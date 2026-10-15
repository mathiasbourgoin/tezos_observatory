import {nonnegativeInteger,validTimestamp} from './guards';
import type {NetworkName} from './models';

export const intervalWindows=Object.freeze([
 {label:'1 week',seconds:604800}, {label:'24 hours',seconds:86400}, {label:'1 hour',seconds:3600},
] as const);
export const intervalSource=(network:NetworkName):string=>network==='mainnet'?'https://api.tzkt.io':'https://api.shadownet.tzkt.io';
export interface IntervalReceipt {readonly wall:number;readonly monotonic:number}
export interface IndexedEndpoint {readonly level:number;readonly hash:string;readonly timestamp:string;readonly milliseconds:number}
export type IntervalValue={readonly state:'available'|'partial';readonly mean:number;readonly spanMilliseconds:number;readonly count:number;readonly start:IndexedEndpoint}
 |{readonly state:'insufficient'|'unavailable';readonly reason:string};
export interface IntervalWindow {readonly label:string;readonly seconds:number;readonly cutoff:number;readonly value:IntervalValue}
export interface IntervalBatch {
 readonly network:NetworkName;readonly source:string;readonly generation:number;readonly start:IntervalReceipt;
 readonly completed:IntervalReceipt;readonly end:IndexedEndpoint;readonly windows:readonly IntervalWindow[];
 readonly metadata:{readonly receipt:IntervalReceipt;readonly lag?:number;readonly lagReason?:string;readonly synchronizedAt?:string};
 readonly reads:readonly string[];
}
export interface IntervalView {
 readonly network:NetworkName;readonly source:string;readonly enabled:boolean;readonly running:boolean;readonly cooldownSeconds:number;
 readonly batch?:IntervalBatch;readonly stale:boolean;readonly freshnessMilliseconds?:number;readonly endpointAgeMilliseconds?:number;
 readonly endpointAgeReason?:string;readonly failure?:{readonly reason:string;readonly receipt:IntervalReceipt};
}
interface IntervalClock {wall():number;monotonic():number}
const clock:IntervalClock={wall:()=>Date.now(),monotonic:()=>performance.now()};
const receipt=(time:IntervalClock):IntervalReceipt=>Object.freeze({wall:time.wall(),monotonic:time.monotonic()});
const message=(error:unknown):string=>(error instanceof Error?error.message:String(error)).slice(0,240);
class IntervalIdentityError extends Error {}

export function indexedEndpoint(value:unknown):IndexedEndpoint {
 if(typeof value!=='object'||value===null||Array.isArray(value))throw new Error('Malformed indexed endpoint');
 const row=value as Record<string,unknown>;
 if(!nonnegativeInteger(row.level)||typeof row.hash!=='string'||!row.hash.trim()||!validTimestamp(row.timestamp)||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(row.timestamp))throw new Error('Malformed indexed endpoint level, hash or timestamp');
 return Object.freeze({level:row.level,hash:row.hash,timestamp:row.timestamp,milliseconds:Date.parse(row.timestamp)});
}
function single(body:unknown):IndexedEndpoint|undefined {
 if(!Array.isArray(body)||body.length>1)throw new Error('Expected an array containing zero or one indexed endpoint');
 return body.length?indexedEndpoint(body[0]):undefined;
}
export function intervalValue(end:IndexedEndpoint,start:IndexedEndpoint,cutoff:number,partial=false):IntervalValue {
 const count=end.level-start.level,span=end.milliseconds-start.milliseconds;
 const reason=end.milliseconds<=cutoff?'Selected indexed endpoint is at or before this cutoff'
  :!Number.isSafeInteger(count)||count<=0?'No positive safe completed interval count'
  :!Number.isSafeInteger(span)||span<=0?'No positive safe elapsed endpoint duration':undefined;
 if(reason)return Object.freeze({state:'insufficient',reason});
 const mean=span/1000/count;
 if(!Number.isFinite(mean)||mean<=0)return Object.freeze({state:'insufficient',reason:'Mean is not a positive finite number'});
 return Object.freeze({state:partial?'partial':'available',mean,spanMilliseconds:span,count,start});
}
export function formatInterval(mean:number):string{return mean>0&&mean<.005?'<0.01 s':`${mean.toFixed(2)} s`;}

