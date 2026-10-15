import {afterEach, expect, it, vi} from "vitest";
import {NetworkData} from "../../src/rpc/networkData";
import {groupsFor} from "../../src/consensus/phaseEvidence";
import type {BlockHeader} from "../../src/rpc/models";

afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
const head=(level:number):BlockHeader=>({chainId:"NetFixture",proto:4,level,hash:`B${level}`,predecessor:`B${level-1}`,timestamp:"2026-01-01T00:00:00Z",fitness:["02",level.toString(16).padStart(8,"0"),"","ffffffff","00000000"]});
const contextResponse=(url:string):Response|undefined=>{
 if(url.endsWith("/protocols"))return Response.json({protocol:"PFixture",next_protocol:"PFixture"});
 if(!url.endsWith("/header"))return undefined;
 const hash=url.split("/blocks/")[1]?.split("/")[0]??"";
 const level=hash==="BFork"?120:hash==="BForkParent"?119:Number(hash.slice(1));
 return Response.json({...head(level),hash,predecessor:hash==="BFork"?"BForkParent":head(level).predecessor,chain_id:"NetFixture"});
};
it("reuses committees and constants for the same immutable target",async()=>{
  const calls:string[]=[];
  const fetchMock=vi.fn(async(input:string|URL|Request)=>{
    const url=String(input);calls.push(url);
    const proof=contextResponse(url);if(proof)return proof;
    if(url.includes("attestation_rights")) {
      const level=Number(new URL(url).searchParams.get("level"));
      return Response.json([{level,delegates:[{delegate:"tz1Baker",first_slot:0,attesting_power:7000}]}]);
    }
    return Response.json({minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4667,consensus_committee_size:7000});
  });
  vi.stubGlobal("fetch",fetchMock);
  const data=new NetworkData("mainnet");const signal=new AbortController().signal;
  await data.derive(head(100),signal);
  const next=await data.derive(head(100),signal);
  expect(next.rights.get(101)?.[0]?.power).toBe(7000);
  expect(next.constants?.quorum).toBe(4667);
  expect(calls.filter(url=>url.endsWith("attestation_rights?level=101"))).toHaveLength(1);
  expect(calls.filter(url=>url.endsWith("/context/constants"))).toHaveLength(2);
});

it("rejects invalid committee values and invalid protocol quorum without losing raw operations",async()=>{
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{
  const url=String(input),level=Number(new URL(url).searchParams.get("level"));
  const proof=contextResponse(url);if(proof)return proof;
  return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:"D1",first_slot:0,attesting_power:1.5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:6,consensus_committee_size:5});
 });
 const data=new NetworkData("mainnet"),result=await data.derive(head(120),new AbortController().signal);
 expect(result.rights.size).toBe(0);expect(result.constants).toBeNull();
});

it("preserves raw pending branches and labels only actually pinned auxiliary requests",async()=>{
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{
  const url=String(input),level=Number(new URL(url).searchParams.get("level"));
  const proof=contextResponse(url);if(proof)return proof;
  if(url.includes("pending_operations"))return Response.json({validated:[{hash:"pending",branch:"BRawAnchor",contents:[{kind:"preattestation",level:121,round:0,slot:0,block_payload_hash:"P"}]}]});
  if(url.includes("attestation_rights"))return Response.json([{level,delegates:[{delegate:"D1",first_slot:0,attesting_power:5}]}]);
  return Response.json({minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4,consensus_committee_size:5});
 });
 const data=new NetworkData("mainnet"),signal=new AbortController().signal;
 const pending=await data.pending(signal,head(120));expect(pending[0]?.branch).toBe("BRawAnchor");
 expect(pending[0]?.evidence?.requestedHeadHash).toBeUndefined();expect(pending[0]?.evidence?.observedHeadHash).toBeUndefined();
 const derived=await data.derive(head(120),signal);
 expect(derived.rights.get(120)?.[0]?.evidence?.requestedHeadHash).toBe("B119");
 expect(derived.rights.get(120)?.[0]?.evidence?.observedHeadHash).toBeUndefined();
});

it("starts no alias reads while paused",async()=>{
 const fetchMock=vi.fn(async()=>Response.json([]));vi.stubGlobal("fetch",fetchMock);
 const data=new NetworkData("mainnet");data.pause();await data.loadAliases();expect(fetchMock).not.toHaveBeenCalled();
});

it("aborts alias requests and rejects their late bodies after pause",async()=>{
 let finish:(response:Response)=>void=()=>undefined;let signal:AbortSignal|undefined;
 vi.stubGlobal("fetch",(_input:unknown,options?:RequestInit)=>{signal=options?.signal??undefined;return new Promise<Response>(resolve=>{finish=resolve;});});
 const data=new NetworkData("mainnet"),pending=data.loadAliases();data.pause();
 expect(signal?.aborted).toBe(true);finish(Response.json([{address:"D1",alias:"Cancelled alias"}]));await pending;expect(data.alias("D1")).toBeUndefined();
});

