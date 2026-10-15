import {afterEach,expect,it,vi} from 'vitest';
import {SourceComparison,type ComparisonSelection} from '../../src/rpc/sourceComparison';
import type {BlockHeader,RpcSource} from '../../src/rpc/models';
import type {TargetContext,DelegateRight,Constants} from '../../src/rpc/networkData';
import {groupsFor} from '../../src/consensus/phaseEvidence';
const a:RpcSource={network:'mainnet',name:'A',baseUrl:'https://a.invalid'},b:RpcSource={network:'mainnet',name:'B',baseUrl:'https://b.invalid'};
const header:BlockHeader={chainId:'NetFixture',level:120,hash:'H120',predecessor:'H119',timestamp:'2026-10-15T00:00:00Z',fitness:['02','00000078','','ffffffff','00000002'],payload_hash:'P'};
const selection:ComparisonSelection={key:'selected-H120',source:a,chainId:'NetFixture',header,level:120,round:2,payload:'P',historical:false,coherent:true};
const identityPath='/chains/main/chain_id',headPath='/chains/main/blocks/head/header',pendingPath='/chains/main/mempool/pending_operations';
const operation=(hash='Braw',slot=1)=>({hash,branch:'H119',contents:[{kind:'preattestation',level:120,round:2,slot,block_payload_hash:'P'}]});
const pending=(operations:unknown[]=[operation()])=>({validated:operations,refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]});
const rpc=(options:{head?:Record<string,unknown>;chain?:string;operations?:unknown[]}={})=>vi.fn(async(input:string|URL|Request)=>{
 const path=new URL(String(input)).pathname;
 if(path===identityPath)return Response.json(options.chain??'NetFixture');
 if(path===headPath)return Response.json({...header,chain_id:'NetFixture',protocol:'PFixture',...options.head});
 if(path===pendingPath)return Response.json(pending(options.operations));
 throw new Error(`Unexpected comparison fixture endpoint: ${String(input)}`);
});
function cachedSelection():ComparisonSelection {
 const receipt=(hash:string)=>Object.freeze({source:a,chainId:'NetFixture',requestedHeadHash:hash,observedHeadHash:'H120',contextHeadHash:'H120',predecessor:'H119',protocolHash:'PFixture',targetLevel:120,receivedAt:1,receivedMonotonic:1});
 const observer={header,source:a,chainId:'NetFixture',protocolHash:'PFixture',nextProtocolHash:'PFixture',evidence:receipt('H120')};
 const parent:BlockHeader={...header,level:119,hash:'H119',predecessor:'H118',fitness:['02','00000077','','ffffffff','00000000']};
 const anchor={...observer,header:parent,evidence:receipt('H119')};
 const context:TargetContext=Object.freeze({observer,anchor,level:120,protocolHash:'PFixture',key:JSON.stringify([a.baseUrl,'NetFixture','H120','H119','PFixture',120])});
 const rights:readonly DelegateRight[]=Object.freeze([{address:'D1',slot:0,power:3,context,evidence:receipt('H119')},{address:'D2',slot:1,power:2,context,evidence:receipt('H119')}].map(right=>Object.freeze(right)));
 const constants:Constants=Object.freeze({minimum:6,increment:3,quorum:4,committee:5,context,evidence:receipt('H119')});
 return Object.freeze({...selection,context,rights,constants});
}
const fakeClock=()=>vi.useFakeTimers({toFake:['Date','performance','setTimeout','clearTimeout']});
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
it('reads identity then head then version2 pending from only B and reports limited head agreement without pooled power',async()=>{
 const reads:string[]=[];vi.stubGlobal('fetch',async(input:string|URL|Request)=>{const url=String(input);reads.push(url);if(url.endsWith('/chain_id'))return Response.json('NetFixture');if(url.endsWith('/header'))return Response.json({...header,chain_id:'NetFixture',protocol:'PFixture'});return Response.json({validated:[{hash:'Braw',contents:[{kind:'preattestation',level:120,round:2,slot:0,block_payload_hash:'P'}]}],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]});});
 const result=await new SourceComparison('mainnet',[a,b]).compare(selection,b);
 expect(reads.map(url=>new URL(url).pathname)).toEqual(['/chains/main/chain_id','/chains/main/blocks/head/header','/chains/main/mempool/pending_operations']);expect(reads.every(url=>url.startsWith(b.baseUrl))).toBe(true);
 expect(result?.outcome).toBe('head-agreement');expect(result?.head?.hash).toBe('H120');expect(result?.protocolHash).toBe('PFixture');expect(result?.rawOperations).toHaveLength(1);expect(result?.rawOperations[0]?.evidence?.source.baseUrl).toBe(b.baseUrl);expect(result?.rawOperations[0]?.evidence?.requestedHeadHash).toBeUndefined();expect(result?.powers).toBeUndefined();expect(result?.rights).toBeUndefined();
});

