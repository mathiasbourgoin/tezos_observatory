import {afterEach,expect,it,vi} from "vitest";
import {ObservationStore} from "../../src/monitor/observationStore";
import {NetworkData,sources,type Derived} from "../../src/rpc/networkData";
import {asOperationBatch} from "../../src/rpc/guards";
import {groupsFor,signerPower} from "../../src/consensus/phaseEvidence";
import type {BlockHeader,ObservationEvidence,RpcSource} from "../../src/rpc/models";
import type {OpportunityFact} from "../../src/consensus/roundSchedule";
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

it("keeps historical candidate facts after active-index eviction without replay refreshing their first receipt",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet);
 const candidate=(index:number)=>({identity:`candidate-${String(index).padStart(3,"0")}`,header:{...head(123),hash:`C${index}`,payload_hash:`P${index}`},evidence:evidence(b,index+1)});
 const seed=store.addOperations([operation()])[0]!;store.accept(await new NetworkData("mainnet").reconcile(seed.target,new AbortController().signal));
 const first=store.addCandidate(candidate(0))!;
 for(let index=1;index<101;index++)store.addCandidate(candidate(index));
 expect(store.acceptedTargets().filter(record=>record.target.candidate)).toHaveLength(100);
 expect(store.acceptedTargets().some(record=>record.identity===first.identity)).toBe(false);
 const historical=store.target(first.identity);expect(historical?.target.candidate?.header.hash).toBe("C0");expect(historical?.evidence.receivedMonotonic).toBe(1);expect(historical?.admission?.context.observer.header.hash).toBe("H122");
 store.addCandidate({...candidate(0),evidence:evidence(b,999)});expect(store.target(first.identity)?.evidence.receivedMonotonic).toBe(1);
});

it("enriches a retained pin through active eviction then freezes it on history eviction even when its identity returns",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),base=operation(),seed=store.addOperations([base])[0]!;store.accept(await new NetworkData("mainnet").reconcile(seed.target,new AbortController().signal));
 const candidate=(index:number,payload="P")=>({identity:`pin-candidate-${index}`,header:{...head(123),hash:`Pinned${index}`,payload_hash:payload},evidence:evidence(b,index+1)});
 const first=store.addCandidate(candidate(0))!;expect(store.pin(first.identity)).toBe(true);
 for(let index=1;index<101;index++)store.addCandidate(candidate(index));
 let inspection=store.inspection();expect(inspection.frozen).toBe(false);expect(inspection.snapshot?.candidates).toHaveLength(100);expect(inspection.snapshot?.candidates.some(record=>record.identity===first.identity)).toBe(true);expect(inspection.snapshot?.partial).toBe(true);
 store.addOperations([{...base,hash:"late-second-signer",evidence:evidence(b,200),contents:[{...base.contents[0]!,slot:1}]}]);inspection=store.inspection();expect(inspection.selectedIdentity).toBe(first.identity);expect(inspection.snapshot?.record.phases?.pre?.maximumPower).toBe(5);expect(inspection.snapshot?.pre).toEqual(["D1","D2"]);
 for(let index=101;index<252;index++)store.addCandidate(candidate(index,`P${index}`));
 const frozen=store.inspection();expect(frozen.frozen).toBe(true);expect(frozen.snapshot?.record.phases?.pre?.maximumPower).toBe(5);
 expect(store.pin(first.identity)).toBe(true);expect(store.inspection()).toEqual(frozen);
 expect(store.pin("pin-candidate-100")).toBe(true);expect(store.inspection().snapshot).toBe(frozen.snapshot);expect(store.inspection().frozen).toBe(true);expect(store.inspection().selectedIdentity).toBe("pin-candidate-100");expect(store.history()).toHaveLength(150);expect(store.pin(first.identity)).toBe(true);
 store.addOperations([{...base,hash:"return-to-frozen",evidence:evidence(b,1000)}]);expect(store.inspection().snapshot===frozen.snapshot).toBe(true);expect(store.inspection().frozen).toBe(true);
 const replayed=store.addCandidate({...candidate(0),evidence:evidence(b,2000)})!;expect(replayed.evidence.receivedMonotonic).toBe(first.evidence.receivedMonotonic);
 expect(store.latest()).toBe(true);expect(store.inspection().snapshot).not.toBe(frozen.snapshot);
 expect(store.pin("pin-candidate-251")).toBe(true);expect(store.inspection().frozen).toBe(false);expect(store.inspection().snapshot).not.toBe(frozen.snapshot);
});

