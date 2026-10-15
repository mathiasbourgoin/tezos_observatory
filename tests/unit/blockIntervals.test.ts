import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {BlockIntervals,collectBlockIntervals,indexedEndpoint,intervalValue,formatInterval} from '../../src/rpc/blockIntervals';

beforeEach(()=>{expect.hasAssertions();});
afterEach(context=>{Object.assign(context.task.meta,{blockIntervalAssertions:expect.getState().assertionCalls});vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});
const T=Date.parse('2026-10-15T12:00:30Z');
const end={level:104,hash:'E104',timestamp:'2026-10-15T12:00:28Z'};
const time={wall:()=>T,monotonic:()=>100};
const endpoint=(level:number,timestamp:string)=>indexedEndpoint({level,hash:`H${level}`,timestamp});
const responseFor=(url:URL):unknown=>{
 if(url.searchParams.has('level')||!url.searchParams.has('level.le'))return [end];
 const cutoff=url.searchParams.get('timestamp.le');
 if(cutoff?.startsWith('2026-10-08'))return [{level:20,hash:'W20',timestamp:'2026-10-08T12:00:04Z'}];
 if(cutoff?.startsWith('2026-10-14'))return [{level:80,hash:'D80',timestamp:'2026-10-14T12:00:04Z'}];
 return [{level:100,hash:'H100',timestamp:'2026-10-15T11:00:04Z'}];
};
const serve=(override?:(url:URL)=>unknown)=>{
 const fetcher=vi.fn(async(input:RequestInfo|URL)=>Response.json(override?override(new URL(String(input))):responseFor(new URL(String(input)))));
 vi.stubGlobal('fetch',fetcher);return fetcher;
};

