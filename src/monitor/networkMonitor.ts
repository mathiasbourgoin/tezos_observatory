import {
  asBlockHeader,
  asOperationBatch,
  asValidatedProposal,
} from "../rpc/guards";
import { proposalRound } from "../consensus/roundSchedule";
import type {
  BlockHeader,
  MonitorOperationBatch,
  NetworkName,
  RpcSource,
  StreamStatus,
  TransportMetrics,
} from "../rpc/models";
import { StreamTransport } from "../rpc/streamTransport";
import {
  HeadGeneration,
  commitIfCurrent,
  type HeadSnapshot,
} from "./headGeneration";

export interface NetworkDerivedState {
  readonly refreshedAt: number;
}

export interface NetworkMonitorView<T extends NetworkDerivedState> {
  readonly network: NetworkName;
  readonly snapshot: HeadSnapshot<T> | null;
  readonly headStream: StreamStatus;
  readonly operationStream: StreamStatus;
  readonly operationMode: "stream" | "fallback" | "paused";
  readonly fallbackRequests: number;
  readonly headObservedAt: number | null;
  readonly lastOperationAt: number | null;
  readonly operationGeneration: number | null;
  readonly latestProposal: BlockHeader | null;
  readonly proposalStream: StreamStatus;
}

export interface NetworkMonitorOptions<T extends NetworkDerivedState> {
  readonly network: NetworkName;
  readonly headSources: readonly RpcSource[];
  readonly operationSources: readonly RpcSource[];
  readonly proposalSources?: readonly RpcSource[];
  readonly derive: (head: BlockHeader, signal: AbortSignal) => Promise<T>;
  readonly fallbackOperations: (
    head: BlockHeader,
    signal: AbortSignal,
  ) => Promise<MonitorOperationBatch>;
  readonly onUpdate: (view: NetworkMonitorView<T>) => void;
  readonly fallbackIntervalMs?: number;
  readonly fallbackHead?: (signal: AbortSignal) => Promise<BlockHeader>;
  readonly headFallbackIntervalMs?: number;
  readonly streamBootstrapTimeoutMs?: number;
  readonly streamFactory?: <V>(
    options: ConstructorParameters<typeof StreamTransport<V>>[0],
  ) => StreamTransport<V>;
}

const emptyMetrics = (): TransportMetrics => ({
  connects: 0,
  messages: 0,
  reconnects: 0,
  bytes: 0,
  lastLatencyMs: null,
});
const emptyStatus = (): StreamStatus => ({
  mode: "paused",
  source: null,
  error: null,
  metrics: emptyMetrics(),
});

export class NetworkMonitor<T extends NetworkDerivedState> {
  private readonly state = new HeadGeneration<T>();
  private readonly headTransport: StreamTransport<BlockHeader>;
  private readonly operationTransport: StreamTransport<MonitorOperationBatch> | null;
  private readonly proposalTransport: StreamTransport<BlockHeader> | null;
  private headStatus = emptyStatus();
  private operationStatus = emptyStatus();
  private proposalStatus = emptyStatus();
  private latestProposal: BlockHeader | null = null;
  private proposalStreaming = false;
  private operationMode: "stream" | "fallback" | "paused" = "paused";
  private fallbackTimer: number | null = null;
  private fallbackRequests = 0;
  private running = false;
  private headObservedAt: number | null = null;
  private lastOperationAt: number | null = null;
  private operationGeneration: number | null = null;
  private initialOperations: MonitorOperationBatch = [];
  private lifecycle = 0;
  private lifecycleController = new AbortController();
  private bootstrapTimer: number | null = null;
  private headFallbackTimer: number | null = null;
  private operationStreaming = false;
  private headStreaming = false;
  private headFallbackActive = false;
  private derivingGeneration: number | null = null;