it("rejects late eligibility evidence even when fetch ignores cancellation",async()=>{
 let finish:((response:Response)=>void)|undefined;
 vi.stubGlobal("fetch",(input:string|URL|Request)=>contextResponse(String(input))??new Promise<Response>(resolve=>{finish=resolve;}));
 const data=new NetworkData("shadownet"),pending=data.loadEligibility(head(120),[{address:"D1",slot:0,power:5}],new AbortController().signal);
 await vi.waitFor(()=>expect(finish).toBeDefined());data.pause();finish?.(Response.json(true));await pending;expect(data.forbidden("D1")).toBeUndefined();
});

it("cannot poison same-head rights/constants caches with cancelled-generation responses",async()=>{
 const finishes:{url:string;finish:(response:Response)=>void}[]=[];
 vi.stubGlobal("fetch",(input:string|URL|Request)=>contextResponse(String(input))??new Promise<Response>(finish=>{finishes.push({url:String(input),finish});}));
 const data=new NetworkData("mainnet"),signal=new AbortController().signal;
 const pending=data.derive(head(120),signal);await vi.waitFor(()=>expect(finishes.some(request=>request.url.includes("attestation_rights"))).toBe(true));data.pause();data.resume();
 for(const request of finishes){const level=Number(new URL(request.url).searchParams.get("level"));request.finish(Response.json(request.url.includes("attestation_rights")?[{level,delegates:[{delegate:"Old",first_slot:0,attesting_power:5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4,consensus_committee_size:5}));}
 await pending;
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{const url=String(input),level=Number(new URL(url).searchParams.get("level"));const proof=contextResponse(url);if(proof)return proof;return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:"Fresh",first_slot:0,attesting_power:5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:3,consensus_committee_size:5});});
 const fresh=await data.derive(head(120),signal);expect(fresh.rights.get(120)?.[0]?.address).toBe("Fresh");expect(fresh.constants?.quorum).toBe(3);
});

it('loads distinct current and successor execution durations with exact original context and receipts across proven protocol metadata',async()=>{
 const calls:string[]=[],selected={...head(120),fitness:['02','00000078','','ffffffff','00000002']};
 vi.stubGlobal('fetch',async(input:string|URL|Request)=>{const url=String(input);calls.push(url);const anchor=url.split('/blocks/')[1]?.split('/')[0];if(url.endsWith('/header'))return Response.json({...head(Number(anchor?.slice(1))),...(anchor==='B120'?selected:{}),chain_id:'NetFixture'});if(url.endsWith('/protocols'))return Response.json({protocol:'PCurrent',next_protocol:anchor==='B120'?'PSuccessor':'PCurrent'});if(url.endsWith('/context/constants'))return Response.json({minimal_block_delay:anchor==='B120'?'10':'6',delay_increment_per_round:anchor==='B120'?'4':'3',consensus_threshold_size:4,consensus_committee_size:5});throw new Error(`Unexpected timing fixture endpoint ${url}`);});
 const data=new NetworkData('mainnet'),signal=new AbortController().signal,results=await Promise.allSettled([data.opportunityConstants(selected,120,signal),data.opportunityConstants(selected,121,signal)]);
 expect(results.map(result=>result.status)).toEqual(['fulfilled','fulfilled']);
 if(results[0]!.status!=='fulfilled'||results[1]!.status!=='fulfilled')return;
 const [current,next]=[results[0]!.value,results[1]!.value];expect([current.minimum,current.increment,next.minimum,next.increment]).toEqual([6,3,10,4]);
 expect([current.context?.protocolHash,next.context?.protocolHash]).toEqual(['PCurrent','PSuccessor']);expect([current.evidence?.requestedHeadHash,next.evidence?.requestedHeadHash]).toEqual(['B119','B120']);expect([current.evidence?.targetLevel,next.evidence?.targetLevel]).toEqual([120,121]);expect([current.evidence?.contextHeadHash,next.evidence?.contextHeadHash]).toEqual(['B120','B120']);expect([current.evidence?.source.baseUrl,next.evidence?.source.baseUrl]).toEqual([data.source.baseUrl,data.source.baseUrl]);
 expect(calls.filter(url=>url.endsWith('/context/constants')).map(url=>url.split('/blocks/')[1]?.split('/')[0]).sort()).toEqual(['B119','B120']);
});

