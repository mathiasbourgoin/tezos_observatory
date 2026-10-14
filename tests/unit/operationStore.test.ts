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

it("keeps distinct immutable head-context receipts for an operation without renewing replay",()=>{
 const store=new OperationStore(10000,Infinity);
 const observed=(observedHeadHash:string)=>({hash:"same",contents:[],evidence:{source:{network:"mainnet" as const,name:"A",baseUrl:"A"},observedHeadHash,receivedAt:1,receivedMonotonic:1}});
 store.add([observed("H1")],1);store.add([observed("H2")],2);store.add([observed("H1")],3);
 expect(store.values(3)).toHaveLength(2);expect(store.values(3).map(value=>value.evidence?.observedHeadHash)).toEqual(["H1","H2"]);
 expect(store.values(3)[0]?.evidence?.receivedMonotonic).toBe(1);
});