it.each([
 ['shared-payload hash',{hash:'OtherH120'},'hash'],
 ['level',{level:121,fitness:['02','00000079','','ffffffff','00000002']},'level'],
 ['round',{fitness:['02','00000078','','ffffffff','00000003']},'round'],
 ['timestamp',{timestamp:'2026-10-15T00:00:01Z'},'time'],
])('reports proven %s divergence without confusing payload equality with agreement',async(_name,changed,_field)=>{
 const fetchMock=rpc({head:changed});vi.stubGlobal('fetch',fetchMock);const result=await new SourceComparison('mainnet',[a,b]).compare(selection,b);
 expect(result?.outcome).toBe('divergence');expect(result?.differences.length).toBeGreaterThan(0);expect(result?.head?.payload_hash).toBe('P');expect(result?.source.baseUrl).toBe(b.baseUrl);expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(3);
});

it('keeps historical uncertainty partial while labelling fetched current B head separately',async()=>{
 const fetchMock=rpc({head:{hash:'BCurrent130',level:130,predecessor:'B129',fitness:['02','00000082','','ffffffff','00000000']}});vi.stubGlobal('fetch',fetchMock);
 const historical={...selection,historical:true,coherent:false};const result=await new SourceComparison('mainnet',[a,b]).compare(historical,b);
 expect(result?.outcome).toBe('partial');expect(result?.selection.header?.hash).toBe('H120');expect(result?.head?.hash).toBe('BCurrent130');expect(result?.powers).toBeUndefined();expect(historical.header?.hash).toBe('H120');
});

it('uses compatible cached A rights only for separate B comparison power and preserves both original carriers',async()=>{
 const cached=cachedSelection(),before=JSON.stringify(cached);const fetchMock=rpc();vi.stubGlobal('fetch',fetchMock);
 const result=await new SourceComparison('mainnet',[a,b]).compare(cached,b);
 expect(result?.powers?.find(group=>group.payload==='P')?.pre).toBe(2);expect(result?.rightsProof).toBeTruthy();expect(result?.rights?.map(right=>right.evidence?.source.baseUrl)).toEqual([a.baseUrl,a.baseUrl]);
 expect(result?.rawOperations[0]?.evidence?.source.baseUrl).toBe(b.baseUrl);expect(result?.rawOperations[0]?.evidence?.requestedHeadHash).toBeUndefined();expect(result?.rawOperations[0]?.admission).toBeUndefined();expect(result?.rawOperations[0]?.admissions).toBeUndefined();
 expect(JSON.stringify(cached)).toBe(before);expect(fetchMock.mock.calls).toHaveLength(3);expect(fetchMock.mock.calls.some(([input])=>String(input).includes('rights'))).toBe(false);
});

