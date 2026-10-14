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
