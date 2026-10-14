import type {BlockHeader, DelegateProtocolStatus, RpcSource} from "../rpc/models";

interface CacheEntry {readonly value: DelegateProtocolStatus}

type FetchFunction = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface DelegateStatusOptions {
  readonly concurrency?: number;
  readonly maximumDelegates?: number;
  readonly fetch?: FetchFunction;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export class DelegateStatusReader {
  private headHash: string | null = null;
  private generation = 0;
  private controller = new AbortController();
  private readonly cache = new Map<string, CacheEntry>();
  private readonly concurrency: number;
  private readonly maximumDelegates: number;
  private readonly request: FetchFunction;

  constructor(private readonly source: RpcSource, options: DelegateStatusOptions = {}) {
    this.concurrency = Math.max(1, Math.min(8, options.concurrency ?? 4));
    this.maximumDelegates = Math.max(1, Math.min(256, options.maximumDelegates ?? 64));
    this.request = options.fetch ?? fetch;
  }

  transition(head: BlockHeader): void {
    if (head.hash === this.headHash) return;
    this.generation += 1;
    this.controller.abort();
    this.controller = new AbortController();
    this.headHash = head.hash;
    this.cache.clear();
  }

  async read(head: BlockHeader, delegates: readonly string[]): Promise<readonly DelegateProtocolStatus[]> {
    this.transition(head);
    const generation = this.generation;
    const unique = [...new Set(delegates)].slice(0, this.maximumDelegates);
    const results = new Map<string, DelegateProtocolStatus>();
    const pending = unique.filter(delegate => {
      const cached = this.cache.get(this.key(head.hash, delegate));
      if (cached !== undefined) results.set(delegate, cached.value);
      return cached === undefined;
    });
    let cursor = 0;
    const worker = async (): Promise<void> => {
      while (cursor < pending.length) {
        const index = cursor;
        cursor += 1;
        const delegate = pending[index];
        if (delegate === undefined) return;
        const value = await this.fetchOne(head.hash, delegate, generation);
        results.set(delegate, value);
      }
    };
    await Promise.all(Array.from({length: Math.min(this.concurrency, pending.length)}, worker));
    return unique.map(delegate => results.get(delegate) ??
      {delegate, eligibility: "unavailable", reason: "status was not fetched"});
  }

  private async fetchOne(headHash: string, delegate: string,
    generation: number): Promise<DelegateProtocolStatus> {
    let value: DelegateProtocolStatus;
    try {
      const path = `/chains/main/blocks/${encodeURIComponent(headHash)}` +
        `/context/delegates/${encodeURIComponent(delegate)}/is_forbidden`;
      const response = await this.request(`${this.source.baseUrl}${path}`, {
        cache: "no-store", signal: this.controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body: unknown = await response.json();
      if (typeof body !== "boolean") throw new Error("RPC returned a non-boolean value");
      value = {delegate, eligibility: body ? "forbidden" : "eligible"};
    } catch (error) {
      value = {delegate, eligibility: "unavailable", reason: errorMessage(error)};
    }
    if (generation !== this.generation || headHash !== this.headHash) {
      return {delegate, eligibility: "unavailable", reason: "obsolete head response ignored"};
    }
    this.cache.set(this.key(headHash, delegate), {value});
    return value;
  }

  private key(headHash: string, delegate: string): string {
    return `${headHash}:${delegate}`;
  }
}
