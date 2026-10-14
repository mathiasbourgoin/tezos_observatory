import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NetworkMonitor,
  type NetworkDerivedState,
  type NetworkMonitorView,
} from "../../src/monitor/networkMonitor";
import type {
  BlockHeader,
  RpcSource,
  TransportMetrics,
} from "../../src/rpc/models";

const source: RpcSource = {
  network: "mainnet",
  name: "rpc",
  baseUrl: "https://rpc",
};
const metrics: TransportMetrics = {
  connects: 1,
  messages: 0,
  reconnects: 0,
  bytes: 0,
  lastLatencyMs: null,
};
class FakeTransport<T> {
  static instances: FakeTransport<unknown>[] = [];
  readonly settings: ConstructorParameters<
    typeof import("../../src/rpc/streamTransport").StreamTransport<T>
  >[0];
  constructor(
    settings: ConstructorParameters<
      typeof import("../../src/rpc/streamTransport").StreamTransport<T>
    >[0],
  ) {
    this.settings = settings;
    FakeTransport.instances.push(this as FakeTransport<unknown>);
  }
  start() {
    this.settings.onStatus(source, null, metrics);
  }
  stop() {
    this.settings.onStatus(null, null, metrics);
  }
  value(value: T,observer:RpcSource=source) {
    this.settings.onValue(value, observer, 0);
  }
}
const header = (level: number): BlockHeader => ({
  level,
  hash: `B${level}`,
  predecessor: `B${level - 1}`,
  timestamp: "2026-10-14T00:00:00Z",
  fitness: ["02",level.toString(16).padStart(8,"0"),"","ffffffff","00000000"],
});
beforeEach(() => {
  vi.stubGlobal("window", globalThis);
});

it("tracks monotonically newer validated proposals independently of applied heads", () => {
  vi.useFakeTimers();
  const { monitor, heads, views } = setup({ proposalSources: [source] });
  const proposals = FakeTransport.instances[2] as FakeTransport<BlockHeader>;
  const proposal = (level: number, round: number): BlockHeader => ({
    ...header(level),
    hash: `B${level}r${round}`,
    fitness: [
      "02",
      level.toString(16).padStart(8,"0"),
      "",
      "ffffffff",
      round.toString(16).padStart(8, "0"),
    ],
  });
  expect(proposals.settings.path).toBe("/monitor/validated_blocks?chain=main");
  heads.value(header(10));
  proposals.value(proposal(11, 2));
  expect(views.at(-1)?.latestProposal?.hash).toBe("B11r2");
  expect(views.at(-1)?.snapshot?.head.level).toBe(10);
  proposals.value(proposal(11, 1));
  proposals.value(proposal(10, 4));
  expect(views.at(-1)?.latestProposal?.hash).toBe("B11r2");
  proposals.value(proposal(11, 3));
  expect(views.at(-1)?.latestProposal?.hash).toBe("B11r3");
  heads.value(header(12));
  expect(views.at(-1)?.latestProposal).toBeNull();
  proposals.value(proposal(11, 100));
  expect(views.at(-1)?.latestProposal).toBeNull();
  proposals.settings.onStatus(source, "HTTP 401", metrics);
  expect(views.at(-1)?.proposalStream.error).toBe("HTTP 401");
  expect(views.at(-1)?.headStream.mode).toBe("stream");
  monitor.stop();
  proposals.value(proposal(13, 0));
  expect(views.at(-1)?.latestProposal).toBeNull();
  expect(views.at(-1)?.proposalStream.mode).toBe("paused");
});