it('requests selected observed N/R+1 and N+1/R0 baking rights independently with original attribution',async()=>{
 const calls:string[]=[];vi.stubGlobal('fetch',async(input:string|URL|Request)=>{const url=String(input);calls.push(url);const proof=contextResponse(url);if(proof)return proof;const query=new URL(url).searchParams;if(url.includes('baking_rights'))return Response.json([{level:Number(query.get('level')),round:Number(query.get('max_round')),delegate:query.get('level')==='120'?'SameLevelBaker':'NextLevelBaker'}]);throw new Error(`Unexpected baking fixture endpoint ${url}`);});
 const data=new NetworkData('mainnet'),signal=new AbortController().signal,selected=head(120),results=await Promise.all([data.bakers(selected,120,3,signal),data.bakers(selected,121,0,signal)]);
 expect(results.map(rights=>rights.map(right=>[right.level,right.round,right.delegate]))).toEqual([[[120,3,'SameLevelBaker']],[[121,0,'NextLevelBaker']]]);expect(results.map(rights=>rights[0]?.evidence?.requestedHeadHash)).toEqual(['B119','B120']);expect(results.every(rights=>rights[0]?.evidence?.source.baseUrl===data.source.baseUrl)).toBe(true);
 expect(calls.filter(url=>url.includes('baking_rights')).map(url=>[new URL(url).searchParams.get('level'),new URL(url).searchParams.get('max_round')]).sort()).toEqual([['120','3'],['121','0']]);await data.bakers(selected,120,3,signal);expect(calls.filter(url=>url.includes('baking_rights'))).toHaveLength(2);
});

it('does not expose cached timing to a cancelled caller or infer execution constants two levels ahead',async()=>{
 const calls:string[]=[];vi.stubGlobal('fetch',async(input:string|URL|Request)=>{const url=String(input);calls.push(url);return contextResponse(url)??Response.json({minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5});});
 const data=new NetworkData('mainnet'),controller=new AbortController();await data.opportunityConstants(head(120),121,controller.signal);controller.abort();
 const cancelled=await Promise.allSettled([data.opportunityConstants(head(120),121,controller.signal)]);expect(cancelled[0]?.status).toBe('rejected');
 const before=calls.length;await expect(data.opportunityConstants(head(120),122,new AbortController().signal)).rejects.toThrow('execution');expect(calls).toHaveLength(before);
});

it.each(['missing-rights','missing-timing'] as const)('keeps %s independent from the other branch evidence request',async missing=>{
 vi.stubGlobal('fetch',async(input:string|URL|Request)=>{const url=String(input),proof=contextResponse(url);if(proof)return proof;if(url.includes('baking_rights'))return Response.json(missing==='missing-rights'?[]:[{level:121,round:0,delegate:'StillKnownBaker'}]);if(url.endsWith('/context/constants'))return missing==='missing-timing'?new Response('Timing unavailable',{status:503}):Response.json({minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5});throw new Error(`Unexpected independent fixture endpoint ${url}`);});
 const data=new NetworkData('mainnet'),signal=new AbortController().signal,results=await Promise.allSettled([data.bakers(head(120),121,0,signal),data.opportunityConstants(head(120),121,signal)]);
 expect(results[0]?.status).toBe('fulfilled');if(results[0]?.status==='fulfilled')expect(results[0].value.map(right=>right.delegate)).toEqual(missing==='missing-rights'?[]:['StillKnownBaker']);expect(results[1]?.status).toBe(missing==='missing-rights'?'fulfilled':'rejected');
});

it("rejects cancelled baking rights before they can enter the same-context cache",async()=>{
 let finish:((response:Response)=>void)|undefined;vi.stubGlobal("fetch",(input:string|URL|Request)=>contextResponse(String(input))??new Promise<Response>(resolve=>{finish=resolve;}));
 const data=new NetworkData("mainnet"),signal=new AbortController().signal;
 const pending=data.bakers(head(120),121,2,signal);await vi.waitFor(()=>expect(finish).toBeDefined());data.pause();data.resume();finish?.(Response.json([{level:121,round:2,delegate:"Cancelled"}]));await expect(pending).rejects.toThrow("Cancelled collection generation");
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>contextResponse(String(input))??Response.json([{level:121,round:2,delegate:"Fresh"}]));
 expect((await data.bakers(head(120),121,2,signal))[0]?.delegate).toBe("Fresh");
});

it("cancelled fallback bodies cannot change the displayed responding source",async()=>{
 let finish:((response:Response)=>void)|undefined;let reads=0;
 vi.stubGlobal("fetch",()=>++reads===1?Promise.resolve(new Response("",{status:503})):new Promise<Response>(resolve=>{finish=resolve;}));
 const data=new NetworkData("mainnet"),originalSource=data.source.baseUrl,pending=data.head(new AbortController().signal);
 await vi.waitFor(()=>expect(finish).toBeDefined());data.pause();data.resume();finish?.(Response.json(head(120)));
 await expect(pending).rejects.toThrow("Cancelled collection generation");expect(data.source.baseUrl).toBe(originalSource);expect(reads).toBe(2);
});