it("keeps a proven newer-arrival lower bound through retirement without counting uncertain replay as new",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),base=operation(),seed=store.addOperations([base])[0]!;store.accept(await new NetworkData("mainnet").reconcile(seed.target,new AbortController().signal));expect(store.pin(seed.identity)).toBe(true);
 const add=(index:number)=>store.addCandidate({identity:`newer-${index}`,header:{...head(123),hash:`Newer${index}`,payload_hash:`NewerPayload${index}`},evidence:evidence(b,index+2)});
 for(let index=0;index<151;index++)add(index);
 const count=store.inspection().newer;expect(count).toBeGreaterThanOrEqual(150);
 add(0);expect(store.inspection().newer).toBe(count);expect(store.inspection().newerPartial).toBe(true);
 const first=store.addCandidate({identity:"genuine-new-after-loss",header:{...head(123),hash:"GenuineNew",payload_hash:"GenuineNew"},evidence:evidence(b,999)});expect(first).toBeDefined();expect(store.inspection().newer).toBe(count);expect(store.inspection().newerPartial).toBe(true);
});

it("Latest and Follow select the newest actually active coherent candidate and expose unavailable after invalidation",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),seed=store.addOperations([operation()])[0]!;store.accept(await new NetworkData("mainnet").reconcile(seed.target,new AbortController().signal));
 for(let index=0;index<101;index++)store.addCandidate({identity:`live-${index}`,header:{...head(123),hash:`Live${index}`,payload_hash:"P"},evidence:evidence(b,index+2)});
 expect(store.latest()).toBe(true);expect(store.inspection().selectedIdentity).toBe("live-100");store.followLive();expect(store.inspection().selectedIdentity).toBe("live-100");
 store.observeHead({...head(122),hash:"Fork122",evidence:evidence(b,1000)});expect(store.latest()).toBe(false);expect(store.inspection().mode).toBe("follow");expect(store.inspection().snapshot).toBeUndefined();
});

it("bounds historical unique consensus facts across raw turnovers and preserves the committee of an earlier maximum",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),base=operation(),record=store.addOperations([base])[0]!,proof=await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal);store.accept(proof);
 const corrected={...proof,...store.generation(b),rights:proof.rights.map(right=>({...right,power:right.slot===0?2:3}))};store.accept(corrected);
 const initial=store.history()[0]!;expect(initial.record.phases?.pre?.maximumPower).toBe(3);expect(initial.maximumCommittees?.pre?.find(right=>right.address==="D1")?.power).toBe(3);expect(initial.committee.find(right=>right.address==="D1")?.power).toBe(2);
 for(let batch=0;batch<2;batch++)store.addOperations(Array.from({length:10000},(_,index)=>({...base,hash:`unknown-${batch}-${index}`,contents:[{...base.contents[0]!,slot:batch*10000+index+2}]})));
 const retained=store.history()[0]!;expect(retained.unknownSlots.length).toBeLessThanOrEqual(10000);expect(retained.partial).toBe(true);expect(retained.record.phases?.pre?.maximumPower).toBe(3);
});

it("does not publish complete candidate coverage through a partial historical instance",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),seed=store.addOperations([operation()])[0]!,proof=await new NetworkData("mainnet").reconcile(seed.target,new AbortController().signal);store.accept(proof);
 for(let index=0;index<101;index++)store.addCandidate({identity:`partial-${index}`,header:{...head(123),hash:`Partial${index}`,payload_hash:"P"},evidence:evidence(b,index+2)});
 const snapshot={contextBefore:proof.context,contextAfter:proof.context,evidence:evidence(b,500),startedMonotonic:500,operations:[],complete:true,reasons:[]};store.accept({...proof,...store.generation(b),snapshot});
 expect(store.history()[0]?.partial).toBe(true);expect(store.target("partial-100")?.coverage?.complete).toBe(false);expect(store.history()[0]?.candidates.every(candidate=>candidate.coverage?.complete!==true)).toBe(true);
});

