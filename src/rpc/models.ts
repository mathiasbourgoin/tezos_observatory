export type NetworkName = "mainnet" | "shadownet";

export interface RpcSource {
  readonly network: NetworkName;
  readonly name: string;
  readonly baseUrl: string;
}

export interface BlockHeader {
  readonly proto?: number;
  readonly level: number;
  readonly hash: string;
  readonly predecessor: string;
  readonly timestamp: string;
  readonly fitness: readonly string[];
  readonly payload_hash?: string;
}

export interface ConsensusContent {
  readonly kind: "preattestation" | "attestation" | "attestation_with_dal";
  readonly level: number;
  readonly round: number;
  readonly slot: number;
  readonly block_payload_hash?: string;
}

export interface MonitoredOperation {
  readonly hash: string;
  readonly contents: readonly ConsensusContent[];
}

export type MonitorOperationBatch = readonly MonitoredOperation[];

export interface TransportMetrics {
  readonly connects: number;
  readonly messages: number;
  readonly reconnects: number;
  readonly bytes: number;
  readonly lastLatencyMs: number | null;
}

export type StreamMode = "stream" | "fallback" | "paused" | "connecting";

export interface StreamStatus {
  readonly mode: StreamMode;
  readonly source: RpcSource | null;
  readonly error: string | null;
  readonly metrics: TransportMetrics;
}

export type DelegateEligibility = "forbidden" | "eligible" | "unavailable";

export interface DelegateProtocolStatus {
  readonly delegate: string;
  readonly eligibility: DelegateEligibility;
  readonly reason?: string;
}