it("withdraws rights and constants from another hash at the same height",async()=>{
 const calls:string[]=[];
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{
  const url=String(input);calls.push(url);const proof=contextResponse(url);if(proof)return proof;const fork=url.includes("/BFork/") || url.includes("/BForkParent/");
  const level=Number(new URL(url).searchParams.get("level"));
  return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:fork?"Fork":"Original",first_slot:0,attesting_power:5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:fork?3:4,consensus_committee_size:5});
 });
 const data=new NetworkData("mainnet"),signal=new AbortController().signal;
 await data.derive(head(120),signal);
 const fork=await data.derive({...head(120),hash:"BFork",predecessor:"BForkParent"},signal);
 expect(fork.rights.get(120)?.[0]?.address).toBe("Fork");
 expect(fork.constants?.quorum).toBe(3);
 expect(calls.some(url=>url.includes("/BFork/"))).toBe(true);
});

it("withholds numerical authority when the pinned observer protocol identity is unproven",async()=>{
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{
  const url=String(input),level=Number(new URL(url).searchParams.get("level"));
  if(url.endsWith("/protocols"))return Response.json({protocol_level:4});
  if(url.endsWith("/header"))return Response.json({...head(120),chain_id:"NetFixture"});
  return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:"D",first_slot:0,attesting_power:5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4,consensus_committee_size:5});
 });
 const result=await new NetworkData("mainnet").derive(head(120),new AbortController().signal);
 expect(result.rights.size).toBe(0);expect(result.constants).toBeNull();
 expect(result.errors.some(error=>error.includes("context"))).toBe(true);
});

it("counts only operations captured at the proven observer head and source",async()=>{
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{
  const url=String(input),proof=contextResponse(url);if(proof)return proof;
  const level=Number(new URL(url).searchParams.get("level"));
  return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:"D",first_slot:0,attesting_power:5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4,consensus_committee_size:5});
 });
 const data=new NetworkData("mainnet"),result=await data.derive(head(120),new AbortController().signal);
 const operation=(payload:string,source:string,observedHeadHash:string)=>({hash:payload,evidence:{source:{...data.source,baseUrl:source},observedHeadHash,receivedAt:1,receivedMonotonic:1},contents:[{kind:"preattestation" as const,level:120,round:0,slot:0,block_payload_hash:payload}]});
 const groups=groupsFor([operation("Good",data.source.baseUrl,"B120"),operation("WrongSource","https://other.invalid","B120"),operation("OldHead",data.source.baseUrl,"BOld")],result.rights.get(120)??[],120);
 expect(groups.find(group=>group.payload==="Good")?.pre.size).toBe(1);
 expect(groups.find(group=>group.payload==="WrongSource")?.pre.size).toBe(0);
 expect(groups.find(group=>group.payload==="OldHead")?.pre.size).toBe(0);
 expect(groups.find(group=>group.payload==="WrongSource")?.unknownSlots).toEqual([0]);
});

it("expires eligibility at the exact monotonic boundary and never revives stale evidence",async()=>{
 const clock=vi.spyOn(performance,"now").mockReturnValue(1000);
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>contextResponse(String(input))??Response.json(true));
 const data=new NetworkData("shadownet"),signal=new AbortController().signal;
 await data.loadEligibility(head(120),[{address:"D",slot:0,power:5}],signal);
 expect(data.forbidden("D")).toBe(true);
 clock.mockReturnValue(60999);expect(data.forbidden("D")).toBe(true);
 clock.mockReturnValue(61000);expect(data.forbidden("D")).toBeUndefined();
 clock.mockReturnValue(1000);expect(data.forbidden("D")).toBeUndefined();
});
it("invalidates eligibility on a changed observer hash even if the old hash returns",async()=>{
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>contextResponse(String(input))??Response.json(true));
 const data=new NetworkData("shadownet"),signal=new AbortController().signal;
 await data.loadEligibility(head(120),[{address:"D",slot:0,power:5}],signal);expect(data.forbidden("D")).toBe(true);
 await data.derive({...head(120),hash:"BFork",predecessor:"BForkParent"},signal);expect(data.forbidden("D")).toBeUndefined();
 await data.derive(head(120),signal);expect(data.forbidden("D")).toBeUndefined();
});

