import type {SessionSnapshot} from '../monitor/observationStore';

/** Project retained phase peaks without changing their source/context identities. */
export function recentConsensus<T>(history:readonly SessionSnapshot<T>[]){
 return history.filter(snapshot=>snapshot.record.phases?.pre!==undefined||snapshot.record.phases?.att!==undefined).slice(0,5).map(snapshot=>{const record=snapshot.record,pre=record.phases?.pre,att=record.phases?.att;return {identity:snapshot.identity,level:record.target.level,round:record.target.round,total:pre?.maximumTotal??att?.maximumTotal??record.admission?.constants.committee??0,...(pre?{prePower:pre.maximumPower,preTotal:pre.maximumTotal}:{}),...(att?{attPower:att.maximumPower,attTotal:att.maximumTotal}:{}),...(record.target.payload?{payload:record.target.payload}:{}),source:record.target.source.baseUrl};});
}
