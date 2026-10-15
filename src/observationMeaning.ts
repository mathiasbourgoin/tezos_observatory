import {observedHeaderMatches} from './consensus/opportunityFacts';
import {proposalRound} from './consensus/roundSchedule';
import type {NetworkViewModel,ObservedNavigatorView} from './dashboardView';
import type {NetworkDerivedState,NetworkMonitorView} from './monitor/networkMonitor';

type Meaning=Pick<NetworkViewModel,'selectedRelationship'|'appliedSinceMonotonic'|'nextProposalObservation'>;
/** Read-only relationship to the actually proven applied head, never a clock projection. */
export function observationMeaning<T extends NetworkDerivedState>(view:Pick<NetworkMonitorView<T>,'snapshot'|'appliedProof'|'networkIdentity'|'observationTargets'>,selected:ObservedNavigatorView|undefined):Meaning {
 const head=view.snapshot?.head,proof=view.appliedProof,expectedChain=view.networkIdentity?.chainId;
 if(!head||!proof||!expectedChain)return {};
 const {context,evidence}=proof,source=context.source.baseUrl;
 if(source!==head.evidence?.source.baseUrl||context.source.network!==head.evidence.source.network||context.header.chainId!==context.chainId||context.chainId!==expectedChain||!observedHeaderMatches(context.header,head)||evidence.source.baseUrl!==source||evidence.source.network!==context.source.network||!Number.isFinite(evidence.receivedMonotonic)||evidence.receivedMonotonic<0||(evidence.chainId!==undefined&&evidence.chainId!==context.chainId)||(evidence.observedHeadHash!==undefined&&evidence.observedHeadHash!==head.hash))return {};
 const next=view.observationTargets.some(record=>!record.contextInvalid&&record.target.candidate!==undefined&&record.target.source.baseUrl===source&&record.target.level===head.level+1&&record.target.candidate.header.predecessor===head.hash&&record.admission?.context.observer.chainId===context.chainId&&record.admission.context.observer.source.baseUrl===source&&record.admission.context.anchor.header.hash===head.hash);
 const result:Meaning={appliedSinceMonotonic:evidence.receivedMonotonic,nextProposalObservation:{observed:next,source:context.source.name}};
 if(!selected?.coherent||selected.source!==source||selected.chain!==context.chainId)return result;
 const round=proposalRound(head.fitness,head.level);
 if(round!==undefined&&selected.level===head.level&&selected.round===round&&selected.payload!==undefined&&selected.payload===head.payload_hash)result.selectedRelationship=selected.hash===head.hash?'applied-block':selected.hash===undefined?'applied-tuple':'different-block';
 else result.selectedRelationship=selected.level===head.level+1&&selected.contextParent===head.hash?'next-level':'other';
 return result;
}
