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
  value(value: T) {
    this.settings.onValue(value, source, 0);
  }
}
const header = (level: number): BlockHeader => ({
  level,
  hash: `B${level}`,
  predecessor: `B${level - 1}`,
  timestamp: "2026-10-14T00:00:00Z",
  fitness: [],
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
      "00000000",
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
