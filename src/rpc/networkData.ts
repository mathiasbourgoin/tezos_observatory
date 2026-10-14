import type {
  BlockHeader,
  NetworkName,
  RpcSource,
  MonitoredOperation,
  ObservationEvidence,
} from "./models";
import {tenderbakeFitness} from "../consensus/roundSchedule";
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

export interface RpcContext {
  readonly header: BlockHeader;
  readonly source: RpcSource;
  readonly chainId: string;
  readonly protocolHash: string;
  readonly nextProtocolHash: string;
  readonly evidence: ObservationEvidence;
}
export interface TargetContext {
  readonly observer: RpcContext;
  readonly anchor: RpcContext;
  readonly level: number;
  readonly protocolHash: string;
  readonly key: string;
}
export interface DelegateRight {
  readonly context?: TargetContext;
  readonly evidence?: ObservationEvidence;
  address: string;
  slot: number;
  power: number;
}
export interface Constants {
  readonly context?: TargetContext;
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
  readonly contexts: ReadonlyMap<number,TargetContext>;
  readonly constantsByLevel: ReadonlyMap<number,Constants>;
  errors: readonly string[];
}
export interface BakingRight {
  readonly evidence?:ObservationEvidence;
  readonly context?:TargetContext;
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
  private readonly constantCache = new Map<string,Constants>();
  private readonly contextCache = new Map<string,RpcContext>();
  private readonly contextPending = new Map<string,Promise<RpcContext>>();
  private auxiliaryController = new AbortController();
  private collecting = true;
  private collectionGeneration = 0;
  private aliasesLoading = false;
  private readonly committees = new Map<string,readonly DelegateRight[]>();
  private readonly committeesPending = new Map<string,Promise<readonly DelegateRight[]>>();
  private readonly aliases = new Map<string, string>();
  private aliasesLoaded = false;
  private readonly rightCache = new Map<string, readonly BakingRight[]>();
  private eligibilityObserverKey:string|undefined;
  private readonly eligibility = new Map<
    string,
    { value:boolean;context:TargetContext;evidence:ObservationEvidence;stale:boolean;invalidated:boolean }
  >();
  constructor(readonly network: NetworkName) {
    this.source = sources[network][0]!;
  }

  pause():void {
    this.collecting=false;this.collectionGeneration++;
    this.auxiliaryController.abort();
    this.contextPending.clear();this.committeesPending.clear();this.aliasesLoading=false;
  }

  resume():void {
    if(this.collecting)return;
    this.collecting=true;this.collectionGeneration++;
    this.auxiliaryController=new AbortController();
  }

  private assertCollecting(generation:number,signal?:AbortSignal):void {
    if(!this.collecting || generation!==this.collectionGeneration || signal?.aborted || this.auxiliaryController.signal.aborted) throw new Error("Cancelled collection generation");
  }

  private async context(hash:string,source:RpcSource,signal:AbortSignal,expected?:BlockHeader):Promise<RpcContext> {
    const key=JSON.stringify([source.baseUrl,hash]);
    const verify=(context:RpcContext):RpcContext=>{
      const header=context.header;
      if(expected && (header.hash!==expected.hash || header.level!==expected.level || header.predecessor!==expected.predecessor || header.timestamp!==expected.timestamp || JSON.stringify(header.fitness)!==JSON.stringify(expected.fitness) || (expected.chainId!==undefined && expected.chainId!==context.chainId))) throw new Error("Observer context does not match observed header");
      return context;
    };
    const cached=this.contextCache.get(key);if(cached)return verify(cached);
    const existing=this.contextPending.get(key);if(existing)return verify(await existing);
    const generation=this.collectionGeneration;
    const task=(async()=>{
      const [headerReceipt,protocolReceipt]=await Promise.all([
        this.requestObserved(`/chains/main/blocks/${hash}/header`,signal,undefined,source),
        this.requestObserved(`/chains/main/blocks/${hash}/protocols`,signal,undefined,source),
      ]);
      const header=asBlockHeader(headerReceipt.value),raw=protocolReceipt.value;
      if(header.hash!==hash || !header.chainId || !object(raw) || typeof raw.protocol!=="string" || raw.protocol.length===0 || typeof raw.next_protocol!=="string" || raw.next_protocol.length===0)throw new Error("Unproven observer context identity");
      this.assertCollecting(generation,signal);
      const value:RpcContext=Object.freeze({header:Object.freeze({...header,fitness:Object.freeze([...header.fitness])}),source:Object.freeze({...source}),chainId:header.chainId,protocolHash:raw.protocol,nextProtocolHash:raw.next_protocol,evidence:Object.freeze({...protocolReceipt.evidence,requestedHeadHash:hash,chainId:header.chainId,protocolHash:raw.protocol,nextProtocolHash:raw.next_protocol})});
      verify(value);this.contextCache.set(key,value);
      while(this.contextCache.size>12)this.contextCache.delete(this.contextCache.keys().next().value!);
      return value;
    })();
    this.contextPending.set(key,task);
    try{return verify(await task);}finally{if(this.contextPending.get(key)===task)this.contextPending.delete(key);}
  }