it('computes crossing intervals from elapsed timestamps and level differences, preserving precision',()=>{
 const result=intervalValue(indexedEndpoint(end),endpoint(100,'2026-10-15T11:00:04Z'),T-3600000);
 expect(result).toMatchObject({state:'available',mean:906,spanMilliseconds:3624000,count:4});
 const fine=intervalValue(endpoint(2,'2026-10-15T12:00:00.004Z'),endpoint(1,'2026-10-15T12:00:00Z'),T-3600000);
 expect(fine).toMatchObject({mean:.004,count:1});expect(formatInterval(.004)).toBe('<0.01 s');
 expect(formatInterval(906)).toBe('906.00 s');
});
it('keeps invalid source fields distinct from valid but unusable arithmetic',()=>{
 for(const timestamp of ['2026-02-30T12:00:00Z','2026-10-15T12:00:00.1234Z','2026-10-15T12:00:00'])expect(()=>endpoint(1,timestamp)).toThrow();
 expect(endpoint(1,'2026-10-15T14:00:00.001+02:00').milliseconds).toBe(Date.parse('2026-10-15T12:00:00.001Z'));
 for(const lower of [endpoint(104,end.timestamp),endpoint(105,'2026-10-15T11:00:00Z'),endpoint(100,end.timestamp)])expect(intervalValue(indexedEndpoint(end),lower,T-3600000)).toMatchObject({state:'insufficient'});
});
it('acquires exactly five anonymous projected reads and uses only initial response lag metadata',async()=>{
 let active=0,peak=0;const reads:{url:URL;options:RequestInit|undefined}[]=[];
 vi.stubGlobal('fetch',async(input:RequestInfo|URL,options?:RequestInit)=>{active++;peak=Math.max(peak,active);await Promise.resolve();const url=new URL(String(input));reads.push({url,options});active--;return Response.json(responseFor(url),{headers:reads.length===1?{'Tzkt-Level':'250','Tzkt-Known-Level':'255','Tzkt-Synced-At':'2026-10-15T12:00:29Z'}:{'Tzkt-Level':'1','Tzkt-Known-Level':'0'}});});
 const result=await collectBlockIntervals('mainnet',3,new AbortController().signal,time);
 expect(reads).toHaveLength(5);expect(peak).toBeLessThanOrEqual(2);expect(result.metadata.lag).toBe(5);expect(result.end.level).toBe(104);expect(result.generation).toBe(3);
 expect(reads.every(read=>read.url.origin==='https://api.tzkt.io'&&read.url.searchParams.get('select')==='level,timestamp,hash'&&read.options?.credentials==='omit'&&read.options.cache==='no-store'&&read.options.redirect==='error'&&read.options.method==='GET')).toBe(true);
 expect(result.windows.map(window=>'mean' in window.value?window.value.mean:undefined)).toEqual([604824/84,3601,906]);
 expect(reads.at(-1)?.url.searchParams.get('level')).toBe('104');
});
it('shares one earliest lookup only between valid empty floors and labels partial coverage',async()=>{
 const fetcher=serve(url=>url.searchParams.get('sort.asc')==='level'?[{level:100,hash:'Young100',timestamp:'2026-10-15T10:00:00Z'}]:url.searchParams.has('timestamp.le')&&url.searchParams.has('level.le')&&!url.searchParams.get('timestamp.le')?.startsWith('2026-10-15')?[]:responseFor(url));
 const result=await collectBlockIntervals('shadownet',0,new AbortController().signal,time);
 expect(fetcher).toHaveBeenCalledTimes(6);expect(result.windows.map(window=>window.value.state)).toEqual(['partial','partial','available']);
 expect(result.reads.every(url=>url.startsWith('https://api.shadownet.tzkt.io/'))).toBe(true);
});
it('rejects fixed endpoint changes atomically and keeps malformed floor failure local',async()=>{
 serve(url=>url.searchParams.get('timestamp.le')?.startsWith('2026-10-08')?[{level:'bad'}]:responseFor(url));
 const result=await collectBlockIntervals('mainnet',0,new AbortController().signal,time);
 expect(result.windows.map(window=>window.value.state)).toEqual(['unavailable','available','available']);expect(result.reads).toHaveLength(5);
 serve(url=>url.searchParams.has('level')?[{...end,hash:'Reorg'}]:responseFor(url));
 await expect(collectBlockIntervals('mainnet',0,new AbortController().signal,time)).rejects.toThrow('changed or disappeared');
});
it('rejects streamed overflow without reading an unbounded JSON body',async()=>{
 vi.stubGlobal('fetch',async()=>new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array(16385));controller.close();}})));
 await expect(collectBlockIntervals('mainnet',0,new AbortController().signal,time)).rejects.toThrow('16384');
});
it('settles an abort-ignoring fetch after eight seconds with no late followup reads',async()=>{
 vi.useFakeTimers();const fetcher=vi.fn(()=>new Promise<Response>(()=>{}));vi.stubGlobal('fetch',fetcher);
 const attempt=collectBlockIntervals('mainnet',0,new AbortController().signal,time);const result=expect(attempt).rejects.toThrow('eight seconds');
 await vi.advanceTimersByTimeAsync(8000);await result;expect(fetcher).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);
});
it('rejects a malformed populated response URL as a shared identity contradiction',async()=>{
 vi.stubGlobal('fetch',async(input:RequestInfo|URL)=>{const url=new URL(String(input)),response=Response.json(responseFor(url));if(url.searchParams.get('timestamp.le')?.startsWith('2026-10-08'))Object.defineProperty(response,'url',{value:'not a URL'});return response;});
 await expect(collectBlockIntervals('mainnet',0,new AbortController().signal,time)).rejects.toThrow('source');
});
it('enforces cooldown without polling and stales at completion plus120 seconds',async()=>{
 let mono=0;serve();const service=new BlockIntervals('mainnet',()=>{},{wall:()=>T,monotonic:()=>mono});
 service.setEnabled(true);for(let turn=0;turn<100;turn++)await Promise.resolve();
 expect(service.view().batch).toBeDefined();const batch=service.view().batch;
 mono=59999;await service.refresh();expect(service.view().batch).toBe(batch);
 mono=119999;expect(service.view().stale).toBe(false);mono=120000;expect(service.view().stale).toBe(true);
 service.setEnabled(false);expect(service.view().stale).toBe(true);expect(service.view().batch).toBe(batch);
});
it('bounds ignored-abort body reads locally and still verifies independent supported windows',async()=>{
 vi.useFakeTimers();let cancelCount=0;const calls:string[]=[];
 vi.stubGlobal('fetch',async(input:RequestInfo|URL)=>{const url=new URL(String(input));calls.push(url.href);return url.searchParams.get('timestamp.le')?.startsWith('2026-10-08')?new Response(new ReadableStream({pull:()=>new Promise(()=>{}),cancel:()=>{cancelCount++;}})):Response.json(responseFor(url));});
 const attempt=collectBlockIntervals('mainnet',0,new AbortController().signal,time);
 await vi.advanceTimersByTimeAsync(8000);const batch=await attempt;
 expect(batch.windows.map(window=>window.value.state)).toEqual(['unavailable','available','available']);expect(calls).toHaveLength(5);expect(cancelCount).toBe(1);expect(vi.getTimerCount()).toBe(0);
});
it('rejects the whole24second attempt even when the final ignored-abort response later agrees',async()=>{
 vi.useFakeTimers();let mono=0;const calls:string[]=[];
 vi.stubGlobal('fetch',(input:RequestInfo|URL)=>{const url=new URL(String(input));calls.push(url.href);return new Promise<Response>(resolve=>setTimeout(()=>resolve(Response.json(responseFor(url))),7999));});
 const attempt=collectBlockIntervals('mainnet',0,new AbortController().signal,{wall:()=>T,monotonic:()=>mono});
 const outcome=attempt.then(value=>({value,error:undefined}),error=>({value:undefined,error}));
 for(const delta of [7999,7999,7999,3]){mono+=delta;await vi.advanceTimersByTimeAsync(delta);}
 const result=await outcome;expect(result.value).toBeUndefined();expect(result.error).toBeInstanceOf(Error);expect((result.error as Error).message).toContain('twenty-four');expect(calls).toHaveLength(5);await vi.advanceTimersByTimeAsync(8000);expect(calls).toHaveLength(5);expect(vi.getTimerCount()).toBe(0);
});
it('does not commit when the final completion receipt itself reaches the whole deadline',async()=>{
 serve();let walls=0,mono=0;
 const attempt=collectBlockIntervals('mainnet',0,new AbortController().signal,{wall:()=>{if(++walls===7)mono=24000;return T;},monotonic:()=>mono});
 await expect(attempt).rejects.toThrow('twenty-four');
});
it('keeps failed shared attempts atomic and never borrows a previous numeric window',async()=>{
 let mono=0;const fetcher=serve();const service=new BlockIntervals('mainnet',()=>{},{wall:()=>T,monotonic:()=>mono});
 service.setEnabled(true);for(let turn=0;turn<100;turn++)await Promise.resolve();const original=service.view().batch;expect(original).toBeDefined();
 mono=60000;fetcher.mockImplementation(async()=>new Response('Unavailable',{status:503}));await service.refresh();
 expect(service.view()).toMatchObject({stale:true,batch:original,failure:{reason:'TzKT history HTTP 503'}});
 mono=120000;fetcher.mockImplementation(async(input:RequestInfo|URL)=>{const url=new URL(String(input));return Response.json(url.searchParams.get('timestamp.le')?.startsWith('2026-10-08')?[{level:'bad'}]:responseFor(url));});await service.refresh();
 expect(service.view().batch).not.toBe(original);expect(service.view().batch?.windows[0]?.value).toMatchObject({state:'unavailable'});expect(service.view().stale).toBe(false);
});
it('fences ignored-abort old generations through pause and same-context resume',async()=>{
 let mono=0,release:((response:Response)=>void)|undefined;const fetcher=vi.fn(()=>new Promise<Response>(resolve=>{release=resolve;}));vi.stubGlobal('fetch',fetcher);
 const service=new BlockIntervals('mainnet',()=>{},{wall:()=>T,monotonic:()=>mono});service.setEnabled(true);service.setEnabled(false);mono=60000;
 vi.stubGlobal('fetch',async(input:RequestInfo|URL)=>Response.json(responseFor(new URL(String(input)))));service.setEnabled(true);for(let turn=0;turn<100;turn++)await Promise.resolve();
 const current=service.view().batch;expect(current).toBeDefined();release?.(Response.json([{...end,hash:'OldGenerationPoison'}]));for(let turn=0;turn<100;turn++)await Promise.resolve();expect(service.view().batch).toBe(current);expect(service.view().batch?.end.hash).toBe('E104');
});
it('uses completion monotonic freshness independently of selected endpoint age and wall jumps',async()=>{
 let mono=100,wall=T;vi.stubGlobal('fetch',async(input:RequestInfo|URL)=>{mono+=100;return Response.json(responseFor(new URL(String(input))));});
 const service=new BlockIntervals('mainnet',()=>{},{wall:()=>wall,monotonic:()=>mono});service.setEnabled(true);for(let turn=0;turn<100;turn++)await Promise.resolve();
 const batch=service.view().batch;expect(batch?.start.monotonic).toBe(100);expect(batch?.completed.monotonic).toBeGreaterThan(100);expect(service.view().freshnessMilliseconds).toBe(0);
 const age=service.view().endpointAgeMilliseconds;wall-=864000000;mono+=119999;expect(service.view().stale).toBe(false);expect(service.view().endpointAgeMilliseconds).toBe((age??0)+119999);mono++;expect(service.view().stale).toBe(true);expect(service.view().batch).toBe(batch);
});
it.each(['rollback','same-height','adjacent-parent'] as const)('fences only proven applied branch replacement: %s',async(kind)=>{
 let mono=0;serve();const service=new BlockIntervals('mainnet',()=>{},{wall:()=>T,monotonic:()=>mono});service.setEnabled(true);for(let turn=0;turn<100;turn++)await Promise.resolve();
 service.appliedHead({key:'A',source:'https://rpc-a.invalid',chain:'NetA',level:100,hash:'A',predecessor:'P'});
 const head=kind==='rollback'?{level:99,hash:'R',predecessor:'Q'}:kind==='same-height'?{level:100,hash:'R',predecessor:'P'}:{level:101,hash:'R',predecessor:'Other100'};
 service.appliedHead({key:'R',source:'https://rpc-a.invalid',chain:'NetA',...head});expect(service.view().stale).toBe(true);expect(service.view().failure?.reason).toContain('Proven applied branch');
 mono=60000;await service.refresh();expect(service.view().stale).toBe(false);
});
it.each(['forward','gap','rotation','duplicate'] as const)('does not invent metric contradiction from %s',async(kind)=>{
 serve();const service=new BlockIntervals('mainnet',()=>{},time);service.setEnabled(true);for(let turn=0;turn<100;turn++)await Promise.resolve();
 const first={key:'A',source:'https://rpc-a.invalid',chain:'NetA',level:100,hash:'A',predecessor:'P'};service.appliedHead(first);
 service.appliedHead(kind==='duplicate'?first:kind==='rotation'?{...first,key:'B',source:'https://rpc-b.invalid',level:90,hash:'B'}:{...first,key:'B',level:kind==='gap'?105:101,hash:'B',predecessor:kind==='gap'?'Unknown':'A'});expect(service.view().stale).toBe(false);expect(service.view().failure).toBeUndefined();
});
it.each([[],[end,end],{},[{...end,timestamp:'2026-10-15T12:00:31Z'}]])('rejects malformed, missing or future shared initial selection %j',async(body)=>{
 const fetcher=serve(()=>body);await expect(collectBlockIntervals('mainnet',0,new AbortController().signal,time)).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(1);
});
it('accepts exact normalized offset equality while preserving original timestamp strings',async()=>{
 serve(url=>url.searchParams.has('level')?[{...end,timestamp:'2026-10-15T14:00:28+02:00'}]:responseFor(url));
 const batch=await collectBlockIntervals('mainnet',0,new AbortController().signal,time);expect(batch.end.timestamp).toBe(end.timestamp);expect(batch.windows[2]?.value).toMatchObject({mean:906});
 serve(url=>url.searchParams.has('level')?[{...end,timestamp:'2026-10-15T12:00:28.001Z'}]:responseFor(url));await expect(collectBlockIntervals('mainnet',0,new AbortController().signal,time)).rejects.toThrow('changed');
});
it('applies empty-floor contradictions only to dependent windows, without treating unsupported metadata as history proof',async()=>{
 serve(url=>url.searchParams.get('sort.asc')==='level'?[{level:10,hash:'Earliest10',timestamp:'2026-10-13T12:00:00Z',historyComplete:true}]:url.searchParams.get('timestamp.le')?.startsWith('2026-10-08')||url.searchParams.get('timestamp.le')?.startsWith('2026-10-14')?[]:responseFor(url));
 const batch=await collectBlockIntervals('mainnet',0,new AbortController().signal,time);expect(batch.windows.map(window=>window.value.state)).toEqual(['partial','unavailable','available']);expect(batch.windows[1]?.value).toMatchObject({reason:'Earliest endpoint contradicts the empty cutoff lookup'});expect(batch.reads).toHaveLength(6);
});
it('keeps earliest failure local to missing-history dependents and never falls back from invalid nonempty rows',async()=>{
 const requests:string[]=[];vi.stubGlobal('fetch',async(input:RequestInfo|URL)=>{const url=new URL(String(input));requests.push(url.href);if(url.searchParams.get('sort.asc')==='level')return new Response('History unavailable',{status:503});return Response.json(url.searchParams.get('timestamp.le')?.startsWith('2026-10-08')||url.searchParams.get('timestamp.le')?.startsWith('2026-10-14')?[]:responseFor(url));});
 const batch=await collectBlockIntervals('mainnet',0,new AbortController().signal,time);expect(batch.windows.map(window=>window.value.state)).toEqual(['unavailable','unavailable','available']);expect(requests).toHaveLength(6);
 const fetcher=serve(url=>url.searchParams.get('timestamp.le')?.startsWith('2026-10-08')?[end,end]:responseFor(url));const invalid=await collectBlockIntervals('mainnet',0,new AbortController().signal,time);expect(invalid.windows[0]?.value.state).toBe('unavailable');expect(fetcher).toHaveBeenCalledTimes(5);
});
it.each([{}, {'Tzkt-Level':'-1','Tzkt-Known-Level':'255'}, {'Tzkt-Level':'9007199254740992','Tzkt-Known-Level':'9007199254740993'}, {'Tzkt-Level':'250','Tzkt-Known-Level':'249'}, {'Tzkt-Level':'100','Tzkt-Known-Level':'255'}])('keeps unsupported or incoherent metadata unknown independently of usable spans: %j',async(headers)=>{
 vi.stubGlobal('fetch',async(input:RequestInfo|URL)=>Response.json(responseFor(new URL(String(input))),{headers:{...headers,'Tzkt-Synced-At':'2026-10-15T12:00:29Z','Unknown-Chain':'wrong'}}));
 const batch=await collectBlockIntervals('mainnet',0,new AbortController().signal,time);expect(batch.metadata.lag).toBeUndefined();expect(batch.metadata.synchronizedAt).toBe('2026-10-15T12:00:29Z');expect(batch.windows.every(window=>window.value.state==='available')).toBe(true);
});
it('treats invalid synchronization independently of coherent level lag and accepts exactly16KiB streamed bodies',async()=>{
 vi.stubGlobal('fetch',async(input:RequestInfo|URL)=>new Response(JSON.stringify(responseFor(new URL(String(input)))).padEnd(16384,' '),{headers:{'Tzkt-Level':'250','Tzkt-Known-Level':'255','Tzkt-Synced-At':'2026-02-30T12:00:00Z'}}));
 const batch=await collectBlockIntervals('mainnet',0,new AbortController().signal,time);expect(batch.metadata.lag).toBe(5);expect(batch.metadata.synchronizedAt).toBeUndefined();expect(batch.windows[2]?.value).toMatchObject({mean:906});
});
it('coalesces eligible overlap into one latest attempt and drops cooldown-ineligible work without timers',async()=>{
 let mono=0,release:((response:Response)=>void)|undefined,reads=0;vi.stubGlobal('fetch',(input:RequestInfo|URL)=>{reads++;return reads===1?new Promise<Response>(resolve=>{release=resolve;}):Promise.resolve(Response.json(responseFor(new URL(String(input)))));});
 const service=new BlockIntervals('mainnet',()=>{},{wall:()=>T,monotonic:()=>mono});service.setEnabled(true);mono=59000;await service.refresh();expect(reads).toBe(1);mono=60000;const first=service.refresh(),second=service.refresh();expect(first).toBe(second);release?.(Response.json([end]));await first;for(let turn=0;turn<100;turn++)await Promise.resolve();expect(reads).toBe(6);expect(service.view().batch).toBeDefined();mono=119999;await service.refresh();expect(reads).toBe(6);mono=120000;expect(reads).toBe(6);await service.refresh();expect(reads).toBe(11);
});
it('includes a whole long-stall crossing interval and preserves irregular large-gap arithmetic',()=>{
 expect(intervalValue(endpoint(102,'2026-10-15T12:00:00Z'),endpoint(100,'2026-10-15T10:00:00Z'),Date.parse('2026-10-15T11:00:30Z'))).toMatchObject({mean:3600,count:2,spanMilliseconds:7200000});
 expect(intervalValue(endpoint(1000000000,'2026-10-15T12:00:28Z'),endpoint(100,'2026-10-15T11:00:04Z'),T-3600000)).toMatchObject({mean:3624/999999900,count:999999900});
});
it.each(['https://other.invalid/v1/blocks','https://api.tzkt.io/v1/not-blocks'])('rejects populated wrong response source %s even on an otherwise valid local floor',async(source)=>{
 vi.stubGlobal('fetch',async(input:RequestInfo|URL)=>{const url=new URL(String(input)),response=Response.json(responseFor(url));if(url.searchParams.get('timestamp.le')?.startsWith('2026-10-08'))Object.defineProperty(response,'url',{value:source});return response;});await expect(collectBlockIntervals('mainnet',0,new AbortController().signal,time)).rejects.toThrow('configured source');
});
it('keeps independent network failures from overwriting supported results and ignores unsupported completeness flags',async()=>{
 vi.stubGlobal('fetch',async(input:RequestInfo|URL)=>{const url=new URL(String(input));return url.hostname==='api.shadownet.tzkt.io'?new Response('Unavailable',{status:503}):Response.json((responseFor(url) as object[]).map(row=>({...row,historyComplete:false,missingHistory:true})));});
 const main=new BlockIntervals('mainnet',()=>{},time),shad=new BlockIntervals('shadownet',()=>{},time);main.setEnabled(true);shad.setEnabled(true);for(let turn=0;turn<100;turn++)await Promise.resolve();expect(main.view().batch?.windows.every(window=>window.value.state==='available')).toBe(true);expect(shad.view().batch).toBeUndefined();expect(shad.view().failure?.reason).toBe('TzKT history HTTP 503');
});
const runnerModule=async()=>{
 const path=new URL('../../scripts/check-observatory-block-intervals.mjs',import.meta.url).href;
 const module:unknown=await import(path);
 if(typeof module!=='object'||module===null||!('classifyUnits' in module)||typeof module.classifyUnits!=='function'||!('classifyBrowsers' in module)||typeof module.classifyBrowsers!=='function')throw new Error('Feature runner classification exports missing');
 return {classifyUnits:module.classifyUnits,classifyBrowsers:module.classifyBrowsers};
};
it('classifies actual-shaped browser reports with runtime errors taking precedence in either order',async()=>{
 const runner=await runnerModule(),expected=['A','B'].map(title=>({title,annotation:{type:'block-interval-verified',description:title}}));
 const browser=(messages:readonly string[])=>({errors:[],stats:{expected:4-messages.length,skipped:0,unexpected:messages.length,flaky:0},suites:[{specs:expected.map((entry,index)=>({title:entry.title,tests:['chromium','firefox'].map(projectName=>({projectName,annotations:[entry.annotation],results:[{status:projectName==='chromium'&&messages[index]?'failed':'passed',errors:projectName==='chromium'&&messages[index]?[{message:messages[index]}]:[]}]}))}))}]});
 for(const messages of [['Error: expect(received).toBe(expected) failed','Error: missing production module'],['Error: missing production module','Error: expect(received).toBe(expected) failed']])expect(()=>runner.classifyBrowsers(browser(messages),1,expected)).toThrow('missing production module');
 expect(runner.classifyBrowsers(browser(['Error: expect(received).toBe(expected) failed']),1,expected)).toMatchObject({code:1});expect(runner.classifyBrowsers(browser([]),0,expected)).toMatchObject({code:0,completed:4});
 const missing=browser([]);missing.suites[0]?.specs[0]?.tests.pop();expect(()=>runner.classifyBrowsers(missing,0,expected)).toThrow();
});
it('requires every unit case and real positive assertion count and prioritizes runtime over RED',async()=>{
 const runner=await runnerModule(),unit=(fullName:string,failure:string|undefined)=>({fullName,status:failure?'failed':'passed',failureMessages:failure?[failure]:[],meta:{blockIntervalAssertions:1}});
 for(const failures of [['AssertionError: expected positive','Error: missing fixture'],['Error: missing fixture','AssertionError: expected positive']])expect(()=>runner.classifyUnits({numTotalTests:2,success:false,testResults:[{assertionResults:failures.map((message,index)=>unit(String(index),message))}]},1,['0','1'])).toThrow('missing fixture');
 const valid={numTotalTests:1,success:true,testResults:[{assertionResults:[unit('A',undefined)]}]};expect(runner.classifyUnits(valid,0,['A'])).toMatchObject({code:0,assertions:1});const sole=valid.testResults[0]?.assertionResults[0];if(!sole)throw new Error('Unit classifier fixture missing');sole.meta.blockIntervalAssertions=0;expect(()=>runner.classifyUnits(valid,0,['A'])).toThrow('Zero/missing');
 expect(()=>runner.classifyUnits({numTotalTests:0,success:true,testResults:[]},0,['A'])).toThrow();
});

