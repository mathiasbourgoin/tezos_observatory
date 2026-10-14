import { describe, expect, it } from "vitest";
import { asBlockHeader, asOperationBatch, asValidatedProposal } from "../../src/rpc/guards";

it("flattens a validated block shell header and rejects malformed wrappers", () => {
  const header = {
    level: 10,
    predecessor: "B9",
    timestamp: "2026-10-14T00:00:00Z",
    fitness: ["02", "0000000a", "", "ffffffff", "00000002"],
    protocol_data: "00",
  };
  expect(
    asValidatedProposal({ chain_id: "NetXdQprcVkpaWU", hash: "B10", header }),
  ).toEqual({
    level: 10,
    hash: "B10",
    chainId: "NetXdQprcVkpaWU",
    predecessor: "B9",
    timestamp: header.timestamp,
    fitness: header.fitness,
  });
  expect(() => asValidatedProposal({ hash: "B10", header })).toThrow(
    "Invalid validated block",
  );
  expect(() =>
    asValidatedProposal({
      chain_id: "NetXdQprcVkpaWU",
      hash: "B10",
      header: {},
    }),
  ).toThrow("Invalid block header");
});

const consensus = {
  level: 15372240,
  round: 0,
  block_payload_hash: "vhPayload",
};

describe("consensus operation guards", () => {
  it("expands aggregate signer slots while retaining one operation hash", () => {
    expect(
      asOperationBatch([
        {
          hash: "opPre",
          contents: [
            {
              kind: "preattestations_aggregate",
              consensus_content: consensus,
              committee: [0, 10],
            },
          ],
        },
        {
          hash: "opAtt",
          contents: [
            {
              kind: "attestations_aggregate",
              consensus_content: consensus,
              committee: [{ slot: 10, dal_attestation: "0" }, { slot: 20 }],
            },
          ],
        },
      ]),
    ).toEqual([
      {
        hash: "opPre",
        contents: [
          { kind: "preattestation", ...consensus, slot: 0 },
          { kind: "preattestation", ...consensus, slot: 10 },
        ],
      },
      {
        hash: "opAtt",
        contents: [
          { kind: "attestation", ...consensus, slot: 10 },
          { kind: "attestation", ...consensus, slot: 20 },
        ],
      },
    ]);
  });

  it("preserves individual consensus forms and ignores unrelated manager operations", () => {
    const contents = [
      { kind: "preattestation", ...consensus, slot: 0 },
      { kind: "attestation", ...consensus, slot: 1 },
      { kind: "attestation_with_dal", ...consensus, slot: 2 },
    ];
    expect(
      asOperationBatch([
        { hash: "op", contents: [...contents, { kind: "transaction" }] },
      ]),
    ).toEqual([{ hash: "op", contents }]);
  });

  it("rejects invalid numeric fields and malformed aggregate committee entries", () => {
    const malformed = [
      { kind: "preattestation", ...consensus, level: -1, slot: 0 },
      { kind: "attestation", ...consensus, round: 0.5, slot: 0 },
      { kind: "attestation_with_dal", ...consensus, slot: Number.NaN },
      {
        kind: "preattestations_aggregate",
        consensus_content: { ...consensus, level: Number.MAX_SAFE_INTEGER + 1 },
        committee: [0],
      },
      {
        kind: "attestations_aggregate",
        consensus_content: { ...consensus, round: -1 },
        committee: [{ slot: 0 }],
      },
      {
        kind: "preattestations_aggregate",
        consensus_content: consensus,
        committee: ["0", -1, 0.5, Infinity, {}],
      },
      {
        kind: "attestations_aggregate",
        consensus_content: consensus,
        committee: [1, { slot: -1 }, { slot: "1" }, null],
      },
      {
        kind: "attestations_aggregate",
        consensus_content: consensus,
        committee: null,
      },
      {
        kind: "preattestations_aggregate",
        consensus_content: null,
        committee: [0],
      },
    ];
    expect(
      asOperationBatch([{ hash: "invalid", contents: malformed }]),
    ).toEqual([{ hash: "invalid", contents: [] }]);
  });
});

 it("rejects whole mixed malformed aggregate rather than counting valid members", () => {
   expect(asOperationBatch([{hash:"mixed",contents:[{kind:"preattestations_aggregate",consensus_content:consensus,committee:[0,-1,10]}]}])).toEqual([{hash:"mixed",contents:[]}]);
 });
 it("rejects invalid applied integers and calendar timestamps while accepting offsets", () => {
   const h={level:120,hash:"H",predecessor:"Parent",timestamp:"2026-10-14T12:00:00+02:00",fitness:[]};
   expect(asBlockHeader(h).timestamp).toBe(h.timestamp);
   for(const timestamp of ["2026-02-30T12:00:00Z","2026-10-14T12:00:00","2026-13-01T00:00:00Z"])
     expect(()=>asBlockHeader({...h,timestamp})).toThrow();
   for(const level of [-1,0.5,Infinity,Number.MAX_SAFE_INTEGER+1])expect(()=>asBlockHeader({...h,level})).toThrow();
 });

it("preserves the RPC operation branch as a raw anchor without fabricating one",()=>{
 const parsed=asOperationBatch([{hash:"anchored",branch:"BOriginalBranch",contents:[{kind:"preattestation",...consensus,slot:0}]}]);
 expect((parsed[0] as unknown as {branch?:string})?.branch).toBe("BOriginalBranch");
 expect((asOperationBatch([{hash:"unanchored",contents:[{kind:"preattestation",...consensus,slot:0}]}])[0] as unknown as {branch?:string})?.branch).toBeUndefined();
});
