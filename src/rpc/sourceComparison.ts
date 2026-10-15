import type {BlockHeader,MonitoredOperation,NetworkName,ObservationEvidence,RpcSource} from './models';
import type {Constants,DelegateRight,TargetContext,RpcContext} from './networkData';
import {asBlockHeader,asOperationBatch} from './guards';
import {proposalRound} from '../consensus/roundSchedule';
import {operationIdentity} from './operationStore';
import {comparisonAuthorityUsable,comparisonGroupsFor,committeeAuthority,signerPower,type ComparisonAuthorityProof} from '../consensus/phaseEvidence';

export interface ComparisonSelection {
  readonly key:string;
  readonly source:RpcSource;
  readonly chainId?:string;
  readonly header?:BlockHeader;
  readonly level:number;
  readonly round:number;
  readonly payload?:string;
  readonly historical:boolean;
  readonly coherent:boolean;
  readonly context?:TargetContext;
  readonly rights?:readonly DelegateRight[];
  readonly constants?:Constants;
}
export interface ComparisonResult {
  readonly selection:ComparisonSelection;
  readonly source:RpcSource;
  readonly outcome:'head-agreement'|'divergence'|'partial'|'unavailable';
  readonly headOutcome:ComparisonResult['outcome'];
  readonly differences:readonly string[];
  readonly chainId?:string;
  readonly head?:BlockHeader;
  readonly protocolHash?:string;
  readonly evidence?:ObservationEvidence;
  readonly identityEvidence?:ObservationEvidence;
  readonly headEvidence?:ObservationEvidence;
  readonly pendingEvidence?:ObservationEvidence;
  readonly rawOperations:readonly MonitoredOperation[];
  readonly pendingReasons:readonly string[];
  readonly powers?:readonly {readonly round:number;readonly payload:string;readonly pre?:number;readonly att?:number;readonly total:number;readonly threshold:number}[];
  readonly rights?:readonly DelegateRight[];
  readonly rightsProof?:string;
  readonly reads:readonly string[];
  readonly errors:readonly string[];
  readonly startedAt:number;
  readonly startedMonotonic:number;
  readonly invalidated:boolean;
  readonly stale:boolean;
}

/** Capture the typed numerical/provenance graph before the first asynchronous read. */
function captureSelection(selection:ComparisonSelection):ComparisonSelection {
  const contexts=new Map<TargetContext,TargetContext>();
  const source=(value:RpcSource):RpcSource=>Object.freeze({...value});
  const evidence=(value:ObservationEvidence):ObservationEvidence=>Object.freeze({...value,source:source(value.source)});
  const header=(value:BlockHeader):BlockHeader=>Object.freeze({...value,fitness:Object.freeze([...value.fitness]),...(value.evidence?{evidence:evidence(value.evidence)}:{})});
  const reference=(value:RpcContext):RpcContext=>Object.freeze({...value,source:source(value.source),header:header(value.header),evidence:evidence(value.evidence)});
  const context=(value:TargetContext):TargetContext=>{
    const existing=contexts.get(value);if(existing)return existing;
    const captured=Object.freeze({...value,observer:reference(value.observer),anchor:reference(value.anchor)});contexts.set(value,captured);return captured;
  };
  return Object.freeze({...selection,source:source(selection.source),...(selection.header?{header:header(selection.header)}:{}),...(selection.context?{context:context(selection.context)}:{}),...(selection.rights?{rights:Object.freeze(selection.rights.map(right=>Object.freeze({...right,...(right.context?{context:context(right.context)}:{}),...(right.evidence?{evidence:evidence(right.evidence)}:{})})))}:{}),...(selection.constants?{constants:Object.freeze({...selection.constants,...(selection.constants.context?{context:context(selection.constants.context)}:{}),...(selection.constants.evidence?{evidence:evidence(selection.constants.evidence)}:{})})}:{})});
}