/** Feature-local acquisition: no provider fallback, retry, pagination or background timer. */
export async function collectBlockIntervals(network:NetworkName,generation:number,signal:AbortSignal,time:IntervalClock=clock):Promise<IntervalBatch> {
 const source=intervalSource(network),start=receipt(time),reads:string[]=[],controller=new AbortController();
 if(!Number.isFinite(start.wall)||!Number.isFinite(start.monotonic)||!Number.isFinite(new Date(start.wall).getTime()))throw new Error('Invalid batch start clock');
 let wholeExpired=false;
 const cancel=()=>controller.abort();signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();
 const wholeTimer=setTimeout(()=>{wholeExpired=true;controller.abort();},24000);
 const assertCurrent=():void=>{
  if(wholeExpired||time.monotonic()-start.monotonic>=24000)throw new Error('Block interval batch exceeded twenty-four seconds');
  if(controller.signal.aborted)throw new Error('Block interval collection interrupted');
 };
 const urlFor=(parameters:Record<string,string>):URL=>{const url=new URL('/v1/blocks',source);url.search=new URLSearchParams({select:'level,timestamp,hash',limit:'1',...parameters}).toString();return url;};
 const read=async(url:URL):Promise<{body:unknown;headers:Headers;receipt:IntervalReceipt}>=>{
  assertCurrent();if(reads.length>=6)throw new Error('Block interval read budget exhausted');reads.push(url.href);
  const local=new AbortController(),started=time.monotonic();let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  let rejectAbort:(reason:Error)=>void=()=>{};
  const aborted=new Promise<never>((_,reject)=>{rejectAbort=reject;});
  let finished=false;
  const abortRead=()=>{if(finished)return;local.abort();void reader?.cancel().catch(()=>{});rejectAbort(new Error(wholeExpired?'Block interval batch exceeded twenty-four seconds':controller.signal.aborted?'Block interval collection interrupted':'Block interval full-body read exceeded eight seconds'));};
  controller.signal.addEventListener('abort',abortRead,{once:true});
  const timer=setTimeout(abortRead,8000);
  try {
   const result=await Promise.race([(async()=>{
    const response=await fetch(url.href,{method:'GET',credentials:'omit',cache:'no-store',redirect:'error',signal:local.signal});
    if(local.signal.aborted)throw new Error('Block interval read interrupted');
    if(response.redirected)throw new IntervalIdentityError('Unexpected indexed source redirect');
    if(response.url){let actual:URL;try{actual=new URL(response.url);}catch{throw new IntervalIdentityError('Indexed response URL cannot establish its configured source');}if(actual.origin!==url.origin||actual.pathname!==url.pathname)throw new IntervalIdentityError('Indexed response origin/path contradicts configured source');}
    if(!response.ok)throw new Error(`TzKT history HTTP ${response.status}`);
    if(!response.body)throw new Error('Indexed response body missing');
    reader=response.body.getReader();let bytes=0;const chunks:Uint8Array[]=[];
    while(true){const part=await reader.read();if(local.signal.aborted)throw new Error('Block interval body interrupted');if(part.done)break;bytes+=part.value.byteLength;if(bytes>16384){void reader.cancel().catch(()=>{});throw new Error('Indexed response exceeds 16384 bytes');}chunks.push(part.value);}
    reader.releaseLock();reader=undefined;
    const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.byteLength;}
    return {body:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer)) as unknown,headers:response.headers,receipt:receipt(time)};
   })(),aborted]);
   assertCurrent();if(time.monotonic()-started>=8000)throw new Error('Block interval full-body read exceeded eight seconds');
   return result;
  }finally{finished=true;clearTimeout(timer);controller.signal.removeEventListener('abort',abortRead);local.abort();void reader?.cancel().catch(()=>{});}
 };
 try {
  const initial=await read(urlFor({'timestamp.le':new Date(start.wall).toISOString(),'sort.desc':'level'}));
  const end=single(initial.body);if(!end)throw new Error('No indexed endpoint at or before batch start');
  if(end.milliseconds>start.wall)throw new Error('Indexed endpoint is later than batch start');
  const integerHeader=(name:string):number|undefined=>{const value=initial.headers.get(name);if(value===null||!/^\d+$/.test(value))return undefined;const parsed=Number(value);return nonnegativeInteger(parsed)?parsed:undefined;};
  const indexed=integerHeader('Tzkt-Level'),known=integerHeader('Tzkt-Known-Level'),sync=initial.headers.get('Tzkt-Synced-At');
  const lag=indexed!==undefined&&known!==undefined&&known>=indexed&&indexed>=end.level?known-indexed:undefined;
  const metadata=Object.freeze({receipt:initial.receipt,...(lag===undefined?{lagReason:'Coherent same-response indexed/known level metadata unavailable'}:{lag}),...(validTimestamp(sync)?{synchronizedAt:sync}:{})});
  type Floor={readonly endpoint?:IndexedEndpoint;readonly error?:string};
  const floors:Floor[]=[];let cursor=0;
  const worker=async():Promise<void>=>{while(cursor<intervalWindows.length){assertCurrent();const index=cursor++,definition=intervalWindows[index];if(!definition)throw new Error('Window definition missing');const cutoff=start.wall-definition.seconds*1000;
   try{const result=await read(urlFor({'timestamp.le':new Date(cutoff).toISOString(),'level.le':String(end.level),'sort.desc':'level'})),endpoint=single(result.body);
    if(endpoint&&(endpoint.level>end.level||endpoint.milliseconds>cutoff))throw new Error('Indexed floor violates cutoff or level selection');
    floors[index]=endpoint?{endpoint}:{};
   }catch(error){if(error instanceof IntervalIdentityError){controller.abort();throw error;}assertCurrent();floors[index]={error:message(error)};}
  }};
  await Promise.all([worker(),worker()]);
  let earliest:Floor|undefined;
  if(floors.some(floor=>!floor.endpoint&&!floor.error)){
   try{const response=await read(urlFor({'level.le':String(end.level),'sort.asc':'level'})),endpoint=single(response.body);
    if(!endpoint)throw new Error('Earliest available indexed endpoint missing');
    if(endpoint.level>end.level||endpoint.milliseconds>end.milliseconds)throw new Error('Earliest endpoint violates captured end selection');
    earliest={endpoint};
   }catch(error){if(error instanceof IntervalIdentityError)throw error;assertCurrent();earliest={error:message(error)};}
  }
  const verification=single((await read(urlFor({level:String(end.level)}))).body);
  if(!verification||verification.level!==end.level||verification.hash!==end.hash||verification.milliseconds!==end.milliseconds)throw new Error('Fixed indexed endpoint changed or disappeared during acquisition');
  assertCurrent();
  const windows=intervalWindows.map((definition,index):IntervalWindow=>{
   const cutoff=start.wall-definition.seconds*1000,floor=floors[index];let value:IntervalValue;
   if(!floor)value={state:'unavailable',reason:'Floor acquisition did not complete'};
   else if(floor.error)value={state:'unavailable',reason:floor.error};
   else if(floor.endpoint)value=intervalValue(end,floor.endpoint,cutoff);
   else if(earliest?.endpoint){value=earliest.endpoint.milliseconds<=cutoff?{state:'unavailable',reason:'Earliest endpoint contradicts the empty cutoff lookup'}:intervalValue(end,earliest.endpoint,cutoff,true);}
   else value={state:'unavailable',reason:earliest?.error??'Lower indexed history unavailable'};
   return Object.freeze({...definition,cutoff,value:Object.freeze(value)});
  });
  const completed=receipt(time);assertCurrent();
  return Object.freeze({network,source,generation,start,end,metadata,windows:Object.freeze(windows),completed,reads:Object.freeze([...reads])});
 }finally{clearTimeout(wholeTimer);signal.removeEventListener('abort',cancel);controller.abort();}
}