it.each(['chain','head','parent','protocol','target'] as const)('withholds cached authority when exact %s compatibility is absent without a fourth read',async kind=>{
 const cached=cachedSelection(),context=cached.context!;
 const changed:TargetContext=kind==='chain'?{...context,observer:{...context.observer,chainId:'WrongChain'}}:kind==='head'?{...context,observer:{...context.observer,header:{...header,hash:'WrongHead'}}}:kind==='parent'?{...context,observer:{...context.observer,header:{...header,predecessor:'WrongParent'}}}:kind==='protocol'?{...context,protocolHash:'WrongProtocol'}:{...context,level:121};
 const fetchMock=rpc();vi.stubGlobal('fetch',fetchMock);const result=await new SourceComparison('mainnet',[a,b]).compare({...cached,context:changed},b);
 expect(fetchMock.mock.calls).toHaveLength(3);expect(result?.rawOperations).toHaveLength(1);expect(result?.powers).toBeUndefined();expect(result?.rights).toBeUndefined();expect(result?.rightsProof).toBeUndefined();
});

it('rejects wrong-network second-source identity without borrowing otherwise valid cached rights',async()=>{
 const fetchMock=rpc({chain:'OtherNet'});vi.stubGlobal('fetch',fetchMock);const result=await new SourceComparison('mainnet',[a,b]).compare(cachedSelection(),b);
 expect(fetchMock).toHaveBeenCalled();expect(result?.outcome).toBe('divergence');expect(result?.powers).toBeUndefined();expect(result?.rights).toBeUndefined();expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(3);
});

it('starts no activity automatically and refuses same unconfigured or sole providers without cascading',async()=>{
 const fetchMock=rpc();vi.stubGlobal('fetch',fetchMock);const comparison=new SourceComparison('mainnet',[a,b]);comparison.resume();comparison.setSelection(selection.key);expect(fetchMock).not.toHaveBeenCalled();expect(comparison.running).toBe(false);expect(comparison.result()).toBeUndefined();
 for(const source of [a,{...b,baseUrl:'https://unconfigured.invalid'},{...b,network:'shadownet' as const}]){const result=await comparison.compare(selection,source);expect(result?.outcome).toBe('unavailable');}
 expect((await new SourceComparison('mainnet',[a]).compare(selection,b))?.outcome).toBe('unavailable');expect(fetchMock).not.toHaveBeenCalled();
});

it('coalesces a second click into one in-flight three-read workflow and never polls afterwards',async()=>{
 fakeClock();let finish:((value:Response)=>void)|undefined;const normal=rpc();const fetchMock=vi.fn((input:string|URL|Request)=>new URL(String(input)).pathname===identityPath?new Promise<Response>(resolve=>{finish=resolve;}):normal(input));vi.stubGlobal('fetch',fetchMock);
 const comparison=new SourceComparison('mainnet',[a,b]),first=comparison.compare(selection,b);expect(comparison.running).toBe(true);expect(fetchMock).toHaveBeenCalledTimes(1);
 const second=comparison.compare(selection,b);expect(fetchMock).toHaveBeenCalledTimes(1);expect(typeof finish).toBe('function');finish?.(Response.json('NetFixture'));await Promise.all([first,second]);
 expect(fetchMock).toHaveBeenCalledTimes(3);expect(comparison.running).toBe(false);await vi.advanceTimersByTimeAsync(120000);expect(fetchMock).toHaveBeenCalledTimes(3);
});

it.each([identityPath,headPath,pendingPath])('bounds the entire %s read including an abort-ignoring JSON body to eight seconds',async slowPath=>{
 fakeClock();let release:((value:unknown)=>void)|undefined,resolved=false;const normal=rpc();const fetchMock=vi.fn(async(input:string|URL|Request)=>{
  if(new URL(String(input)).pathname!==slowPath)return normal(input);const response=Response.json({});response.json=()=>new Promise(resolve=>{release=resolve;});return response;
 });vi.stubGlobal('fetch',fetchMock);const comparison=new SourceComparison('mainnet',[a,b]),work=comparison.compare(selection,b);work.then(()=>{resolved=true;});expect(comparison.running).toBe(true);await vi.advanceTimersByTimeAsync(0);
 expect(fetchMock).toHaveBeenCalledTimes([identityPath,headPath,pendingPath].indexOf(slowPath)+1);expect(typeof release).toBe('function');await vi.advanceTimersByTimeAsync(7999);expect(resolved).toBe(false);await vi.advanceTimersByTimeAsync(1);expect(resolved).toBe(true);
 const result=await work;expect(['partial','unavailable']).toContain(result?.outcome);expect(result?.errors.length).toBeGreaterThan(0);expect(result?.rawOperations).toHaveLength(0);expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(3);
 release?.(slowPath===identityPath?'NetFixture':slowPath===headPath?{...header,chain_id:'NetFixture',protocol:'PFixture'}:pending());await vi.advanceTimersByTimeAsync(0);expect(comparison.result()?.rawOperations.length??0).toBe(0);
});