it('rejects an inventory-only metric matrix without actual source-bound DOM observations',async()=>{
 const path=new URL('../../scripts/check-observatory-block-intervals.mjs',import.meta.url).href,module:unknown=await import(path);
 if(typeof module!=='object'||module===null||!('validateMetricInventory' in module)||typeof module.validateMetricInventory!=='function')throw new Error('Metric observation consumer missing');
 const validate=module.validateMetricInventory;
 const bundle={manifest:{variants:['metric-values'],renders:Array.from({length:36},()=>({variant:'metric-values'})),additionalSurfaces:['metric-refresh-focus'],surfaceEvidence:{'metric-refresh-focus':['inventory-only.json']}}};
 expect(()=>validate(bundle,{variants:['metric-values'],additionalSurfaces:['metric-refresh-focus']})).toThrow('Missing actual metric cell');
});

it('checks actual metric fonts, source, coverage and parent bindings instead of trusting a PASS label',async()=>{
 const path=new URL('../../scripts/check-observatory-block-intervals.mjs',import.meta.url).href,module:unknown=await import(path);
 if(typeof module!=='object'||module===null||!('validateMetricObservation' in module)||typeof module.validateMetricObservation!=='function')throw new Error('Metric observation checker missing');
 const validate=module.validateMetricObservation;
 const binding={sourceCombined:'a'.repeat(64),contractCombined:'b'.repeat(64),productionCombined:'c'.repeat(64)},parent={...binding,state:'metric-values',engine:'chromium',theme:'light',viewport:{width:360,height:800},screenshotSha256:'d'.repeat(64)},bounds={x:0,y:0,width:320,height:100,right:320};
 const record={...parent,namespace:'observatory-block-intervals',status:'PASS',metric:{bounds,rows:['1 week','24 hours','1 hour'].map(label=>({label,bounds,mean:'906.00 s',coverage:'4 intervals · 3,624 s actual coverage',endpoints:'Level 100 · 2026-10-15T11:00:04.000Z → 104 · 2026-10-15T12:00:28.000Z'})),sourceHref:'https://api.tzkt.io/v1/blocks',sourceText:'TzKT-reported indexed spans',typography:['interval-mean','interval-coverage','interval-endpoints','interval-note','interval-status'].map(selector=>({selector,size:14})),refresh:{tag:'BUTTON',bounds:{width:44,height:44}},details:{tag:'DETAILS',open:false,summaryBounds:{height:24}}}};
 expect(validate(record,parent,binding)).toMatchObject({code:0,failures:[]});
 const tiny=structuredClone(record);if(!tiny.metric.typography[0])throw new Error('Font fixture absent');tiny.metric.typography[0].size=10.5;expect(validate(tiny,parent,binding)).toMatchObject({code:1});
 const unqualified=structuredClone(record);unqualified.metric.sourceHref='https://unrelated.invalid/';expect(validate(unqualified,parent,binding)).toMatchObject({code:1});
 const missingCoverage=structuredClone(record);if(!missingCoverage.metric.rows[0])throw new Error('Coverage fixture absent');missingCoverage.metric.rows[0].coverage='';expect(validate(missingCoverage,parent,binding)).toMatchObject({code:1});
 expect(()=>validate({...record,productionCombined:'e'.repeat(64)},parent,binding)).toThrow('different productionCombined');
});

