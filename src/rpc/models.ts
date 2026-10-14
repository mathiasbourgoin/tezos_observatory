export type NetworkName = "mainnet" | "shadownet";

export interface RpcSource {
  readonly network: NetworkName;
  readonly name: string;
  readonly baseUrl: string;
}

/** Facts captured once at receipt; current transport cannot relabel them. */
export interface ObservationEvidence {
  readonly source: RpcSource;
  readonly chainId?: string;
  readonly requestedHeadHash?: string;
  readonly observedHeadHash?: string;
  readonly predecessor?: string;
  /** Shell header proto is a protocol-level counter, not a protocol hash. */
  readonly protocolLevel?: number;
  readonly observedBlockHash?: string;
  readonly receivedAt: number;
  readonly receivedMonotonic: number;
}

export interface CandidateObservation {
  readonly identity: string;
  readonly header: BlockHeader;
  readonly evidence: ObservationEvidence;
}

export interface BlockHeader {
  readonly chainId?: string;
  readonly evidence?: ObservationEvidence;
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
  /** Original raw RPC branch; it does not prove immediate proposal ancestry. */
  readonly branch?: string;
  readonly evidence?: ObservationEvidence;
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