it('completes three slow full bodies within twenty-four seconds and ages the fetched receipt rather than request start',async()=>{
 fakeClock();const normal=rpc();const fetchMock=vi.fn(async(input:string|URL|Request)=>{const response=await normal(input),body=await response.json();response.json=()=>new Promise(resolve=>setTimeout(()=>resolve(body),7900));return response;});vi.stubGlobal('fetch',fetchMock);
 const comparison=new SourceComparison('mainnet',[a,b]);let resolved=false;const work=comparison.compare(selection,b);work.then(()=>{resolved=true;});expect(comparison.running).toBe(true);await vi.advanceTimersByTimeAsync(23700);expect(resolved).toBe(true);const result=await work;
 expect(result?.outcome).toBe('head-agreement');expect(fetchMock).toHaveBeenCalledTimes(3);expect(result?.evidence).toBeDefined();expect(result!.evidence!.receivedMonotonic-result!.startedMonotonic).toBeLessThanOrEqual(24000);
 await vi.advanceTimersByTimeAsync(36300);expect(comparison.result()?.stale).toBe(false);await vi.advanceTimersByTimeAsync(23700);expect(comparison.result()?.stale).toBe(true);expect(fetchMock).toHaveBeenCalledTimes(3);
});

it('rejects redirects without a hidden followed read or fallback provider',async()=>{
 const fetchMock=vi.fn(async()=>new Response(null,{status:302,headers:{location:'https://other.invalid/identity'}}));vi.stubGlobal('fetch',fetchMock);
 const result=await new SourceComparison('mainnet',[a,b]).compare(selection,b);expect(fetchMock).toHaveBeenCalledTimes(1);expect(result?.outcome).toBe('unavailable');expect(result?.errors.length).toBeGreaterThan(0);
 const options=(fetchMock.mock.calls as unknown as [unknown,RequestInit][])[0]?.[1];expect(['error','manual']).toContain(options?.redirect);
});

it.each(['pause-resume','context-away-back'] as const)('fences late abort-ignoring body completion after %s',async action=>{
 fakeClock();let release:((value:unknown)=>void)|undefined,bodySignal:AbortSignal|undefined;const normal=rpc();vi.stubGlobal('fetch',vi.fn(async(input:string|URL|Request,options?:RequestInit)=>{const response=await normal(input);if(new URL(String(input)).pathname===pendingPath){bodySignal=options?.signal??undefined;response.json=()=>new Promise(resolve=>{release=resolve;});}return response;}));
 const comparison=new SourceComparison('mainnet',[a,b]);comparison.setSelection(selection.key);const work=comparison.compare(selection,b);expect(comparison.running).toBe(true);await vi.advanceTimersByTimeAsync(0);expect(typeof release).toBe('function');expect(bodySignal).toBeDefined();
 if(action==='pause-resume'){comparison.pause();expect(bodySignal?.aborted).toBe(true);comparison.resume();}else{comparison.setSelection('other-context');expect(bodySignal?.aborted).toBe(true);comparison.setSelection(selection.key);}
 release?.(pending());await vi.advanceTimersByTimeAsync(0);const answer=await work;expect(comparison.result()?.rawOperations.length??0).toBe(0);expect(answer===undefined||answer.invalidated||answer.stale).toBe(true);
});

