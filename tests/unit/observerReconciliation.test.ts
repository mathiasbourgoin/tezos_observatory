import {afterEach,expect,it,vi} from "vitest";
import {ObserverReconciliation,reconciliationKey,type ReconciliationTarget} from "../../src/monitor/observerReconciliation";
const source={network:"mainnet" as const,name:"A",baseUrl:"https://A"};
const target=(payload:string):ReconciliationTarget=>({source,level:123,round:0,payload});
afterEach(()=>vi.useRealTimers());
it('accepts an owned context shared by a queued candidate and raw target without another read',async()=>{
 vi.useFakeTimers();let finish:(value:string)=>void=()=>undefined;const results:string[]=[];
 const head={chainId:'NetFixture',level:122,hash:'H122',predecessor:'H121',timestamp:'2026-01-01T00:00:00Z',fitness:[]};
 const candidate=(hash:string):ReconciliationTarget=>({...target('K'),candidate:{identity:hash,header:{...head,hash,level:123,predecessor:'H122',payload_hash:'K'},evidence:{source,receivedAt:1,receivedMonotonic:1}}});
 const run=vi.fn(()=>new Promise<string>(resolve=>{finish=resolve;}));
 const scheduler=new ObserverReconciliation(source,{run,onResult:(_target,value)=>results.push(value)});scheduler.start();
 scheduler.request(candidate('H1'));scheduler.request(candidate('H2'));scheduler.request(target('K'));
 scheduler.observeOwnedContext(head,0,0);finish('same proven context');await vi.advanceTimersByTimeAsync(0);
 expect(results).toEqual(['same proven context']);expect(scheduler.state().queued).toBeUndefined();expect(run).toHaveBeenCalledTimes(1);scheduler.stop();
});
it.each(['head','payload','protocol','parent','generation'] as const)('does not reuse an active proof for a queued different %s',async kind=>{
 vi.useFakeTimers();let finish:(value:string)=>void=()=>undefined;const onResult=vi.fn();
 const head={chainId:'NetFixture',level:122,hash:'H122',predecessor:'H121',timestamp:'2026-01-01T00:00:00Z',fitness:[]};
 const scheduler=new ObserverReconciliation(source,{run:()=>new Promise<string>(resolve=>{finish=resolve;}),onResult});scheduler.start();
 scheduler.request({...target('K'),protocolHash:'P'});scheduler.observeOwnedContext(head,0,0);
 const queued={...target('K'),observerHead:head,protocolHash:'P',observerGeneration:0,collectionGeneration:0};
 scheduler.request(kind==='head'?{...queued,observerHead:{...head,hash:'Other'}}:kind==='payload'?{...queued,payload:'Other'}:kind==='protocol'?{...queued,protocolHash:'Other'}:kind==='generation'?{...queued,observerGeneration:1}:{...queued,candidate:{identity:'Other',header:{...head,hash:'Other',level:123,predecessor:'OtherParent'},evidence:{source,receivedAt:1,receivedMonotonic:1}}});
 finish('obsolete');await vi.advanceTimersByTimeAsync(0);expect(onResult).not.toHaveBeenCalled();expect(scheduler.state().queued).toBeDefined();scheduler.stop();
});