it("bounds full candidate-only histories independently from accepted and unresolved indexes",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),seed=store.addOperations([operation()])[0]!;store.accept(await new NetworkData("mainnet").reconcile(seed.target,new AbortController().signal));
 for(let index=0;index<151;index++)store.addCandidate({identity:`bounded-${String(index).padStart(3,"0")}`,header:{...head(123),hash:`Bounded${index}`,payload_hash:`BoundedPayload${index}`},evidence:evidence(b,index+2)});
 expect(store.history()).toHaveLength(150);expect(store.acceptedTargets().filter(record=>record.target.candidate)).toHaveLength(100);expect(store.target("bounded-000")).toBeUndefined();expect(store.target("bounded-001")?.target.candidate?.header.hash).toBe("Bounded1");
 for(let index=0;index<101;index++)store.addCandidate({identity:`unknown-${index}`,header:{...head(2147483647),hash:`Unknown${index}`,payload_hash:`UnknownPayload${index}`},evidence:evidence(b,1000+index)});
 expect(store.unresolvedTargets()).toHaveLength(100);expect(store.history()).toHaveLength(150);expect(store.acceptedTargets().filter(record=>record.target.candidate)).toHaveLength(100);
});
it("uses the earliest original accepted receipt when delayed compatible evidence joins an existing full instance",async()=>{
 const current={...head(123),payload_hash:"P"};installRpc(current);const store=new ObservationStore<Derived>("mainnet",sources.mainnet);store.observeHead({...current,evidence:evidence(b)});
 const candidate={identity:"late-admitted-candidate",header:current,evidence:{...evidence(b,10),observedHeadHash:current.hash,observedHeadLevel:123}},record=store.addCandidate(candidate)!;store.accept(await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal));expect(store.history()[0]?.evidence.receivedMonotonic).toBe(10);
 store.addOperations([{...operation("early-body"),evidence:{...evidence(b,1),observedHeadHash:current.hash,observedHeadLevel:123}}]);expect(store.history()).toHaveLength(1);expect(store.history()[0]?.evidence.receivedMonotonic).toBe(1);expect(store.history()[0]?.candidates[0]?.evidence.receivedMonotonic).toBe(10);
});

it("does not reconstruct observed-quorum beside a retained crossing event for the same retired phase",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),base=operation(),record=store.addOperations([base])[0]!;store.accept(await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal));store.addOperations([{...base,hash:"cross-slot-1",contents:[{...base.contents[0]!,slot:1}]}]);const original=store.acceptedEvents()[0]!;expect(original.kind).toBe("crossing");
 store.addOperations(Array.from({length:151},(_,index)=>({...base,hash:`below-new-${index}`,evidence:evidence(b,index+2),contents:[{...base.contents[0]!,block_payload_hash:`Other${index}`}]})));store.addOperations([{...base,hash:"reconstructed-original",evidence:evidence(b,200),contents:[...base.contents,{...base.contents[0]!,slot:1}]}]);expect(store.acceptedEvents()).toHaveLength(1);expect(store.acceptedEvents()[0]===original).toBe(true);
});

 it("retains exact bounded session facts after a ten-thousand distinct-payload admission batch",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),seed=store.addOperations([operation()])[0]!;store.accept(await new NetworkData("mainnet").reconcile(seed.target,new AbortController().signal));
 const packets=Array.from({length:10000},(_,index)=>({...operation(`session-stress-${index}`),evidence:evidence(b,index+2),contents:[{kind:"preattestation" as const,level:123,round:0,slot:0,block_payload_hash:`Stress${index}`}]}));
 store.addOperations(packets);expect(store.rawOperations()).toHaveLength(10000);expect(store.history()).toHaveLength(150);expect(store.acceptedTargets()).toHaveLength(150);expect(store.unresolvedTargets()).toHaveLength(0);expect(store.acceptedEvents()).toHaveLength(0);expect(store.crossingState().retained).toBeLessThanOrEqual(500);
 const latest=store.history()[0]!;expect(latest.record.target.payload).toBe("Stress9999");expect(latest.evidence).toBe(packets[9999]!.evidence);expect(latest.record.phases?.pre?.power).toBe(3);expect(latest.record.phases?.pre?.maximumPower).toBe(3);expect(latest.currentPre).toEqual(["D1"]);expect(latest.record.admission?.context.observer.header.hash).toBe("H122");
 const original=store.rawOperations().at(-1)!;expect(original.evidence).toBe(packets[9999]!.evidence);expect(original.admission?.source.baseUrl).toBe(b.baseUrl);expect(original.evidence?.requestedHeadHash).toBeUndefined();
 });

