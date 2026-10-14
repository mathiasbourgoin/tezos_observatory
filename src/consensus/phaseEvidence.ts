import type {AdmissionEvidence, MonitoredOperation, ObservationEvidence} from "../rpc/models";
import type {DelegateRight,TargetContext} from "../rpc/networkData";
import {nonnegativeInteger} from "../rpc/guards";

export interface Group {
  readonly level: number;
  readonly round: number;
  readonly payload: string;
  readonly contextKey: string;
  readonly evidence?: ObservationEvidence;
  readonly admission?:AdmissionEvidence;
  readonly pre: Set<string>;
  readonly att: Set<string>;
  readonly unknownSlots: readonly number[];
  readonly conflicts: readonly string[];
}
export type CommitteeAuthority = {readonly usable:true;readonly total:number;readonly threshold:number} | {readonly usable:false;readonly reason:string};

const contextFacts=(context:TargetContext):string=>JSON.stringify([context.key,context.level,context.protocolHash,context.observer.source.network,context.observer.source.baseUrl,context.observer.chainId,context.observer.header.hash,context.observer.header.predecessor,context.observer.protocolHash,context.observer.nextProtocolHash,context.anchor.header.hash,context.anchor.chainId,context.anchor.nextProtocolHash]);

/** The single numerical boundary used by the production inspector. */
export function committeeAuthority(rights: readonly DelegateRight[], expectedTotal?: number, threshold?: number): CommitteeAuthority {
  const contextual=rights.find(right=>right.context)?.context;
  if(contextual && rights.some(right=>!right.context || contextFacts(right.context)!==contextFacts(contextual)))return {usable:false,reason:"Mixed or incomplete committee context"};
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

export function evidenceContext(evidence?: ObservationEvidence,admission?:AdmissionEvidence): string {
  if(admission)return admission.contextKey;
  return JSON.stringify([evidence?.source.network ?? "unknown", evidence?.source.baseUrl ?? "unknown", evidence?.chainId ?? "unknown", evidence?.requestedHeadHash ?? "unknown", evidence?.observedHeadHash ?? "unknown", evidence?.predecessor ?? "unknown", evidence?.protocolLevel ?? "unknown"]);
}

export function observationContextCompatible(evidence:ObservationEvidence|undefined,context:TargetContext,admission?:AdmissionEvidence):boolean {
  const sidecar=admission!==undefined && admission.source.baseUrl===context.observer.source.baseUrl && admission.chainId===context.observer.chainId && admission.headHash===context.observer.header.hash && admission.predecessor===context.observer.header.predecessor && admission.anchorHash===context.anchor.header.hash && admission.protocolHash===context.protocolHash && admission.targetLevel===context.level && admission.contextKey===context.key;
  return evidence?.source.baseUrl===context.observer.source.baseUrl && (admission?sidecar:evidence.observedHeadHash===context.observer.header.hash) && (evidence.chainId===undefined || evidence.chainId===context.observer.chainId);
}

export function groupsFor(operations: readonly MonitoredOperation[], rights: readonly DelegateRight[], level: number): Group[] {
  const authorityContext=rights[0]?.context;
  const bySlot = committeeAuthority(rights).usable && authorityContext!==undefined ? new Map(rights.map(right => [right.slot,right.address])) : new Map<number,string>();
  type AccumulatedGroup = Omit<Group,"unknownSlots"|"conflicts"> & {unknownSlots:Set<number>;conflicts:Set<string>};
  const groups = new Map<string,AccumulatedGroup>();
  // Each unique signer/phase/group enters one membership. Conflict marking visits
  // those memberships once, rather than comparing every payload pair.
  const memberships = new Map<string,{address:string;groups:Set<AccumulatedGroup>}>();
  for (const operation of operations) for (const content of operation.contents) {
    if (content.level !== level || !content.block_payload_hash) continue;
    const admission=operation.admissions?.find(proof=>proof.contextKey===authorityContext?.key && proof.targetLevel===content.level)??operation.admissions?.find(proof=>proof.targetLevel===content.level)??(operation.admission?.targetLevel===content.level?operation.admission:undefined);
    const contextKey = evidenceContext(operation.evidence,admission);
    const key = JSON.stringify([contextKey,content.round,content.block_payload_hash]);
    let group = groups.get(key);
    if (!group) {
      group = {level,round:content.round,payload:content.block_payload_hash,contextKey,pre:new Set(),att:new Set(),unknownSlots:new Set(),conflicts:new Set(),...(operation.evidence ? {evidence:operation.evidence} : {}),...(admission?{admission}:{})};
      groups.set(key,group);
    }
    const compatible=authorityContext!==undefined && (authorityContext.level===content.level && observationContextCompatible(operation.evidence,authorityContext,admission));
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
