import type {
  BlockHeader,
  NetworkName,
  RpcSource,
  MonitoredOperation,
  ObservationEvidence,
} from "./models";
import {proposalRound,tenderbakeFitness} from "../consensus/roundSchedule";
import {committeeAuthority,contextFacts} from "../consensus/phaseEvidence";
import { asBlockHeader, asOperationBatch } from "./guards";
import type {ReconciliationTarget} from "../monitor/observerReconciliation";
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
/** A fully received source-local validated category; contextual proof is separate from its unpinned receipt. */
export interface PendingSnapshot {
  readonly operations:readonly MonitoredOperation[];
  readonly evidence:ObservationEvidence;
  readonly startedMonotonic:number;
  readonly complete:boolean;
  readonly reasons:readonly string[];
  readonly phaseCoverage?:Readonly<Record<"pre"|"att",{readonly complete:boolean;readonly reasons:readonly string[]}>>;
  readonly contextBefore:TargetContext;
  readonly contextAfter:TargetContext;
}
/** Explicit per-phase proof, falling back conservatively for legacy snapshots. */
export function pendingPhaseComplete(snapshot:Pick<PendingSnapshot,"complete"|"reasons"|"phaseCoverage">,phase:"pre"|"att"):boolean {
  const proof=snapshot.phaseCoverage?.[phase];
  return proof?proof.complete && proof.reasons.length===0:snapshot.complete && snapshot.reasons.length===0;
}
/** Shared retention loss withdraws both phase authorities without changing receipt facts. */
export function invalidatePendingCoverage<S extends Pick<PendingSnapshot,"complete"|"reasons"|"phaseCoverage">>(snapshot:S,reason:string):Readonly<Omit<S,"complete"|"reasons"|"phaseCoverage"> & Pick<PendingSnapshot,"complete"|"reasons"|"phaseCoverage">> {
  const {complete:_previousComplete,reasons:previousReasons,phaseCoverage,...retained}=snapshot;
  const reasons=Object.freeze([...new Set([...previousReasons,reason])]);
  return Object.freeze({...retained,complete:false,reasons,...(phaseCoverage?{phaseCoverage:Object.freeze({pre:Object.freeze({complete:false,reasons}),att:Object.freeze({complete:false,reasons})})}:{})});
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
export interface ReconciledContext {
  readonly head:BlockHeader;
  readonly derived:Derived;
  readonly context:TargetContext;
  readonly rights:readonly DelegateRight[];
  readonly constants:Constants;
  readonly observerGeneration?:number;
  readonly collectionGeneration?:number;
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
      if(expected && (header.hash!==expected.hash || header.level!==expected.level || header.predecessor!==expected.predecessor || header.timestamp!==expected.timestamp || (expected.proto!==undefined && header.proto!==expected.proto) || (expected.payload_hash!==undefined && header.payload_hash!==expected.payload_hash) || JSON.stringify(header.fitness)!==JSON.stringify(expected.fitness) || (expected.chainId!==undefined && expected.chainId!==context.chainId))) throw new Error("Observer context does not match observed header");
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

  private async targetRequest(path:string,context:TargetContext,signal:AbortSignal,exactSource?:RpcSource):Promise<{value:unknown;evidence:ObservationEvidence}> {
    const receipt=await this.requestObserved(path,signal,context.anchor.header,exactSource);
    const source=receipt.evidence.source;
    const observer=await this.context(context.observer.header.hash,source,signal,context.observer.header);
    const anchor=await this.context(context.anchor.header.hash,source,signal,context.anchor.header);
    if(observer.chainId!==context.observer.chainId || observer.protocolHash!==context.observer.protocolHash || observer.nextProtocolHash!==context.observer.nextProtocolHash || anchor.chainId!==context.anchor.chainId || anchor.nextProtocolHash!==context.protocolHash)throw new Error("Helper response has incompatible source context");
    return {value:receipt.value,evidence:Object.freeze({...receipt.evidence,chainId:observer.chainId,protocolHash:context.protocolHash,targetLevel:context.level,contextHeadHash:observer.header.hash,predecessor:observer.header.predecessor})};
  }

  private async committee(context:TargetContext,signal:AbortSignal,exactSource?:RpcSource):Promise<readonly DelegateRight[]> {
    const key=exactSource?JSON.stringify([context.key,exactSource.baseUrl]):context.key,level=context.level;
    const cached=this.committees.get(key);if(cached)return cached;
    const pending=this.committeesPending.get(key);if(pending)return pending;
    const task=(async()=>{
      const generation=this.collectionGeneration;
      const observed=await this.targetRequest(`/chains/main/blocks/${context.anchor.header.hash}/helpers/attestation_rights?level=${level}`,context,signal,exactSource);
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

  private async protocolConstants(context:TargetContext,signal:AbortSignal,exactSource?:RpcSource):Promise<Constants> {
    const key=exactSource?JSON.stringify([context.key,exactSource.baseUrl]):context.key;
    const cached=this.constantCache.get(key);if(cached)return cached;
    const generation=this.collectionGeneration;
    const observed=await this.targetRequest(`/chains/main/blocks/${context.anchor.header.hash}/context/constants`,context,signal,exactSource);
    const raw=observed.value;
    if(!object(raw))throw new Error("Invalid constants");
    const value:Constants=Object.freeze({minimum:numeric(raw.minimal_block_delay),increment:numeric(raw.delay_increment_per_round),quorum:numeric(raw.consensus_threshold_size),committee:numeric(raw.consensus_committee_size),evidence:observed.evidence,context});
    if(value.minimum<=0 || value.committee<=0 || value.quorum<=0 || value.quorum>value.committee)throw new Error("Invalid committee total/threshold");
    this.assertCollecting(generation,signal);this.constantCache.set(key,value);
    while(this.constantCache.size>12)this.constantCache.delete(this.constantCache.keys().next().value!);
    return value;
  }

  /** One exact immutable-hash read; timeout includes a body even if a fetch shim ignores abort. */
  async blockMetadata(head:BlockHeader,source:RpcSource,signal:AbortSignal):Promise<{value:unknown;evidence:ObservationEvidence}> {
    const deadline=AbortSignal.any([signal,this.auxiliaryController.signal,AbortSignal.timeout(8000)]);
    let rejectAbort:()=>void=()=>undefined;
    const aborted=new Promise<never>((_resolve,reject)=>{rejectAbort=()=>reject(new DOMException('Metadata read cancelled or timed out','AbortError'));if(deadline.aborted)rejectAbort();else deadline.addEventListener('abort',rejectAbort,{once:true});});
    try{return await Promise.race([this.requestObserved(`/chains/main/blocks/${encodeURIComponent(head.hash)}/metadata`,deadline,head,source,true),aborted]);}
    finally{deadline.removeEventListener('abort',rejectAbort);}
  }

  async request(path: string, signal?: AbortSignal): Promise<unknown> {
    return (await this.requestObserved(path,signal)).value;
  }

  private async requestObserved(path: string, signal?: AbortSignal, head?:BlockHeader, exactSource?:RpcSource, strictRedirect=false): Promise<{value:unknown;evidence:ObservationEvidence}> {
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
          ...(strictRedirect?{redirect:"error" as const}:{}),
          signal: AbortSignal.any([this.auxiliaryController.signal,...(signal ? [signal] : []),AbortSignal.timeout(8000)]),
        });
        if (!response.ok || strictRedirect&&response.redirected)
          throw new Error(`${source.name}: HTTP ${response.status}`);
        const result: unknown = await response.json();
        this.assertCollecting(generation,signal);
        if(!exactSource)this.source = source;
        const pinnedHead = head && path.includes(`/blocks/${head.hash}/`) ? head : undefined;
        const sameObserverHead = head?.evidence?.source.baseUrl === source.baseUrl ? head : undefined;
        return {value:result,evidence:Object.freeze({
          source:Object.freeze({...source}),collectionGeneration:generation,receivedAt:Date.now(),receivedMonotonic:performance.now(),
          ...(pinnedHead ? {requestedHeadHash:pinnedHead.hash} : {}),
          ...(sameObserverHead ? {observedHeadHash:sameObserverHead.hash,observedHeadLevel:sameObserverHead.level,predecessor:sameObserverHead.predecessor,...(sameObserverHead.proto === undefined ? {} : {protocolLevel:sameObserverHead.proto}),...(sameObserverHead.chainId ? {chainId:sameObserverHead.chainId} : {})} : {}),
        })};
      } catch (failure) {
        error = failure;
      }
    }
    throw error;
  }

  async head(signal: AbortSignal,exactSource?:RpcSource): Promise<BlockHeader> {
    const observed = await this.requestObserved("/chains/main/blocks/head/header",signal,undefined,exactSource);
    const header = asBlockHeader(observed.value);
    return {...header,evidence:Object.freeze({...observed.evidence,observedHeadHash:header.hash,observedBlockHash:header.hash,predecessor:header.predecessor,...(header.proto === undefined ? {} : {protocolLevel:header.proto})})};
  }

  async pending(signal:AbortSignal,head?:BlockHeader):Promise<readonly MonitoredOperation[]>;
  async pending(signal:AbortSignal,head:BlockHeader,context:TargetContext,onObservedHead?:(head:BlockHeader)=>void):Promise<PendingSnapshot>;
  async pending(signal: AbortSignal, head?: BlockHeader,context?:TargetContext,onObservedHead?:(head:BlockHeader)=>void): Promise<readonly MonitoredOperation[]|PendingSnapshot> {
    const startedMonotonic=performance.now(),generation=this.collectionGeneration;
    const before=context?await this.head(signal,context.observer.source):undefined;
    if(before)onObservedHead?.(before);
    const contextBefore=context&&before?await this.targetContext(before,context.level,signal):undefined;
    const observed = await this.requestObserved(
      "/chains/main/mempool/pending_operations?version=2&refused=false&outdated=false&branch_refused=false&branch_delayed=false",
      signal,context?undefined:head,context?.observer.source,
    );
    const raw = observed.value;
    if(!context){
      if (!object(raw) || !Array.isArray(raw.validated)) throw new Error("Invalid version-2 validated mempool response");
      return asOperationBatch(raw.validated).map(operation => ({...operation,evidence:observed.evidence}));
    }
    const reasons:string[]=[],operations:MonitoredOperation[]=[];
    const phaseReasons:{pre:string[];att:string[]}={pre:[],att:[]};
    const invalidate=(reason:string,phase?:"pre"|"att"):void=>{if(!reasons.includes(reason))reasons.push(reason);for(const affected of phase?[phase]:["pre","att"] as const)if(!phaseReasons[affected].includes(reason))phaseReasons[affected].push(reason);};
    if(!object(raw) || !Array.isArray(raw.validated))invalidate("Missing full validated category");
    else {
      if(raw.validated.length>10000)invalidate("Validated category exceeds retained operation bound");
      for(const entry of raw.validated.slice(0,10000))try {
        operations.push(...asOperationBatch([entry],phase=>invalidate("Malformed or unclassifiable consensus content",phase)).map(operation=>({...operation,evidence:observed.evidence})));
      }catch {invalidate("Malformed operation envelope");}
    }
    const after=await this.head(signal,context.observer.source);onObservedHead?.(after);
    const contextAfter=await this.targetContext(after,context.level,signal);
    this.assertCollecting(generation,signal);
    if(!contextBefore || contextFacts(contextBefore)!==contextFacts(context) || contextFacts(contextAfter)!==contextFacts(context))invalidate("Observer context changed across validated snapshot");
    return Object.freeze({operations:Object.freeze(operations),evidence:observed.evidence,startedMonotonic,complete:reasons.length===0,reasons:Object.freeze(reasons),phaseCoverage:Object.freeze({pre:Object.freeze({complete:phaseReasons.pre.length===0,reasons:Object.freeze(phaseReasons.pre)}),att:Object.freeze({complete:phaseReasons.att.length===0,reasons:Object.freeze(phaseReasons.att)})}),contextBefore:contextBefore??context,contextAfter});
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

  async reconcile(target:ReconciliationTarget,signal:AbortSignal,onObservedHead?:(head:BlockHeader)=>void):Promise<ReconciledContext> {
    if(![...sources[this.network],...streamSources[this.network]].some(source=>source.baseUrl===target.source.baseUrl && source.network===target.source.network))throw new Error("Unconfigured reconciliation observer");
    if(target.candidate && target.candidate.evidence.source.baseUrl!==target.source.baseUrl)throw new Error("Candidate belongs to another observer");
    if(target.observerHead && (target.observerHead.evidence?.source.baseUrl!==target.source.baseUrl || target.observerHead.evidence.source.network!==target.source.network))throw new Error("Current head belongs to an unproven or different observer");
    if(target.candidate && (target.level!==target.candidate.header.level || target.round!==proposalRound(target.candidate.header.fitness,target.candidate.header.level) || target.payload!==target.candidate.header.payload_hash))throw new Error("Reconciliation target does not match candidate facts");
    let head:BlockHeader;
    if(target.candidate){
      const candidate=await this.context(target.candidate.header.hash,target.source,signal,target.candidate.header);
      const parent=await this.context(candidate.header.predecessor,target.source,signal);
      if(parent.chainId!==candidate.chainId || parent.header.level!==candidate.header.level-1 || parent.nextProtocolHash!==candidate.protocolHash)throw new Error("Unproven validated candidate parent context");
      if(parent.protocolHash===candidate.protocolHash && tenderbakeFitness(candidate.header.fitness,candidate.header.level)?.predecessorRound!==tenderbakeFitness(parent.header.fitness,parent.header.level)?.round)throw new Error("Contradictory validated predecessor round");
      // A candidate's verified parent is an anchor, not a replacement for an
      // already observed same-level head at this observer.
      head=target.observerHead?.level===target.level?target.observerHead:{...parent.header,evidence:parent.evidence};
    }else {head=await this.head(signal,target.source);onObservedHead?.(head);}
    const context=await this.targetContext(head,target.level,signal);
    if(target.protocolHash!==undefined && target.protocolHash!==context.protocolHash)throw new Error("Contradictory target execution protocol");
    const [rights,constants]=await Promise.all([this.committee(context,signal,target.source),this.protocolConstants(context,signal,target.source)]);
    if(!committeeAuthority(rights,constants.committee,constants.quorum).usable)throw new Error("Reconciliation committee contradicts constants");
    const derived:Derived={refreshedAt:Date.now(),rights:new Map([[target.level,rights]]),contexts:new Map([[target.level,context]]),constantsByLevel:new Map([[target.level,constants]]),constants,predecessor:target.level===head.level?context.anchor.header:null,errors:[]};
    return Object.freeze({head:Object.freeze(head),derived,context,rights,constants,...(target.observerGeneration===undefined?{}:{observerGeneration:target.observerGeneration}),...(target.collectionGeneration===undefined?{}:{collectionGeneration:target.collectionGeneration})});
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

  async opportunityConstants(head:BlockHeader,level:number,signal:AbortSignal):Promise<Constants> {
    const generation=this.collectionGeneration;this.assertCollecting(generation,signal);
    if(level!==head.level&&level!==head.level+1)throw new Error("Target execution timing context unavailable");
    const context=await this.targetContext(head,level,signal,true);
    const value=await this.protocolConstants(context,signal);
    this.assertCollecting(generation,signal);return value;
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
