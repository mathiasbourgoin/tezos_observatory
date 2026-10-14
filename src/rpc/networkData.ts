import type {
  BlockHeader,
  NetworkName,
  RpcSource,
  MonitoredOperation,
  ObservationEvidence,
} from "./models";
import {committeeAuthority} from "../consensus/phaseEvidence";
import { asBlockHeader, asOperationBatch } from "./guards";
import type { NetworkDerivedState } from "../monitor/networkMonitor";

export const sources: Record<NetworkName, readonly RpcSource[]> = {
  mainnet: [
    {
      network: "mainnet",
      name: "SmartPy",
      baseUrl: "https://mainnet.smartpy.io",
    },
    {
      network: "mainnet",
      name: "Octez public",
      baseUrl: "https://tezos-mainnet.octez.io",
    },
    {
      network: "mainnet",
      name: "Octez archive",
      baseUrl: "https://octez-mainnet-archive.octez.io",
    },
  ],
  shadownet: [
    {
      network: "shadownet",
      name: "Teztnets",
      baseUrl: "https://rpc.shadownet.teztnets.com",
    },
    {
      network: "shadownet",
      name: "Octez public",
      baseUrl: "https://tezos-shadownet.octez.io",
    },
    {
      network: "shadownet",
      name: "SmartPy",
      baseUrl: "https://shadownet.smartpy.io",
    },
  ],
};

// TzKT allows browser monitor streams but restricts protocol helper routes.
// Keep attestation-rights and constants lookups on their existing providers.
export const streamSources: Record<NetworkName, readonly RpcSource[]> = {
  mainnet: [
    {
      network: "mainnet",
      name: "TzKT RPC",
      baseUrl: "https://rpc.tzkt.io/mainnet",
    },
    ...sources.mainnet,
  ],
  shadownet: sources.shadownet,
};

export interface DelegateRight {
  readonly evidence?: ObservationEvidence;
  address: string;
  slot: number;
  power: number;
}
export interface Constants {
  readonly evidence?: ObservationEvidence;
  minimum: number;
  increment: number;
  quorum: number;
  committee: number;
}
export interface Derived extends NetworkDerivedState {
  rights: ReadonlyMap<number, readonly DelegateRight[]>;
  constants: Constants | null;
  predecessor: BlockHeader | null;
  errors: readonly string[];
}
export interface BakingRight {
  level: number;
  round: number;
  delegate: string;
}
type JsonRecord = Record<string, unknown>;
const object = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const numeric = (value: unknown): number => {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  if (!Number.isSafeInteger(number) || number < 0 || (typeof value === "string" && !/^\d+$/.test(value)))
    throw new Error("RPC returned an invalid number");
  return number;
};

/** Small read-only RPC facade. Auxiliary lookups are cached; consensus uses monitors. */
export class NetworkData {
  onChange: (()=>void) | undefined;
  requests = 0;
  source: RpcSource;
  private constants: { at: number; value: Constants } | null = null;
  private constantsProto: number | undefined;
  private constantsPending: Promise<Constants> | null = null;
  private auxiliaryController = new AbortController();
  private readonly committees = new Map<string,readonly DelegateRight[]>();
  private readonly committeesPending = new Map<string,Promise<readonly DelegateRight[]>>();
  private readonly aliases = new Map<string, string>();
  private aliasesLoaded = false;
  private readonly rightCache = new Map<string, readonly BakingRight[]>();
  private readonly eligibility = new Map<
    string,
    { at: number; value: boolean }
  >();
  constructor(readonly network: NetworkName) {
    this.source = sources[network][0]!;
  }

  pause():void {
    this.auxiliaryController.abort();
    this.auxiliaryController=new AbortController();
    this.constantsPending=null;
  }

