/** Round zero starts after the predecessor's own round duration. All times in ms. */
export function roundSchedule(
  anchor: number,
  minimum: number,
  increment: number,
  now: number,
): { round: number; startedAt: number; endsAt: number } {
  if (
    ![anchor, minimum, increment, now].every(Number.isFinite) ||
    minimum <= 0 ||
    increment < 0
  ) {
    throw new Error("Invalid round schedule");
  }
  const elapsed = Math.max(0, (now - anchor) / 1000);
  const before = (r: number): number =>
    r * minimum + (increment * r * (r - 1)) / 2;
  const b = minimum - increment / 2;
  let round =
    increment === 0
      ? Math.floor(elapsed / minimum)
      : Math.floor(
          (2 * elapsed) / (Math.sqrt(b * b + 2 * increment * elapsed) + b),
        );
  round = Math.max(0, round);
  if (before(round) > elapsed) round = Math.max(0, round - 1);
  if (before(round + 1) <= elapsed) round += 1;
  return {
    round,
    startedAt: anchor + before(round) * 1000,
    endsAt: anchor + before(round + 1) * 1000,
  };
}

export function proposalRound(fitness: readonly string[]): number {
  const value = fitness[4];
  if (value === undefined || !/^[0-9a-fA-F]{8}$/.test(value)) return 0;
  return Number.parseInt(value, 16);
}
