import {afterEach,expect,it,vi} from "vitest";
import {ObservationStore} from "../../src/monitor/observationStore";
import {NetworkData,sources,type Derived} from "../../src/rpc/networkData";
import {asOperationBatch} from "../../src/rpc/guards";
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


it("rejects supplied contradictory execution protocol in source-local reconciliation",async()=>{
 installRpc();await expect(new NetworkData("mainnet").reconcile({source:b,level:123,round:0,payload:"P",protocolHash:"WrongExecutionProtocol"},new AbortController().signal)).rejects.toThrow("protocol");
});
it("does not let omitted lifecycle epochs restore authority after pause",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),target=store.addOperations([operation()])[0]?.target;if(!target)throw new Error("Fixture missing");
 const proof=await new NetworkData("mainnet").reconcile(target,new AbortController().signal),{observerGeneration:ignoredObserver,collectionGeneration:ignoredCollection,...untagged}=proof;store.stop();store.start();
 expect(()=>store.accept(untagged)).toThrow("generation");
});
it("rejects contradictory constants context despite an equal opaque key",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),target=store.addOperations([operation()])[0]?.target;if(!target)throw new Error("Fixture missing");
 const proof=await new NetworkData("mainnet").reconcile(target,new AbortController().signal);
 expect(()=>store.accept({...proof,constants:{...proof.constants,context:{...proof.context,protocolHash:"WrongProtocol"}}})).toThrow("context");
});


it.each(["parent","protocol","anchor-source","anchor-header","observer-chain","anchor-chain"])("rejects internally contradictory %s facts even when all records share one key",async(kind)=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),target=store.addOperations([operation()])[0]?.target;if(!target)throw new Error("Fixture missing");
 const proof=await new NetworkData("mainnet").reconcile(target,new AbortController().signal);
 let context=kind==="parent"?{...proof.context,observer:{...proof.context.observer,header:{...proof.context.observer.header,predecessor:"WrongParent"}}}:kind==="protocol"?{...proof.context,protocolHash:"WrongExecutionProtocol"}:{...proof.context,anchor:{...proof.context.anchor,source:{...b,network:"shadownet" as const}}};
 if(kind==="anchor-header")context={...proof.context,anchor:{...proof.context.anchor,header:{...proof.context.anchor.header,predecessor:"WrongParent"}}};
 if(kind==="observer-chain")context={...proof.context,observer:{...proof.context.observer,header:{...proof.context.observer.header,chainId:"WrongChain"}}};
 if(kind==="anchor-chain")context={...proof.context,anchor:{...proof.context.anchor,header:{...proof.context.anchor.header,chainId:"WrongChain"}}};
 expect(()=>store.accept({...proof,context,rights:proof.rights.map(right=>({...right,context})),constants:{...proof.constants,context}})).toThrow("context");
});


it("keeps accepted candidates independent from the shared unresolved product",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),target=store.addOperations([operation()])[0]?.target;if(!target)throw new Error("Fixture missing");
 store.accept(await new NetworkData("mainnet").reconcile(target,new AbortController().signal));
 for(let index=0;index<101;index++){const hash=`Accepted${String(index).padStart(3,"0")}`;store.addCandidate({identity:hash,header:{...head(123),hash,payload_hash:"P"},evidence:evidence(b,1)});}
 const accepted=store.acceptedTargets().filter(record=>record.target.candidate);expect(accepted).toHaveLength(100);expect(accepted.some(record=>record.identity==="Accepted000")).toBe(false);
 for(let index=0;index<101;index++){const hash=`Unresolved${String(index).padStart(3,"0")}`;store.addCandidate({identity:hash,header:{...head(999999),hash,payload_hash:"Unknown"},evidence:evidence(b,2)});}
 expect(store.unresolvedTargets()).toHaveLength(100);expect(store.acceptedTargets().filter(record=>record.target.candidate)).toHaveLength(100);
 const original=accepted[0];if(!original?.target.candidate)throw new Error("Fixture missing");store.addCandidate({...original.target.candidate,evidence:evidence(b,999)});expect(store.target(original.identity)?.evidence.receivedMonotonic).toBe(1);
});


