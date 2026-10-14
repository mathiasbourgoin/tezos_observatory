import {describe,expect,it} from "vitest";
import type {NextOpportunitiesModel} from "../../src/view/nextOpportunities";

describe("NextOpportunitiesModel",()=>{
  it.each(["mainnet","shadownet"] as const)("supports %s with observed/theoretical split",network=>{
    const model:NextOpportunitiesModel={network,state:"ready",observedRound:2,theoreticalRound:8,
      sameLevel:{level:100,round:9,bakers:[{delegate:"tz1same",alias:"Same baker"}]},
      nextLevelRoundZero:{level:101,round:0,bakers:[{delegate:"tz1next",alias:"Next baker"}]}};
    expect(model.observedRound).not.toBe(model.theoreticalRound);
    expect(model.sameLevel?.round).toBe(9);
    expect(model.nextLevelRoundZero?.round).toBe(0);
  });

  it("represents loading separately from unavailable",()=>{
    const model:NextOpportunitiesModel={network:"mainnet",state:"loading",observedRound:null,
      theoreticalRound:null,sameLevel:null,nextLevelRoundZero:null};
    expect(model.state).toBe("loading");
  });
});