  private async targetContext(head:BlockHeader,level:number,signal:AbortSignal,allowFollowingLevel=false):Promise<TargetContext> {
    if(level!==head.level && level!==head.level+1 && !(allowFollowingLevel&&level===head.level+2))throw new Error("Target outside proven observer window");
    const observer=await this.context(head.hash,head.evidence?.source ?? this.source,signal,head);
    const anchor=level===head.level?await this.context(head.predecessor,observer.source,signal):observer;
    if(anchor.chainId!==observer.chainId || (level===head.level && (anchor.header.level!==head.level-1 || anchor.nextProtocolHash!==observer.protocolHash)))throw new Error("Incompatible predecessor protocol context");
    if(level===head.level && observer.protocolHash===anchor.protocolHash && tenderbakeFitness(observer.header.fitness,observer.header.level)?.predecessorRound!==tenderbakeFitness(anchor.header.fitness,anchor.header.level)?.round)throw new Error("Contradictory proven predecessor round");
    const protocolHash=anchor.nextProtocolHash;
    return Object.freeze({observer,anchor,level,protocolHash,key:JSON.stringify([observer.source.baseUrl,observer.chainId,head.hash,head.predecessor,protocolHash,level])});
  }

  private async targetRequest(path:string,context:TargetContext,signal:AbortSignal):Promise<{value:unknown;evidence:ObservationEvidence}> {
    const receipt=await this.requestObserved(path,signal,context.anchor.header);
    const source=receipt.evidence.source;
    const observer=await this.context(context.observer.header.hash,source,signal,context.observer.header);
    const anchor=await this.context(context.anchor.header.hash,source,signal,context.anchor.header);
    if(observer.chainId!==context.observer.chainId || observer.protocolHash!==context.observer.protocolHash || observer.nextProtocolHash!==context.observer.nextProtocolHash || anchor.chainId!==context.anchor.chainId || anchor.nextProtocolHash!==context.protocolHash)throw new Error("Helper response has incompatible source context");
    return {value:receipt.value,evidence:Object.freeze({...receipt.evidence,chainId:observer.chainId,protocolHash:context.protocolHash,targetLevel:context.level,contextHeadHash:observer.header.hash,predecessor:observer.header.predecessor})};
  }

  private async committee(context:TargetContext,signal:AbortSignal):Promise<readonly DelegateRight[]> {
    const key=context.key,level=context.level;
    const cached=this.committees.get(key);if(cached)return cached;
    const pending=this.committeesPending.get(key);if(pending)return pending;
    const task=(async()=>{
      const generation=this.collectionGeneration;
      const observed=await this.targetRequest(`/chains/main/blocks/${context.anchor.header.hash}/helpers/attestation_rights?level=${level}`,context,signal);
      this.assertCollecting(generation,signal);
      const raw=observed.value;
      if(!Array.isArray(raw))throw new Error("Invalid rights response");
      const entries=raw.filter((value:unknown)=>object(value)&&value.level===level);
      if(entries.length!==1)throw new Error(`Ambiguous rights at level ${level}`);
      const entry=entries[0] as JsonRecord;
      if(!Array.isArray(entry.delegates))throw new Error(`No rights at level ${level}`);
      const values=entry.delegates.map((value:unknown)=>{
        if(!object(value)||typeof value.delegate!=="string")throw new Error("Invalid delegate right");
        return Object.freeze({address:value.delegate,slot:numeric(value.first_slot),power:numeric(value.attesting_power),evidence:observed.evidence,context});
      });
      if (!committeeAuthority(values).usable) throw new Error("Invalid or contradictory committee");
      this.committees.set(key,Object.freeze(values));
      while(this.committees.size>12)this.committees.delete(this.committees.keys().next().value!);
      this.onChange?.();return values;
    })();
    this.committeesPending.set(key,task);
    try{return await task;}finally{if(this.committeesPending.get(key)===task)this.committeesPending.delete(key);}
  }

