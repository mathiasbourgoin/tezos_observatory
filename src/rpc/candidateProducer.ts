import type {ObservationTarget} from '../monitor/observationStore';
import type {Derived,NetworkData} from './networkData';
import type {ObservationEvidence} from './models';

// Exact supported metadata schema: Octez proto_025_PsUshuai (pinned primary source in author evidence).
export const PRODUCER_PROTOCOL='PsUshuai9QapM5TGj1JpuVGkdxz5GykdnEvS6Rh8SUVrARvZLCY';
export interface BlockProducerFact {readonly identity:string;readonly hash:string;readonly baker:string;readonly protocol:string;readonly evidence:ObservationEvidence}
type Record=ObservationTarget<Derived>;
type Attempt={readonly source:string;readonly chain:string;readonly level:number};
export function metadataBaker(value:unknown,record:Record):string|undefined {
 if(!value||typeof value!=='object'||!record.target.candidate||record.admission?.context.protocolHash!==PRODUCER_PROTOCOL)return undefined;
 const raw=value as {baker?:unknown;proposer?:unknown;protocol?:unknown;level_info?:{level?:unknown};hash?:unknown};
 const address=/^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
 if(typeof raw.baker!=='string'||!address.test(raw.baker)||typeof raw.proposer!=='string'||!address.test(raw.proposer)||raw.level_info?.level!==record.target.level||raw.protocol!==PRODUCER_PROTOCOL||raw.hash!==undefined&&raw.hash!==record.target.candidate.header.hash)return undefined;
 return raw.baker;
}
/** Admission-driven optional evidence. No rendering/navigation entrypoint can start a read. */
export class CandidateProducers {
 private enabled=false;
 private readonly attempts=new Map<string,Attempt>();
 private readonly watermarks=new Map<string,{chain:string;level:number}>();
 private readonly facts=new Map<string,BlockProducerFact>();
 private flight:{record:Record;controller:AbortController;epoch:string}|undefined;
 private queued:Record|undefined;
 constructor(private readonly options:{data:Pick<NetworkData,'blockMetadata'>;sources:readonly string[];epoch:(record:Record)=>string|undefined;changed:(fact:BlockProducerFact,epoch:string)=>void}){}
 start():void {this.enabled=true;}
 stop():void {this.enabled=false;this.queued=undefined;this.flight?.controller.abort();}
 fact(identity:string):BlockProducerFact|undefined{return this.facts.get(identity);}
 get state():Readonly<{attempts:number;cached:number;inFlight:number;queued:number;saturated:boolean}>{return Object.freeze({attempts:this.attempts.size,cached:this.facts.size,inFlight:this.flight?1:0,queued:this.queued?1:0,saturated:this.attempts.size>=100});}
 /** Called only after real source candidate/context admission. */
 admitted(records:readonly Record[]):void {
  if(!this.enabled)return;
  for(const record of records){
   const context=record.admission?.context,source=record.target.source.baseUrl;
   if(!context||record.contextInvalid||!this.options.sources.includes(source)||context.observer.source.baseUrl!==source||record.evidence.source.baseUrl!==source||record.evidence.chainId!==undefined&&record.evidence.chainId!==context.observer.chainId||record.target.candidate&&record.target.candidate.header.chainId!==context.observer.chainId||!this.options.epoch(record))continue;
   const prior=this.watermarks.get(source),chain=context.observer.chainId,level=context.observer.header.level;
   if(prior&&prior.chain!==chain)continue;
   if(!prior||level>prior.level){
    this.watermarks.set(source,{chain,level});
    for(const [identity,attempt] of this.attempts)if(attempt.source===source&&attempt.chain===chain&&attempt.level<level)this.attempts.delete(identity);
   }
  }
  this.fence();
  for(const record of [...records].sort((a,b)=>a.evidence.receivedMonotonic-b.evidence.receivedMonotonic||a.identity.localeCompare(b.identity))){
   if(!this.eligible(record)||this.attempts.has(record.identity)||this.facts.has(record.identity)||this.attempts.size>=100)continue;
   const context=record.admission!.context;
   this.attempts.set(record.identity,{source:record.target.source.baseUrl,chain:context.observer.chainId,level:record.target.level});
   if(this.flight)this.queued=record;else this.launch(record);
  }
 }
 /** Synchronous lifecycle/context fence; it can cancel, but never starts work. */
 fence():void {
  if(this.flight&&(!this.eligible(this.flight.record)||this.options.epoch(this.flight.record)!==this.flight.epoch))this.flight.controller.abort();
  if(this.queued&&!this.eligible(this.queued))this.queued=undefined;
 }
 private eligible(record:Record):boolean {
  const candidate=record.target.candidate,context=record.admission?.context,watermark=this.watermarks.get(record.target.source.baseUrl);
  return this.enabled&&!!candidate&&!!context&&!record.contextInvalid&&context.protocolHash===PRODUCER_PROTOCOL&&candidate.header.chainId===context.observer.chainId&&candidate.evidence.source.baseUrl===context.observer.source.baseUrl&&!!watermark&&watermark.chain===context.observer.chainId&&context.observer.header.level===watermark.level&&record.target.level>=watermark.level&&record.target.level<=watermark.level+1&&!!this.options.epoch(record);
 }
 private launch(record:Record):void {
  const epoch=this.options.epoch(record);if(!epoch||!this.eligible(record))return;
  const controller=new AbortController(),flight={record,controller,epoch};this.flight=flight;
  void this.options.data.blockMetadata(record.target.candidate!.header,record.target.source,controller.signal).then(receipt=>{
   if(controller.signal.aborted||this.flight!==flight||!this.eligible(record)||this.options.epoch(record)!==epoch)return;
   if(receipt.evidence.source.baseUrl!==record.target.source.baseUrl||receipt.evidence.source.network!==record.target.source.network||receipt.evidence.requestedHeadHash!==record.target.candidate!.header.hash)return;
   const baker=metadataBaker(receipt.value,record);if(!baker)return;
   const context=record.admission!.context,hash=record.target.candidate!.header.hash;
   const fact:BlockProducerFact=Object.freeze({identity:record.identity,hash,baker,protocol:context.protocolHash,evidence:Object.freeze({...receipt.evidence,source:Object.freeze({...receipt.evidence.source}),chainId:context.observer.chainId,protocolHash:context.protocolHash,contextHeadHash:context.observer.header.hash,predecessor:context.anchor.header.hash})});
   this.facts.set(record.identity,fact);if(this.facts.size>100)this.facts.delete(this.facts.keys().next().value!);this.options.changed(fact,epoch);
  }).catch(()=>{/* Optional metadata failure remains unknown, without retry or cascade. */}).finally(()=>{
   if(this.flight!==flight)return;this.flight=undefined;const queued=this.queued;this.queued=undefined;if(queued&&this.eligible(queued))this.launch(queued);
  });
 }
}
