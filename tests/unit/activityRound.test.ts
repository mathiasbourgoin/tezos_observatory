import {describe,expect,it} from "vitest";
import {selectLatestActivity,type ConsensusActivity} from "../../src/consensus/activityRound";

describe("selectLatestActivity",()=>{
  it("shows latest observed activity independently from theoretical wall-clock round",()=>{
    const theoreticalRound=8;
    const groups:readonly ConsensusActivity[]=[
      {kind:"preattestation",level:101,round:1,payload:"vh1",operations:16,power:2_000},
      {kind:"preattestation",level:101,round:2,payload:"vh2",operations:24,power:6_000},
      {kind:"attestation",level:101,round:2,payload:"vh2",operations:24,power:6_000},
    ];
    const selected=selectLatestActivity(groups,101);
    expect(selected?.round).toBe(2);
    expect(selected?.preattestation?.operations).toBe(24);
    expect(selected?.attestation?.operations).toBe(24);
    expect(selected?.round).not.toBe(theoreticalRound);
  });

  it("does not invent zero gauges when the theoretical round has no activity",()=>{
    expect(selectLatestActivity([],101)).toBeNull();
  });
});
