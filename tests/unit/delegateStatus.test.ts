import {describe, expect, it, vi} from "vitest";
import {DelegateStatusReader} from "../../src/consensus/delegateStatus";
import type {BlockHeader, RpcSource} from "../../src/rpc/models";

const source: RpcSource = {network: "shadownet", name: "test", baseUrl: "https://rpc.test"};
const head = (level: number): BlockHeader => ({level, hash: `B${level}`,
  predecessor: `B${level - 1}`, timestamp: "2026-10-14T00:00:00Z", fitness: []});

describe("DelegateStatusReader", () => {
  it.each([[true, "forbidden"], [false, "eligible"]] as const)(
    "maps RPC %s to %s", async (rpcValue, expected) => {
      const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(rpcValue)));
      const reader = new DelegateStatusReader(source, {fetch: request});
      await expect(reader.read(head(10), ["tz1delegate"])).resolves.toEqual([
        {delegate: "tz1delegate", eligibility: expected},
      ]);
    });

  it("keeps failures explicitly unavailable", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response("denied", {status: 401}));
    const reader = new DelegateStatusReader(source, {fetch: request});
    const [status] = await reader.read(head(10), ["tz1delegate"]);
    expect(status?.eligibility).toBe("unavailable");
    expect(status?.reason).toBe("HTTP 401");
  });

  it("ignores a stale response and does not cache it for the new head", async () => {
    let resolveOld: ((response: Response) => void) | undefined;
    const request = vi.fn<typeof fetch>()
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
      .mockResolvedValueOnce(new Response("false"));
    const reader = new DelegateStatusReader(source, {fetch: request, concurrency: 1});
    const oldRead = reader.read(head(10), ["tz1delegate"]);
    reader.transition(head(11));
    resolveOld?.(new Response("true"));
    const [oldStatus] = await oldRead;
    expect(oldStatus).toEqual({delegate: "tz1delegate", eligibility: "unavailable",
      reason: "obsolete head response ignored"});
    await expect(reader.read(head(11), ["tz1delegate"])).resolves.toEqual([
      {delegate: "tz1delegate", eligibility: "eligible"},
    ]);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("bounds requests and reuses the per-head cache", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response("false"));
    const reader = new DelegateStatusReader(source, {fetch: request, maximumDelegates: 2});
    await reader.read(head(10), ["tz1a", "tz1b", "tz1c"]);
    await reader.read(head(10), ["tz1a", "tz1b"]);
    expect(request).toHaveBeenCalledTimes(2);
  });
});