  constructor(private readonly options: NetworkMonitorOptions<T>) {
    const factory =
      options.streamFactory ?? ((settings) => new StreamTransport(settings));
    this.headTransport = factory({
      sources: options.headSources,
      path: "/monitor/heads/main",
      parse: asBlockHeader,
      onValue: (head) => {
        if (!this.running) return;
        this.headStreaming = true;
        this.headFallbackActive = false;
        this.clearHeadFallback();
        this.headStatus = { ...this.headStatus, mode: "stream", error: null };
        this.acceptHead(head);
      },
      onStatus: (source, error, metrics) => {
        if (error !== null) {
          this.headStreaming = false;
          this.enableHeadFallback();
        }
        this.headStatus = {
          mode: this.running
            ? this.headStreaming
              ? "stream"
              : this.headFallbackActive
                ? "fallback"
                : "connecting"
            : "paused",
          source,
          error: error ?? (this.headStreaming ? null : this.headStatus.error),
          metrics,
        };
        this.emit();
      },
    });
    this.operationTransport =
      options.operationSources.length === 0
        ? null
        : factory({
            sources: options.operationSources,
            path: "/chains/main/mempool/monitor_operations?validated=true&version=1",
            reconnectOnEnd: true,
            parse: asOperationBatch,
            onValue: (batch) => {
              if (!this.running) return;
              this.operationStreaming = true;
              this.operationMode = "stream";
              this.clearOperationFallback();
              this.operationStatus = {
                ...this.operationStatus,
                mode: "stream",
                error: null,
              };
              this.acceptOperations(batch);
            },
            onStatus: (source, error, metrics) => {
              if (error !== null) {
                this.operationStreaming = false;
                this.enableFallback();
              }
              this.operationStatus = {
                mode: this.running
                  ? this.operationStreaming
                    ? "stream"
                    : "connecting"
                  : "paused",
                source,
                error:
                  error ??
                  (this.operationStreaming ? null : this.operationStatus.error),
                metrics,
              };
              this.emit();
            },
          });
    this.proposalTransport =
      (options.proposalSources?.length ?? 0) === 0
        ? null
        : factory({
            sources: options.proposalSources!,
            path: "/monitor/validated_blocks?chain=main",
            parse: asValidatedProposal,
            onValue: (proposal) => {
              if (!this.running) return;
              this.proposalStreaming = true;
              this.proposalStatus = {
                ...this.proposalStatus,
                mode: "stream",
                error: null,
              };
              this.acceptProposal(proposal);
            },
            onStatus: (source, error, metrics) => {
              if (error !== null) this.proposalStreaming = false;
              this.proposalStatus = {
                mode: this.running
                  ? this.proposalStreaming
                    ? "stream"
                    : "connecting"
                  : "paused",
                source,
                error:
                  error ??
                  (this.proposalStreaming ? null : this.proposalStatus.error),
                metrics,
              };
              this.emit();
            },
          });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lifecycle += 1;
    this.lifecycleController = new AbortController();
    this.state.resumeWork();
    this.headStreaming = false;
    this.headFallbackActive = false;
    this.operationStreaming = false;
    this.proposalStreaming = false;
    this.operationMode =
      this.operationTransport === null ? "fallback" : "stream";
    this.headTransport.start();
    this.operationTransport?.start();
    this.proposalTransport?.start();
    // A quiet monitor stream need not send an initial head. Bootstrap once by
    // RPC immediately; the first streamed head cancels this fallback loop.
    if (this.state.snapshot() === null) this.enableHeadFallback();
    if (this.operationTransport === null) this.enableFallback();
    this.bootstrapTimer = window.setTimeout(() => {
      this.bootstrapTimer = null;
      if (!this.headStreaming) this.enableHeadFallback();
      if (!this.operationStreaming) this.enableFallback();
    }, this.options.streamBootstrapTimeoutMs ?? 8_000);
    const snapshot = this.state.snapshot();
    if (snapshot !== null && snapshot.derived === null)
      this.deriveHead(snapshot.head, snapshot.generation);
    this.emit();
  }
  stop(): void {
    this.running = false;
    this.lifecycle += 1;
    this.lifecycleController.abort();
    this.state.cancelWork();
    this.derivingGeneration = null;
    this.headTransport.stop();
    this.operationTransport?.stop();
    this.proposalTransport?.stop();
    this.clearOperationFallback();
    this.clearHeadFallback();
    if (this.bootstrapTimer !== null) window.clearTimeout(this.bootstrapTimer);
    this.bootstrapTimer = null;
    this.operationMode = "paused";
    this.emit();
  }
  refresh(): void {
    this.stop();
    this.start();
    this.refreshDerived();
  }
  refreshDerived(): void {
    if (!this.running) return;
    const snapshot = this.state.snapshot();
    if (snapshot !== null) this.deriveHead(snapshot.head, snapshot.generation);
  }
  bindVisibility(
    documentLike: Pick<Document, "hidden" | "addEventListener"> = document,
  ): void {
    const update = () => {
      if (documentLike.hidden) this.stop();
      else this.start();
    };
    documentLike.addEventListener("visibilitychange", update);
    update();
  }

