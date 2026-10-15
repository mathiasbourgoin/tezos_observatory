import type {
  BlockHeader,
  ConsensusContent,
  MonitorOperationBatch,
  MonitoredOperation,
} from "./models";

import {proposalRound} from "../consensus/roundSchedule";

type JsonRecord = Record<string, unknown>;

/** Validate local calendar fields before Date.parse can normalize rollover dates. */
export function validTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  if (year === undefined || month === undefined || day === undefined || hour === undefined || minute === undefined || second === undefined) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= (days[month - 1] ?? 0) && hour < 24 && minute < 60 && second < 60 && Number(match[8] ?? 0) < 24 && Number(match[9] ?? 0) < 60 && Number.isFinite(Date.parse(value));
}

const record = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Recognized unrelated top-level Ushuaia content kinds. This identifies their
// category, not cryptographic validity: the RPC's validated category supplies
// that claim. Octez 5c73fc9a, proto_025_PsUshuai/operation_repr.ml:686–1500.
const unrelatedKinds=new Set("reveal transaction origination delegation register_global_constant set_deposits_limit increase_paid_storage update_consensus_key update_companion_key transfer_ticket zk_rollup_origination zk_rollup_publish zk_rollup_update smart_rollup_originate dal_publish_commitment smart_rollup_add_messages smart_rollup_cement smart_rollup_publish smart_rollup_refute smart_rollup_timeout smart_rollup_execute_outbox_message smart_rollup_recover_bond seed_nonce_revelation vdf_revelation double_consensus_operation_evidence double_baking_evidence activate_account proposals ballot drain_delegate failing_noop dal_entrapment_evidence".split(" "));

export const nonnegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export function asBlockHeader(value: unknown): BlockHeader {
  if (
    !record(value) ||
    !nonnegativeInteger(value.level) ||
    typeof value.hash !== "string" ||
    typeof value.predecessor !== "string" ||
    !validTimestamp(value.timestamp) ||
    (value.proto !== undefined && !nonnegativeInteger(value.proto)) ||
    !Array.isArray(value.fitness) ||
    !value.fitness.every((item) => typeof item === "string") ||
    proposalRound(value.fitness,value.level)===undefined
  ) {
    throw new Error("Invalid block header from monitor/heads");
  }
  const payloadHash =
    typeof value.payload_hash === "string" ? value.payload_hash : undefined;
  return {
    level: value.level,
    ...(typeof value.chain_id==="string" ? {chainId:value.chain_id} : {}),
    ...(typeof value.proto === "number" ? {proto:value.proto} : {}),
    hash: value.hash,
    predecessor: value.predecessor,
    timestamp: value.timestamp,
    fitness: value.fitness,
    ...(payloadHash === undefined ? {} : { payload_hash: payloadHash }),
  };
}

/** The validated-block stream wraps its shell header and hash separately. */
export function asValidatedProposal(value: unknown): BlockHeader {
  if (
    !record(value) ||
    typeof value.chain_id !== "string" ||
    typeof value.hash !== "string" ||
    !record(value.header)
  ) {
    throw new Error("Invalid validated block from monitor/validated_blocks");
  }
  return {...asBlockHeader({ ...value.header, hash: value.hash }),chainId:value.chain_id};
}

function asOperation(value: unknown,onUnusable?:(phase?:"pre"|"att")=>void): MonitoredOperation {
  if (
    !record(value) ||
    typeof value.hash !== "string" ||
    !Array.isArray(value.contents)
  ) {
    throw new Error("Invalid operation from mempool monitor");
  }
  let invalid = value.contents.length===0;
  const invalidPhases=new Set<"pre"|"att">();
  let unclassifiable=invalid;
  const reject=(kind:unknown):void=>{invalid=true;if(kind==="preattestation" || kind==="preattestations_aggregate")invalidPhases.add("pre");else if(kind==="attestation" || kind==="attestation_with_dal" || kind==="attestations_aggregate")invalidPhases.add("att");else unclassifiable=true;};
  const contents: ConsensusContent[] = value.contents.flatMap(
    (content): ConsensusContent[] => {
      if (!record(content)) {reject(undefined); return [];}
      if (
        content.kind === "preattestations_aggregate" ||
        content.kind === "attestations_aggregate"
      ) {
        const consensus = content.consensus_content;
        if (
          !record(consensus) ||
          !nonnegativeInteger(consensus.level) ||
          !nonnegativeInteger(consensus.round) ||
          typeof consensus.block_payload_hash !== "string" || consensus.block_payload_hash.length===0 ||
          !Array.isArray(content.committee)
        ) {reject(content.kind); return [];}
        const kind =
          content.kind === "preattestations_aggregate"
            ? "preattestation"
            : "attestation";
        const level = consensus.level;
        const round = consensus.round;
        const block_payload_hash = consensus.block_payload_hash;
        return content.committee.flatMap((member): ConsensusContent[] => {
          const slot: unknown =
            kind === "preattestation"
              ? member
              : record(member)
                ? member.slot
                : undefined;
          if (!nonnegativeInteger(slot)) {reject(content.kind); return [];}
          return [{ kind, level, round, slot, block_payload_hash }];
        });
      }
      if (content.kind !== "preattestation" && content.kind !== "attestation" && content.kind !== "attestation_with_dal") {
        if(typeof content.kind!=="string" || !unrelatedKinds.has(content.kind))onUnusable?.();
        return [];
      }
      if (
        !nonnegativeInteger(content.level) ||
        !nonnegativeInteger(content.round) ||
        !nonnegativeInteger(content.slot)
      ) {reject(content.kind); return [];}
      const payload =
        typeof content.block_payload_hash === "string"
          ? { block_payload_hash: content.block_payload_hash }
          : {};
      if(!("block_payload_hash" in payload) || payload.block_payload_hash.length===0){reject(content.kind);return [];}
      return [
        {
          kind: content.kind,
          level: content.level,
          round: content.round,
          slot: content.slot,
          ...payload,
        },
      ];
    },
  );
  if(invalid){
    // The conservative operation parser discards an entire malformed envelope.
    // Any valid counted contents lost with it also invalidate their phase.
    for(const content of contents)invalidPhases.add(content.kind==="preattestation"?"pre":"att");
    if(unclassifiable)onUnusable?.();else for(const phase of invalidPhases)onUnusable?.(phase);
  }
  return { hash: value.hash, contents: invalid ? [] : contents, ...(typeof value.branch === "string" ? {branch:value.branch} : {}) };
}

export function asOperationBatch(value: unknown,onUnusable?:(phase?:"pre"|"att")=>void): MonitorOperationBatch {
  if (!Array.isArray(value)) throw new Error("Invalid mempool monitor batch");
  return value.map(operation=>asOperation(operation,onUnusable));
}