it('marks sixty-second comparison age stale monotonically without rewriting receipt or refreshing',async()=>{
 fakeClock();vi.setSystemTime(new Date('2026-10-15T00:00:00Z'));const fetchMock=rpc();vi.stubGlobal('fetch',fetchMock);const comparison=new SourceComparison('mainnet',[a,b]);await comparison.compare(selection,b);
 const original=comparison.result();expect(original?.evidence).toBeDefined();expect(original?.stale).toBe(false);await vi.advanceTimersByTimeAsync(59999);expect(comparison.result()?.stale).toBe(false);vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));await vi.advanceTimersByTimeAsync(1);
 expect(comparison.result()?.stale).toBe(true);expect(comparison.result()?.evidence).toEqual(original?.evidence);expect(fetchMock).toHaveBeenCalledTimes(3);
});

it.each(['selection','pause'] as const)('keeps fetched-result invalidation sticky across %s return before expiry',async action=>{
 const fetchMock=rpc();vi.stubGlobal('fetch',fetchMock);const comparison=new SourceComparison('mainnet',[a,b]);comparison.setSelection(selection.key);await comparison.compare(selection,b);expect(comparison.result()?.stale).toBe(false);const receipt=comparison.result()?.evidence;
 if(action==='selection'){comparison.setSelection('away');comparison.setSelection(selection.key);}else{comparison.pause();comparison.resume();}
 expect(comparison.result()?.invalidated).toBe(true);expect(comparison.result()?.stale).toBe(true);expect(comparison.result()?.evidence).toEqual(receipt);expect(fetchMock).toHaveBeenCalledTimes(3);
});

it('shares the ten-thousand raw budget with live growth and trims owned raw immediately without rewriting captured positive facts',async()=>{
 let live=9998;const cached=cachedSelection(),before=JSON.stringify(cached),fetchMock=rpc({operations:[operation('B1',0),operation('B2',1),operation('B3',0)]});vi.stubGlobal('fetch',fetchMock);
 const comparison=new SourceComparison('mainnet',[a,b],{rawCapacity:()=>10000-live});await comparison.compare(cached,b);const original=comparison.result();expect(original?.rawOperations).toHaveLength(2);expect(original?.pendingReasons.length).toBeGreaterThan(0);expect(live+(original?.rawOperations.length??0)).toBeLessThanOrEqual(10000);
 live=9999;comparison.setRawCapacity(1);expect(comparison.result()?.rawOperations).toHaveLength(1);expect(comparison.result()?.rawOperations[0]?.evidence).toEqual(original?.rawOperations[0]?.evidence);
 live=10000;comparison.setRawCapacity(0);expect(comparison.result()?.rawOperations).toHaveLength(0);expect(comparison.result()?.pendingReasons.length).toBeGreaterThan(0);expect(comparison.result()?.powers?.every(group=>group.pre!==0&&group.att!==0)??true).toBe(true);
 expect(JSON.stringify(cached)).toBe(before);expect(fetchMock).toHaveBeenCalledTimes(3);expect(comparison.result()?.rights?.every(right=>right.evidence?.source.baseUrl===a.baseUrl)??true).toBe(true);
});

it('does not fabricate zero when the live owner leaves no comparison raw capacity',async()=>{
 const fetchMock=rpc();vi.stubGlobal('fetch',fetchMock);const comparison=new SourceComparison('mainnet',[a,b],{rawCapacity:()=>0});const result=await comparison.compare(cachedSelection(),b);
 expect(fetchMock).toHaveBeenCalledTimes(3);expect(result?.rawOperations).toHaveLength(0);expect(result?.pendingReasons.length).toBeGreaterThan(0);expect(result?.powers?.every(group=>group.pre!==0&&group.att!==0)??true).toBe(true);
});

