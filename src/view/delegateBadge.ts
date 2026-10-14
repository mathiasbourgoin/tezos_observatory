import type {DelegateProtocolStatus} from "../rpc/models";

export interface DelegateBadge {
  readonly label: "FORBIDDEN" | "eligible" | "unavailable";
  readonly className: "delegate-forbidden" | "delegate-eligible" | "delegate-unavailable";
  readonly title: string;
}

export function delegateBadge(status: DelegateProtocolStatus | undefined): DelegateBadge {
  if (status?.eligibility === "forbidden") {
    return {label: "FORBIDDEN", className: "delegate-forbidden",
      title: "This delegate is protocol-forbidden at the observed block hash"};
  }
  if (status?.eligibility === "eligible") {
    return {label: "eligible", className: "delegate-eligible",
      title: "This delegate is not protocol-forbidden at the observed block hash"};
  }
  return {label: "unavailable", className: "delegate-unavailable",
    title: status?.reason ?? "Protocol eligibility was not available"};
}