it("coalesces one newest material target and separates starts by fifteen monotonic seconds",async()=>{
 vi.useFakeTimers();let now=0;const starts:{payload:string;at:number}[]=[],finishes:((value:string)=>void)[]=[],results:string[]=[];
 const scheduler=new ObserverReconciliation(source,{now:()=>now,run:request=>{if(!request.payload)throw new Error("Fixture payload missing");starts.push({payload:request.payload,at:now});return new Promise<string>(resolve=>finishes.push(resolve));},onResult:(_request,value)=>results.push(value)});
 scheduler.start();scheduler.request(target("K0"));scheduler.request(target("K1"));scheduler.request(target("K2"));scheduler.request(target("K3"));
 expect(starts).toEqual([{payload:"K0",at:0}]);expect(scheduler.state().queued).toBe(reconciliationKey(target("K3")));
 finishes[0]?.("obsolete");await vi.advanceTimersByTimeAsync(0);expect(results).toEqual([]);
 now=14999;await vi.advanceTimersByTimeAsync(14999);expect(starts).toHaveLength(1);
 now=15000;await vi.advanceTimersByTimeAsync(1);expect(starts).toEqual([{payload:"K0",at:0},{payload:"K3",at:15000}]);
 finishes[1]?.("newest");await vi.advanceTimersByTimeAsync(0);expect(results).toEqual(["newest"]);expect(vi.getTimerCount()).toBe(0);
 scheduler.stop();
});
it("never polls a failed unchanged context and requires a fresh manual action after cooldown",async()=>{
 vi.useFakeTimers();let now=0;const run=vi.fn(async()=>{throw new Error("Unproven context");});
 const scheduler=new ObserverReconciliation(source,{now:()=>now,run,onResult:()=>{throw new Error("Failure cannot authorize power");}});
 scheduler.start();scheduler.request(target("K"));await vi.advanceTimersByTimeAsync(0);
 expect(run).toHaveBeenCalledTimes(1);expect(scheduler.request(target("K"))).toBe(false);
 now=14999;expect(scheduler.request(target("K"),true)).toBe(false);expect(vi.getTimerCount()).toBe(0);
 now=120000;await vi.advanceTimersByTimeAsync(120000);expect(run).toHaveBeenCalledTimes(1);
 expect(scheduler.request(target("K"))).toBe(false);expect(scheduler.request(target("K"),true)).toBe(true);
 await vi.advanceTimersByTimeAsync(0);expect(run).toHaveBeenCalledTimes(2);expect(vi.getTimerCount()).toBe(0);scheduler.stop();
});
it("aborts lifecycle work and ignores late old-generation results after resume",async()=>{
 vi.useFakeTimers();let now=0,signal:AbortSignal|undefined;const finishes:((value:string)=>void)[]=[],results:string[]=[];
 const scheduler=new ObserverReconciliation(source,{now:()=>now,run:(_request,currentSignal)=>{signal=currentSignal;return new Promise<string>(resolve=>finishes.push(resolve));},onResult:(_request,value)=>results.push(value)});
 scheduler.start();scheduler.request(target("Old"));scheduler.request(target("Queued"));scheduler.stop();expect(signal?.aborted).toBe(true);expect(vi.getTimerCount()).toBe(0);
 expect(scheduler.request(target("Paused"))).toBe(false);scheduler.start();now=15000;scheduler.request(target("Fresh"));
 finishes[0]?.("late");finishes[1]?.("fresh");await vi.advanceTimersByTimeAsync(0);expect(results).toEqual(["fresh"]);scheduler.stop();
});
it("uses proven head parent protocol and target identity, excluding receipt-only changes",()=>{
 const head={level:122,hash:"H",predecessor:"P",timestamp:"2026-01-01T00:00:00Z",fitness:[]};
 const original={...target("K"),observerHead:head,protocolHash:"PProtocol"};
 expect(reconciliationKey({...original,observerHead:{...head,evidence:{source,receivedAt:999,receivedMonotonic:999}}})).toBe(reconciliationKey(original));
 for(const changed of [{...original,observerHead:{...head,hash:"Other"}},{...original,observerHead:{...head,predecessor:"Other"}},{...original,protocolHash:"POther"},{...original,round:1},{...original,payload:"Other"}])expect(reconciliationKey(changed)).not.toBe(reconciliationKey(original));
});
it("rejects another endpoint without performing reads",()=>{
 const run=vi.fn(async()=>"unused"),scheduler=new ObserverReconciliation(source,{run,onResult:()=>undefined});scheduler.start();
 expect(()=>scheduler.request({...target("K"),source:{...source,baseUrl:"https://B"}})).toThrow("another observer");expect(run).not.toHaveBeenCalled();scheduler.stop();
});

it("retains failure suppression for a still-owned K1 after K2 fails",async()=>{
 vi.useFakeTimers();let now=0;const run=vi.fn(async()=>{throw new Error("Unproven");});
 const scheduler=new ObserverReconciliation(source,{now:()=>now,run,onResult:()=>{throw new Error("No authority");}});
 scheduler.start();scheduler.request(target("K1"));await vi.advanceTimersByTimeAsync(0);now=15000;scheduler.request(target("K2"));await vi.advanceTimersByTimeAsync(0);
 now=30000;expect(scheduler.request(target("K1"))).toBe(false);await vi.advanceTimersByTimeAsync(0);expect(run).toHaveBeenCalledTimes(2);scheduler.stop();
});