it('accepts a floor exactly at each cutoff including equivalent offset timestamps',async()=>{
 for(const offset of [false,true]){
  const fetcher=serve(url=>{
   if(url.searchParams.has('level')||!url.searchParams.has('level.le'))return responseFor(url);
   const cutoff=url.searchParams.get('timestamp.le');if(!cutoff)throw new Error('Cutoff query absent');const milliseconds=Date.parse(cutoff),level=cutoff.startsWith('2026-10-08')?20:cutoff.startsWith('2026-10-14')?80:100;
   const timestamp=offset?new Date(milliseconds+7200000).toISOString().replace('Z','+02:00'):cutoff;
   return [{level,hash:`ExactCutoff${level}`,timestamp}];
  });
  const result=await collectBlockIntervals('mainnet',0,new AbortController().signal,time);expect(fetcher).toHaveBeenCalledTimes(5);
  for(const [index,window] of result.windows.entries()){
   const count=[84,24,4][index];if(count===undefined)throw new Error('Window count fixture absent');const spanMilliseconds=window.seconds*1000-2000;
   expect(window.value).toMatchObject({state:'available',count,spanMilliseconds,mean:spanMilliseconds/1000/count,start:{milliseconds:window.cutoff}});
   if(window.value.state==='available')expect(window.value.start.timestamp.endsWith(offset?'+02:00':'Z')).toBe(true);
  }
 }
});

