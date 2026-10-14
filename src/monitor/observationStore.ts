import type {AdmissionEvidence,BlockHeader,CandidateObservation,MonitoredOperation,NetworkName,ObservationEvidence,RpcSource} from "../rpc/models";
import {OperationStore,operationIdentity} from "../rpc/operationStore";
import {committeeAuthority,contextFacts} from "../consensus/phaseEvidence";
import {proposalRound} from "../consensus/roundSchedule";
import type {Constants,DelegateRight,TargetContext,RpcContext} from "../rpc/networkData";
import type {ReconciliationTarget} from "./observerReconciliation";
import {headFactsKey} from "./headGeneration";

export interface ContextAdmission<T> {
  readonly head:BlockHeader;
  readonly derived:T;
  readonly context:TargetContext;
  readonly rights:readonly DelegateRight[];
  readonly constants:Constants;
  readonly observerGeneration?:number;
  readonly collectionGeneration?:number;
}
export interface ObservationTarget<T> {
  readonly identity:string;
  readonly target:ReconciliationTarget;
  readonly evidence:ObservationEvidence;
  readonly admission?:ContextAdmission<T>;
  readonly sourceContext?:ContextAdmission<T>;
  readonly error?:string;
  readonly contextInvalid:boolean;
}

const instanceIdentity=(operation:MonitoredOperation,level:number,round:number,payload:string):string=>JSON.stringify(["instance",operation.evidence?.source.network??"unknown",operation.evidence?.source.baseUrl??"unknown",operation.evidence?.chainId??"unknown",operation.evidence?.observedHeadHash??"unknown",level,round,payload]);

/** Bounded observation products share raw records; admission never reinserts or relabels them. */
export class ObservationStore<T> {
  private readonly raw=new OperationStore(10000,Infinity);
  private readonly unresolved=new Map<string,ObservationTarget<T>>();
  private readonly acceptedCandidates=new Map<string,ObservationTarget<T>>();
  private readonly instances=new Map<string,ObservationTarget<T>>();
  private readonly bindings=new Map<string,Map<string,AdmissionEvidence>>();
  private readonly membership=new Map<string,Set<string>>();
  private readonly contexts=new Map<string,Map<number,ContextAdmission<T>>>();
  private readonly heads=new Map<string,BlockHeader>();
  private readonly configured:Set<string>;
  private readonly observerGenerations=new Map<string,number>();
  private collectionGeneration=0;
  private enabled=true;
  private expectedNetwork:RpcContext|undefined;

  constructor(readonly network:NetworkName,sources:readonly RpcSource[]){this.configured=new Set(sources.filter(source=>source.network===network).map(source=>source.baseUrl));}
  private allowed(source:RpcSource|undefined):source is RpcSource {return source!==undefined && source.network===this.network && this.configured.has(source.baseUrl);}

  networkIdentity():RpcContext|undefined {return this.expectedNetwork;}
  establishNetworkIdentity(context:RpcContext):boolean {
    if(!this.allowed(context.source) || !context.chainId || context.header.chainId!==context.chainId || context.evidence.chainId!==context.chainId || context.evidence.requestedHeadHash!==context.header.hash || context.evidence.source.baseUrl!==context.source.baseUrl)throw new Error("Unproven expected network identity");
    if(this.expectedNetwork)return this.expectedNetwork.chainId===context.chainId;
    this.expectedNetwork=context;
    for(const source of this.contexts.keys()){const proof=this.contexts.get(source)?.values().next().value;if(proof)this.recheck(proof.context.observer.source);}
    return true;
  }
  contextAuthorized(context:TargetContext):boolean {
    const proof=this.contexts.get(context.observer.source.baseUrl)?.get(context.level);
    return this.expectedNetwork?.chainId===context.observer.chainId && proof!==undefined && contextFacts(proof.context)===contextFacts(context);
  }

  start():void {this.enabled=true;}
  stop():void {this.enabled=false;this.collectionGeneration++;}
  generation(source:RpcSource):{readonly observerGeneration:number;readonly collectionGeneration:number} {return {observerGeneration:this.observerGenerations.get(source.baseUrl)??0,collectionGeneration:this.collectionGeneration};}
  private headerKey(head:BlockHeader):string {return headFactsKey(head);}
  observeHead(head:BlockHeader):void {
    const source=head.evidence?.source;if(!this.allowed(source))return;
    const old=this.heads.get(source.baseUrl);
    if(!old || this.headerKey(old)!==this.headerKey(head))this.observerGenerations.set(source.baseUrl,(this.observerGenerations.get(source.baseUrl)??0)+1);
    this.heads.set(source.baseUrl,head);
    const contexts=this.contexts.get(source.baseUrl);
    if(contexts)for(const [level,admission] of contexts){
      const proven=admission.context.observer.header;
      if(head.hash!==proven.hash || head.level!==proven.level || head.predecessor!==proven.predecessor || (head.chainId!==undefined && head.chainId!==admission.context.observer.chainId) || (head.proto!==undefined && head.proto!==proven.proto) || (head.payload_hash!==undefined && head.payload_hash!==proven.payload_hash) || head.timestamp!==proven.timestamp || JSON.stringify(head.fitness)!==JSON.stringify(proven.fitness))contexts.delete(level);
    }
    this.recheck(source);
  }