it("does not count first candidate promotion of a pre-baseline pinned candidate-free unit as newer",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),record=store.addOperations([operation()])[0]!;store.accept(await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal));expect(store.pin(record.identity)).toBe(true);
 store.addCandidate({identity:"first-pinned-candidate",header:{...head(123),hash:"FirstPinnedCandidate",payload_hash:"P"},evidence:evidence(b,2)});
 expect(store.history()).toHaveLength(1);expect(store.inspection().newer).toBe(0);
 store.addCandidate({identity:"second-pinned-candidate",header:{...head(123),hash:"SecondPinnedCandidate",payload_hash:"P"},evidence:evidence(b,3)});expect(store.inspection().newer).toBe(1);
 store.addCandidate({identity:"first-pinned-candidate",header:{...head(123),hash:"FirstPinnedCandidate",payload_hash:"P"},evidence:evidence(b,4)});expect(store.inspection().newer).toBe(1);
});

it("Latest replaces a frozen copy when its same instance has a newer coherent active owner",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet),seed=store.addOperations([operation()])[0]!;store.accept(await new NetworkData("mainnet").reconcile(seed.target,new AbortController().signal));
 const first=store.addCandidate({identity:"frozen-latest-candidate",header:{...head(123),hash:"FrozenLatest",payload_hash:"FrozenLatestPayload"},evidence:evidence(b,1)})!;expect(store.pin(first.identity)).toBe(true);
 store.addOperations([{...operation("newer-live-owner"),evidence:evidence(b,10000),contents:[{kind:"preattestation",level:123,round:0,slot:0,block_payload_hash:"FrozenLatestPayload"}]}]);
 for(let index=0;index<151;index++)store.addCandidate({identity:`latest-retire-${index}`,header:{...head(123),hash:`LatestRetire${index}`,payload_hash:`LatestRetirePayload${index}`},evidence:evidence(b,index+2)});
 const frozen=store.inspection();expect(frozen.frozen).toBe(true);store.addOperations([{...operation("newer-live-second"),evidence:evidence(b,20000),contents:[{kind:"preattestation",level:123,round:0,slot:1,block_payload_hash:"FrozenLatestPayload"}]}]);expect(store.inspection().snapshot?.record.phases?.pre?.power).toBe(3);expect(store.latest()).toBe(true);expect(store.inspection().snapshot?.record.phases?.pre?.power).toBe(5);expect(store.inspection().snapshot?.record.target.payload).toBe("FrozenLatestPayload");
});

async function opportunityFixture(){
 const current={...head(123),payload_hash:'P',timestamp:new Date().toISOString()};installRpc(current);
 const originalFetch=globalThis.fetch;vi.stubGlobal('fetch',async(input:string|URL|Request,options?:RequestInit)=>{const url=new URL(String(input));if(url.pathname.includes('baking_rights'))return Response.json([{level:Number(url.searchParams.get('level')),round:Number(url.searchParams.get('max_round')),delegate:'DBaker'}]);return originalFetch(input,options);});
 const store=new ObservationStore<Derived>('mainnet',sources.mainnet),data=new NetworkData('mainnet');
 const observed={...current,evidence:evidence(b,1)};store.observeHead(observed);
 const record=store.addCandidate({identity:'opportunity-selected',header:current,evidence:evidence(b,1)})!;
 const proof=await data.reconcile({...record.target,observerHead:observed},new AbortController().signal);store.accept(proof);store.establishNetworkIdentity(proof.context.observer);
 const signal=new AbortController().signal,derived=await data.derive(proof.head,signal),rights=await Promise.all([data.bakers(proof.head,123,1,signal),data.bakers(proof.head,124,0,signal)]);
 const capturedAt=Date.parse(current.timestamp)+1000,capturedMonotonic=performance.now()+1000;
 const facts=rights.map((values,index):OpportunityFact=>{
  const right=values[0],parameters=derived.constantsByLevel.get(123+index);
  if(!right?.context||!right.evidence||!parameters?.context||!parameters.evidence)throw new Error('Missing actual opportunity fixture context');
  return {branch:index===0?'same-level':'next-level',level:123+index,round:index===0?1:0,condition:index===0?'Conditional on continued same-level production':'Earliest boundary conditional on hypothetical next-level production',capturedAt,capturedMonotonic,proposer:{state:'known',right:{...right,context:right.context,evidence:right.evidence}},timing:{state:'known',basis:'observed-selected',parameters:{...parameters,context:parameters.context,evidence:parameters.evidence},reference:current,referenceTimestamp:Date.parse(current.timestamp),referenceRound:0,deadline:Date.parse(current.timestamp)+6000,remainingAtCapture:5000}};
 }) as [OpportunityFact,OpportunityFact];
 const token=store.opportunityToken(record.identity);expect(token).toBeDefined();
 return {store,record,proof,current,facts,token:token!};
}