  private async protocolConstants(context:TargetContext,signal:AbortSignal):Promise<Constants> {
    const cached=this.constantCache.get(context.key);if(cached)return cached;
    const generation=this.collectionGeneration;
    const observed=await this.targetRequest(`/chains/main/blocks/${context.anchor.header.hash}/context/constants`,context,signal);
    const raw=observed.value;
    if(!object(raw))throw new Error("Invalid constants");
    const value:Constants=Object.freeze({minimum:numeric(raw.minimal_block_delay),increment:numeric(raw.delay_increment_per_round),quorum:numeric(raw.consensus_threshold_size),committee:numeric(raw.consensus_committee_size),evidence:observed.evidence,context});
    if(value.minimum<=0 || value.committee<=0 || value.quorum<=0 || value.quorum>value.committee)throw new Error("Invalid committee total/threshold");
    this.assertCollecting(generation,signal);this.constantCache.set(context.key,value);
    while(this.constantCache.size>12)this.constantCache.delete(this.constantCache.keys().next().value!);
    return value;
  }

  async request(path: string, signal?: AbortSignal): Promise<unknown> {
    return (await this.requestObserved(path,signal)).value;
  }

  private async requestObserved(path: string, signal?: AbortSignal, head?:BlockHeader, exactSource?:RpcSource): Promise<{value:unknown;evidence:ObservationEvidence}> {
    const generation=this.collectionGeneration;
    this.assertCollecting(generation,signal);
    const pool = exactSource ? [exactSource] : [
      this.source,
      ...sources[this.network].filter((s) => s !== this.source),
    ];
    let error: unknown;
    for (const source of pool) {
      this.assertCollecting(generation,signal);
      this.requests++;
      try {
        const response = await fetch(source.baseUrl + path, {
          cache: "no-store",
          signal: AbortSignal.any([this.auxiliaryController.signal,...(signal ? [signal] : []),AbortSignal.timeout(8000)]),
        });
        if (!response.ok)
          throw new Error(`${source.name}: HTTP ${response.status}`);
        const result: unknown = await response.json();
        this.assertCollecting(generation,signal);
        if(!exactSource)this.source = source;
        const pinnedHead = head && path.includes(`/blocks/${head.hash}/`) ? head : undefined;
        const sameObserverHead = head?.evidence?.source.baseUrl === source.baseUrl ? head : undefined;
        return {value:result,evidence:Object.freeze({
          source:Object.freeze({...source}),receivedAt:Date.now(),receivedMonotonic:performance.now(),
          ...(pinnedHead ? {requestedHeadHash:pinnedHead.hash} : {}),
          ...(sameObserverHead ? {observedHeadHash:sameObserverHead.hash,predecessor:sameObserverHead.predecessor,...(sameObserverHead.proto === undefined ? {} : {protocolLevel:sameObserverHead.proto}),...(sameObserverHead.chainId ? {chainId:sameObserverHead.chainId} : {})} : {}),
        })};
      } catch (failure) {
        error = failure;
      }
    }
    throw error;
  }

  async head(signal: AbortSignal): Promise<BlockHeader> {
    const observed = await this.requestObserved("/chains/main/blocks/head/header",signal);
    const header = asBlockHeader(observed.value);
    return {...header,evidence:Object.freeze({...observed.evidence,observedHeadHash:header.hash,observedBlockHash:header.hash,predecessor:header.predecessor,...(header.proto === undefined ? {} : {protocolLevel:header.proto})})};
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
    this.observeHead(head);
    const rights=new Map<number,readonly DelegateRight[]>(),contexts=new Map<number,TargetContext>(),constantsByLevel=new Map<number,Constants>();
    const errors:string[]=[];
    await Promise.all([head.level,head.level+1].map(async level=>{
      try {
        const context=await this.targetContext(head,level,signal);contexts.set(level,context);
        const [committee,constants]=await Promise.all([this.committee(context,signal),this.protocolConstants(context,signal)]);
        if(!committeeAuthority(committee,constants.committee,constants.quorum).usable)throw new Error("Committee contradicts protocol constants");
        rights.set(level,committee);constantsByLevel.set(level,constants);
      }catch(error){errors.push(`Target context ${level}: ${String(error)}`);}
    }));
    return {refreshedAt:Date.now(),rights,contexts,constantsByLevel,constants:constantsByLevel.get(head.level)??null,predecessor:contexts.get(head.level)?.anchor.header??null,errors};
  }

  alias(address: string): string | undefined {
    return this.aliases.get(address);
  }
  async loadAliases(): Promise<void> {
    if (!this.collecting || this.aliasesLoaded || this.aliasesLoading) return;
    this.aliasesLoading=true;
    const generation=this.collectionGeneration;
    const signal=AbortSignal.any([this.auxiliaryController.signal,AbortSignal.timeout(8000)]);
    const base =
      this.network === "mainnet"
        ? "https://api.tzkt.io"
        : "https://api.shadownet.tzkt.io";
    try {
      const response = await fetch(
        `${base}/v1/delegates?limit=10000&select=address,alias`,
        {signal},
      );
      if (!response.ok) throw new Error(`TzKT HTTP ${response.status}`);
      const raw: unknown = await response.json();
      this.assertCollecting(generation,signal);
      if (Array.isArray(raw))
        for (const item of raw) {
          if (
            object(item) &&
            typeof item.address === "string" &&
            typeof item.alias === "string"
          )
            this.aliases.set(item.address, item.alias);
        }
      this.aliasesLoaded=true;
    } catch {
      /* Alias availability never determines consensus health. */
    } finally {
      if(generation===this.collectionGeneration)this.aliasesLoading=false;
    }
  }