it("uses predecessor and head execution protocols independently across activation",async()=>{
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{
  const url=String(input);
  if(url.endsWith("/protocols"))return Response.json(url.includes("/B119/")?{protocol:"PPrevious",next_protocol:"PCurrent"}:{protocol:"PCurrent",next_protocol:"PNext"});
  const proof=contextResponse(url);if(proof)return proof;
  const level=Number(new URL(url).searchParams.get("level"));
  return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:"D",first_slot:0,attesting_power:5}]}]:{minimal_block_delay:url.includes("/B119/")?"6":"10",delay_increment_per_round:"3",consensus_threshold_size:url.includes("/B119/")?4:3,consensus_committee_size:5});
 });
 const result=await new NetworkData("mainnet").derive(head(120),new AbortController().signal);
 expect(result.contexts?.get(120)?.protocolHash).toBe("PCurrent");expect(result.contexts?.get(121)?.protocolHash).toBe("PNext");
 expect(result.constantsByLevel?.get(120)?.minimum).toBe(6);expect(result.constantsByLevel?.get(121)?.minimum).toBe(10);
 expect(result.rights.get(120)?.[0]?.evidence?.requestedHeadHash).toBe("B119");expect(result.rights.get(121)?.[0]?.evidence?.requestedHeadHash).toBe("B120");
});
it("rejects otherwise valid fallback rights from a different proven chain",async()=>{
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{
  const url=String(input);
  if(url.includes("attestation_rights")&&url.includes("smartpy"))return new Response("",{status:503});
  const proof=contextResponse(url);
  if(proof){if(url.endsWith("/header")&&!url.includes("smartpy")){const value=await proof.json();return Response.json({...value,chain_id:"OtherChain"});}return proof;}
  const level=Number(new URL(url).searchParams.get("level"));
  return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:"WrongChain",first_slot:0,attesting_power:5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4,consensus_committee_size:5});
 });
 const result=await new NetworkData("mainnet").derive(head(120),new AbortController().signal);
 expect(result.rights.size).toBe(0);expect(result.constants).toBeNull();expect(result.errors.some(error=>error.includes("context"))).toBe(true);
});
it("keeps eligibility age monotonic despite a wall clock jump",async()=>{
 const clock=vi.spyOn(performance,"now").mockReturnValue(1000);
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>contextResponse(String(input))??Response.json(false));
 const data=new NetworkData("shadownet");await data.loadEligibility(head(120),[{address:"D",slot:0,power:5}],new AbortController().signal);
 vi.spyOn(Date,"now").mockReturnValue(9999999999999);clock.mockReturnValue(2000);
 expect(data.forbidden("D")).toBe(false);expect(data.eligibilityStatus("D").ageMs).toBe(1000);
 expect(data.eligibilityStatus("D").evidence?.protocolHash).toBe("PFixture");
});
it("caps actual eligibility reads at three workers and starts none on Mainnet",async()=>{
 let active=0,maximum=0;const finishes:(()=>void)[]=[];
 const fetchMock=vi.fn((input:string|URL|Request)=>{
  const proof=contextResponse(String(input));if(proof)return Promise.resolve(proof);
  active++;maximum=Math.max(maximum,active);
  return new Promise<Response>(resolve=>finishes.push(()=>{active--;resolve(Response.json(false));}));
 });vi.stubGlobal("fetch",fetchMock);
 const delegates=Array.from({length:6},(_,slot)=>({address:`D${slot}`,slot,power:1})),signal=new AbortController().signal;
 await new NetworkData("mainnet").loadEligibility(head(120),delegates,signal);expect(fetchMock).not.toHaveBeenCalled();
 const pending=new NetworkData("shadownet").loadEligibility(head(120),delegates,signal);
 await vi.waitFor(()=>expect(finishes).toHaveLength(3));for(const finish of finishes.slice(0,3))finish();
 await vi.waitFor(()=>expect(finishes).toHaveLength(6));for(const finish of finishes.slice(3))finish();await pending;
 expect(maximum).toBe(3);expect(active).toBe(0);
});

it("rejects same-protocol predecessor round contradictions from numerical authority",async()=>{
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{
  const url=String(input),proof=contextResponse(url);
  if(proof){if(url.includes("/B119/header")){const raw=await proof.json();return Response.json({...raw,fitness:["02","00000077","","ffffffff","00000002"]});}return proof;}
  const level=Number(new URL(url).searchParams.get("level"));
  return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:"D",first_slot:0,attesting_power:5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4,consensus_committee_size:5});
 });
 const result=await new NetworkData("mainnet").derive(head(120),new AbortController().signal);
 expect(result.rights.has(120)).toBe(false);expect(result.rights.has(121)).toBe(true);
 expect(result.errors.some(error=>error.includes("predecessor round"))).toBe(true);
});

it("retains late eligibility as context-invalid evidence after a head change",async()=>{
 let finish:((response:Response)=>void)|undefined;
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{
  const url=String(input),proof=contextResponse(url);if(proof)return proof;
  if(url.endsWith("/is_forbidden"))return new Promise<Response>(resolve=>{finish=resolve;});
  return Response.json({});
 });
 const data=new NetworkData("shadownet"),signal=new AbortController().signal;
 const pending=data.loadEligibility(head(120),[{address:"D",slot:0,power:5}],signal);
 await vi.waitFor(()=>expect(finish).toBeDefined());await data.derive({...head(120),hash:"BFork",predecessor:"BForkParent"},signal);
 finish?.(Response.json(true));await pending;
 expect(data.forbidden("D")).toBeUndefined();expect(data.eligibilityStatus("D").contextInvalid).toBe(true);
 expect(data.eligibilityStatus("D").rawValue).toBe(true);expect(data.eligibilityStatus("D").evidence?.contextHeadHash).toBe("B120");
});


it("never converts an unsupported pending body into an empty validated snapshot",async()=>{
 for(const body of [{},{applied:[]},{validated:null},{validated:{}}]){
  vi.stubGlobal("fetch",async()=>Response.json(body));
  await expect(new NetworkData("mainnet").pending(new AbortController().signal)).rejects.toThrow("validated");
 }
});