  observerHead(source:RpcSource):BlockHeader|undefined {return this.heads.get(source.baseUrl);}

  addCandidate(candidate:CandidateObservation):ObservationTarget<T>|undefined {
    if(!this.allowed(candidate.evidence.source))return undefined;
    const identity=candidate.identity,existing=this.find(identity);if(existing)return existing;
    const round=proposalRound(candidate.header.fitness,candidate.header.level),payload=candidate.header.payload_hash;
    if(round===undefined)return undefined;
    const observerHead=this.observerHead(candidate.evidence.source);
    const target:ReconciliationTarget=Object.freeze({...this.generation(candidate.evidence.source),source:candidate.evidence.source,level:candidate.header.level,round,...(payload?{payload}:{}),candidate,...(observerHead?{observerHead}:{})});
    const record:ObservationTarget<T>=Object.freeze({identity,target,evidence:candidate.evidence,contextInvalid:false});
    this.unresolved.set(identity,record);this.tryAdmission(record);this.trim(this.unresolved,100);this.trim(this.acceptedCandidates,100);return this.find(identity);
  }

  addOperations(batch:readonly MonitoredOperation[]):readonly ObservationTarget<T>[] {
    const replayIdentity=(operation:MonitoredOperation):string=>JSON.stringify([operation.evidence?.source.network,operation.evidence?.source.baseUrl,operation.hash,operation.branch??null,operation.contents]);
    const replayIndex=new Map<string,MonitoredOperation[]>();
    for(const operation of this.raw.values()){const key=replayIdentity(operation),members=replayIndex.get(key)??[];members.push(operation);replayIndex.set(key,members);}
    const fresh=batch.filter(operation=>{
      if(!this.allowed(operation.evidence?.source) || this.raw.get(operation))return false;
      const evidence=operation.evidence;
      if(evidence.observedHeadHash===undefined)return true;
      return !(replayIndex.get(replayIdentity(operation))??[]).some(original=>{
        const proofs=this.bindings.get(operationIdentity(original));
        const observed=this.observerHead(evidence.source);
        if(!proofs?.size && original.evidence?.observedHeadHash===undefined && original.evidence?.requestedHeadHash===undefined && observed && observed.hash===evidence.observedHeadHash && (original.evidence?.chainId===undefined || original.evidence.chainId===observed.chainId))return true;
        return proofs && [...proofs.values()].some(proof=>proof.headHash===evidence.observedHeadHash && (evidence.chainId===undefined || evidence.chainId===proof.chainId) && (evidence.requestedHeadHash===undefined || evidence.requestedHeadHash===proof.headHash));
      });
    });
    this.raw.add(fresh);
    const created:ObservationTarget<T>[]=[],visited=new Set<string>();
    for(const submitted of fresh){
      const operation=this.raw.get(submitted);if(!operation)continue;
      const operationKey=operationIdentity(operation);if(visited.has(operationKey))continue;visited.add(operationKey);
      const evidence=operation.evidence;if(!evidence || !this.allowed(evidence.source))continue;
      for(const content of operation.contents){
        if(!content.block_payload_hash)continue;
        const identity=instanceIdentity(operation,content.level,content.round,content.block_payload_hash);
        let members=this.membership.get(identity);if(!members){members=new Set();this.membership.set(identity,members);}members.add(operationKey);
        let record=this.find(identity);
        if(!record){
          const observerHead=this.observerHead(evidence.source);
          const target:ReconciliationTarget=Object.freeze({...this.generation(evidence.source),source:evidence.source,level:content.level,round:content.round,payload:content.block_payload_hash,...(observerHead?{observerHead}:{})});
          record=Object.freeze({identity,target,evidence,contextInvalid:false});this.unresolved.set(identity,record);created.push(record);
        }
        this.tryAdmission(record);
      }
    }
    this.trim(this.unresolved,100);this.trim(this.instances,150);
    const retained=new Set(this.raw.values().map(operationIdentity));for(const key of this.bindings.keys())if(!retained.has(key))this.bindings.delete(key);
    for(const [identity,members] of this.membership){for(const key of members)if(!retained.has(key))members.delete(key);if(members.size===0)this.membership.delete(identity);}
    return created.map(record=>this.find(record.identity)).filter((record):record is ObservationTarget<T>=>record!==undefined);
  }