it("proves network identity from actual B context without requiring A availability",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),target=store.addOperations([operation()])[0]?.target;if(!target)throw new Error("Fixture missing");
 expect(store.acceptedTargets()).toHaveLength(0);expect(store.rawOperations()[0]?.admission).toBeUndefined();
 store.accept(await new NetworkData("mainnet").reconcile(target,new AbortController().signal));
 expect(store.acceptedTargets()).toHaveLength(1);expect(store.networkIdentity()?.chainId).toBe("NetFixture");expect(store.networkIdentity()?.source.baseUrl).toBe(b.baseUrl);
});


it("promotes a current-level validated candidate under the actual same-observer current head",async()=>{
 const current={...head(123),payload_hash:"P"};installRpc(current);
 const store=new ObservationStore<Derived>("mainnet",sources.mainnet);store.observeHead({...current,evidence:evidence(b)});
 const candidate={identity:"B-current-candidate",header:current,evidence:{...evidence(b),observedHeadHash:current.hash,observedHeadLevel:123}};
 const record=store.addCandidate(candidate);if(!record)throw new Error("Fixture target missing");
 const proof=await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal);store.accept(proof);
 expect(store.target(record.identity)?.admission).toBeDefined();expect(proof.context.observer.header.hash).toBe("H123");expect(proof.context.anchor.header.hash).toBe("H122");expect(proof.context.level).toBe(123);
 expect(store.target(record.identity)?.evidence).toBe(candidate.evidence);expect(store.observerHead(b)?.hash).toBe("H123");
});


it("does not borrow a different observer's current head for candidate reconciliation",async()=>{
 const current={...head(123),payload_hash:"P"};installRpc(current);
 const candidate={identity:"B-current-candidate",header:current,evidence:evidence(b)};
 await expect(new NetworkData("mainnet").reconcile({source:b,level:123,round:0,payload:"P",candidate,observerHead:{...current,evidence:evidence(a)}},new AbortController().signal)).rejects.toThrow("observer");
});



it("retains a coherent post-identity source snapshot as separate coverage rather than stream zero",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),record=store.addOperations([operation()])[0];if(!record)throw new Error("Fixture missing");
 const proof=await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal);
 const snapshot={contextBefore:proof.context,contextAfter:proof.context,evidence:evidence(b,2),startedMonotonic:2,operations:[],complete:true,reasons:[]};
 store.accept({...proof,snapshot} as typeof proof);
 const retained=store.target(record.identity) as unknown as {coverage?:typeof snapshot};
 expect(retained.coverage?.complete).toBe(true);expect(retained.coverage?.evidence.receivedMonotonic).toBe(2);
 store.stop();const interrupted=store.target(record.identity) as unknown as {coverage?:typeof snapshot;coverageStale?:boolean};
 expect(interrupted.coverageStale).toBe(true);expect(interrupted.coverage?.evidence.receivedMonotonic).toBe(2);
});


it("does not revive old snapshot completeness through cached admission or raw replay after interruption",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),record=store.addOperations([operation()])[0];if(!record)throw new Error("Fixture missing");
 const proof=await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal);
 const snapshot={contextBefore:proof.context,contextAfter:proof.context,evidence:evidence(b,2),startedMonotonic:2,operations:[],complete:true,reasons:[]};
 store.accept({...proof,snapshot});store.stop();store.start();store.addOperations([operation()]);store.accept({...proof,...store.generation(b),snapshot});
 expect(store.target(record.identity)?.coverageStale).toBe(true);expect(store.target(record.identity)?.coverage?.evidence.receivedMonotonic).toBe(2);
});