it("returns independently attributed full validated coverage with before and after observer proof",async()=>{
 const reads:string[]=[];
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{const url=String(input);reads.push(url);
  if(url.includes("pending_operations"))return Response.json({validated:[{hash:"transaction",branch:"B119",contents:[{kind:"transaction",source:"D1",destination:"D2",fee:"1",counter:"1",gas_limit:"100",storage_limit:"0",amount:"1"}]}],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]});
  if(url.endsWith("/blocks/head/header"))return Response.json({...head(120),chain_id:"NetFixture"});
  const proof=contextResponse(url);if(proof)return proof;
  const level=Number(new URL(url).searchParams.get("level"));return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:"D1",first_slot:0,attesting_power:5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4,consensus_committee_size:5});
 });
 const data=new NetworkData("mainnet"),signal=new AbortController().signal,derived=await data.derive(head(120),signal),context=derived.contexts.get(121);if(!context)throw new Error("Fixture context missing");
 const result=await data.pending(signal,head(120),context) as unknown as {complete?:boolean;operations?:readonly unknown[];evidence?:{source:{baseUrl:string};requestedHeadHash?:string};contextBefore?:unknown;contextAfter?:unknown};
 expect(result.complete).toBe(true);expect(result.operations).toHaveLength(1);expect(result.evidence?.source.baseUrl).toBe(context.observer.source.baseUrl);expect(result.evidence?.requestedHeadHash).toBeUndefined();expect(result.contextBefore).toEqual(context);expect(result.contextAfter).toEqual(context);
 expect(reads.filter(url=>url.endsWith("/blocks/head/header"))).toHaveLength(2);
});


it.each(['deadline','pause','caller'] as const)('V3 metadata body is fenced by %s without a retry or fallback',async cause=>{
 const source={network:'mainnet' as const,name:'TzKT',baseUrl:'https://rpc.tzkt.io/mainnet'},deadline=new AbortController(),caller=new AbortController();
 const timeout=vi.spyOn(AbortSignal,'timeout').mockReturnValue(deadline.signal);
 let resolveBody:(value:unknown)=>void=()=>undefined;const calls:{url:string;options:RequestInit|undefined}[]=[];
 vi.stubGlobal('fetch',async(input:string|URL|Request,options?:RequestInit)=>{calls.push({url:String(input),options});return {ok:true,redirected:false,json:()=>new Promise(resolve=>{resolveBody=resolve;})} as Response;});
 const data=new NetworkData('mainnet'),read=data.blockMetadata(head(123),source,caller.signal);const rejected=expect(read).rejects.toThrow(/cancelled|timed out/);
 await Promise.resolve();await Promise.resolve();expect(timeout).toHaveBeenCalledWith(8000);expect(calls).toHaveLength(1);expect(calls[0]!.url).toBe('https://rpc.tzkt.io/mainnet/chains/main/blocks/B123/metadata');expect(calls[0]!.options?.redirect).toBe('error');
 if(cause==='deadline')deadline.abort();else if(cause==='pause')data.pause();else caller.abort();
 await rejected;expect(calls[0]!.options!.signal!.aborted).toBe(true);resolveBody({baker:'late'});await Promise.resolve();expect(calls).toHaveLength(1);
});

it('V3 metadata rejects redirected responses without following another provider',async()=>{
 const fetchMock=vi.fn(async()=>({ok:true,redirected:true,json:async()=>({baker:'redirected'})} as Response));vi.stubGlobal('fetch',fetchMock);
 const data=new NetworkData('mainnet');await expect(data.blockMetadata(head(123),{network:'mainnet',name:'TzKT',baseUrl:'https://rpc.tzkt.io/mainnet'},new AbortController().signal)).rejects.toThrow();expect(fetchMock).toHaveBeenCalledTimes(1);
});


it.each(['pre','att','unknown','envelope','missing','cap','context'] as const)('qualifies independently parsed phases and fails shared %s damage closed',async phase=>{
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{const url=String(input);
  if(url.includes("pending_operations"))return Response.json(phase==='missing'?{}:{validated:phase==='context'?[]:phase==='cap'?Array.from({length:10001},(_,i)=>({hash:String(i),contents:[{kind:'transaction'}]})):phase==='envelope'?[null]:[{hash:"bad",contents:[{kind:phase==='pre'?'preattestations_aggregate':phase==='att'?'attestations_aggregate':'unknown_kind',consensus_content:{level:121,round:0,block_payload_hash:"P"},committee:[-1]}]}]});
  if(url.endsWith("/blocks/head/header"))return Response.json({...head(120),chain_id:"NetFixture"});
  const proof=contextResponse(url);if(proof)return proof;
  const level=Number(new URL(url).searchParams.get("level"));return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:"D1",first_slot:0,attesting_power:5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4,consensus_committee_size:5});
 });
 const data=new NetworkData("mainnet"),signal=new AbortController().signal,context=(await data.derive(head(120),signal)).contexts.get(121)!;
 const result=await data.pending(signal,head(120),phase==='context'?{...context,protocolHash:"ChangedProtocol"}:context);
 expect(result.complete).toBe(false);
 expect(result.phaseCoverage?.[phase==='pre'?'att':'pre'].complete).toBe(phase==='pre'||phase==='att');
 expect(result.phaseCoverage?.[phase==='pre'?'pre':'att'].complete).toBe(false);
});