  async bakers(head:BlockHeader,level:number,round:number,signal:AbortSignal):Promise<readonly BakingRight[]> {
    if(!Number.isSafeInteger(round)||round<0||round>10000)throw new Error("Proposal rights lookup exceeds bounded round window");
    const context=await this.targetContext(head,level,signal,true),key=JSON.stringify([context.key,round]);
    const cached=this.rightCache.get(key);if(cached)return cached;
    const generation=this.collectionGeneration;
    const receipt=await this.targetRequest(`/chains/main/blocks/${context.anchor.header.hash}/helpers/baking_rights?level=${level}&max_round=${round}&all=true`,context,signal);
    this.assertCollecting(generation,signal);
    if(!Array.isArray(receipt.value))throw new Error("Invalid baking rights response");
    const values=receipt.value.filter((value:unknown)=>object(value)&&value.level===level&&value.round===round);
    if(values.some(value=>!object(value)||typeof value.delegate!=="string"))throw new Error("Invalid baking delegate");
    const delegates=new Set(values.map(value=>(value as JsonRecord).delegate));
    if(delegates.size>1)throw new Error("Contradictory baking rights");
    const rights:readonly BakingRight[]=Object.freeze(values.slice(0,1).map(value=>Object.freeze({level,round,delegate:(value as JsonRecord).delegate as string,evidence:receipt.evidence,context})));
    this.rightCache.set(key,rights);
    while(this.rightCache.size>32)this.rightCache.delete(this.rightCache.keys().next().value!);
    return rights;
  }

  private observeHead(head:BlockHeader):void {
    const source=head.evidence?.source.baseUrl??this.source.baseUrl;
    this.eligibilityObserverKey=JSON.stringify([source,head.hash,head.predecessor,head.chainId??null]);
    for(const value of this.eligibility.values())if(value.context.observer.header.hash!==head.hash || value.context.observer.header.predecessor!==head.predecessor || value.context.observer.source.baseUrl!==source || (head.chainId!==undefined&&value.context.observer.chainId!==head.chainId))value.invalidated=true;
  }

  eligibilityStatus(address:string):{readonly value?:boolean;readonly rawValue?:boolean;readonly ageMs?:number;readonly stale:boolean;readonly contextInvalid:boolean;readonly evidence?:ObservationEvidence} {
    const record=this.eligibility.get(address);
    if(!record)return {stale:false,contextInvalid:false};
    const ageMs=Math.max(0,performance.now()-record.evidence.receivedMonotonic);
    if(ageMs>=60000)record.stale=true;
    return {...(!record.stale&&!record.invalidated?{value:record.value}:{}),rawValue:record.value,ageMs,stale:record.stale,contextInvalid:record.invalidated,evidence:record.evidence};
  }

  forbidden(address:string):boolean|undefined {return this.eligibilityStatus(address).value;}

  async loadEligibility(head:BlockHeader,delegates:readonly DelegateRight[],signal:AbortSignal):Promise<void> {
    if(!this.collecting||this.network!=="shadownet")return;
    this.observeHead(head);
    const generation=this.collectionGeneration,observerKey=this.eligibilityObserverKey;
    let context:TargetContext;
    try{context=await this.targetContext(head,head.level+1,signal);}catch{return;}
    const pending=delegates.filter(right=>this.forbidden(right.address)===undefined);
    let cursor=0;
    await Promise.all(Array.from({length:Math.min(3,pending.length)},async()=>{
      while(cursor<pending.length&&!signal.aborted&&this.collecting&&generation===this.collectionGeneration){
        const right=pending[cursor++];if(!right)break;
        try{
          const receipt=await this.targetRequest(`/chains/main/blocks/${head.hash}/context/delegates/${right.address}/is_forbidden`,context,signal);
          this.assertCollecting(generation,signal);
          if(typeof receipt.value==="boolean")this.eligibility.set(right.address,{value:receipt.value,context,evidence:receipt.evidence,stale:false,invalidated:this.eligibilityObserverKey!==observerKey});
        }catch{/* Raw unavailable or incompatible eligibility cannot confer authority. */}
      }
    }));
  }
}
