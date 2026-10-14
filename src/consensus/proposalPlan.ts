import type {BlockHeader} from "../rpc/models";

export interface ProposalRightRequest {
  readonly level: number;
  readonly round: number;
  readonly label: string;
}

export interface ProposalPlan {
  readonly next: ProposalRightRequest;
  readonly roundZero: ProposalRightRequest;
}

export function proposalPlan(head: BlockHeader, liveRound: number): ProposalPlan {
  if (!Number.isSafeInteger(liveRound) || liveRound < 0) {
    throw new Error("Live round must be a non-negative integer");
  }
  const level = head.level + 1;
  return {
    next: {level, round: liveRound + 1,
      label: `Next proposal: level ${level} · round ${liveRound + 1}`},
    roundZero: {level, round: 0,
      label: `Round-0 proposer for level ${level}`},
  };
}
