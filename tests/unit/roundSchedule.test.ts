import { describe, expect, it } from "vitest";
import { roundSchedule, proposalRound, tenderbakeFitness, conditionalRoundBoundary, protocolRoundStart } from "../../src/consensus/roundSchedule";

describe("Tenderbake schedule", () => {
  it("advances on the exact boundary and uses cumulative durations", () => {
    expect(roundSchedule(1000, 6, 3, 6999).round).toBe(0);
    expect(roundSchedule(1000, 6, 3, 7000)).toEqual({
      round: 1,
      startedAt: 7000,
      endsAt: 16000,
    });
    const start121 = 1000 + (121 * 6 + (3 * 121 * 120) / 2) * 1000;
    expect(roundSchedule(1000, 6, 3, start121).round).toBe(121);
    expect(roundSchedule(1000, 6, 3, start121).endsAt - start121).toBe(369000);
  });
  it("supports a zero increment and a future round-zero boundary", () => {
    expect(roundSchedule(1000, 6, 0, 13000).round).toBe(2);
    expect(roundSchedule(1000, 6, 3, 0).startedAt).toBe(1000);
  });
});

it("keeps malformed legacy and negative encoded rounds unknown rather than inventing zero",()=>{
 const fitness=["02","00000078","","ffffffff","00000000"];
 expect(proposalRound(fitness)).toBe(0);expect(proposalRound([...fitness.slice(0,4),"7fffffff"])).toBe(2147483647);
 for(const value of [[],["00","00000078","","ffffffff","00000000"],[...fitness.slice(0,4),"ffffffff"],[...fitness.slice(0,4),"80000000"],[...fitness.slice(0,4),"xyz"]])expect(proposalRound(value)).toBeUndefined();
});

it("validates complete Tenderbake level lock and predecessor encodings",()=>{
 const valid=["02","00000078","00000001","fffffffe","00000002"];
 expect(tenderbakeFitness(valid,120)).toEqual({level:120,lockedRound:1,predecessorRound:1,round:2});
 expect(tenderbakeFitness(valid,121)).toBeUndefined();
 for(const fitness of [["02","00000078","00000002","ffffffff","00000002"],["02","00000078","","00000000","00000000"],["02","00000078","","ffffffff","0000000"],["02","80000000","","ffffffff","00000000"]])expect(tenderbakeFitness(fitness)).toBeUndefined();
});


it('uses selected observed round rather than an elapsed clock estimate for independent conditional branches',()=>{
 const reference={referenceTimestamp:27000,referenceRound:2,roundBasis:'proven' as const};
 expect(conditionalRoundBoundary({...reference,branch:'same-level',minimum:6,increment:3})).toBe(39000);
 expect(conditionalRoundBoundary({...reference,branch:'next-level',minimum:10,increment:4})).toBe(45000);
 // The successor execution durations govern its predecessor-round term too.
 expect(conditionalRoundBoundary({...reference,branch:'next-level',minimum:6,increment:3})).toBe(39000);
});
it('leaves unsupported migration and unsafe timing unknown without fabricating round zero',()=>{
 const reference={referenceTimestamp:27000,referenceRound:2,branch:'next-level' as const,minimum:10,increment:4,roundBasis:'proven' as const};
 expect(conditionalRoundBoundary({...reference,roundBasis:'unknown'})).toBeUndefined();
 for(const changed of [{referenceRound:-1},{referenceRound:2147483648},{minimum:0},{increment:-1},{referenceTimestamp:NaN},{minimum:Number.MAX_SAFE_INTEGER},{referenceTimestamp:8640000000000000}])expect(conditionalRoundBoundary({...reference,...changed})).toBeUndefined();
});


it('derives a hypothetical selected round using target execution durations in both protocol terms',()=>{
 const predecessor={referenceTimestamp:0,referenceRound:2,targetRound:2,roundBasis:'proven' as const};
 expect(protocolRoundStart({...predecessor,minimum:6,increment:3})).toBe(27000);
 expect(protocolRoundStart({...predecessor,minimum:10,increment:4})).toBe(42000);
 expect(protocolRoundStart({...predecessor,targetRound:0,minimum:6,increment:3})).toBe(12000);
 expect(protocolRoundStart({...predecessor,minimum:6,increment:3,roundBasis:'unknown'})).toBeUndefined();
});