it("records exact accepted phase maxima and one crossing in the store before any rendering",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),record=store.addOperations([operation()])[0];if(!record)throw new Error("Fixture missing");
 const base=await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal),right=base.rights[1];if(!right)throw new Error("Fixture rights missing");
 const proof={...base,rights:[base.rights[0]!,{...right,power:1},{...right,address:"D3",slot:2,power:1}]};store.accept(proof);
 type Phase={maximumPower:number;quorumObserved:boolean;crossed:boolean};
 expect((store.target(record.identity) as unknown as {phases?:{pre?:Phase}})?.phases?.pre?.maximumPower).toBe(3);
 store.addOperations([{...operation("new"),evidence:evidence(b,3),contents:[{kind:"preattestation",level:123,round:0,slot:1,block_payload_hash:"P"}]}]);
 const phase=(store.target(record.identity) as unknown as {phases?:{pre?:Phase}})?.phases?.pre;
 expect(phase?.maximumPower).toBe(4);expect(phase?.crossed).toBe(true);expect(phase?.quorumObserved).toBe(true);
});


it("first authoritative quorum and numerical corrections never invent a crossing",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),record=store.addOperations([operation()])[0];if(!record)throw new Error("Fixture missing");
 const proof=await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal);store.accept(proof);
 const corrected={...proof,...store.generation(b),rights:proof.rights.map((right,index)=>({...right,power:index===0?4:1}))};store.accept(corrected);
 store.addOperations([{...operation("replayed-under-correction"),evidence:evidence(b,9)}]);
 expect(store.target(record.identity)?.phases?.pre?.maximumPower).toBe(4);expect(store.target(record.identity)?.phases?.pre?.crossed).toBe(false);expect(store.acceptedEvents().filter(event=>event.kind==="crossing")).toHaveLength(0);
 const initial=new ObservationStore<Derived>("mainnet",sources.mainnet),target=initial.addOperations([{...operation("initial-quorum"),contents:[...operation().contents,{kind:"preattestation",level:123,round:0,slot:1,block_payload_hash:"P"}]}])[0];if(!target)throw new Error("Fixture missing");
 initial.accept(await new NetworkData("mainnet").reconcile(target.target,new AbortController().signal));
 expect(initial.target(target.identity)?.phases?.pre?.maximumPower).toBe(5);expect(initial.target(target.identity)?.phases?.pre?.crossed).toBe(false);expect(initial.acceptedEvents().map(event=>event.kind)).toEqual(["observed-quorum"]);
});

it("bounds immutable events independently and never duplicates them through replay or shared candidates",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),first=store.addOperations([operation()])[0];if(!first)throw new Error("Fixture missing");
 store.accept(await new NetworkData("mainnet").reconcile(first.target,new AbortController().signal));
 for(let index=0;index<14;index++){
  const payload=`P${index}`,packet=(slot:number)=>({...operation(`${payload}-${slot}`),evidence:evidence(b,index*2+2+slot),contents:[{kind:"preattestation" as const,level:123,round:0,slot,block_payload_hash:payload}]});
  store.addOperations([packet(0)]);store.addOperations([packet(1)]);
 }
 const events=store.acceptedEvents();expect(events).toHaveLength(12);expect(events.every(event=>event.kind==="crossing"&&event.power===5&&event.attribution==="payload-shared")).toBe(true);
 const original=events.at(-1);store.addOperations([{...operation("duplicate-last"),contents:[{kind:"preattestation",level:123,round:0,slot:1,block_payload_hash:"P13"}]}]);store.stop();store.start();
 for(const identity of ["shared-candidate-one","shared-candidate-two"])store.addCandidate({identity,header:{...head(123),payload_hash:"P13"},evidence:evidence(b,99)});
 expect(store.acceptedEvents()).toEqual(events);expect(store.acceptedEvents().at(-1)).toBe(original);expect(original?.evidence.receivedMonotonic).toBe(29);
});

it("keeps group floods bounded by retained owners and qualifies lost crossing history",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),first=store.addOperations([operation()])[0];if(!first)throw new Error("Fixture missing");store.accept(await new NetworkData("mainnet").reconcile(first.target,new AbortController().signal));
 store.addOperations(Array.from({length:1000},(_,index)=>({...operation(`flood-${index}`),evidence:evidence(b,index+2),contents:[{kind:"preattestation",level:123,round:0,slot:0,block_payload_hash:`Payload${index}`}]})));
 expect(store.acceptedTargets()).toHaveLength(150);expect(store.crossingState().retained).toBeLessThanOrEqual(500);expect(store.crossingState().uncertain).toBe(true);expect(store.acceptedEvents()).toHaveLength(0);
});