function successorSelection(nextProtocolHash:string|undefined):ComparisonSelection {
 const cached=cachedSelection();
 const receipt=Object.freeze({...cached.constants!.evidence!,requestedHeadHash:'H120',protocolHash:'PSuccessor',targetLevel:121});
 const original=cached.context!.observer;
 const {nextProtocolHash:_old,...withoutNext}=original;
 // Missing protocol is deliberately malformed cached input at the runtime trust boundary.
 const observer=Object.freeze({...withoutNext,...(nextProtocolHash?{nextProtocolHash}:{})}) as typeof original;
 const context:TargetContext=Object.freeze({observer,anchor:observer,level:121,protocolHash:'PSuccessor',key:'A-H120-target121-PSuccessor'});
 return Object.freeze({...cached,level:121,context,rights:Object.freeze(cached.rights!.map(right=>Object.freeze({...right,context,evidence:receipt}))),constants:Object.freeze({...cached.constants!,context,evidence:receipt})});
}

it.each([['proven','PSuccessor',true],['missing',undefined,false],['contradictory','OtherSuccessor',false]] as const)('uses successor execution rights across activation only with %s original cached next-protocol proof',async(_label,next,usable)=>{
 const cached=successorSelection(next),before=JSON.stringify(cached);
 const successorOperation={...operation(),contents:[{kind:'preattestation',level:121,round:2,slot:1,block_payload_hash:'P'}]};
 const fetchMock=rpc({operations:[successorOperation]});vi.stubGlobal('fetch',fetchMock);
 const result=await new SourceComparison('mainnet',[a,b]).compare(cached,b);
 expect(fetchMock).toHaveBeenCalledTimes(3);expect(result?.protocolHash).toBe('PFixture');expect(result?.head?.level).toBe(120);expect(result?.rawOperations).toHaveLength(1);
 if(usable){expect(result?.powers?.find(group=>group.payload==='P')?.pre).toBe(2);expect(result?.rightsProof).toBeTruthy();expect(result?.rights?.[0]?.context?.protocolHash).toBe('PSuccessor');}
 else{expect(result?.powers).toBeUndefined();expect(result?.rightsProof).toBeUndefined();}
 expect(JSON.stringify(cached)).toBe(before);expect(result?.rawOperations[0]?.evidence?.requestedHeadHash).toBeUndefined();
});

it.each(['source','requested-anchor','context-head','protocol','target','chain'] as const)('rejects cached helper %s receipt contradictions without laundering original provenance',async kind=>{
 const cached=cachedSelection(),before=JSON.stringify(cached),original=cached.rights![0]!;
 const evidence={...original.evidence!,...(kind==='source'?{source:{...a,baseUrl:'https://unrelated.invalid'}}:kind==='requested-anchor'?{requestedHeadHash:'WrongAnchor'}:kind==='context-head'?{contextHeadHash:'WrongObserver'}:kind==='protocol'?{protocolHash:'WrongProtocol'}:kind==='target'?{targetLevel:121}:{chainId:'WrongChain'})};
 const rights=[{...original,evidence},cached.rights![1]!];const fetchMock=rpc();vi.stubGlobal('fetch',fetchMock);
 const result=await new SourceComparison('mainnet',[a,b]).compare({...cached,rights},b);
 expect(fetchMock).toHaveBeenCalledTimes(3);expect(result?.rawOperations).toHaveLength(1);expect(result?.powers).toBeUndefined();expect(result?.rightsProof).toBeUndefined();expect(JSON.stringify(cached)).toBe(before);
});

it('keeps comparison-only authority out of actual LIVE groupsFor with original A rights',async()=>{
 const cached=cachedSelection();vi.stubGlobal('fetch',rpc());const result=await new SourceComparison('mainnet',[a,b]).compare(cached,b);
 expect(result?.powers?.find(group=>group.payload==='P')?.pre).toBe(2);
 const live=groupsFor(result!.rawOperations,cached.rights!,120);
 expect(live.flatMap(group=>[...group.pre,...group.att])).toEqual([]);
 expect(result?.rawOperations.every(operation=>operation.evidence?.source.baseUrl===b.baseUrl)).toBe(true);
 expect(cached.rights!.every(right=>right.evidence?.source.baseUrl===a.baseUrl)).toBe(true);
});