  accept(admission:ContextAdmission<T>):void {
    const context=admission.context,source=context.observer.source;
    const observed=context.observer.header,anchor=context.anchor,head=admission.head;
    const matchingHead=observed.hash===head.hash && observed.level===head.level && observed.predecessor===head.predecessor && observed.timestamp===head.timestamp && JSON.stringify(observed.fitness)===JSON.stringify(head.fitness) && (head.chainId===undefined || head.chainId===context.observer.chainId) && (head.proto===undefined || head.proto===observed.proto) && (head.payload_hash===undefined || head.payload_hash===observed.payload_hash);
    const matchingObserver=anchor.source.network===source.network && anchor.source.baseUrl===source.baseUrl && anchor.chainId===context.observer.chainId && observed.chainId===context.observer.chainId && anchor.header.chainId===anchor.chainId;
    const matchingTarget=context.level===head.level
      ? anchor.header.hash===head.predecessor && anchor.header.level===head.level-1 && anchor.nextProtocolHash===context.observer.protocolHash
      : context.level===head.level+1 && anchor.header.hash===head.hash && anchor.header.level===head.level && anchor.header.predecessor===observed.predecessor && anchor.header.timestamp===observed.timestamp && JSON.stringify(anchor.header.fitness)===JSON.stringify(observed.fitness) && anchor.protocolHash===context.observer.protocolHash && anchor.nextProtocolHash===context.observer.nextProtocolHash;
    if(!matchingHead || !matchingObserver || !matchingTarget || context.protocolHash!==anchor.nextProtocolHash)throw new Error("Contradictory admission context facts");
    const current=this.generation(source),latest=this.heads.get(source.baseUrl);
    if(!this.enabled || (admission.collectionGeneration===undefined && current.collectionGeneration!==0) || (admission.observerGeneration===undefined && current.observerGeneration!==0) || (admission.collectionGeneration!==undefined && admission.collectionGeneration!==current.collectionGeneration) || (admission.observerGeneration!==undefined && admission.observerGeneration!==current.observerGeneration) || (admission.observerGeneration===undefined && latest!==undefined && this.headerKey(latest)!==this.headerKey(admission.head)))throw new Error("Admission belongs to an obsolete observer generation");
    if(!this.allowed(source) || context.observer.header.hash!==admission.head.hash || !committeeAuthority(admission.rights,admission.constants.committee,admission.constants.quorum).usable || context.level!==context.observer.header.level && context.level!==context.observer.header.level+1)throw new Error("Incoherent observer admission");
    if(admission.rights.some(right=>!right.context || contextFacts(right.context)!==contextFacts(context)) || !admission.constants.context || contextFacts(admission.constants.context)!==contextFacts(context))throw new Error("Rights/constants do not prove the admission context");
    if(!this.expectedNetwork)this.establishNetworkIdentity(context.observer);
    if(admission.head.evidence?.source.baseUrl===source.baseUrl && admission.head.evidence.observedHeadHash===admission.head.hash)this.observeHead(admission.head);
    let contexts=this.contexts.get(source.baseUrl);if(!contexts){contexts=new Map();this.contexts.set(source.baseUrl,contexts);}
    for(const [level,old] of contexts)if(old.head.hash!==admission.head.hash)contexts.delete(level);
    contexts.set(context.level,Object.freeze(admission));this.recheck(source);
  }

  fail(identity:string,error:unknown):void {
    const record=this.unresolved.get(identity);if(record)this.unresolved.set(identity,Object.freeze({...record,error:String(error)}));
  }

  private recheck(source:RpcSource):void {
    for(const record of [...this.unresolved.values(),...this.acceptedCandidates.values(),...this.instances.values()])if(record.target.source.baseUrl===source.baseUrl)this.tryAdmission(record);
    this.trim(this.acceptedCandidates,100);this.trim(this.instances,150);
  }

