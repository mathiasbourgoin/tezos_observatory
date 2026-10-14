import {expect,it} from "vitest";
import {groupsFor} from "../../src/consensus/phaseEvidence";
const operation=(payload:string,slot:number,kind:"preattestation"|"attestation"="preattestation")=>({hash:`${payload}:${slot}:${kind}`,contents:[{kind,level:120,round:2,slot,block_payload_hash:payload}]});
const rights=[{address:"D1",slot:0,power:3},{address:"D2",slot:1,power:2}];
it("keeps competing payload delegate power separate and exposes conflicting delegates",()=>{
 const groups=groupsFor([operation("P",0),operation("P",0),operation("Q",0),operation("Q",1)],rights,120);
 expect(groups.find(g=>g.payload==="P")?.pre.size).toBe(1);expect(groups.find(g=>g.payload==="Q")?.pre.size).toBe(2);
 expect((groups.find(g=>g.payload==="P") as unknown as {conflicts:readonly string[]})?.conflicts).toEqual(["D1"]);
});
it("withdraws contradictory committee authority but preserves raw signer evidence",()=>{
 const groups=groupsFor([operation("P",0)],[...rights,{address:"D1",slot:2,power:4}],120);
 expect(groups[0]?.pre.size).toBe(0);
 expect((groups[0] as unknown as {unknownSlots:readonly number[]})?.unknownSlots).toEqual([0]);
});

it("separates identical payload evidence from different immutable observer contexts",()=>{
 const evidence=(source:string)=>({source:{network:"mainnet" as const,name:source,baseUrl:source},requestedHeadHash:"H",receivedAt:1,receivedMonotonic:1});
 const groups=groupsFor([{...operation("P",0),evidence:evidence("A")},{...operation("P",1),evidence:evidence("B")}],rights,120);
 expect(groups).toHaveLength(2);expect(groups[0]?.pre.size).toBe(1);expect(groups[1]?.pre.size).toBe(1);
});