/** One explicit, bounded observer comparison; never a source of LIVE authority. */
export class SourceComparison {
  private current?:ComparisonResult;
  private task:{controller:AbortController;promise:Promise<ComparisonResult|undefined>;generation:number}|undefined;
  private generation=0;
  private enabled=true;
  private selectionKey?:string;
  constructor(readonly network:NetworkName,readonly configured:readonly RpcSource[],readonly options:{readonly rawCapacity?:()=>number;readonly onChange?:()=>void}={}){}
  get running():boolean{return this.task!==undefined;}
  result():ComparisonResult|undefined{
    if(this.current&&!this.current.stale&&performance.now()-(this.current.evidence?.receivedMonotonic??this.current.startedMonotonic)>=60000)this.current=Object.freeze({...this.current,stale:true});
    return this.current;
  }
  private invalidate():void{
    this.generation++;this.task?.controller.abort();this.task=undefined;
    if(this.current)this.current=Object.freeze({...this.current,invalidated:true,stale:true});
    this.options.onChange?.();
  }
  setSelection(key:string):void{if(this.selectionKey!==undefined&&key!==this.selectionKey)this.invalidate();this.selectionKey=key;}
  setRawCapacity(capacity:number):void{
    const limit=Number.isSafeInteger(capacity)?Math.max(0,Math.min(10000,capacity)):0;
    if(this.current&&this.current.rawOperations.length>limit){this.current=Object.freeze({...this.current,rawOperations:Object.freeze(this.current.rawOperations.slice(0,limit)),pendingReasons:Object.freeze([...new Set([...this.current.pendingReasons,'Local shared raw retention limit; captured positive facts remain as-of'])])});this.options.onChange?.();}
  }
  pause():void{this.enabled=false;this.invalidate();}
  resume():void{this.enabled=true;}
  compare(selection:ComparisonSelection,source:RpcSource):Promise<ComparisonResult|undefined>{
    if(this.task)return this.task.promise;
    source=Object.freeze({...source});
    selection=captureSelection(selection);
    this.setSelection(selection.key);
    const controller=new AbortController(),generation=this.generation;
    let complete!:(value:ComparisonResult|undefined)=>void,fail!:(error:unknown)=>void;
    const promise=new Promise<ComparisonResult|undefined>((resolve,reject)=>{complete=resolve;fail=reject;});
    const task={controller,promise,generation};this.task=task;
    const allowed=this.enabled&&selection.source.network===this.network&&source.network===this.network&&source.baseUrl!==selection.source.baseUrl&&this.configured.some(item=>item.network===this.network&&item.baseUrl===source.baseUrl)&&this.configured.some(item=>item.network===this.network&&item.baseUrl===selection.source.baseUrl);
    void this.run(selection,source,controller,allowed).then(result=>{
      if(controller.signal.aborted||generation!==this.generation){complete(undefined);return;}
      this.current=result;this.setRawCapacity(this.options.rawCapacity?.()??10000);complete(this.current);
    },fail).finally(()=>{if(this.task===task){this.task=undefined;this.options.onChange?.();}});
    this.options.onChange?.();return promise;
  }
  private async run(selection:ComparisonSelection,source:RpcSource,controller:AbortController,allowed:boolean):Promise<ComparisonResult>{
    const selectedChain=selection.chainId??selection.header?.chainId;
    const startedAt=Date.now(),startedMonotonic=performance.now(),reads:string[]=[],errors:string[]=[],pendingReasons:string[]=[],differences:string[]=[];
    let chainId:string|undefined,head:BlockHeader|undefined,protocolHash:string|undefined,identityEvidence:ObservationEvidence|undefined,headEvidence:ObservationEvidence|undefined,pendingEvidence:ObservationEvidence|undefined,rawOperations:readonly MonitoredOperation[]=[],powers:ComparisonResult['powers'],rights:ComparisonResult['rights'],rightsProof:string|undefined;
    const receipt=():ObservationEvidence=>Object.freeze({source,receivedAt:Date.now(),receivedMonotonic:performance.now()});
    const read=async(path:string):Promise<{body:unknown;evidence:ObservationEvidence}>=>{
      const readStarted=performance.now(),remaining=24000-(performance.now()-startedMonotonic);if(remaining<=0)throw new Error('Comparison workflow exceeded twenty-four seconds');
      const url=source.baseUrl.replace(/\/$/,'')+path;reads.push(url);
      const local=new AbortController();
      let rejectAbort!:(error:Error)=>void;
      const aborted=new Promise<never>((_,reject)=>{rejectAbort=reject;});
      const cancel=()=>{local.abort();rejectAbort(new Error(controller.signal.aborted?'Comparison cancelled':'Comparison read exceeded eight seconds'));};
      controller.signal.addEventListener('abort',cancel,{once:true});
      const timer=setTimeout(cancel,Math.min(8000,remaining));
      try{
        const body=await Promise.race([(async()=>{const response=await fetch(url,{signal:local.signal,cache:'no-store',redirect:'error'});if(!response.ok||response.redirected)throw new Error(`Comparison HTTP ${response.status} or unsupported redirect`);return response.json() as Promise<unknown>;})(),aborted]);
        if(controller.signal.aborted)throw new Error('Comparison cancelled');
        if(performance.now()-readStarted>8000||performance.now()-startedMonotonic>24000)throw new Error('Comparison full body exceeded read/workflow deadline');
        return {body,evidence:receipt()};
      }finally{clearTimeout(timer);controller.signal.removeEventListener('abort',cancel);}
    };
    if(allowed){
      try{
        const identity=await read('/chains/main/chain_id');identityEvidence=identity.evidence;
        if(typeof identity.body!=='string'||!identity.body)throw new Error('Invalid comparison chain identity');
        chainId=identity.body;
        if(selectedChain!==undefined&&chainId!==selectedChain){differences.push('chain identity');}
        else{
          const response=await read('/chains/main/blocks/head/header');headEvidence=response.evidence;head=asBlockHeader(response.body);
          if(head.chainId!==chainId)throw new Error('Comparison header contradicts chain identity');
          const body=response.body as Record<string,unknown>;protocolHash=typeof body.protocol==='string'&&body.protocol?body.protocol:undefined;
          if(selection.header){if(head.hash!==selection.header.hash)differences.push('head hash');if(head.level!==selection.header.level)differences.push('level');if(head.timestamp!==selection.header.timestamp)differences.push('timestamp');if(proposalRound(head.fitness,head.level)!==selection.round)differences.push('round');}
          const pending=await read('/chains/main/mempool/pending_operations?version=2');pendingEvidence=pending.evidence;
          const envelope=pending.body;
          if(typeof envelope!=='object'||envelope===null||!('validated' in envelope)||!Array.isArray(envelope.validated))throw new Error('Version 2 validated pending category unavailable');
          let unusable=false;const normalized=asOperationBatch(envelope.validated,()=>{unusable=true;});
          const retained=new Map<string,MonitoredOperation>();for(const operation of normalized){const observed=Object.freeze({...operation,evidence:pending.evidence}),key=operationIdentity(observed);if(!retained.has(key)&&retained.size<10000)retained.set(key,observed);}
          rawOperations=Object.freeze([...retained.values()]);
          if(unusable)pendingReasons.push('Malformed or unsupported validated entries; snapshot partial');
          if(normalized.length>10000)pendingReasons.push('Local shared raw retention limit; snapshot partial');
          const cachedRights=selection.rights;
          if(selection.coherent&&selection.context&&selection.context.level===selection.level&&selection.constants&&cachedRights&&protocolHash){
            const proof:ComparisonAuthorityProof={source,chainId,head,producingProtocolHash:protocolHash,context:selection.context,constants:selection.constants,headEvidence,pendingEvidence,configuredSources:this.configured};
            if(comparisonAuthorityUsable(cachedRights,selection.context.level,proof)){
              const authority=committeeAuthority(cachedRights,selection.constants.committee,selection.constants.quorum);
              if(authority.usable){rights=cachedRights;rightsProof=JSON.stringify([source.baseUrl,chainId,head.hash,head.predecessor,protocolHash,selection.context.key]);powers=Object.freeze(comparisonGroupsFor(rawOperations,cachedRights,selection.context.level,proof).map(group=>{const pre=signerPower(group.pre,cachedRights),att=signerPower(group.att,cachedRights);return Object.freeze({round:group.round,payload:group.payload,...(pre?{pre}:{}),...(att?{att}:{}),total:authority.total,threshold:authority.threshold});}));}
            }
          }
        }
      }catch(error){errors.push(error instanceof Error?error.message:String(error));}
    }else errors.push('Comparison requires collection and two distinct configured network providers');
    const evidence=pendingEvidence??headEvidence??identityEvidence;
    const headProven=head!==undefined&&headEvidence!==undefined&&chainId!==undefined&&head.chainId===chainId;
    const headOutcome:ComparisonResult['outcome']=!headProven?'unavailable':!selection.coherent||!selection.header||!selectedChain||selectedChain!==chainId?'partial':differences.length?'divergence':'head-agreement';
    const outcome:ComparisonResult['outcome']=!allowed||!identityEvidence?'unavailable':!selection.coherent?'partial':differences.length?'divergence':errors.length||!head||!selection.header||!selectedChain?'partial':'head-agreement';
    return Object.freeze({selection,source,outcome,headOutcome,differences:Object.freeze(differences),...(chainId?{chainId}:{}),...(head?{head}:{}),...(protocolHash?{protocolHash}:{}),...(evidence?{evidence}:{}),...(identityEvidence?{identityEvidence}:{}),...(headEvidence?{headEvidence}:{}),...(pendingEvidence?{pendingEvidence}:{}),rawOperations,pendingReasons:Object.freeze(pendingReasons),...(powers?{powers}:{}),...(rights?{rights}:{}),...(rightsProof?{rightsProof}:{}),reads:Object.freeze(reads),errors:Object.freeze(errors),startedAt,startedMonotonic,invalidated:false,stale:false});
  }
}
