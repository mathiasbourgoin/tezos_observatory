import {describe, expect, it} from "vitest";
import {OperationStore} from "../../src/rpc/operationStore";

describe("OperationStore", () => {
  it("deduplicates hashes and expires stale operations", () => {
    const store = new OperationStore(10, 100);
    const operation = {hash: "op1", contents: []} as const;
    expect(store.add([operation, operation], 0)).toBe(1);
    expect(store.values(50)).toHaveLength(1);
    expect(store.values(101)).toHaveLength(0);
  });
});

it("replay cannot renew first-receipt TTL or overwrite original immutable evidence",()=>{
 const store=new OperationStore(10,100);const original={hash:"same",contents:[]} as const;
 store.add([original],0);store.add([{hash:"same",contents:[{kind:"attestation",level:1,round:0,slot:0}]}],90);
 expect(store.values(90)).toEqual([original]);expect(store.values(101)).toEqual([]);
});