  private async committee(head:BlockHeader,level:number,signal:AbortSignal):Promise<readonly DelegateRight[]> {
    const key=`${head.proto??"unknown"}:${level}`;
    const cached=this.committees.get(key);if(cached)return cached;
    const pending=this.committeesPending.get(key);if(pending)return pending;
    const task=(async()=>{
      const observed=await this.requestObserved(`/chains/main/blocks/${head.hash}/helpers/attestation_rights?level=${level}`,signal,head);
      const raw=observed.value;
      if(!Array.isArray(raw))throw new Error("Invalid rights response");
      const entry=raw.find((value:unknown)=>object(value)&&value.level===level) as JsonRecord|undefined;
      if(!entry||!Array.isArray(entry.delegates))throw new Error(`No rights at level ${level}`);
      const values=entry.delegates.map((value:unknown)=>{
        if(!object(value)||typeof value.delegate!=="string")throw new Error("Invalid delegate right");
        return {address:value.delegate,slot:numeric(value.first_slot),power:numeric(value.attesting_power),evidence:observed.evidence};
      });
      if (!committeeAuthority(values).usable) throw new Error("Invalid or contradictory committee");
      this.committees.set(key,values);
      while(this.committees.size>12)this.committees.delete(this.committees.keys().next().value!);
      this.onChange?.();return values;
    })();
    this.committeesPending.set(key,task);
    try{return await task;}finally{if(this.committeesPending.get(key)===task)this.committeesPending.delete(key);}
  }

  private async protocolConstants(head:BlockHeader):Promise<Constants> {
    if(this.constants&&this.constantsProto===head.proto&&Date.now()-this.constants.at<3_600_000)return this.constants.value;
    if(this.constantsProto!==head.proto)this.constantsPending=null;
    this.constantsProto=head.proto;
    if(!this.constantsPending) {
      const task=(async()=>{
        const observed=await this.requestObserved(`/chains/main/blocks/${head.hash}/context/constants`,this.auxiliaryController.signal,head);
        const raw=observed.value;
        if(!object(raw))throw new Error("Invalid constants");
        const value={minimum:numeric(raw.minimal_block_delay),increment:numeric(raw.delay_increment_per_round),
          quorum:numeric(raw.consensus_threshold_size),committee:numeric(raw.consensus_committee_size),evidence:observed.evidence};
        if (value.minimum <= 0 || value.committee <= 0 || value.quorum <= 0 || value.quorum > value.committee) throw new Error("Invalid committee total/threshold");
        if(this.constantsProto===head.proto)this.constants={at:Date.now(),value};
        return value;
      })();
      this.constantsPending=task;
      void task.finally(()=>{if(this.constantsPending===task)this.constantsPending=null;}).catch(()=>{});
    }
    return this.constantsPending;
  }

  async request(path: string, signal?: AbortSignal): Promise<unknown> {
    return (await this.requestObserved(path,signal)).value;
  }

  private async requestObserved(path: string, signal?: AbortSignal, head?:BlockHeader): Promise<{value:unknown;evidence:ObservationEvidence}> {
    const pool = [
      this.source,
      ...sources[this.network].filter((s) => s !== this.source),
    ];
    let error: unknown;
    for (const source of pool) {
      if (signal?.aborted) throw signal.reason;
      this.requests++;
      try {
        const response = await fetch(source.baseUrl + path, {
          cache: "no-store",
          signal: signal
            ? AbortSignal.any([signal, AbortSignal.timeout(8000)])
            : AbortSignal.timeout(8000),
        });
        if (!response.ok)
          throw new Error(`${source.name}: HTTP ${response.status}`);
        const result: unknown = await response.json();
        this.source = source;
        return {value:result,evidence:Object.freeze({source:Object.freeze({...source}),receivedAt:Date.now(),receivedMonotonic:performance.now(),...(head ? {requestedHeadHash:head.hash,observedHeadHash:head.hash,predecessor:head.predecessor,...(head.proto === undefined ? {} : {protocol:head.proto}),...(head.chainId ? {chainId:head.chainId} : {})} : {})})};
      } catch (failure) {
        error = failure;
      }
    }
    throw error;
  }

  async head(signal: AbortSignal): Promise<BlockHeader> {
    const observed = await this.requestObserved("/chains/main/blocks/head/header",signal);
    return {...asBlockHeader(observed.value),evidence:observed.evidence};
  }

  async pending(signal: AbortSignal, head?: BlockHeader): Promise<readonly MonitoredOperation[]> {
    const observed = await this.requestObserved(
      "/chains/main/mempool/pending_operations?version=2&refused=false&outdated=false&branch_refused=false&branch_delayed=false",
      signal,head,
    );
    const raw = observed.value;
    if (!object(raw)) throw new Error("Invalid mempool response");
    return asOperationBatch(raw.validated ?? raw.applied ?? []).map(operation => ({...operation,evidence:observed.evidence}));
  }

