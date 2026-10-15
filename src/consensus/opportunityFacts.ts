import type {BlockHeader,ObservationEvidence,RpcSource} from '../rpc/models';
import type {RpcContext,TargetContext} from '../rpc/networkData';
import {headFactsKey} from '../monitor/headGeneration';
import {conditionalRoundBoundary,protocolRoundStart,proposalRound,tenderbakeFitness,validCalendarMilliseconds,type OpportunityFact} from './roundSchedule';

const header=(value:BlockHeader):BlockHeader=>Object.freeze({...value,...(value.evidence?{evidence:evidence(value.evidence)}:{}),fitness:Object.freeze([...value.fitness])});
const evidence=(value:ObservationEvidence):ObservationEvidence=>Object.freeze({...value,source:Object.freeze({...value.source})});
const rpc=(value:RpcContext):RpcContext=>Object.freeze({...value,source:Object.freeze({...value.source}),header:header(value.header),evidence:evidence(value.evidence)});
const context=(value:TargetContext):TargetContext=>Object.freeze({...value,observer:rpc(value.observer),anchor:rpc(value.anchor)});
/** Compare only facts the original observation actually supplied. */
export const observedHeaderMatches=(proven:BlockHeader,observed:BlockHeader):boolean=>proven.hash===observed.hash&&proven.level===observed.level&&proven.predecessor===observed.predecessor&&proven.timestamp===observed.timestamp&&JSON.stringify(proven.fitness)===JSON.stringify(observed.fitness)&&(observed.chainId===undefined||proven.chainId===observed.chainId)&&(observed.proto===undefined||proven.proto===observed.proto)&&(observed.payload_hash===undefined||proven.payload_hash===observed.payload_hash);

