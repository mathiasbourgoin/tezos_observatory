import type {ObservationEvidence} from './rpc/models';
import type {TargetContext,DelegateRight} from './rpc/networkData';

/** Present original phase and helper receipts without inventing a new observation. */
export function phaseProof(evidence:ObservationEvidence|undefined,context:TargetContext|undefined,rights:readonly DelegateRight[],complete:boolean,historical=false){
 if(!evidence)return undefined;
 return {receivedAt:evidence.receivedAt,receivedMonotonic:evidence.receivedMonotonic,description:`${historical?'Historical as-of':'Observed phase'} · ${complete?'Source-snapshot coverage captured':'Partial positive observations; no complete coverage claim'} · Observer ${evidence.source.baseUrl} · Chain ${context?.observer.chainId??evidence.chainId??'unknown'} · Context head ${context?.observer.header.hash??'unknown'} · Requested anchor ${context?.anchor.header.hash??'unknown'} · Execution protocol ${context?.protocolHash??'unknown'} · Rights responder ${rights[0]?.evidence?.source.baseUrl??'unknown'} · Rights received ${rights[0]?.evidence?new Date(rights[0].evidence.receivedAt).toISOString():'unknown'} · Shared payload evidence`};
}