describe("NetworkMonitor", () => {
  it("aborts old derivation on streamed head transition and pauses while hidden", async () => {
    FakeTransport.instances = [];
    const views: NetworkMonitorView<NetworkDerivedState>[] = [];
    let finishOld: ((value: NetworkDerivedState) => void) | undefined;
    const derive = vi.fn((head: BlockHeader) =>
      head.level === 1
        ? new Promise<NetworkDerivedState>((resolve) => {
            finishOld = resolve;
          })
        : Promise.resolve({ refreshedAt: 2 }),
    );
    const monitor = new NetworkMonitor({
      network: "mainnet",
      headSources: [source],
      operationSources: [source],
      derive,
      fallbackOperations: async () => [],
      onUpdate: (view) => views.push(view),
      streamFactory: (settings) => new FakeTransport(settings) as never,
    });
    const listeners: EventListener[] = [];
    const page = {
      hidden: false,
      addEventListener: (
        _name: string,
        listener: EventListenerOrEventListenerObject,
      ) => listeners.push(listener as EventListener),
    };
    monitor.bindVisibility(
      page as Pick<Document, "hidden" | "addEventListener">,
    );
    const heads = FakeTransport.instances[0] as FakeTransport<BlockHeader>;
    heads.value(header(1));
    heads.value(header(2));
    finishOld?.({ refreshedAt: 1 });
    await Promise.resolve();
    await Promise.resolve();
    expect(views.at(-1)?.snapshot?.head.level).toBe(2);
    expect(views.at(-1)?.snapshot?.derived?.refreshedAt).toBe(2);
    Object.assign(page, { hidden: true });
    listeners[0]?.(new Event("visibilitychange"));
    expect(views.at(-1)?.operationMode).toBe("paused");
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("refreshes partial derived state at the same head without parallel derivations", async () => {
  vi.useFakeTimers();
  type Derived = NetworkDerivedState & { errors: string[] };
  let finish: (value: Derived) => void = () => undefined;
  const derive = vi
    .fn()
    .mockResolvedValueOnce({ refreshedAt: 1, errors: ["rights unavailable"] })
    .mockImplementationOnce(
      () =>
        new Promise<Derived>((resolve) => {
          finish = resolve;
        }),
    );
  const { monitor, heads, views } = setup({ derive });
  heads.value(header(10));
  await vi.advanceTimersByTimeAsync(0);
  monitor.refreshDerived();
  monitor.refreshDerived();
  expect(derive).toHaveBeenCalledTimes(2);
  finish({ refreshedAt: 2, errors: [] });
  await vi.advanceTimersByTimeAsync(0);
  expect(views.at(-1)?.snapshot?.derived?.refreshedAt).toBe(2);
  monitor.stop();
  monitor.refreshDerived();
  expect(derive).toHaveBeenCalledTimes(2);
});

it("keeps a failed head stream visible during RPC fallback and reconnect attempts", async () => {
  vi.useFakeTimers();
  const { monitor, heads, views } = setup({
    fallbackHead: async () => header(10),
  });
  heads.settings.onStatus(source, "stream blocked", metrics);
  await vi.advanceTimersByTimeAsync(1);
  expect(views.at(-1)?.headStream).toMatchObject({
    mode: "fallback",
    error: "stream blocked",
  });
  heads.settings.onStatus(source, null, metrics);
  expect(views.at(-1)?.headStream).toMatchObject({
    mode: "fallback",
    error: "stream blocked",
  });
  heads.value(header(10));
  expect(views.at(-1)?.headStream).toMatchObject({
    mode: "stream",
    error: null,
  });
  monitor.stop();
});

it.each(["stop", "transition"])(
  "rejects a late same-head retry after %s",
  async (action) => {
    vi.useFakeTimers();
    let finish: (value: NetworkDerivedState) => void = () => undefined;
    const derive = vi
      .fn()
      .mockResolvedValueOnce({ refreshedAt: 1 })
      .mockImplementationOnce(
        () =>
          new Promise<NetworkDerivedState>((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValue({ refreshedAt: 3 });
    const { monitor, heads, views } = setup({ derive });
    heads.value(header(10));
    await vi.advanceTimersByTimeAsync(0);
    monitor.refreshDerived();
    if (action === "stop") monitor.stop();
    else heads.value(header(11));
    finish({ refreshedAt: 2 });
    await vi.advanceTimersByTimeAsync(0);
    expect(views.at(-1)?.snapshot?.derived?.refreshedAt).toBe(
      action === "stop" ? 1 : 3,
    );
    monitor.stop();
  },
);

function setup(
  overrides: Partial<
    ConstructorParameters<typeof NetworkMonitor<NetworkDerivedState>>[0]
  > = {},
) {
  FakeTransport.instances = [];
  const views: NetworkMonitorView<NetworkDerivedState>[] = [];
  const derive = vi.fn(async () => ({ refreshedAt: Date.now() }));
  const monitor = new NetworkMonitor({
    network: "mainnet",
    headSources: [source],
    operationSources: [source],
    derive,
    fallbackOperations: async () => [],
    onUpdate: (view) => views.push(view),
    streamFactory: (settings) => new FakeTransport(settings) as never,
    ...overrides,
  });
  monitor.start();
  return {
    monitor,
    views,
    derive,
    heads: FakeTransport.instances[0] as FakeTransport<BlockHeader>,
    operations: FakeTransport.instances[1] as FakeTransport<
      import("../../src/rpc/models").MonitorOperationBatch
    >,
  };
}

it("preserves votes delivered before the initial head and deduplicates repeated head derivation", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("window", globalThis);
  const { monitor, views, derive, heads, operations } = setup();
  expect(views.at(-1)?.headObservedAt).toBeNull();
  expect(views.at(-1)?.lastOperationAt).toBeNull();
  operations.value([
    {
      hash: "early",
      contents: [{ kind: "attestation", level: 2, round: 0, slot: 0 }],
    },
  ]);
  heads.value(header(1));
  heads.value(header(1));
  expect(derive).toHaveBeenCalledTimes(1);
  expect(views.at(-1)?.snapshot?.operations.map((op) => op.hash)).toEqual([
    "early",
  ]);
  expect(views.at(-1)?.lastOperationAt).toBe(Date.now());
  heads.value(header(2));
  expect(views.at(-1)?.snapshot?.operations.map((op) => op.hash)).toEqual([
    "early",
  ]);
  monitor.stop();
});

it("bootstraps with head RPC when streams hang, and cancels fallback after stream recovery", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("window", globalThis);
  const fallbackHead = vi.fn(async () => header(10));
  const fallbackOperations = vi.fn(async () => []);
  const { monitor, heads, operations, views } = setup({
    fallbackHead,
    fallbackOperations,
    streamBootstrapTimeoutMs: 100,
  });
  await vi.advanceTimersByTimeAsync(0);
  expect(fallbackHead).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(101);
  expect(fallbackHead).toHaveBeenCalledTimes(1);
  expect(views.at(-1)?.snapshot?.head.level).toBe(10);
  expect(views.at(-1)?.headStream.mode).toBe("fallback");
  const operationCalls = fallbackOperations.mock.calls.length;
  heads.value(header(11));
  operations.value([]);
  await vi.advanceTimersByTimeAsync(60_000);
  expect(fallbackHead).toHaveBeenCalledTimes(1);
  expect(fallbackOperations).toHaveBeenCalledTimes(operationCalls);
  expect(views.at(-1)?.operationMode).toBe("stream");
  monitor.stop();
});

it("retains state on refresh and ignores an obsolete fallback result", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("window", globalThis);
  let finish: (head: BlockHeader) => void = () => undefined;
  const fallbackHead = vi.fn(
    () =>
      new Promise<BlockHeader>((resolve) => {
        finish = resolve;
      }),
  );
  const { monitor, heads, views } = setup({
    fallbackHead,
    streamBootstrapTimeoutMs: 100,
  });
  await vi.advanceTimersByTimeAsync(101);
  monitor.refresh();
  heads.value(header(20));
  finish(header(10));
  await Promise.resolve();
  await Promise.resolve();
  expect(views.at(-1)?.snapshot?.head.level).toBe(20);
  const observedAt = views.at(-1)?.headObservedAt;
  monitor.stop();
  heads.value(header(99));
  expect(views.at(-1)?.snapshot?.head.level).toBe(20);
  expect(views.at(-1)?.headObservedAt).toBe(observedAt);
});

it("retains distinct same-round candidate hashes and immutable first receipts", () => {
  vi.useFakeTimers();
  const {monitor,heads,views}=setup({proposalSources:[source]});
  heads.value(header(120));
  const proposals=FakeTransport.instances[2] as FakeTransport<BlockHeader>;
  const first={...header(121),hash:"H1",payload_hash:"P"};
  proposals.value(first);vi.advanceTimersByTime(1);proposals.value({...first,hash:"H2"});
  expect(views.at(-1)?.latestProposal?.hash).toBe("H2");
  const view=views.at(-1) as unknown as {candidates: readonly {header:BlockHeader;evidence:{receivedAt:number;source:RpcSource}}[]};
  expect(view.candidates.map(c=>c.header.hash)).toEqual(["H1","H2"]);
  const receipt=view.candidates[0]?.evidence.receivedAt;
  vi.advanceTimersByTime(1);proposals.value(first);
  const replay=views.at(-1) as unknown as typeof view;
  expect(replay.candidates).toHaveLength(2);expect(replay.candidates[0]?.evidence.receivedAt).toBe(receipt);
  expect(replay.candidates[0]?.evidence.source).toEqual(source);monitor.stop();
});

it("bounds accepted and unresolved candidate products independently by first receipt", () => {
  vi.useFakeTimers();
  const {monitor,heads,views}=setup({proposalSources:[source]});heads.value(header(120));
  const proposals=FakeTransport.instances[2] as FakeTransport<BlockHeader>;
  for (let index=0;index<101;index++) {proposals.value({...header(121),hash:`accepted-${String(index).padStart(3,"0")}`});vi.advanceTimersByTime(1);}
  for (let index=0;index<101;index++) {proposals.value({...header(1_000_000+index),hash:`unknown-${String(index).padStart(3,"0")}`});vi.advanceTimersByTime(1);}
  expect(views.at(-1)?.candidates).toHaveLength(100);expect(views.at(-1)?.unresolvedCandidates).toHaveLength(100);
  expect(views.at(-1)?.candidates.some(candidate=>candidate.header.hash==="accepted-000")).toBe(false);
  expect(views.at(-1)?.candidates.some(candidate=>candidate.header.hash==="accepted-100")).toBe(true);
  monitor.stop();
});

it("keeps unpinned A/B stream requested-head facts unknown and never borrows A head context for B",()=>{
 vi.useFakeTimers();
 const {monitor,heads,operations,views}=setup({proposalSources:[source]});
 heads.value(header(120));
 const headEvidence=views.at(-1)?.snapshot?.head.evidence;
 expect(headEvidence?.requestedHeadHash).toBeUndefined();
 expect(headEvidence?.observedHeadHash).toBe("B120");
 const other={...source,name:"observer B",baseUrl:"https://observer-b"};
 operations.settings.onValue([{hash:"B-vote",contents:[{kind:"preattestation",level:121,round:0,slot:0,block_payload_hash:"P"}]}],other,0);
 const voteEvidence=views.at(-1)?.snapshot?.operations[0]?.evidence;
 expect(voteEvidence?.requestedHeadHash).toBeUndefined();expect(voteEvidence?.observedHeadHash).toBeUndefined();
 expect(voteEvidence?.source.baseUrl).toBe(other.baseUrl);
 const proposals=FakeTransport.instances[2] as FakeTransport<BlockHeader>;
 proposals.settings.onValue({...header(121),hash:"B-proposal",chainId:"NetB",payload_hash:"P"},other,0);
 const candidate=views.at(-1)?.candidates[0];
 expect(candidate?.evidence.requestedHeadHash).toBeUndefined();expect(candidate?.evidence.observedHeadHash).toBeUndefined();
 expect(candidate?.header.predecessor).toBe("B120");
 monitor.stop();
});

it("retains ahead raw operations without letting another observer head count them",async()=>{
 vi.useFakeTimers();vi.stubGlobal("window",globalThis);
 const observerB={...source,name:"B",baseUrl:"https://B"};
 const {monitor,heads,operations,views}=setup({operationSources:[source,observerB]});heads.value(header(120));
 operations.value([{hash:"ahead-B",contents:[{kind:"preattestation",level:123,round:0,slot:0,block_payload_hash:"PB"}]}],observerB);
 expect(views.at(-1)?.snapshot?.head.level).toBe(120);
 expect(views.at(-1)?.snapshot?.operations).toHaveLength(0);
 expect(views.at(-1)?.rawOperations).toHaveLength(1);
 expect(views.at(-1)?.rawOperations[0]?.contents[0]?.level).toBe(123);
 monitor.stop();
});