it('captures both exact opportunity branches without refreshing selected receipt history order or newer count',async()=>{
 const {store,record,facts,token}=await opportunityFixture();expect(store.pin(record.identity)).toBe(true);const before=store.inspection(),receipt=before.snapshot!.evidence;
 expect(store.captureOpportunities(record.identity,token,facts)).toBe(true);
 expect(store.target(record.identity)?.opportunities).toEqual(facts);expect(store.inspection().snapshot?.record.opportunities).toEqual(facts);
 expect(store.inspection().snapshot?.evidence).toBe(receipt);expect(store.inspection().newer).toBe(before.newer);expect(store.inspection().selectedIdentity).toBe(record.identity);
 expect(store.target(record.identity)?.opportunities?.map(fact=>fact.proposer.state==='known'?fact.proposer.right.evidence.source.baseUrl:undefined)).toEqual(facts.map(fact=>fact.proposer.state==='known'?fact.proposer.right.evidence.source.baseUrl:undefined));
});

it('rejects unrenderable opportunity capture dates without publishing historical facts',async()=>{
 const {store,record,facts,token}=await opportunityFixture();
 const invalid=facts.map(fact=>({...fact,capturedAt:Number.MAX_SAFE_INTEGER,timing:fact.timing.state==='known'?{...fact.timing,remainingAtCapture:0}:fact.timing})) as [OpportunityFact,OpportunityFact];
 expect(store.captureOpportunities(record.identity,token,invalid)).toBe(false);
 expect(store.target(record.identity)?.opportunities).toBeUndefined();
});

it.each(['rights-only','timing-only','neither'] as const)('captures independent %s branch availability without borrowing another branch fact',async availability=>{
 const {store,record,facts,token}=await opportunityFixture();const absent={state:'unavailable' as const,reason:'Not captured under this exact branch context'};
 const pair:[OpportunityFact,OpportunityFact]=[{...facts[0],...(availability==='timing-only'||availability==='neither'?{proposer:absent}:{}),...(availability==='rights-only'||availability==='neither'?{timing:absent}:{})},{...facts[1],proposer:absent,timing:absent}];
 expect(store.captureOpportunities(record.identity,token,pair)).toBe(true);expect(store.target(record.identity)?.opportunities).toEqual(pair);expect(store.target(record.identity)?.opportunities?.[1].timing.state).toBe('unavailable');
});

it('enriches retained opportunity history after active eviction and preserves one immutable frozen capture after history eviction',async()=>{
 const {store,record,facts,token,current}=await opportunityFixture();expect(store.pin(record.identity)).toBe(true);expect(store.captureOpportunities(record.identity,token,facts)).toBe(true);
 for(let index=0;index<101;index++)store.addCandidate({identity:`opportunity-active-${index}`,header:{...current,hash:`OpportunityActive${index}`},evidence:evidence(b,index+2)});
 expect(store.acceptedTargets().some(value=>value.identity===record.identity)).toBe(false);expect(store.inspection().frozen).toBe(false);
 const enriched=facts.map(fact=>({...fact,capturedAt:fact.capturedAt+1,capturedMonotonic:fact.capturedMonotonic+1,...(fact.timing.state==='known'?{timing:{...fact.timing,remainingAtCapture:4999}}:{})})) as [OpportunityFact,OpportunityFact];
 expect(store.captureOpportunities(record.identity,token,enriched)).toBe(true);expect(store.target(record.identity)?.opportunities).toEqual(enriched);
 for(let index=0;index<151;index++)store.addCandidate({identity:`opportunity-history-${index}`,header:{...current,hash:`OpportunityHistory${index}`,payload_hash:`HistoricalPayload${index}`},evidence:evidence(b,index+200)});
 const frozen=store.inspection();expect(frozen.frozen).toBe(true);const captured=frozen.snapshot!.candidates.find(value=>value.identity===record.identity)?.opportunities??frozen.snapshot!.record.opportunities;expect(captured).toEqual(enriched);
 expect(store.captureOpportunities(record.identity,token,facts)).toBe(false);expect(store.inspection().snapshot).toBe(frozen.snapshot);expect(captured).toEqual(enriched);
 const uncaptured=store.history().find(value=>value.record.target.payload==='HistoricalPayload150');expect(uncaptured?.record.opportunities).toBeUndefined();
});