  async derive(head: BlockHeader, signal: AbortSignal): Promise<Derived> {
    const rights = new Map<number, readonly DelegateRight[]>();
    const errors: string[] = [];
    for(const level of [head.level,head.level+1]) {
      const cached=this.committees.get(`${head.proto??"unknown"}:${level}`);if(cached)rights.set(level,cached);
    }
    // Current-head and successor votes can overlap during pipelining. Avoid
    // waiting for an unrelated predecessor request in a six-second block.
    const tasks = [head.level, head.level + 1].map(async (level) => {
      try {
        rights.set(level,await this.committee(head,level,signal));
      } catch (error) {
        errors.push(`Rights ${level}: ${String(error)}`);
      }
    });
    let constants: Constants | null = null;
    const predecessor: BlockHeader | null = null;
    if(rights.size>0 && this.constants && this.constantsProto===head.proto) {
      // Return the known committee immediately. Its successor is prefetched
      // without holding up votes for the current instance.
      void Promise.all(tasks);
      return {refreshedAt:Date.now(),rights,constants:this.constants.value,predecessor,errors};
    }
    await Promise.all([
      ...tasks,
      (async () => {
        try {
          constants=await this.protocolConstants(head);
        } catch (error) {
          errors.push(`Protocol constants: ${String(error)}`);
        }
      })(),
    ]);
    return { refreshedAt: Date.now(), rights, constants, predecessor, errors };
  }

  alias(address: string): string | undefined {
    return this.aliases.get(address);
  }
  async loadAliases(): Promise<void> {
    if (this.aliasesLoaded) return;
    this.aliasesLoaded = true;
    const base =
      this.network === "mainnet"
        ? "https://api.tzkt.io"
        : "https://api.shadownet.tzkt.io";
    try {
      const response = await fetch(
        `${base}/v1/delegates?limit=10000&select=address,alias`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!response.ok) throw new Error(`TzKT HTTP ${response.status}`);
      const raw: unknown = await response.json();
      if (Array.isArray(raw))
        for (const item of raw) {
          if (
            object(item) &&
            typeof item.address === "string" &&
            typeof item.alias === "string"
          )
            this.aliases.set(item.address, item.alias);
        }
    } catch {
      /* Alias availability never determines consensus health. */
    }
  }

  async bakers(
    head: BlockHeader,
    level: number,
    round: number,
    signal: AbortSignal,
  ): Promise<readonly BakingRight[]> {
    if (round > 10000)
      throw new Error("Proposal rights lookup exceeds bounded round window");
    const key = `${head.proto??"unknown"}:${level}:${round}`;
    const cached = this.rightCache.get(key);
    if (cached) return cached;
    const raw = await this.request(
      `/chains/main/blocks/${head.hash}/helpers/baking_rights?level=${level}&max_round=${round}&all=true`,
      signal,
    );
    if (!Array.isArray(raw)) throw new Error("Invalid baking rights response");
    const rights = raw.flatMap((value: unknown): BakingRight[] =>
      object(value) &&
      value.round === round &&
      typeof value.delegate === "string"
        ? [{ level, round, delegate: value.delegate }]
        : [],
    );
    this.rightCache.set(key, rights);
    while (this.rightCache.size > 32)
      this.rightCache.delete(this.rightCache.keys().next().value!);
    return rights;
  }

  forbidden(address: string): boolean | undefined {
    return this.eligibility.get(address)?.value;
  }
  async loadEligibility(
    head: BlockHeader,
    delegates: readonly DelegateRight[],
    signal: AbortSignal,
  ): Promise<void> {
    // Mainnet's hundreds of delegates must not generate an RPC fanout every block.
    // Shadownet's small committee is queried once per minute, with three requests in flight.
    if (this.network !== "shadownet") return;
    const pending = delegates.filter(
      (d) => Date.now() - (this.eligibility.get(d.address)?.at ?? 0) > 60_000,
    );
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(3, pending.length) }, async () => {
        while (cursor < pending.length && !signal.aborted) {
          const right = pending[cursor++];
          if (!right) break;
          try {
            const raw = await this.request(
              `/chains/main/blocks/${head.hash}/context/delegates/${right.address}/is_forbidden`,
              signal,
            );
            if (typeof raw === "boolean")
              this.eligibility.set(right.address, {
                at: Date.now(),
                value: raw,
              });
          } catch {
            /* Unknown eligibility stays unknown. */
          }
        }
      }),
    );
  }
}
