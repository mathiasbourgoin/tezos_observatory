import type {MonitoredOperation, ObservationEvidence} from "../rpc/models";
import type {DelegateRight} from "../rpc/networkData";
import {nonnegativeInteger} from "../rpc/guards";

export interface Group {
  readonly level: number;
  readonly round: number;
  readonly payload: string;
  readonly contextKey: string;
  readonly evidence?: ObservationEvidence;
  readonly pre: Set<string>;
  readonly att: Set<string>;
  readonly unknownSlots: readonly number[];
  readonly conflicts: readonly string[];
}
export type CommitteeAuthority = {readonly usable:true;readonly total:number;readonly threshold:number} | {readonly usable:false;readonly reason:string};

/** The single numerical boundary used by the production inspector. */
export function committeeAuthority(rights: readonly DelegateRight[], expectedTotal?: number, threshold?: number): CommitteeAuthority {
  const addresses = new Set<string>(), slots = new Set<number>();
  let total = 0;
  for (const right of rights) {
    if (!right.address || addresses.has(right.address) || slots.has(right.slot) || !nonnegativeInteger(right.slot) || !nonnegativeInteger(right.power)) return {usable:false,reason:"Invalid or contradictory committee"};
    addresses.add(right.address); slots.add(right.slot); total += right.power;
    if (!Number.isSafeInteger(total)) return {usable:false,reason:"Unsafe cumulative committee power"};
  }
  if (total <= 0 || (expectedTotal !== undefined && (!nonnegativeInteger(expectedTotal) || expectedTotal !== total))) return {usable:false,reason:"Incomplete committee total"};
  const required = threshold ?? total;
  if (!nonnegativeInteger(required) || required === 0 || required > total) return {usable:false,reason:"Invalid quorum threshold"};
  return {usable:true,total,threshold:required};
}

export function signerPower(signers: ReadonlySet<string>, rights: readonly DelegateRight[]): number | undefined {
  if (!committeeAuthority(rights).usable) return undefined;
  let power = 0;
  for (const right of rights) if (signers.has(right.address)) {
    power += right.power;
    if (!Number.isSafeInteger(power)) return undefined;
  }
  return power;
}

export function evidenceContext(evidence?: ObservationEvidence): string {
  return JSON.stringify([evidence?.source.network ?? "unknown", evidence?.source.baseUrl ?? "unknown", evidence?.chainId ?? "unknown", evidence?.requestedHeadHash ?? "unknown", evidence?.observedHeadHash ?? "unknown", evidence?.predecessor ?? "unknown", evidence?.protocolLevel ?? "unknown"]);
}

export function groupsFor(operations: readonly MonitoredOperation[], rights: readonly DelegateRight[], level: number): Group[] {
  const bySlot = committeeAuthority(rights).usable ? new Map(rights.map(right => [right.slot,right.address])) : new Map<number,string>();
  const groups = new Map<string, Group & {unknownSlots:number[];conflicts:string[]}>();
  for (const operation of operations) for (const content of operation.contents) {
    if (content.level !== level || !content.block_payload_hash) continue;
    const contextKey = evidenceContext(operation.evidence);
    const key = JSON.stringify([contextKey,content.round,content.block_payload_hash]);
    let group = groups.get(key);
    if (!group) {
      group = {level,round:content.round,payload:content.block_payload_hash,contextKey,pre:new Set(),att:new Set(),unknownSlots:[],conflicts:[],...(operation.evidence ? {evidence:operation.evidence} : {})};
      groups.set(key,group);
    }
    const address = bySlot.get(content.slot);
    if (!address) {if (!group.unknownSlots.includes(content.slot)) group.unknownSlots.push(content.slot); continue;}
    (content.kind === "preattestation" ? group.pre : group.att).add(address);
  }
  const values = [...groups.values()];
  for (const group of values) {
    const conflicts = new Set<string>();
    for (const other of values) {
      if (group.contextKey !== other.contextKey || group.round !== other.round || group.payload === other.payload) continue;
      for (const address of group.pre) if (other.pre.has(address)) conflicts.add(address);
      for (const address of group.att) if (other.att.has(address)) conflicts.add(address);
    }
    group.conflicts = [...conflicts].sort(); group.unknownSlots.sort((a,b) => a-b);
  }
  return values;
}
