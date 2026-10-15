import { describe, expect, it } from "vitest";
import {
  HeadGeneration,
  commitIfCurrent,
} from "../../src/monitor/headGeneration";
import type { BlockHeader } from "../../src/rpc/models";
import { proposalPlan } from "../../src/consensus/proposalPlan";

const head = (level: number): BlockHeader => ({
  level,
  hash: `B${level}`,
  predecessor: `B${level - 1}`,
  timestamp: "2026-10-14T00:00:00Z",
  fitness: [],
});

describe("HeadGeneration", () => {
  it("rejects a slow old scan after a new head transition", async () => {
    const state = new HeadGeneration<string>();
    const oldGeneration = state.transition(head(101));
    let finishOld: ((value: string) => void) | undefined;
    const oldWork = commitIfCurrent(
      state,
      oldGeneration,
      () =>
        new Promise((resolve) => {
          finishOld = resolve;
        }),
    );

    const newGeneration = state.transition(head(102));
    expect(newGeneration).toBe(oldGeneration + 1);
    state.commitDerived(newGeneration, "round 0");
    finishOld?.("round 4");

    await expect(oldWork).resolves.toBe(false);
    expect(state.snapshot()?.derived).toBe("round 0");
    expect(state.snapshot()?.head.level).toBe(102);
  });

  it("purges old-level operations atomically", () => {
    const state = new HeadGeneration<never>();
    const first = state.transition(head(10));
    state.addOperations(first, [
      {
        hash: "old",
        contents: [{ kind: "attestation", level: 10, round: 9, slot: 0 }],
      },
    ]);
    expect(state.snapshot()?.operations).toHaveLength(1);
    state.transition(head(11));
    expect(state.snapshot()?.operations).toHaveLength(0);
  });

  it("retains next-level votes across a head transition and excludes obsolete levels", () => {
    const state = new HeadGeneration<never>();
    const first = state.transition(head(10));
    state.addOperations(
      first,
      [9, 10, 11, 12].map((level) => ({
        hash: `op${level}`,
        contents: [{ kind: "attestation" as const, level, round: 0, slot: 0 }],
      })),
    );
    expect(state.snapshot()?.operations.map((op) => op.hash)).toEqual([
      "op10",
      "op11",
    ]);
    state.transition(head(11));
    expect(state.snapshot()?.operations.map((op) => op.hash)).toEqual(["op11"]);
  });

  it("does not commit work cancelled before a pause and resume at the same head", async () => {
    const state = new HeadGeneration<string>();
    const generation = state.transition(head(10));
    let resolve: (value: string) => void = () => undefined;
    const pending = commitIfCurrent(
      state,
      generation,
      () =>
        new Promise<string>((done) => {
          resolve = done;
        }),
    );
    state.cancelWork();
    state.resumeWork();
    resolve("stale");
    await expect(pending).resolves.toBe(false);
    expect(state.snapshot()?.derived).toBeNull();
  });

  it("targets proposal rights at head plus one after a head transition", () => {
    const state = new HeadGeneration<ReturnType<typeof proposalPlan>>();
    state.transition(head(100));
    const generation = state.transition(head(101));
    const plan = proposalPlan(state.snapshot()?.head ?? head(0), 3);
    state.commitDerived(generation, plan);

    expect(state.snapshot()?.derived?.next).toEqual({
      level: 102,
      round: 4,
      label: "Next proposal: level 102 · round 4",
    });
    expect(state.snapshot()?.derived?.roundZero.level).toBe(102);
    expect(state.snapshot()?.operations).toHaveLength(0);
  });
});

it("withdraws derived authority when the same hash is observed at another endpoint",()=>{
 const state=new HeadGeneration<string>();
 const observed=(baseUrl:string)=>({...head(100),evidence:{source:{network:"mainnet" as const,name:baseUrl,baseUrl},receivedAt:1,receivedMonotonic:1}});
 const a=state.transition(observed("A"));state.commitDerived(a,"A rights");
 const b=state.transition(observed("B"));expect(b).toBe(a+1);expect(state.snapshot()?.derived).toBeNull();
 expect(state.snapshot()?.head.evidence?.source.baseUrl).toBe("B");
 expect(()=>state.commitDerived(a,"late A rights")).toThrow("obsolete head generation");
});