it.each([true,false])('accepts exact cached helper C provenance only when configured: %s',async configured=>{
 const c:RpcSource={network:'mainnet',name:'C',baseUrl:'https://c.invalid'};
 const cached=cachedSelection(),context=cached.context!;
 const rights=Object.freeze(cached.rights!.map(right=>Object.freeze({...right,evidence:Object.freeze({...right.evidence!,source:c})})));
 const constants=Object.freeze({...cached.constants!,evidence:Object.freeze({...cached.constants!.evidence!,source:c})});
 const selected=Object.freeze({...cached,rights,constants}),before=JSON.stringify(selected);
 const fetchMock=rpc();vi.stubGlobal('fetch',fetchMock);
 const result=await new SourceComparison('mainnet',configured?[a,b,c]:[a,b]).compare(selected,b);
 expect(fetchMock).toHaveBeenCalledTimes(3);expect(fetchMock.mock.calls.every(([input])=>String(input).startsWith(b.baseUrl))).toBe(true);
 expect(context.observer.source.baseUrl).toBe(a.baseUrl);expect(result?.rawOperations[0]?.evidence?.source.baseUrl).toBe(b.baseUrl);
 if(configured){
  expect(result?.powers?.find(group=>group.payload==='P')?.pre).toBe(2);expect(result?.rightsProof).toBeTruthy();
  expect(result?.rights?.map(right=>right.evidence?.source.baseUrl)).toEqual([c.baseUrl,c.baseUrl]);
  expect(result?.rights?.[0]?.evidence).toEqual(rights[0]?.evidence);expect(selected.constants.evidence?.source.baseUrl).toBe(c.baseUrl);
 }else{expect(result?.powers).toBeUndefined();expect(result?.rights).toBeUndefined();expect(result?.rightsProof).toBeUndefined();}
 expect(JSON.stringify(selected)).toBe(before);
});


it('does not infer selected A network identity merely from matching B head fields',async()=>{
 const {chainId:_unknown,...withoutChain}=selection;const {chainId:_headerChain,...withoutHeaderChain}=header;const unproven={...withoutChain,header:withoutHeaderChain};vi.stubGlobal('fetch',rpc());
 const result=await new SourceComparison('mainnet',[a,b]).compare(unproven,b);
 expect(result?.outcome).toBe('partial');expect(result?.chainId).toBe('NetFixture');expect(result?.head?.hash).toBe('H120');
});


it('withholds a coherent-looking cached committee whose observer itself was never configured',async()=>{
 const cached=cachedSelection(),foreign={...a,baseUrl:'https://unconfigured-context.invalid'};
 const context={...cached.context!,observer:{...cached.context!.observer,source:foreign},anchor:{...cached.context!.anchor,source:foreign}};
 const replace=(receipt:NonNullable<Constants['evidence']>)=>({...receipt,source:foreign});
 const rights=cached.rights!.map(right=>({...right,context,evidence:replace(right.evidence!)}));
 const constants={...cached.constants!,context,evidence:replace(cached.constants!.evidence!)};vi.stubGlobal('fetch',rpc());
 const result=await new SourceComparison('mainnet',[a,b]).compare({...cached,context,rights,constants},b);
 expect(result?.rawOperations).toHaveLength(1);expect(result?.powers).toBeUndefined();expect(result?.rightsProof).toBeUndefined();expect(result?.reads).toHaveLength(3);
});


it('refuses a selected source labelled as another network even if its URL matches a configured provider',async()=>{
 const fetchMock=rpc();vi.stubGlobal('fetch',fetchMock);
 const result=await new SourceComparison('mainnet',[a,b]).compare({...selection,source:{...a,network:'shadownet'}},b);
 expect(result?.outcome).toBe('unavailable');expect(fetchMock).not.toHaveBeenCalled();
});