it('rejects a missing or incoherent native browser summary after all real scenario results pass',async()=>{
 const runner=await runnerModule(),entry={title:'completed metric case',annotation:{type:'block-interval-verified',description:'complete'}};
 const report={errors:[],stats:{expected:2,skipped:0,unexpected:0,flaky:0},suites:[{specs:[{title:entry.title,tests:['chromium','firefox'].map(projectName=>({projectName,annotations:[entry.annotation],results:[{status:'passed',errors:[]}]}))}]}]};
 expect(runner.classifyBrowsers(report,0,[entry])).toMatchObject({code:0,completed:2});
 const {stats,...missing}=report;expect(()=>runner.classifyBrowsers(missing,0,[entry])).toThrow('browser summary');
 expect(()=>runner.classifyBrowsers({...report,stats:{...stats,expected:1}},0,[entry])).toThrow('browser summary');
 expect(()=>runner.classifyBrowsers({...report,stats:{...stats,expected:NaN}},0,[entry])).toThrow('browser summary');
});

it('requires actual native screen observations for every metric zoom record',async()=>{
 const path=new URL('../../scripts/check-observatory-block-intervals.mjs',import.meta.url).href,module:unknown=await import(path);
 if(typeof module!=='object'||module===null||!('validateMetricInventory' in module)||typeof module.validateMetricInventory!=='function')throw new Error('Actual metric inventory consumer missing');
 const validate=module.validateMetricInventory,root=mkdtempSync('/var/tmp/interval-zoom-validator-'),artifacts:Record<string,string>={},names:string[]=[];
 const binding={sourceCombined:'a'.repeat(64),contractCombined:'b'.repeat(64),productionCombined:'c'.repeat(64)},physical='WINDOW=12345\nX=0\nY=0\nWIDTH=1440\nHEIGHT=900\nSCREEN=0';
 const put=(name:string,data:string)=>{writeFileSync(`${root}/${name}`,data);artifacts[name]=createHash('sha256').update(data).digest('hex');};
 const records=['chromium','firefox'].flatMap(engine=>['light','dark'].map(theme=>{
  const base=`${engine}-${theme}`,screenshot=`${base}.png`;put(screenshot,'diagnostic unit fixture, not a release image');const parent={...binding,state:'metric-values',engine,theme,viewport:{width:360,height:800},screenshot,screenshotSha256:artifacts[screenshot]},bounds={x:0,y:0,width:320,height:100,right:320};
  const record={...parent,namespace:'observatory-block-intervals',parentMeasurement:`${base}.json`,surface:'metric-zoom-200',native:{baseline:{width:720},measured:{width:360,documentWidth:360},nativeBaseline:undefined as string|undefined,nativeMeasured:undefined as string|undefined},metric:{bounds,rows:['1 week','24 hours','1 hour'].map(label=>({label,bounds,mean:'906.00 s',coverage:'4 intervals · 3,624 s actual coverage',endpoints:'Level 100 · 2026-10-15T11:00:04.000Z → 104 · 2026-10-15T12:00:28.000Z'})),sourceHref:'https://api.tzkt.io/v1/blocks',sourceText:'TzKT-reported indexed spans',typography:['interval-mean','interval-coverage','interval-endpoints','interval-note','interval-status'].map(selector=>({selector,size:14})),refresh:{tag:'BUTTON',bounds:{width:44,height:44}},details:{tag:'DETAILS',open:false,summaryBounds:{height:24}}}};
  put(`${base}.json`,JSON.stringify(parent));names.push(`${base}.metric.json`);return record;
 }));
 const bundle={root,artifacts,manifest:{...binding,variants:[],renders:[],additionalSurfaces:['metric-zoom-200'],surfaceEvidence:{'metric-zoom-200':names}}},inventory={variants:[],additionalSurfaces:['metric-zoom-200']};
 const save=()=>records.forEach((record,index)=>{const name=names[index];if(!name)throw new Error('Zoom fixture name missing');put(name,JSON.stringify(record));});
 try{
  save();expect(()=>validate(bundle,inventory)).toThrow('native screen');
  records.forEach(record=>{record.native.nativeBaseline=physical;record.native.nativeMeasured=physical;});save();expect(validate(bundle,inventory)).toMatchObject({code:0,failures:[]});
  const first=records[0];if(!first)throw new Error('Zoom fixture absent');first.native.nativeMeasured=physical.replace('WIDTH=1440','WIDTH=1200');save();expect(validate(bundle,inventory)).toMatchObject({code:1});
  first.native.nativeMeasured=physical.replace('WIDTH=1440','WIDTH=Infinity');save();expect(()=>validate(bundle,inventory)).toThrow('native screen');
 }finally{rmSync(root,{recursive:true,force:true});}
});
