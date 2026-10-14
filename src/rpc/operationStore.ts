import type { MonitoredOperation } from "./models";

interface StoredOperation {
  readonly operation: MonitoredOperation;
  readonly seenAt: number;
}

export function operationIdentity(operation:MonitoredOperation):string {
  const evidence=operation.evidence;
  return JSON.stringify([evidence?.source.baseUrl??"unknown",evidence?.chainId??"unknown",evidence?.requestedHeadHash??"unknown",evidence?.observedHeadHash??"unknown",operation.hash]);
}

export class OperationStore {
  private readonly operations = new Map<string, StoredOperation>();

  constructor(
    private readonly maximum = 10_000,
    private readonly ttlMs = 120_000,
  ) {}

  add(batch: readonly MonitoredOperation[], now = performance.now()): number {
    this.expire(now);
    let added = 0;
    for (const operation of batch) {
      const key = operationIdentity(operation);
      if (this.operations.has(key)) continue;
      added += 1;
      this.operations.set(key, { operation, seenAt: now });
    }
    while (this.operations.size > this.maximum) {
      const oldest = this.operations.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.operations.delete(oldest);
    }
    return added;
  }

  values(now = performance.now()): readonly MonitoredOperation[] {
    this.expire(now);
    return [...this.operations.values()].map((item) => item.operation);
  }

  getByIdentity(identity:string):MonitoredOperation|undefined {
    return this.operations.get(identity)?.operation;
  }

  get(operation:MonitoredOperation):MonitoredOperation|undefined {
    return this.operations.get(operationIdentity(operation))?.operation;
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