it.each([false,true])("does not recreate a forgotten crossing after proven reorg return (original crossed=%s)",async crossed=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),first=store.addOperations([operation()])[0];if(!first)throw new Error("Fixture missing");store.accept(await new NetworkData("mainnet").reconcile(first.target,new AbortController().signal));
 if(crossed)store.addOperations([{...operation("original-threshold"),evidence:evidence(b,2),contents:[{kind:"preattestation",level:123,round:0,slot:1,block_payload_hash:"P"}]}]);
 const originalCrossings=store.acceptedEvents().filter(event=>event.kind==="crossing").length;
 store.addOperations(Array.from({length:151},(_,index)=>({...operation(`retire-${index}`),evidence:evidence(b,index+3),contents:[{kind:"preattestation",level:123,round:0,slot:0,block_payload_hash:`Retire${index}`}]})));
 expect(store.target(first.identity)).toBeUndefined();expect(store.crossingState().uncertain).toBe(true);
 const fork={...head(122),hash:"Fork122",evidence:evidence(b,200)};store.observeHead(fork);installRpc(fork);
 const forkRecord=store.addOperations([{...operation("fork"),evidence:{...evidence(b,201),observedHeadHash:fork.hash,observedHeadLevel:122},contents:[{kind:"preattestation",level:123,round:0,slot:0,block_payload_hash:"ForkPayload"}]}])[0];if(!forkRecord)throw new Error("Fixture missing");store.accept(await new NetworkData("mainnet").reconcile(forkRecord.target,new AbortController().signal));
 store.observeHead({...head(122),evidence:evidence(b,300)});installRpc();
 const returning=store.addOperations([{...operation("return-below"),evidence:{...evidence(b,301),observedHeadHash:"H122",observedHeadLevel:122}}])[0];if(!returning)throw new Error("Fixture missing");store.accept(await new NetworkData("mainnet").reconcile(returning.target,new AbortController().signal));
 store.addOperations([{...operation("return-threshold"),evidence:{...evidence(b,302),observedHeadHash:"H122",observedHeadLevel:122},contents:[{kind:"preattestation",level:123,round:0,slot:1,block_payload_hash:"P"}]}]);
 expect(store.acceptedEvents().filter(event=>event.kind==="crossing")).toHaveLength(originalCrossings);expect(store.target(returning.identity)?.phases?.pre?.uncertain).toBe(true);
});


it("withdraws live completeness on a failed new source snapshot while retaining the old timestamped zero",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),record=store.addOperations([operation()])[0];if(!record)throw new Error("Fixture missing");
 const proof=await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal),snapshot={contextBefore:proof.context,contextAfter:proof.context,evidence:evidence(b,2),startedMonotonic:2,operations:[],complete:true,reasons:[]};store.accept({...proof,snapshot});
 store.accept({...proof,...store.generation(b),snapshotError:"Pending snapshot body failed"} as typeof proof);
 expect(store.target(record.identity)?.coverageStale).toBe(true);expect(store.target(record.identity)?.coverage?.evidence.receivedMonotonic).toBe(2);expect(store.target(record.identity)?.phases?.att?.maximumPower).toBe(0);
 expect((store.target(record.identity)?.coverage as unknown as {operations?:unknown})?.operations).toBeUndefined();expect(store.target(record.identity)?.admission?.snapshot).toBeUndefined();
});