it('captures the comparison source at request start so later caller changes cannot relabel receipts or redirect later reads',async()=>{
 const mutable={...b},normal=rpc(),reads:string[]=[];let release!:(value:Response)=>void;
 vi.stubGlobal('fetch',(input:string|URL|Request)=>{reads.push(String(input));return reads.length===1?new Promise<Response>(resolve=>{release=resolve;}):normal(input);});
 const comparison=new SourceComparison('mainnet',[a,b]),work=comparison.compare(selection,mutable);
 mutable.baseUrl='https://changed-after-start.invalid';mutable.name='Changed source';release(Response.json('NetFixture'));
 const result=await work;expect(reads.every(url=>url.startsWith(b.baseUrl))).toBe(true);expect(result?.source.baseUrl).toBe(b.baseUrl);expect(result?.evidence?.source.baseUrl).toBe(b.baseUrl);expect(result?.evidence?.source.name).toBe('B');
});


it('retains the selected head and source facts captured when the explicit workflow began',async()=>{
 const mutable={...selection,header:{...header,fitness:[...header.fitness]},source:{...a}},normal=rpc();let release!:(value:Response)=>void;
 vi.stubGlobal('fetch',(input:string|URL|Request)=>String(input).endsWith('/chain_id')?new Promise<Response>(resolve=>{release=resolve;}):normal(input));
 const work=new SourceComparison('mainnet',[a,b]).compare(mutable,b);mutable.header.hash='ChangedSelectedHead';mutable.header.fitness[4]='00000003';mutable.source.baseUrl='https://changed-selection.invalid';release(Response.json('NetFixture'));
 const result=await work;expect(result?.selection.header?.hash).toBe('H120');expect(result?.selection.source.baseUrl).toBe(a.baseUrl);expect(result?.outcome).toBe('head-agreement');
});


it('never authorizes a cached successor target as though it were the selected current target',async()=>{
 const cached=successorSelection('PSuccessor'),successorOperation={...operation(),contents:[{kind:'preattestation',level:121,round:2,slot:1,block_payload_hash:'P'}]};
 vi.stubGlobal('fetch',rpc({operations:[successorOperation]}));
 const result=await new SourceComparison('mainnet',[a,b]).compare({...cached,level:120},b);
 expect(result?.rawOperations).toHaveLength(1);expect(result?.powers).toBeUndefined();expect(result?.rightsProof).toBeUndefined();
});
it('captures nested committee and constants numerical facts before any asynchronous response completes',async()=>{
 const cached=cachedSelection(),rights=cached.rights!.map(right=>({...right})),constants={...cached.constants!};
 let release!:(value:Response)=>void;const normal=rpc();vi.stubGlobal('fetch',(input:string|URL|Request)=>String(input).endsWith('/chain_id')?new Promise<Response>(resolve=>{release=resolve;}):normal(input));
 const work=new SourceComparison('mainnet',[a,b]).compare({...cached,rights,constants},b);
 rights[0]!.power=100;rights[1]!.power=200;constants.committee=300;constants.quorum=201;release(Response.json('NetFixture'));
 const result=await work;expect(result?.powers?.[0]?.pre).toBe(2);expect(result?.powers?.[0]?.total).toBe(5);expect(result?.rights?.map(right=>right.power)).toEqual([3,2]);
});


it.each([['matching',{},'head-agreement'],['conflicting',{hash:'OtherKnownHead'},'divergence']] as const)('retains independently proven %s head outcome when optional pending fails',async(_label,changed,expected)=>{
 const normal=rpc({head:changed});vi.stubGlobal('fetch',(input:string|URL|Request)=>new URL(String(input)).pathname===pendingPath?Promise.resolve(new Response('Pending unavailable',{status:503})):normal(input));
 const result=await new SourceComparison('mainnet',[a,b]).compare(selection,b);
 expect(result?.headOutcome).toBe(expected);expect(result?.errors.join(' ')).toContain('503');expect(result?.rawOperations).toHaveLength(0);expect(result?.reads).toHaveLength(3);
});
