import {afterEach, expect, it, vi} from "vitest";
import {NetworkData} from "../../src/rpc/networkData";
import type {BlockHeader} from "../../src/rpc/models";

afterEach(()=>vi.unstubAllGlobals());
const head=(level:number):BlockHeader=>({proto:4,level,hash:`B${level}`,predecessor:`B${level-1}`,timestamp:new Date().toISOString(),fitness:[]});
it("reuses prefetched committee immediately while the next level is still loading",async()=>{
  const calls:string[]=[];
  const fetchMock=vi.fn(async(input:string|URL|Request)=>{
    const url=String(input);calls.push(url);
    if(url.includes("attestation_rights")) {
      const level=Number(new URL(url).searchParams.get("level"));
      if(level===102)return new Promise<Response>(()=>{});
      return Response.json([{level,delegates:[{delegate:"tz1Baker",first_slot:0,attesting_power:7000}]}]);
    }
    return Response.json({minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4667,consensus_committee_size:7000});
  });
  vi.stubGlobal("fetch",fetchMock);
  const data=new NetworkData("mainnet");const signal=new AbortController().signal;
  await data.derive(head(100),signal);
  const next=await data.derive(head(101),signal);
  expect(next.rights.get(101)?.[0]?.power).toBe(7000);
  expect(next.constants?.quorum).toBe(4667);
  expect(calls.filter(url=>url.endsWith("attestation_rights?level=101"))).toHaveLength(1);
  expect(calls.filter(url=>url.endsWith("/context/constants"))).toHaveLength(1);
});

it("rejects invalid committee values and invalid protocol quorum without losing raw operations",async()=>{
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{
  const url=String(input),level=Number(new URL(url).searchParams.get("level"));
  return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:"D1",first_slot:0,attesting_power:1.5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:6,consensus_committee_size:5});
 });
 const data=new NetworkData("mainnet"),result=await data.derive(head(120),new AbortController().signal);
 expect(result.rights.size).toBe(0);expect(result.constants).toBeNull();
});

it("preserves raw pending branches and labels only actually pinned auxiliary requests",async()=>{
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{
  const url=String(input),level=Number(new URL(url).searchParams.get("level"));
  if(url.includes("pending_operations"))return Response.json({validated:[{hash:"pending",branch:"BRawAnchor",contents:[{kind:"preattestation",level:121,round:0,slot:0,block_payload_hash:"P"}]}]});
  if(url.includes("attestation_rights"))return Response.json([{level,delegates:[{delegate:"D1",first_slot:0,attesting_power:5}]}]);
  return Response.json({minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4,consensus_committee_size:5});
 });
 const data=new NetworkData("mainnet"),signal=new AbortController().signal;
 const pending=await data.pending(signal,head(120));expect(pending[0]?.branch).toBe("BRawAnchor");
 expect(pending[0]?.evidence?.requestedHeadHash).toBeUndefined();expect(pending[0]?.evidence?.observedHeadHash).toBeUndefined();
 const derived=await data.derive(head(120),signal);
 expect(derived.rights.get(120)?.[0]?.evidence?.requestedHeadHash).toBe("B120");
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
 let finish:(response:Response)=>void=()=>undefined;
 vi.stubGlobal("fetch",()=>new Promise<Response>(resolve=>{finish=resolve;}));
 const data=new NetworkData("shadownet"),pending=data.loadEligibility(head(120),[{address:"D1",slot:0,power:5}],new AbortController().signal);
 data.pause();finish(Response.json(true));await pending;expect(data.forbidden("D1")).toBeUndefined();
});

it("cannot poison same-head rights/constants caches with cancelled-generation responses",async()=>{
 const finishes:{url:string;finish:(response:Response)=>void}[]=[];
 vi.stubGlobal("fetch",(input:string|URL|Request)=>new Promise<Response>(finish=>{finishes.push({url:String(input),finish});}));
 const data=new NetworkData("mainnet"),signal=new AbortController().signal;
 const pending=data.derive(head(120),signal);data.pause();data.resume();
 for(const request of finishes){const level=Number(new URL(request.url).searchParams.get("level"));request.finish(Response.json(request.url.includes("attestation_rights")?[{level,delegates:[{delegate:"Old",first_slot:0,attesting_power:5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4,consensus_committee_size:5}));}
 await pending;
 vi.stubGlobal("fetch",async(input:string|URL|Request)=>{const url=String(input),level=Number(new URL(url).searchParams.get("level"));return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:"Fresh",first_slot:0,attesting_power:5}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:3,consensus_committee_size:5});});
 const fresh=await data.derive(head(120),signal);expect(fresh.rights.get(120)?.[0]?.address).toBe("Fresh");expect(fresh.constants?.quorum).toBe(3);
});

it("rejects cancelled baking rights before they can enter the same-context cache",async()=>{
 let finish:(response:Response)=>void=()=>undefined;vi.stubGlobal("fetch",()=>new Promise<Response>(resolve=>{finish=resolve;}));
 const data=new NetworkData("mainnet"),signal=new AbortController().signal;
 const pending=data.bakers(head(120),121,2,signal);data.pause();data.resume();finish(Response.json([{level:121,round:2,delegate:"Cancelled"}]));await expect(pending).rejects.toThrow("Cancelled collection generation");
 vi.stubGlobal("fetch",async()=>Response.json([{level:121,round:2,delegate:"Fresh"}]));
 expect((await data.bakers(head(120),121,2,signal))[0]?.delegate).toBe("Fresh");
});

it("cancelled fallback bodies cannot change the displayed responding source",async()=>{
 let finish:((response:Response)=>void)|undefined;let reads=0;
 vi.stubGlobal("fetch",()=>++reads===1?Promise.resolve(new Response("",{status:503})):new Promise<Response>(resolve=>{finish=resolve;}));
 const data=new NetworkData("mainnet"),originalSource=data.source.baseUrl,pending=data.head(new AbortController().signal);
 await vi.waitFor(()=>expect(finish).toBeDefined());data.pause();data.resume();finish?.(Response.json(head(120)));
 await expect(pending).rejects.toThrow("Cancelled collection generation");expect(data.source.baseUrl).toBe(originalSource);expect(reads).toBe(2);
});