it("binds a permitted 10000-operation same-payload snapshot without duplicate power receipt or events",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),first=store.addOperations([operation()])[0];if(!first)throw new Error("Fixture missing");store.accept(await new NetworkData("mainnet").reconcile(first.target,new AbortController().signal));
 store.addOperations(Array.from({length:10000},(_,index)=>({...operation(`same-payload-${index}`),evidence:evidence(b,index+2)})));
 expect(store.rawOperations()).toHaveLength(10000);expect(store.acceptedTargets()).toHaveLength(1);expect(store.target(first.identity)?.evidence.receivedMonotonic).toBe(1);expect(store.target(first.identity)?.phases?.pre?.maximumPower).toBe(3);expect(store.target(first.identity)?.phases?.pre?.evidence.receivedMonotonic).toBe(1);expect(store.acceptedEvents()).toHaveLength(0);
 const proof=store.target(first.identity)?.admission;if(!proof)throw new Error("Fixture proof missing");const group=groupsFor(store.rawOperations(),proof.rights,123)[0];expect(group?.pre.size).toBe(1);expect(signerPower(group?.pre??new Set(),proof.rights)).toBe(3);expect(store.crossingState().retained).toBe(1);
});


it("uses complete-body receipt rather than request start to order a coherent post-identity snapshot",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),record=store.addOperations([operation()])[0];if(!record)throw new Error("Fixture missing");
 const proof=await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal),snapshot={contextBefore:proof.context,contextAfter:proof.context,evidence:evidence(b,2),startedMonotonic:0,operations:[],complete:true,reasons:[]};store.accept({...proof,snapshot});
 expect(store.target(record.identity)?.coverage?.complete).toBe(true);expect(store.target(record.identity)?.coverage?.startedMonotonic).toBe(0);expect(store.target(record.identity)?.coverage?.evidence.receivedMonotonic).toBe(2);expect(store.target(record.identity)?.phases?.att?.power).toBe(0);
});


it("withdraws complete coverage when its supporting raw vote is evicted",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),record=store.addOperations([operation()])[0]!;
 const proof=await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal),packet={...operation(),evidence:evidence(b,2)};
 const snapshot={contextBefore:proof.context,contextAfter:proof.context,evidence:packet.evidence,startedMonotonic:2,operations:[packet],complete:true,reasons:[]};
 store.accept({...proof,snapshot});expect(store.target(record.identity)?.coverage?.complete).toBe(true);expect(store.target(record.identity)?.phases?.pre?.power).toBe(3);
 store.addOperations(Array.from({length:10000},(_,index)=>({hash:`unrelated-${index}`,evidence:evidence(b,index+3),contents:[]})));
 expect(store.rawOperations().some(value=>value.hash==="op")).toBe(false);const retained=store.target(record.identity)!;
 expect(retained.coverageStale===true||retained.coverage?.complete===false).toBe(true);expect(retained.coverage?.evidence).toBe(snapshot.evidence);expect(retained.phases?.pre?.maximumPower).toBe(3);expect(retained.phases?.pre?.power).not.toBe(0);
});

it("does not duplicate a retained observed-quorum event after its phase owner retires",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),base=operation("first-quorum"),initial={...base,contents:[...base.contents,{...base.contents[0]!,slot:1}]};
 const record=store.addOperations([initial])[0]!;store.accept(await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal));const original=store.acceptedEvents()[0]!;expect(original.kind).toBe("observed-quorum");
 store.addOperations(Array.from({length:151},(_,index)=>({...operation(`retire-${index}`),contents:[{...base.contents[0]!,block_payload_hash:`Retire${index}`}]})));expect(store.acceptedEvents()).toEqual([original]);
 store.addOperations([{...initial,hash:"return-quorum",evidence:{...evidence(b,200),observedHeadHash:"H122",observedHeadLevel:122}}]);
 expect(store.acceptedEvents().filter(event=>event.identity===original.identity)).toHaveLength(1);expect(store.acceptedEvents()[0]).toBe(original);
});

it("reuses the canonical first receipt when a coherent unpinned snapshot repeats a proven observed packet",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet);store.observeHead({...head(122),evidence:evidence(b)});
 const original={...operation(),evidence:{...evidence(b),observedHeadHash:"H122",observedHeadLevel:122}},record=store.addOperations([original])[0]!;
 const proof=await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal);store.accept(proof);
 const packet={...operation(),evidence:evidence(b,2)},snapshot={contextBefore:proof.context,contextAfter:proof.context,evidence:packet.evidence,startedMonotonic:2,operations:[packet],complete:true,reasons:[]};
 store.accept({...proof,...store.generation(b),snapshot});expect(store.rawOperations()).toHaveLength(1);expect(store.rawOperations()[0]?.evidence).toBe(original.evidence);expect(store.target(record.identity)?.coverage?.evidence.requestedHeadHash).toBeUndefined();expect(store.target(record.identity)?.coverage?.complete).toBe(true);
});