export interface AppliedIntervalHead {readonly key:string;readonly source:string;readonly chain:string;readonly level:number;readonly hash:string;readonly predecessor:string}
/** A single bounded acquisition owner per network; rendering/ticking never acquires. */
export class BlockIntervals {
 private enabled=false;private generation=0;private lastStart=Number.NEGATIVE_INFINITY;private queued=false;
 private active:{readonly controller:AbortController;readonly generation:number;readonly done:Promise<void>}|undefined;
 private batch?:IntervalBatch;private sticky=false;private failure:IntervalView['failure'];private applied?:AppliedIntervalHead;
 constructor(readonly network:NetworkName,private readonly changed:()=>void=()=>{},private readonly time:IntervalClock=clock){}
 setEnabled(enabled:boolean):void {
  if(enabled===this.enabled)return;this.enabled=enabled;
  if(enabled)this.refresh();else this.invalidate('Collection interrupted');this.changed();
 }
 invalidate(reason:string):void {
  this.generation++;this.queued=false;this.active?.controller.abort();this.active=undefined;this.sticky=true;
  this.failure=Object.freeze({reason:reason.slice(0,240),receipt:receipt(this.time)});this.changed();
 }
 appliedHead(head:AppliedIntervalHead):void {
  const previous=this.applied;this.applied=Object.freeze({...head});if(previous?.key===head.key)return;
  if(previous&&previous.source===head.source&&previous.chain===head.chain&&(head.level<previous.level||head.level===previous.level&&head.hash!==previous.hash||head.level===previous.level+1&&head.predecessor!==previous.hash))this.invalidate('Proven applied branch changed; retained indexed evidence is stale');
  this.refresh();
 }
 refresh():Promise<void> {
  const now=this.time.monotonic();if(!this.enabled||now-this.lastStart<60000)return Promise.resolve();
  if(this.active){this.queued=true;return this.active.done;}
  const controller=new AbortController(),generation=this.generation;this.lastStart=now;
  const done=collectBlockIntervals(this.network,generation,controller.signal,this.time).then(batch=>{
   if(controller.signal.aborted||generation!==this.generation||!this.enabled)return;
   if(batch.network!==this.network||batch.source!==intervalSource(this.network)||batch.generation!==generation){this.invalidate('Metric network/source generation contradiction');return;}
   this.batch=batch;this.sticky=false;this.failure=undefined;
  }).catch(error=>{
   if(controller.signal.aborted||generation!==this.generation)return;
   this.sticky=true;this.failure=Object.freeze({reason:message(error),receipt:receipt(this.time)});
  }).finally(()=>{
   if(this.active?.controller!==controller)return;
   this.active=undefined;const queued=this.queued;this.queued=false;this.changed();
   if(queued&&this.enabled&&this.time.monotonic()-this.lastStart>=60000)void this.refresh();
  });
  this.active={controller,generation,done};this.changed();return done;
 }
 view():IntervalView {
  const now=this.time.monotonic(),batch=this.batch,freshness=batch?now-batch.completed.monotonic:undefined;
  const endpointAge=batch?(batch.start.wall-batch.end.milliseconds)+(now-batch.start.monotonic):undefined;
  const safeAge=endpointAge!==undefined&&Number.isFinite(endpointAge)&&Number.isSafeInteger(Math.trunc(endpointAge))&&endpointAge>=0;
  return Object.freeze({network:this.network,source:intervalSource(this.network),enabled:this.enabled,running:this.active!==undefined,cooldownSeconds:Math.max(0,Math.ceil((60000-(now-this.lastStart))/1000)),stale:this.sticky||freshness!==undefined&&freshness>=120000,...(batch?{batch}:{}),...(freshness!==undefined?{freshnessMilliseconds:freshness}:{}),...(safeAge?{endpointAgeMilliseconds:endpointAge}:{endpointAgeReason:'Selected indexed-endpoint age unavailable or unsafe'}),...(this.failure?{failure:this.failure}:{})});
 }
}