it("reuses completed immutable helpers across derive, exact-source reconciliation and head advance with fresh context",async()=>{
 const wall=vi.spyOn(Date,'now').mockReturnValue(1000),monotonic=vi.spyOn(performance,'now').mockReturnValue(100);
 const calls:string[]=[];
 vi.stubGlobal('fetch',async(input:string|URL|Request)=>{const url=String(input);calls.push(url);if(url.endsWith('/head/header'))return Response.json({...head(120),chain_id:'NetFixture'});const proof=contextResponse(url);if(proof)return proof;
 if(url.includes('attestation_rights'))return Response.json([{level:Number(new URL(url).searchParams.get('level')),delegates:[{delegate:'D',first_slot:0,attesting_power:5}]}]);
 return Response.json({minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5});});
 const data=new NetworkData('mainnet'),signal=new AbortController().signal,source=data.source;
 const initial=await data.derive(head(120),signal);
 const rightsReceipt=initial.rights.get(121)?.[0]?.evidence,constantsReceipt=initial.constantsByLevel.get(121)?.evidence;
 wall.mockReturnValue(2000);monotonic.mockReturnValue(200);
 const reconciled=await data.reconcile({source,level:121,round:0},signal);
 expect(reconciled.rights[0]?.context?.observer.header.hash).toBe('B120');
 const advanced=await data.derive(head(121),signal);
 expect(advanced.rights.get(121)?.[0]?.context?.observer.header.hash).toBe('B121');
 expect(advanced.constantsByLevel.get(121)?.evidence?.contextHeadHash).toBe('B121');
 for(const [original,reused] of [[rightsReceipt,advanced.rights.get(121)?.[0]?.evidence],[constantsReceipt,advanced.constantsByLevel.get(121)?.evidence]]){
  expect(reused?.receivedAt).toBe(original?.receivedAt);expect(reused?.receivedMonotonic).toBe(original?.receivedMonotonic);
  expect(reused?.source).toEqual(original?.source);expect(reused?.requestedHeadHash).toBe('B120');
 }
 expect(initial.rights.get(121)?.[0]?.context?.observer.header.hash).toBe('B120');
 expect(calls.filter(url=>url.includes('/blocks/B120/helpers/attestation_rights?level=121'))).toHaveLength(1);
 expect(calls.filter(url=>url.includes('/blocks/B120/context/constants'))).toHaveLength(1);
});

it('coalesces unfinished constants reads only for the same cancellation owner',async()=>{
 const calls:string[]=[];let finish:(response:Response)=>void=()=>undefined;
 vi.stubGlobal('fetch',async(input:string|URL|Request)=>{const url=String(input);const proof=contextResponse(url);if(proof)return proof;calls.push(url);return new Promise<Response>(resolve=>{finish=resolve;});});
 const data=new NetworkData('mainnet'),signal=new AbortController().signal;
 const first=data.opportunityConstants(head(120),121,signal);
 await vi.waitFor(()=>expect(calls).toHaveLength(1));
 const second=data.opportunityConstants(head(120),121,signal);
 await new Promise(resolve=>setTimeout(resolve,0));expect(calls).toHaveLength(1);
 finish(Response.json({minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5}));
 expect((await first).minimum).toBe(6);expect((await second).minimum).toBe(6);expect(calls).toHaveLength(1);
});

it.each(['owner','waiter'] as const)('keeps unfinished constants independent when the %s is cancelled',async cancelled=>{
 const calls:{signal:AbortSignal|undefined;finish:(response:Response)=>void}[]=[];
 vi.stubGlobal('fetch',async(input:string|URL|Request,options?:RequestInit)=>contextResponse(String(input))??new Promise<Response>(finish=>{calls.push({signal:options?.signal??undefined,finish});}));
 const data=new NetworkData('mainnet'),owner=new AbortController(),waiter=new AbortController();
 const first=data.opportunityConstants(head(120),121,owner.signal).then(value=>({value}),()=>({value:undefined}));
 await vi.waitFor(()=>expect(calls).toHaveLength(1));
 const second=data.opportunityConstants(head(120),121,waiter.signal).then(value=>({value}),()=>({value:undefined}));
 await vi.waitFor(()=>expect(calls).toHaveLength(2));
 (cancelled==='owner'?owner:waiter).abort();
 expect(calls[cancelled==='owner'?0:1]?.signal?.aborted).toBe(true);
 calls[0]!.finish(Response.json({minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5}));
 calls[1]!.finish(Response.json({minimal_block_delay:'10',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5}));
 const results=await Promise.all([first,second]);
 expect(results[cancelled==='owner'?0:1]?.value).toBeUndefined();
 expect(results[cancelled==='owner'?1:0]?.value?.minimum).toBe(cancelled==='owner'?10:6);
 expect((await data.opportunityConstants(head(120),121,new AbortController().signal)).minimum).toBe(cancelled==='owner'?10:6);
});