  private tryAdmission(record:ObservationTarget<T>):boolean {
    const admission=this.contexts.get(record.target.source.baseUrl)?.get(record.target.level);
    const candidate=record.target.candidate;
    if(admission && this.expectedNetwork?.chainId!==admission.context.observer.chainId){
      const updated=Object.freeze({...record,sourceContext:admission,error:this.expectedNetwork?"Source chain contradicts expected network identity":"Expected network identity unavailable",contextInvalid:record.admission!==undefined || this.expectedNetwork!==undefined});
      const product=record.admission?(candidate?this.acceptedCandidates:this.instances):this.unresolved;
      product.set(record.identity,updated);return false;
    }
    const incompatibleReceipt=admission!==undefined && record.evidence.observedHeadHash!==undefined && record.evidence.observedHeadHash!==admission.context.observer.header.hash && (record.evidence.observedHeadLevel===undefined || record.target.level<=record.evidence.observedHeadLevel+1);
    const staleInstance=!candidate && record.admission!==undefined && admission!==undefined && record.admission.context.key!==admission.context.key;
    if(incompatibleReceipt || staleInstance || !admission || (record.evidence.chainId!==undefined && record.evidence.chainId!==admission.context.observer.chainId) || (candidate && candidate.header.predecessor!==admission.context.anchor.header.hash)){
      if(record.admission){const product=candidate?this.acceptedCandidates:this.instances;product.set(record.identity,Object.freeze({...record,contextInvalid:true}));}
      return false;
    }
    const updated:ObservationTarget<T>=Object.freeze({identity:record.identity,target:record.target,evidence:record.evidence,admission,sourceContext:admission,contextInvalid:false});
    this.unresolved.delete(record.identity);
    const product=candidate?this.acceptedCandidates:this.instances;product.set(record.identity,updated);
    const instanceRecords=candidate?[...this.unresolved.values(),...this.instances.values()].filter(instance=>!instance.contextInvalid && (!instance.admission || instance.admission.context.key===admission.context.key) && instance.target.source.baseUrl===record.target.source.baseUrl && instance.target.level===record.target.level && instance.target.round===record.target.round && instance.target.payload===record.target.payload):[record];
    const members=new Set(instanceRecords.flatMap(instance=>[...(this.membership.get(instance.identity)??[])]));
    for(const operationKey of members){
      const operation=this.raw.getByIdentity(operationKey);if(!operation)continue;
      if(operation.evidence?.source.baseUrl!==record.target.source.baseUrl)continue;
      if(!operation.contents.some(content=>content.level===record.target.level && content.round===record.target.round && content.block_payload_hash===record.target.payload))continue;
      const evidence=operation.evidence,context=admission.context;
      if(evidence.chainId!==undefined && evidence.chainId!==context.observer.chainId)continue;
      if(evidence.observedHeadHash!==undefined && evidence.observedHeadHash!==context.observer.header.hash && (evidence.observedHeadLevel===undefined || record.target.level<=evidence.observedHeadLevel+1))continue;
      const key=operationIdentity(operation);let proofs=this.bindings.get(key);if(!proofs){proofs=new Map();this.bindings.set(key,proofs);}if(proofs.has(context.key))continue;
      proofs.set(context.key,Object.freeze({source:context.observer.source,chainId:context.observer.chainId,headHash:context.observer.header.hash,predecessor:context.observer.header.predecessor,protocolHash:context.protocolHash,targetLevel:context.level,contextKey:context.key,anchorHash:context.anchor.header.hash,...(admission.rights[0]?.evidence?.collectionGeneration===undefined?{}:{proofGeneration:admission.rights[0].evidence.collectionGeneration}),provedAt:Date.now(),provedMonotonic:performance.now()}));
    }
    return true;
  }

  private find(identity:string):ObservationTarget<T>|undefined {return this.unresolved.get(identity)??this.acceptedCandidates.get(identity)??this.instances.get(identity);}
  target(identity:string):ObservationTarget<T>|undefined {return this.find(identity);}
  unresolvedTargets():readonly ObservationTarget<T>[] {return [...this.unresolved.values()];}
  acceptedTargets():readonly ObservationTarget<T>[] {return [...this.acceptedCandidates.values(),...this.instances.values()];}
  rawOperations():readonly MonitoredOperation[] {return this.raw.values().map(operation=>{const proofs=this.bindings.get(operationIdentity(operation)),admissions=proofs?[...proofs.values()]:[],admission=admissions[0];return admission?Object.freeze({...operation,admission,admissions:Object.freeze(admissions)}):operation;});}
  private trim(product:Map<string,ObservationTarget<T>>,maximum:number):void {
    if(product.size<=maximum)return;
    const ordered=[...product.values()].sort((a,b)=>a.evidence.receivedMonotonic-b.evidence.receivedMonotonic||a.identity.localeCompare(b.identity));
    for(const record of ordered.slice(0,product.size-maximum)){product.delete(record.identity);if(!this.find(record.identity))this.membership.delete(record.identity);}
  }
}
