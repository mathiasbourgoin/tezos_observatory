import type { BlockHeader, MonitoredOperation } from "../rpc/models";
import { OperationStore } from "../rpc/operationStore";

export interface HeadSnapshot<T> {
  readonly generation: number;
  readonly head: BlockHeader;
  readonly derived: T | null;
  readonly operations: readonly MonitoredOperation[];
}

export class StaleHeadError extends Error {
  constructor() {
    super("Result belongs to an obsolete head generation");
  }
}

export class HeadGeneration<T> {
  private generation = 0;
  private head: BlockHeader | null = null;
  private derived: T | null = null;
  // Votes remain relevant for long rounds; bound by count and head level instead
  // of expiring them while the chain is stalled.
  private readonly operations = new OperationStore(10_000, Infinity);
  private workController = new AbortController();

  transition(head: BlockHeader): number {
    if (this.head?.hash === head.hash && this.head.predecessor===head.predecessor && this.head.chainId===head.chainId && this.head.evidence?.source.baseUrl===head.evidence?.source.baseUrl) return this.generation;
    this.generation += 1;
    this.workController.abort();
    this.workController = new AbortController();
    this.head = head;
    this.derived = null;
    this.operations.retain((operation) =>
      operation.contents.some(
        (content) =>
          content.level === head.level || content.level === head.level + 1,
      ),
    );
    return this.generation;
  }

  currentGeneration(): number {
    return this.generation;
  }

  cancelWork(): void {
    this.workController.abort();
  }

  resumeWork(): void {
    if (this.workController.signal.aborted)
      this.workController = new AbortController();
  }

  signal(generation: number): AbortSignal {
    this.assertCurrent(generation);
    return this.workController.signal;
  }

  addOperations(
    generation: number,
    operations: readonly MonitoredOperation[],
  ): number {
    this.assertCurrent(generation);
    const level = this.head?.level;
    const relevant = operations.filter((operation) =>
      operation.contents.some(
        (content) =>
          content.level === level || content.level === (level ?? -2) + 1,
      ),
    );
    return this.operations.add(relevant);
  }

  syncOperations(generation:number,operations:readonly MonitoredOperation[]):void {
    this.assertCurrent(generation);
    this.operations.clear();
    this.addOperations(generation,operations);
  }

  commitDerived(generation: number, value: T): void {
    this.assertCurrent(generation);
    this.derived = value;
  }

  snapshot(): HeadSnapshot<T> | null {
    if (this.head === null) return null;
    return {
      generation: this.generation,
      head: this.head,
      derived: this.derived,
      operations: this.operations.values(),
    };
  }

  private assertCurrent(generation: number): void {
    if (generation !== this.generation || this.workController.signal.aborted) {
      throw new StaleHeadError();
    }
  }
}

export async function commitIfCurrent<T>(
  state: HeadGeneration<T>,
  generation: number,
  work: (signal: AbortSignal) => Promise<T>,
): Promise<boolean> {
  try {
    const signal = state.signal(generation);
    const result = await work(signal);
    if (signal.aborted) return false;
    state.commitDerived(generation, result);
    return true;
  } catch (error) {
    if (
      error instanceof StaleHeadError ||
      state.currentGeneration() !== generation
    )
      return false;
    throw error;
  }
}
