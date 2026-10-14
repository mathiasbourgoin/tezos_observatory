import type {MonitoredOperation, ObservationEvidence} from "../rpc/models";
import type {DelegateRight,TargetContext} from "../rpc/networkData";
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

export function observationContextCompatible(evidence:ObservationEvidence|undefined,context:TargetContext):boolean {
  return evidence?.source.baseUrl===context.observer.source.baseUrl && evidence.observedHeadHash===context.observer.header.hash && (evidence.chainId===undefined || evidence.chainId===context.observer.chainId);
}

export function groupsFor(operations: readonly MonitoredOperation[], rights: readonly DelegateRight[], level: number): Group[] {
  const bySlot = committeeAuthority(rights).usable ? new Map(rights.map(right => [right.slot,right.address])) : new Map<number,string>();
  type AccumulatedGroup = Omit<Group,"unknownSlots"|"conflicts"> & {unknownSlots:Set<number>;conflicts:Set<string>};
  const groups = new Map<string,AccumulatedGroup>();
  // Each unique signer/phase/group enters one membership. Conflict marking visits
  // those memberships once, rather than comparing every payload pair.
  const memberships = new Map<string,{address:string;groups:Set<AccumulatedGroup>}>();
  for (const operation of operations) for (const content of operation.contents) {
    if (content.level !== level || !content.block_payload_hash) continue;
    const contextKey = evidenceContext(operation.evidence);
    const key = JSON.stringify([contextKey,content.round,content.block_payload_hash]);
    let group = groups.get(key);
    if (!group) {
      group = {level,round:content.round,payload:content.block_payload_hash,contextKey,pre:new Set(),att:new Set(),unknownSlots:new Set(),conflicts:new Set(),...(operation.evidence ? {evidence:operation.evidence} : {})};
      groups.set(key,group);
    }
    const authorityContext=rights[0]?.context;
    const compatible=!authorityContext || (authorityContext.level===content.level && observationContextCompatible(operation.evidence,authorityContext));
    const address = compatible ? bySlot.get(content.slot) : undefined;
    if (!address) {group.unknownSlots.add(content.slot);continue;}
    const phase = content.kind === "preattestation" ? "pre" : "att";
    if (group[phase].has(address)) continue;
    group[phase].add(address);
    const membershipKey = JSON.stringify([contextKey,content.round,phase,address]);
    let membership = memberships.get(membershipKey);
    if (!membership) {
      membership = {address,groups:new Set()};memberships.set(membershipKey,membership);
    }
    membership.groups.add(group);
  }
  for (const membership of memberships.values()) {
    if (membership.groups.size < 2) continue;
    for (const group of membership.groups) group.conflicts.add(membership.address);
  }
  return [...groups.values()].map(group => ({...group,conflicts:[...group.conflicts].sort(),unknownSlots:[...group.unknownSlots].sort((a,b)=>a-b)}));
}