it("retains a malformed mixed operation raw identity without admitting its otherwise-quorate valid portion",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),seed=store.addOperations([operation("seed")])[0]!;const proof=await new NetworkData("mainnet").reconcile(seed.target,new AbortController().signal);store.accept(proof);
 for(const payload of [undefined,""]){const packet=asOperationBatch([{hash:`malformed-${String(payload)}`,branch:"OriginalBranch",contents:[{kind:"preattestation",level:123,round:0,slot:0,block_payload_hash:"Other"},{kind:"preattestation",level:123,round:0,slot:1,block_payload_hash:"Other"},{kind:"attestation",level:123,round:0,slot:1,...(payload===undefined?{}:{block_payload_hash:payload})}]}]).map(value=>({...value,evidence:evidence(b)}));store.addOperations(packet);}
 expect(store.rawOperations().filter(value=>value.hash.startsWith("malformed-")).every(value=>value.branch==="OriginalBranch"&&value.contents.length===0)).toBe(true);expect(groupsFor(store.rawOperations(),proof.rights,123).some(group=>group.payload==="Other")).toBe(false);expect(store.acceptedEvents()).toHaveLength(0);
});

it("does not suppress a first genuine crossing after only unrelated raw facts were evicted",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet);store.addOperations([{hash:"unrelated-first",evidence:evidence(b),contents:[]}]);store.addOperations(Array.from({length:10000},(_,index)=>({hash:`unrelated-new-${index}`,evidence:evidence(b,index+2),contents:[]})));
 const below={...operation("fresh-below"),evidence:evidence(b,20000)},record=store.addOperations([below])[0]!;store.accept(await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal));store.addOperations([{...operation("fresh-quorum"),evidence:evidence(b,20001),contents:[{...below.contents[0]!,slot:1}]}]);
 expect(store.acceptedEvents().filter(event=>event.kind==="crossing")).toHaveLength(1);expect(store.target(record.identity)?.phases?.pre?.maximumPower).toBe(5);
});

it("retains a bounded idempotent coverage reason when supporting votes are repeatedly evicted",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),base=operation(),record=store.addOperations([base])[0]!,proof=await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal),packet={...base,evidence:evidence(b,2)};
 store.accept({...proof,snapshot:{contextBefore:proof.context,contextAfter:proof.context,evidence:packet.evidence,startedMonotonic:2,operations:[packet],complete:true,reasons:[]}});
 store.addOperations(Array.from({length:10000},(_,index)=>({...base,hash:`support-${index}`,evidence:evidence(b,index+3)})));
 for(let index=0;index<3;index++)store.addOperations([{...base,hash:`later-support-${index}`,evidence:evidence(b,index+20000)}]);
 const coverage=store.target(record.identity)?.coverage;expect(coverage?.reasons.length).toBe(new Set(coverage?.reasons).size);expect(coverage?.reasons).toEqual(["Supporting snapshot consensus facts evicted"]);expect(coverage?.evidence).toBe(packet.evidence);expect(coverage?.complete).toBe(false);
});

it("does not infer a lost crossing history from never-admitted ahead raw consensus",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet);store.addOperations([operation("never-admitted",999)]);store.addOperations(Array.from({length:10000},(_,index)=>({hash:`unrelated-ahead-${index}`,evidence:evidence(b,index+2),contents:[]})));
 const below={...operation("fresh-known-below"),evidence:evidence(b,20000)},record=store.addOperations([below])[0]!;store.accept(await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal));store.addOperations([{...operation("fresh-known-quorum"),evidence:evidence(b,20001),contents:[{...below.contents[0]!,slot:1}]}]);expect(store.acceptedEvents().filter(event=>event.kind==="crossing")).toHaveLength(1);
});