/** Capture only the two selected-relative opportunities, independently qualified. */
export function captureOpportunityFacts(facts:readonly [OpportunityFact,OpportunityFact],selected:TargetContext,level:number,round:number,allowed:(source:RpcSource)=>boolean,observedReference?:BlockHeader):readonly [OpportunityFact,OpportunityFact]|undefined {
  const sameRpc=(a:RpcContext,b:RpcContext):boolean=>a.source.baseUrl===b.source.baseUrl&&a.source.network===b.source.network&&a.chainId===b.chainId&&a.protocolHash===b.protocolHash&&a.nextProtocolHash===b.nextProtocolHash&&headFactsKey(a.header)===headFactsKey(b.header);
  const provenRpc=(value:RpcContext):boolean=>allowed(value.source)&&value.header.chainId===value.chainId&&value.evidence.source.baseUrl===value.source.baseUrl&&value.evidence.source.network===value.source.network&&value.evidence.chainId===value.chainId&&value.evidence.protocolHash===value.protocolHash&&value.evidence.nextProtocolHash===value.nextProtocolHash&&value.evidence.requestedHeadHash===value.header.hash;
  const compatible=(value:TargetContext,receipt:ObservationEvidence,target:number):boolean=>{
    const candidateParent=observedReference?.level===selected.observer.header.level+1?selected.observer:observedReference?.level===selected.observer.header.level?selected.anchor:undefined;
    const candidateObserver=candidateParent!==undefined&&observedReference?.level===level&&observedHeaderMatches(value.observer.header,observedReference)&&proposalRound(value.observer.header.fitness,level)===round&&value.observer.header.predecessor===candidateParent.header.hash&&value.observer.protocolHash===selected.protocolHash&&candidateParent.nextProtocolHash===selected.protocolHash&&(value.observer.protocolHash!==candidateParent.protocolHash||tenderbakeFitness(value.observer.header.fitness,level)?.predecessorRound===proposalRound(candidateParent.header.fitness,candidateParent.header.level));
    const observer=candidateObserver?value.observer:selected.observer;
    const anchor=target===observer.header.level?(candidateObserver?candidateParent:selected.anchor):target===observer.header.level+1?observer:undefined;
    return anchor!==undefined&&provenRpc(value.observer)&&provenRpc(value.anchor)&&sameRpc(value.anchor,anchor)&&value.protocolHash===anchor.nextProtocolHash&&
    value.level===target && value.observer.chainId===selected.observer.chainId &&
    value.observer.source.baseUrl===selected.observer.source.baseUrl &&
    value.observer.source.network===selected.observer.source.network &&
    value.observer.header.chainId===selected.observer.chainId &&
    (candidateObserver||sameRpc(value.observer,selected.observer)) &&
    value.anchor.chainId===value.observer.chainId && value.anchor.nextProtocolHash===value.protocolHash &&
    allowed(receipt.source) && validCalendarMilliseconds(receipt.receivedAt) && receipt.chainId===value.observer.chainId && receipt.protocolHash===value.protocolHash &&
    receipt.targetLevel===target && receipt.contextHeadHash===value.observer.header.hash &&
    receipt.requestedHeadHash===value.anchor.header.hash;
  };
  if(!Number.isSafeInteger(round)||round<0||round>=0x7fffffff)return undefined;
  const result:OpportunityFact[]=[];
  for(let index=0;index<2;index++){
    const fact=facts[index];
    if(!fact||fact.branch!==(index===0?'same-level':'next-level')||fact.level!==level+index||fact.round!==(index===0?round+1:0)||!fact.condition||!validCalendarMilliseconds(fact.capturedAt)||!Number.isFinite(fact.capturedMonotonic)||fact.capturedMonotonic<0)return undefined;
    let proposer:OpportunityFact['proposer'];
    if(fact.proposer.state==='known'){
      const right=fact.proposer.right;
      if(!right.delegate||right.level!==fact.level||right.round!==fact.round||!compatible(right.context,right.evidence,fact.level))return undefined;
      proposer=Object.freeze({state:'known',right:Object.freeze({...right,context:context(right.context),evidence:evidence(right.evidence)})});
    }else{if(!fact.proposer.reason)return undefined;proposer=Object.freeze({...fact.proposer});}
    let timing:OpportunityFact['timing'];
    if(fact.timing.state==='known'){
      const value=fact.timing,parameters=value.parameters;
      const reference=observedReference??(selected.observer.header.level===level?selected.observer.header:undefined);
      if(!compatible(parameters.context,parameters.evidence,fact.level)||Date.parse(value.reference.timestamp)!==value.referenceTimestamp||proposalRound(value.reference.fitness,value.reference.level)!==value.referenceRound||!Number.isSafeInteger(value.deadline)||!Number.isSafeInteger(value.remainingAtCapture)||value.remainingAtCapture<0||value.remainingAtCapture!==Math.max(0,value.deadline-fact.capturedAt))return undefined;
      let deadline:number|undefined;
      if(value.basis==='observed-selected'){
        if(!reference||headFactsKey(value.reference)!==headFactsKey(reference)||value.referenceRound!==round||value.reference.level!==level||(fact.branch==='next-level'&&parameters.context.protocolHash!==selected.protocolHash))return undefined;
        deadline=conditionalRoundBoundary({referenceTimestamp:value.referenceTimestamp,referenceRound:value.referenceRound,branch:fact.branch,minimum:parameters.minimum,increment:parameters.increment,roundBasis:'proven'});
      }else{
        if(fact.branch!=='same-level'||value.reference.level!==level-1||!observedHeaderMatches(selected.observer.header,value.reference)||selected.protocolHash!==selected.observer.protocolHash)return undefined;
        deadline=protocolRoundStart({referenceTimestamp:value.referenceTimestamp,referenceRound:value.referenceRound,targetRound:round+1,minimum:parameters.minimum,increment:parameters.increment,roundBasis:'proven'});
      }
      if(deadline!==value.deadline)return undefined;
      timing=Object.freeze({...value,reference:header(value.reference),parameters:Object.freeze({...parameters,context:context(parameters.context),evidence:evidence(parameters.evidence)})});
    }else{if(!fact.timing.reason)return undefined;timing=Object.freeze({...fact.timing});}
    result.push(Object.freeze({...fact,proposer,timing}));
  }
  return Object.freeze([result[0]!,result[1]!] as const);
}