  private acceptHead(head: BlockHeader): void {
    if (!this.running) return;
    this.headObservedAt = Date.now();
    const generation = this.state.transition(head);
    if (
      this.latestProposal !== null &&
      (this.latestProposal.level < head.level ||
        (this.latestProposal.level === head.level &&
          proposalRound(this.latestProposal.fitness) <
            proposalRound(head.fitness)))
    ) {
      this.latestProposal = null;
    }
    if (this.initialOperations.length > 0) {
      this.state.addOperations(generation, this.initialOperations);
      this.initialOperations = [];
    }
    this.emit();
    if (this.state.snapshot()?.derived === null)
      this.deriveHead(head, generation);
  }
  private deriveHead(head: BlockHeader, generation: number): void {
    if (this.derivingGeneration === generation) return;
    this.derivingGeneration = generation;
    const lifecycle = this.lifecycle;
    void commitIfCurrent(this.state, generation, (signal) =>
      this.options.derive(head, signal),
    )
      .then((committed) => {
        if (committed && this.running && lifecycle === this.lifecycle)
          this.emit();
      })
      .catch(() => {
        if (this.running && lifecycle === this.lifecycle) this.emit();
      })
      .finally(() => {
        if (
          lifecycle === this.lifecycle &&
          this.derivingGeneration === generation
        )
          this.derivingGeneration = null;
      });
  }
  private acceptProposal(proposal: BlockHeader): void {
    const head = this.state.snapshot()?.head;
    if (
      head !== undefined &&
      (proposal.level < head.level ||
        (proposal.level === head.level &&
          proposalRound(proposal.fitness) < proposalRound(head.fitness)))
    )
      return;
    const previous = this.latestProposal;
    if (
      previous !== null &&
      (proposal.level < previous.level ||
        (proposal.level === previous.level &&
          proposalRound(proposal.fitness) <= proposalRound(previous.fitness)))
    )
      return;
    this.latestProposal = proposal;
    this.emit();
  }
  private acceptOperations(batch: MonitorOperationBatch): void {
    if (!this.running) return;
    this.lastOperationAt = Date.now();
    const generation = this.state.currentGeneration();
    if (generation === 0) {
      this.initialOperations = [...this.initialOperations, ...batch].slice(
        -10_000,
      );
      this.emit();
      return;
    }
    this.operationGeneration = generation;
    this.state.addOperations(generation, batch);
    this.emit();
  }
  private clearOperationFallback(): void {
    if (this.fallbackTimer !== null) window.clearTimeout(this.fallbackTimer);
    this.fallbackTimer = null;
  }
  private clearHeadFallback(): void {
    if (this.headFallbackTimer !== null)
      window.clearTimeout(this.headFallbackTimer);
    this.headFallbackTimer = null;
  }
  private enableFallback(): void {
    if (!this.running || this.fallbackTimer !== null) return;
    this.operationMode = "fallback";
    const lifecycle = this.lifecycle;
    const run = async () => {
      if (
        !this.running ||
        lifecycle !== this.lifecycle ||
        this.operationStreaming
      )
        return;
      const snapshot = this.state.snapshot();
      if (snapshot !== null) {
        this.fallbackRequests += 1;
        try {
          const batch = await this.options.fallbackOperations(
            snapshot.head,
            this.lifecycleController.signal,
          );
          if (
            this.running &&
            lifecycle === this.lifecycle &&
            !this.operationStreaming &&
            this.state.currentGeneration() === snapshot.generation
          )
            this.acceptOperations(batch);
        } catch {
          /* retain last coherent snapshot */
        }
      }
      if (
        this.running &&
        lifecycle === this.lifecycle &&
        !this.operationStreaming
      )
        this.fallbackTimer = window.setTimeout(() => {
          void run();
        }, this.options.fallbackIntervalMs ?? 30_000);
    };
    this.fallbackTimer = window.setTimeout(() => {
      void run();
    }, 0);
  }
  private enableHeadFallback(): void {
    if (
      !this.running ||
      this.headFallbackTimer !== null ||
      this.options.fallbackHead === undefined
    )
      return;
    const lifecycle = this.lifecycle;
    const run = async () => {
      if (!this.running || lifecycle !== this.lifecycle || this.headStreaming)
        return;
      this.fallbackRequests += 1;
      try {
        const head = await this.options.fallbackHead!(
          this.lifecycleController.signal,
        );
        if (
          this.running &&
          lifecycle === this.lifecycle &&
          !this.headStreaming
        ) {
          this.headFallbackActive = true;
          this.headStatus = { ...this.headStatus, mode: "fallback" };
          this.acceptHead(head);
        }
      } catch {
        /* retain last coherent snapshot */
      }
      if (this.running && lifecycle === this.lifecycle && !this.headStreaming)
        this.headFallbackTimer = window.setTimeout(() => {
          void run();
        }, this.options.headFallbackIntervalMs ?? 15_000);
    };
    this.headFallbackTimer = window.setTimeout(() => {
      void run();
    }, 0);
  }
  private emit(): void {
    this.options.onUpdate({
      network: this.options.network,
      snapshot: this.state.snapshot(),
      headStream: this.headStatus,
      operationStream: this.operationStatus,
      operationMode: this.operationMode,
      fallbackRequests: this.fallbackRequests,
      headObservedAt: this.headObservedAt,
      lastOperationAt: this.lastOperationAt,
      operationGeneration: this.operationGeneration,
      latestProposal: this.latestProposal,
      proposalStream: this.proposalStatus,
    });
  }
}
