import { afterEach, expect, it, vi } from "vitest";
import { StreamTransport } from "../../src/rpc/streamTransport";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("reopens a flushed mempool stream on the same source without reporting a failure", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("window", globalThis);
  const controllers: ReadableStreamDefaultController<Uint8Array>[] = [];
  const fetchMock = vi.fn(
    async () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controllers.push(controller);
          },
        }),
      ),
  );
  const values: unknown[] = [];
  const status = vi.fn();
  const transport = new StreamTransport({
    sources: [
      { network: "mainnet", name: "working", baseUrl: "https://working" },
      { network: "mainnet", name: "restricted", baseUrl: "https://restricted" },
    ],
    path: "/monitor_operations",
    reconnectOnEnd: true,
    parse: (value) => value,
    onValue: (value) => values.push(value),
    onStatus: status,
    fetch: fetchMock as typeof fetch,
  });
  transport.start();
  await vi.advanceTimersByTimeAsync(0);
  controllers[0]?.enqueue(new TextEncoder().encode('[{"vote":1}]\n'));
  await vi.advanceTimersByTimeAsync(6000);
  controllers[0]?.close();
  await vi.advanceTimersByTimeAsync(50);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock.mock.calls.map((call) => (call as unknown[])[0])).toEqual([
    "https://working/monitor_operations",
    "https://working/monitor_operations",
  ]);
  controllers[1]?.enqueue(new TextEncoder().encode('[{"vote":2}]\n'));
  await vi.advanceTimersByTimeAsync(0);
  expect(values).toEqual([[{ vote: 1 }], [{ vote: 2 }]]);
  expect(status.mock.calls.every((call) => call[1] === null)).toBe(true);
  transport.stop();
  controllers[1]?.close();
});

it("ignores an old fetch resolving after restart and keeps the new connection active", async () => {
  vi.stubGlobal("window", globalThis);
  let resolveOld: (response: Response) => void = () => undefined;
  let currentController:
    ReadableStreamDefaultController<Uint8Array> | undefined;
  const fetchMock = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveOld = resolve;
        }),
    )
    .mockImplementationOnce(
      async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              currentController = controller;
            },
          }),
        ),
    );
  const values: unknown[] = [];
  const status = vi.fn();
  const transport = new StreamTransport({
    sources: [{ network: "mainnet", name: "rpc", baseUrl: "https://rpc" }],
    path: "/monitor/heads/main",
    parse: (value) => value,
    onValue: (value) => values.push(value),
    onStatus: status,
    fetch: fetchMock as typeof fetch,
  });
  transport.start();
  transport.stop();
  transport.start();
  resolveOld(new Response('{"old":true}\n'));
  await Promise.resolve();
  await Promise.resolve();
  currentController?.enqueue(new TextEncoder().encode('{"current":true}\n'));
  await Promise.resolve();
  await Promise.resolve();
  expect(values).toEqual([{ current: true }]);
  expect(status.mock.calls.at(-1)?.[2].messages).toBe(1);
  transport.stop();
  currentController?.close();
});