it('keeps immutable helper receipts separate for observers with different proven protocols',async()=>{
 const calls:string[]=[];
 vi.stubGlobal('fetch',async(input:string|URL|Request)=>{const url=String(input);calls.push(url);const primary=url.includes('smartpy');
  if(url.endsWith('/head/header'))return Response.json({...head(120),chain_id:'NetFixture'});
  if(url.endsWith('/protocols'))return Response.json({protocol:primary?'PPrimary':'PSecondary',next_protocol:primary?'PPrimary':'PSecondary'});
  const proof=contextResponse(url);if(proof)return proof;
  if(url.includes('attestation_rights'))return Response.json([{level:Number(new URL(url).searchParams.get('level')),delegates:[{delegate:primary?'Primary':'Secondary',first_slot:0,attesting_power:5}]}]);
  return Response.json({minimal_block_delay:primary?'6':'10',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5});
 });
 const data=new NetworkData('mainnet'),signal=new AbortController().signal;
 const primary=await data.derive(head(120),signal),source={network:'mainnet' as const,name:'Octez public',baseUrl:'https://tezos-mainnet.octez.io'};
 const secondary=await data.reconcile({source,level:121,round:0},signal);
 expect(primary.rights.get(121)?.[0]?.address).toBe('Primary');expect(secondary.rights[0]?.address).toBe('Secondary');
 expect(secondary.constants.minimum).toBe(10);expect(secondary.constants.evidence?.source).toEqual(source);
 expect(secondary.constants.evidence?.protocolHash).toBe('PSecondary');expect(secondary.rights[0]?.context?.protocolHash).toBe('PSecondary');
 expect(calls.filter(url=>url.startsWith(source.baseUrl)&&url.endsWith('/B120/context/constants'))).toHaveLength(1);
 expect(calls.filter(url=>url.startsWith(source.baseUrl)&&url.endsWith('/B120/helpers/attestation_rights?level=121'))).toHaveLength(1);
 await data.reconcile({source,level:121,round:0},signal);
 expect(calls.filter(url=>url.startsWith(source.baseUrl)&&url.endsWith('/B120/context/constants'))).toHaveLength(1);
});

it('reuses a fallback source receipt exactly and rejects incompatible observer proof on rebinding',async()=>{
 const calls:string[]=[];
 vi.stubGlobal('fetch',async(input:string|URL|Request)=>{const url=String(input);calls.push(url);const primary=url.includes('smartpy');
  if(url.endsWith('/head/header'))return Response.json({...head(120),chain_id:'NetFixture'});
  if(url.endsWith('/B121/protocols')&&!primary)return Response.json({protocol:'Incompatible',next_protocol:'Incompatible'});
  const proof=contextResponse(url);if(proof)return proof;
  if(primary)return new Response('',{status:503});
  if(url.includes('attestation_rights'))return Response.json([{level:Number(new URL(url).searchParams.get('level')),delegates:[{delegate:'Fallback',first_slot:0,attesting_power:5}]}]);
  return Response.json({minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5});
 });
 const data=new NetworkData('mainnet'),signal=new AbortController().signal,primary=data.source;
 const first=await data.derive(head(120),signal),source=first.rights.get(121)?.[0]?.evidence?.source;
 if(!source)throw new Error('Fixture fallback receipt missing');
 expect(source.baseUrl).not.toBe(primary.baseUrl);
 const reconciled=await data.reconcile({source,level:121,round:0},signal);
 expect(reconciled.rights[0]?.evidence?.source).toEqual(source);expect(reconciled.context.observer.source).toEqual(source);
 expect(calls.filter(url=>url.startsWith(source.baseUrl)&&url.endsWith('/B120/helpers/attestation_rights?level=121'))).toHaveLength(1);
 expect(calls.filter(url=>url.startsWith(source.baseUrl)&&url.endsWith('/B120/context/constants'))).toHaveLength(1);
 const observer=first.contexts.get(121)?.observer;if(!observer)throw new Error('Fixture observer missing');
 const advanced=await data.derive({...head(121),evidence:observer.evidence},signal);
 expect(advanced.contexts.get(121)?.observer.source).toEqual(primary);
 expect(advanced.rights.has(121)).toBe(false);expect(advanced.constantsByLevel.has(121)).toBe(false);
 expect(advanced.errors.some(error=>error.includes('incompatible source context'))).toBe(true);
 expect(calls.filter(url=>url.startsWith(source.baseUrl)&&url.endsWith('/B120/helpers/attestation_rights?level=121'))).toHaveLength(1);
});
