export type ConsensusKind = "preattestation" | "attestation";

export interface ConsensusActivity {
  readonly kind: ConsensusKind;
  readonly level: number;
  readonly round: number;
  readonly payload: string;
  readonly operations: number;
  readonly power: number;
}

export interface ActivitySelection {
  readonly level: number;
  readonly round: number;
  readonly payload: string;
  readonly preattestation: ConsensusActivity | null;
  readonly attestation: ConsensusActivity | null;
}

export function selectLatestActivity(groups: readonly ConsensusActivity[],
  targetLevel: number): ActivitySelection | null {
  const candidates = groups.filter(group => group.level === targetLevel &&
    (group.operations > 0 || group.power > 0));
  if (candidates.length === 0) return null;
  const latestRound = Math.max(...candidates.map(group => group.round));
  const atRound = candidates.filter(group => group.round === latestRound);
  const payloadPower = new Map<string, number>();
  for (const group of atRound) payloadPower.set(group.payload,
    (payloadPower.get(group.payload) ?? 0) + group.power);
  const selectedPayload = [...payloadPower].sort((left, right) =>
    right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0];
  if (selectedPayload === undefined) return null;
  const selected = atRound.filter(group => group.payload === selectedPayload);
  return {level: targetLevel, round: latestRound, payload: selectedPayload,
    preattestation: selected.find(group => group.kind === "preattestation") ?? null,
    attestation: selected.find(group => group.kind === "attestation") ?? null};
}