it.each(['pause-resume','same-height-reorg'] as const)('rejects late opportunity capture after %s without historical live-fill',async change=>{
 const {store,record,facts,token,current}=await opportunityFixture();
 if(change==='pause-resume'){store.stop();store.start();}else store.observeHead({...current,hash:'OpportunityFork',evidence:evidence(b,100)});
 expect(store.captureOpportunities(record.identity,token,facts)).toBe(false);expect(store.target(record.identity)?.opportunities).toBeUndefined();
});

it.each(['level','round','source','timing-context','requested-anchor','unsafe-deadline','unsafe-remaining','unsafe-capture'] as const)('rejects contradictory %s opportunity facts at actual retained-store boundary',async kind=>{
 const {store,record,facts,token}=await opportunityFixture();const first=facts[0];if(first.proposer.state!=='known'||first.timing.state!=='known')throw new Error('Fixture branch is not proven');
 const bad:OpportunityFact=kind==='level'?{...first,level:124}:kind==='round'?{...first,round:2}:kind==='source'?{...first,proposer:{state:'known',right:{...first.proposer.right,evidence:{...first.proposer.right.evidence,source:{...b,baseUrl:'https://unconfigured.invalid'}}}}}:kind==='timing-context'?{...first,timing:{...first.timing,parameters:{...first.timing.parameters,context:{...first.timing.parameters.context,level:124}}}}:kind==='requested-anchor'?{...first,timing:{...first.timing,parameters:{...first.timing.parameters,evidence:{...first.timing.parameters.evidence,requestedHeadHash:'WrongAnchor'}}}}:kind==='unsafe-deadline'?{...first,timing:{...first.timing,deadline:Number.MAX_SAFE_INTEGER+1}}:kind==='unsafe-remaining'?{...first,timing:{...first.timing,remainingAtCapture:-1}}:{...first,capturedMonotonic:NaN};
 expect(store.captureOpportunities(record.identity,token,[bad,facts[1]])).toBe(false);expect(store.target(record.identity)?.opportunities).toBeUndefined();
});

it("independent whole review: retired observed quorum replay cannot append the same event again",async()=>{
 installRpc();const store=new ObservationStore<Derived>("mainnet",sources.mainnet);
 const packet=(hash:string,payload:string,at:number)=>({...operation(hash),evidence:evidence(b,at),contents:[0,1].map(slot=>({kind:"preattestation" as const,level:123,round:0,slot,block_payload_hash:payload}))});
 const original=packet("original-quorum","OriginalPayload",1),record=store.addOperations([original])[0];if(!record)throw new Error("Fixture missing");
 const proof=await new NetworkData("mainnet").reconcile(record.target,new AbortController().signal);store.accept(proof);
 const first=store.acceptedEvents().find(event=>event.payload==="OriginalPayload");expect(first?.kind).toBe("observed-quorum");
 for(let i=0;i<151;i++)store.addOperations([packet(`later-${i}`,`LaterPayload-${i}`,i+2)]);
 expect(store.history().some(snapshot=>snapshot.record.target.payload==="OriginalPayload")).toBe(false);
 expect(store.acceptedEvents().some(event=>event.payload==="OriginalPayload")).toBe(false);
 store.addOperations(Array.from({length:10000},(_,i)=>({hash:`unrelated-${i}`,evidence:evidence(b,i+1000),contents:[]})));
 expect(store.rawOperations().some(op=>op.hash==="original-quorum")).toBe(false);
 const replayed=store.addOperations([{...original,evidence:evidence(b,20000)}])[0]!;
 const phase=store.target(replayed.identity)?.phases?.pre;
 expect([phase?.power,phase?.maximumPower,phase?.threshold,phase?.quorumObserved,phase?.uncertain,phase?.evidence.receivedMonotonic]).toEqual([5,5,4,true,true,20000]);
 expect(phase?.evidence.source.baseUrl).toBe(b.baseUrl);
 expect(store.acceptedEvents().filter(event=>event.phaseIdentity===first!.phaseIdentity)).toHaveLength(0);
 expect(store.rawOperations().length).toBeLessThanOrEqual(10000);expect(store.history().length).toBeLessThanOrEqual(150);expect(store.crossingState().retained).toBeLessThanOrEqual(500);expect(store.acceptedEvents().length).toBeLessThanOrEqual(12);
});
