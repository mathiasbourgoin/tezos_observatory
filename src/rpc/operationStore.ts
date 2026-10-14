import type { MonitoredOperation } from "./models";

interface StoredOperation {
  readonly operation: MonitoredOperation;
  readonly seenAt: number;
}

export class OperationStore {
  private readonly operations = new Map<string, StoredOperation>();

  constructor(
    private readonly maximum = 10_000,
    private readonly ttlMs = 120_000,
  ) {}

  add(batch: readonly MonitoredOperation[], now = Date.now()): number {
    this.expire(now);
    let added = 0;
    for (const operation of batch) {
      if (!this.operations.has(operation.hash)) added += 1;
      this.operations.set(operation.hash, { operation, seenAt: now });
    }
    while (this.operations.size > this.maximum) {
      const oldest = this.operations.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.operations.delete(oldest);
    }
    return added;
  }

  values(now = Date.now()): readonly MonitoredOperation[] {
    this.expire(now);
    return [...this.operations.values()].map((item) => item.operation);
  }

  clear(): void {
    this.operations.clear();
  }

  retain(predicate: (operation: MonitoredOperation) => boolean): void {
    for (const [hash, item] of this.operations) {
      if (!predicate(item.operation)) this.operations.delete(hash);
    }
  }

  private expire(now: number): void {
    for (const [hash, item] of this.operations) {
      if (now - item.seenAt > this.ttlMs) this.operations.delete(hash);
    }
  }
}
