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

export interface TenderbakeFitness {
  readonly level:number;
  readonly round:number;
  readonly predecessorRound:number;
  readonly lockedRound?:number;
}

/** Full protocol fitness validation; absent/legacy evidence never fabricates r0. */
export function tenderbakeFitness(fitness:readonly string[],expectedLevel?:number):TenderbakeFitness|undefined {
  if(fitness.length!==5 || fitness[0]!=="02")return undefined;
  const level=fitness[1],locked=fitness[2],predecessor=fitness[3],round=fitness[4];
  if(level===undefined || locked===undefined || predecessor===undefined || round===undefined || ![level,predecessor,round].every(value=>/^[0-9a-fA-F]{8}$/.test(value)) || (locked!=="" && !/^[0-9a-fA-F]{8}$/.test(locked)))return undefined;
  const parsedLevel=Number.parseInt(level,16),parsedRound=Number.parseInt(round,16),encodedPredecessor=Number.parseInt(predecessor,16);
  const lockedRound=locked===""?undefined:Number.parseInt(locked,16);
  if(parsedLevel>0x7fffffff || parsedRound>0x7fffffff || encodedPredecessor<=0x7fffffff || (lockedRound!==undefined && (lockedRound>0x7fffffff || lockedRound>=parsedRound)) || (expectedLevel!==undefined && parsedLevel!==expectedLevel))return undefined;
  return {level:parsedLevel,round:parsedRound,predecessorRound:0xffffffff-encodedPredecessor,...(lockedRound===undefined?{}:{lockedRound})};
}

export function proposalRound(fitness: readonly string[],expectedLevel?:number): number|undefined {
  return tenderbakeFitness(fitness,expectedLevel)?.round;
}
