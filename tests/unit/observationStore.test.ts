import {afterEach,expect,it,vi} from "vitest";
import {ObservationStore} from "../../src/monitor/observationStore";
import {NetworkData,sources,type Derived} from "../../src/rpc/networkData";
import {groupsFor,signerPower} from "../../src/consensus/phaseEvidence";
import type {BlockHeader,ObservationEvidence,RpcSource} from "../../src/rpc/models";
const a=sources.mainnet[0]!,b=sources.mainnet[1]!;
const head=(level:number):BlockHeader=>({chainId:"NetFixture",level,hash:`H${level}`,predecessor:`H${level-1}`,timestamp:"2026-01-01T00:00:00Z",fitness:["02",level.toString(16).padStart(8,"0"),"","ffffffff","00000000"]});
const evidence=(source:RpcSource,at=1):ObservationEvidence=>({source,receivedAt:at,receivedMonotonic:at});
const operation=(hash="op",level=123,source=b)=>({hash,evidence:evidence(source),contents:[{kind:"preattestation" as const,level,round:0,slot:0,block_payload_hash:"P"}]});
const installRpc=(current=head(122))=>{const reads:string[]=[];vi.stubGlobal("fetch",async(input:string|URL|Request)=>{
 const url=String(input);reads.push(url);const level=Number(new URL(url).searchParams.get("level"));
 if(url.endsWith("/header")){const hash=url.split("/blocks/")[1]?.split("/")[0],observed=hash==="head"||hash===current.hash?current:hash===current.predecessor?{...head(current.level-1),hash:current.predecessor}:head(Number(hash?.slice(1)));return Response.json({...observed,chain_id:"NetFixture"});}
 if(url.endsWith("/protocols"))return Response.json({protocol:"PFixture",next_protocol:"PFixture"});
 return Response.json(url.includes("attestation_rights")?[{level,delegates:[{delegate:"D1",first_slot:0,attesting_power:3},{delegate:"D2",first_slot:1,attesting_power:2}]}]:{minimal_block_delay:"6",delay_increment_per_round:"3",consensus_threshold_size:4,consensus_committee_size:5});
 });return reads;};
afterEach(()=>vi.unstubAllGlobals());
it("promotes retained B123 under exact B122 proof without replacing A120 or reinserting raw votes",async()=>{
 const reads=installRpc(),store=new ObservationStore<Derived>("mainnet",sources.mainnet);store.observeHead({...head(120),evidence:evidence(a)});
 const created=store.addOperations([operation()]);expect(created).toHaveLength(1);expect(store.unresolvedTargets()).toHaveLength(1);expect(store.acceptedTargets()).toHaveLength(0);
 const original=store.rawOperations()[0]?.evidence,target=created[0]?.target;if(!target)throw new Error("Fixture target missing");
 const admission=await new NetworkData("mainnet").reconcile(target,new AbortController().signal);store.accept(admission);
 expect(store.observerHead(a)?.hash).toBe("H120");expect(store.unresolvedTargets()).toHaveLength(0);expect(store.acceptedTargets()).toHaveLength(1);expect(store.rawOperations()).toHaveLength(1);
 expect(store.rawOperations()[0]?.evidence).toBe(original);expect(store.rawOperations()[0]?.evidence?.observedHeadHash).toBeUndefined();
 expect(store.rawOperations()[0]?.admission?.headHash).toBe("H122");expect(reads.every(url=>url.startsWith(b.baseUrl))).toBe(true);
 const group=groupsFor(store.rawOperations(),admission.rights,123)[0];expect(signerPower(group?.pre??new Set(),admission.rights)).toBe(3);
 store.addOperations([operation()]);expect(store.rawOperations()).toHaveLength(1);expect(store.acceptedTargets()).toHaveLength(1);expect(store.rawOperations()[0]?.evidence?.receivedMonotonic).toBe(1);
});

