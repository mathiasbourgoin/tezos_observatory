import type {BlockHeader} from '../rpc/models';
import type {BakingRight,Constants,TargetContext} from '../rpc/networkData';
import type {ObservationEvidence} from '../rpc/models';

const secondsBeforeRound=(round:number,minimum:number,increment:number):number=>round*minimum+increment*round*(round-1)/2;
export const validCalendarMilliseconds=(value:number):boolean=>Number.isSafeInteger(value)&&Math.abs(value)<=8640000000000000;

/** Round zero starts after the predecessor's own round duration. All times in ms. */
export function roundSchedule(
  anchor: number,
  minimum: number,
  increment: number,
  now: number,
): { round: number; startedAt: number; endsAt: number } | undefined {
  if (
    ![anchor, minimum, increment, now].every(Number.isFinite) ||
    minimum <= 0 ||
    increment < 0
  ) {
    throw new Error("Invalid round schedule");
  }
  const elapsed = Math.max(0, (now - anchor) / 1000);
  const before = (r: number): number => secondsBeforeRound(r,minimum,increment);
  const b = minimum - increment / 2;
  let round = elapsed===0?0:
    increment === 0
      ? Math.floor(elapsed / minimum)
      : Math.floor(b>=0
          ? (2 * elapsed) / (Math.sqrt(b * b + 2 * increment * elapsed) + b)
          : (Math.sqrt(b * b + 2 * increment * elapsed) - b) / increment);
  round = Math.max(0, round);
  if (before(round) > elapsed) round = Math.max(0, round - 1);
  if (before(round + 1) <= elapsed) round += 1;
  const startedAt=anchor+before(round)*1000,endsAt=anchor+before(round+1)*1000;
  if(!Number.isSafeInteger(round)||round<0||round>=0x7fffffff||!validCalendarMilliseconds(startedAt)||!validCalendarMilliseconds(endsAt)||endsAt<=startedAt)return undefined;
  return {round,startedAt,endsAt};
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


export interface ConditionalRoundInput {
  readonly referenceTimestamp:number;
  readonly referenceRound:number;
  readonly branch:'same-level'|'next-level';
  readonly minimum:number;
  readonly increment:number;
  readonly roundBasis:'proven'|'unknown';
}
/** A conditional protocol boundary; never advances an observed instance. */
export function conditionalRoundBoundary(input:ConditionalRoundInput):number|undefined {
  const {referenceTimestamp,referenceRound,minimum,increment}=input;
  if(input.roundBasis!=='proven'||![referenceTimestamp,referenceRound,minimum,increment].every(Number.isSafeInteger)||!validCalendarMilliseconds(referenceTimestamp)||referenceRound<0||referenceRound>0x7fffffff||minimum<=0||increment<0||(input.branch==='same-level'&&referenceRound===0x7fffffff))return undefined;
  // S(R+1)-S(R)=D(R). For a successor, D(R) uses its execution
  // parameters, including the term contributed by the predecessor round.
  const seconds=minimum+referenceRound*increment,milliseconds=seconds*1000,boundary=referenceTimestamp+milliseconds;
  return [seconds,milliseconds,boundary].every(Number.isSafeInteger)&&validCalendarMilliseconds(boundary)?boundary:undefined;
}


export type ProvenTimingConstants=Constants & {readonly context:TargetContext;readonly evidence:ObservationEvidence};
export type ProvenBakingRight=BakingRight & {readonly context:TargetContext;readonly evidence:ObservationEvidence};
export interface OpportunityFact {
  readonly branch:'same-level'|'next-level';
  readonly level:number;
  readonly round:number;
  readonly condition:string;
  readonly capturedAt:number;
  readonly capturedMonotonic:number;
  readonly proposer:{readonly state:'known';readonly right:ProvenBakingRight}|{readonly state:'unavailable';readonly reason:string};
  readonly timing:{readonly state:'known';readonly basis:'observed-selected'|'hypothetical-selected';readonly parameters:ProvenTimingConstants;readonly reference:BlockHeader;readonly referenceTimestamp:number;readonly referenceRound:number;readonly deadline:number;readonly remainingAtCapture:number}|{readonly state:'unavailable';readonly reason:string};
}
export interface OpportunityCaptureToken {
  readonly contextFacts:string;
  readonly observerGeneration:number;
  readonly collectionGeneration:number;
}


export type ProtocolRoundInput=Omit<ConditionalRoundInput,'branch'> & {readonly targetRound:number};
/** Hypothetical target-round timestamp from its proven predecessor and execution parameters. */
export function protocolRoundStart(input:ProtocolRoundInput):number|undefined {
  if(!Number.isSafeInteger(input.targetRound)||input.targetRound<0||input.targetRound>0x7fffffff)return undefined;
  const zero=conditionalRoundBoundary({...input,branch:'next-level'});if(zero===undefined)return undefined;
  const seconds=secondsBeforeRound(input.targetRound,input.minimum,input.increment),milliseconds=seconds*1000,timestamp=zero+milliseconds;
  return [seconds,milliseconds,timestamp].every(Number.isSafeInteger)&&validCalendarMilliseconds(timestamp)?timestamp:undefined;
}