it("does not attach another chain's raw packet to a compatible target's sidecar",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet);
 const good={...operation("good"),evidence:{...evidence(b),chainId:"NetFixture"}},wrong={...operation("wrong"),evidence:{...evidence(b),chainId:"WrongChain"}};
 const targets=store.addOperations([good,wrong]),target=targets.find(record=>record.evidence.chainId==="NetFixture")?.target;if(!target)throw new Error("Fixture missing");
 store.accept(await new NetworkData("mainnet").reconcile(target,new AbortController().signal));
 expect(store.rawOperations().find(value=>value.hash==="wrong")?.admission).toBeUndefined();
 expect(store.rawOperations().find(value=>value.hash==="good")?.admission?.chainId).toBe("NetFixture");
});
it("withdraws authority for same-hash contradictory observed parent facts",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),target=store.addOperations([operation()])[0]?.target;if(!target)throw new Error("Fixture missing");
 store.accept(await new NetworkData("mainnet").reconcile(target,new AbortController().signal));
 store.observeHead({...head(122),predecessor:"ContradictoryParent",evidence:evidence(b)});
 expect(store.acceptedTargets()[0]?.contextInvalid).toBe(true);
});
it("rejects a late H1 admission after a newer same-height H2 observer fact",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),target=store.addOperations([operation()])[0]?.target;if(!target)throw new Error("Fixture missing");
 const old=await new NetworkData("mainnet").reconcile(target,new AbortController().signal);
 store.observeHead({...head(122),hash:"H2",predecessor:"P2",evidence:evidence(b)});
 expect(()=>store.accept(old)).toThrow("obsolete");expect(store.unresolvedTargets()).toHaveLength(1);expect(store.acceptedTargets()).toHaveLength(0);
});
it("refuses contextless and mixed-context committees at the actual accounting boundary",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),target=store.addOperations([operation()])[0]?.target;if(!target)throw new Error("Fixture missing");
 const admission=await new NetworkData("mainnet").reconcile(target,new AbortController().signal);
 const raw={...operation(),evidence:{...evidence(b),observedHeadHash:"H122"}};
 const contextless=admission.rights.map(({address,slot,power})=>({address,slot,power}));
 expect(groupsFor([raw],contextless,123)[0]?.pre.size).toBe(0);
 const right=admission.rights[1];if(!right?.context)throw new Error("Fixture missing");
 const mixed=[admission.rights[0]!,{...right,context:{...right.context,key:"OtherContext"}}];
 expect(groupsFor([raw],mixed,123)[0]?.pre.size).toBe(0);
});
it("does not bind an evicted quarantine instance via another retained context's payload",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet);
 const packets=Array.from({length:101},(_,index)=>({...operation(`op${index}`),evidence:{...evidence(b,index),observedHeadHash:`Old${index}`,observedHeadLevel:1}}));
 store.addOperations(packets);expect(store.unresolvedTargets()).toHaveLength(100);
 const target=store.unresolvedTargets()[0]?.target;if(!target)throw new Error("Fixture missing");
 store.accept(await new NetworkData("mainnet").reconcile(target,new AbortController().signal));
 expect(store.rawOperations().find(packet=>packet.hash==="op0")?.admission).toBeUndefined();
 expect(store.rawOperations().find(packet=>packet.hash==="op100")?.admission?.headHash).toBe("H122");
});

it("refuses a committee assembled from different exact contexts",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),target=store.addOperations([operation()])[0]?.target;if(!target)throw new Error("Fixture missing");
 const admission=await new NetworkData("mainnet").reconcile(target,new AbortController().signal),right=admission.rights[1];if(!right?.context)throw new Error("Fixture missing");
 const mixed=[admission.rights[0]!,{...right,context:{...right.context,key:"OtherContext"}}];
 const raw={...operation(),evidence:{...evidence(b),observedHeadHash:"H122"}};
 expect(groupsFor([raw],mixed,123)[0]?.pre.size).toBe(0);
});
it("rejects candidate target round and payload substitution before reading providers",async()=>{
 const reads=installRpc(),candidate={identity:"candidate",header:{...head(123),payload_hash:"P"},evidence:evidence(b)};
 const target={source:b,level:123,round:1,payload:"OtherPayload",candidate};
 await expect(new NetworkData("mainnet").reconcile(target,new AbortController().signal)).rejects.toThrow("target");
 expect(reads).toHaveLength(0);
});

it("keeps H1 instance proof invalid while fresh H2 receipts receive their own exact proof",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet);
 store.observeHead({...head(122),evidence:evidence(b)});
 const oldPacket={...operation(),evidence:{...evidence(b),observedHeadHash:"H122",observedHeadLevel:122}},oldTarget=store.addOperations([oldPacket])[0];if(!oldTarget)throw new Error("Fixture missing");
 store.accept(await new NetworkData("mainnet").reconcile(oldTarget.target,new AbortController().signal));
 const fork={...head(122),hash:"HFork",predecessor:"PFork"};store.observeHead({...fork,evidence:evidence(b,2)});installRpc(fork);
 const fresh={...operation(),evidence:{...evidence(b,3),observedHeadHash:"HFork",observedHeadLevel:122}},freshTarget=store.addOperations([fresh])[0];if(!freshTarget)throw new Error("Fixture missing");
 const current=await new NetworkData("mainnet").reconcile(freshTarget.target,new AbortController().signal);store.accept(current);
 expect(store.target(oldTarget.identity)?.contextInvalid).toBe(true);expect(store.target(oldTarget.identity)?.admission?.context.observer.header.hash).toBe("H122");
 const groups=groupsFor(store.rawOperations(),current.rights,123);expect(groups.find(group=>group.admission?.headHash==="HFork")?.pre.size).toBe(1);
 expect(groups.find(group=>group.admission?.headHash==="H122")?.pre.size).toBe(0);expect(store.rawOperations()).toHaveLength(2);
});

it("rejects pre-pause proof at the same source/head after a fresh collection generation",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),target=store.addOperations([operation()])[0]?.target;if(!target)throw new Error("Fixture missing");
 const old=await new NetworkData("mainnet").reconcile(target,new AbortController().signal);store.stop();store.start();
 expect(()=>store.accept(old)).toThrow("obsolete");expect(store.unresolvedTargets()).toHaveLength(1);expect(store.rawOperations()[0]?.admission).toBeUndefined();
});
it("records an actually read B head independently of the displayed A head",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet);store.observeHead({...head(120),evidence:evidence(a)});
 const target=store.addOperations([operation()])[0]?.target;if(!target)throw new Error("Fixture missing");
 store.accept(await new NetworkData("mainnet").reconcile(target,new AbortController().signal));
 expect(store.observerHead(b)?.hash).toBe("H122");expect(store.observerHead(a)?.hash).toBe("H120");
});
