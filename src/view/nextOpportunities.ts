import type {NetworkName} from "../rpc/models";

export interface BakerIdentity {
  readonly delegate: string;
  readonly alias: string | null;
}

export interface ProposalOpportunity {
  readonly level: number;
  readonly round: number;
  readonly bakers: readonly BakerIdentity[];
}

export interface NextOpportunitiesModel {
  readonly network: NetworkName;
  readonly state: "loading" | "ready";
  readonly observedRound: number | null;
  readonly theoreticalRound: number | null;
  readonly sameLevel: ProposalOpportunity | null;
  readonly nextLevelRoundZero: ProposalOpportunity | null;
}

const addText = (parent: HTMLElement, tag: keyof HTMLElementTagNameMap,
  value: string, className?: string): HTMLElement => {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className !== undefined) element.className = className;
  parent.append(element);
  return element;
};

function opportunityRow(kind: "same-level" | "next-level", value: ProposalOpportunity | null,
  loading: boolean): HTMLElement {
  const row = document.createElement("div");
  row.className = "proposal-opportunity";
  row.dataset.kind = kind;
  const fallback = kind === "same-level" ? "Next round at proposal level" : "Next level · round 0";
  addText(row, "span", value === null ? fallback :
    `Level ${value.level} · round ${value.round}`, "opportunity-label");
  const bakers = document.createElement("span");
  bakers.className = "opportunity-bakers";
  if (loading) {
    bakers.textContent = "Loading…";
    row.dataset.state = "loading";
  } else if (value === null) {
    bakers.textContent = kind === "same-level" ? "Not applicable" : "status unavailable";
    row.dataset.state = kind === "same-level" ? "not-applicable" : "unavailable";
  } else {
    bakers.textContent = value.bakers.length === 0 ? "status unavailable" :
      value.bakers.map(baker => baker.alias === null ? baker.delegate :
        `${baker.alias} (TzKT) · ${baker.delegate}`).join("; ");
    row.dataset.state = value.bakers.length === 0 ? "unavailable" : "ready";
  }
  row.append(bakers);
  return row;
}

export function renderNextOpportunities(container: HTMLElement, model: NextOpportunitiesModel): void {
  const panel = document.createElement("section");
  panel.className = "next-opportunities";
  panel.dataset.network = model.network;
  panel.dataset.testid = `${model.network}-opportunities`;
  const observed = model.observedRound === null ? "pending" : String(model.observedRound);
  const theoretical = model.theoreticalRound === null ? "pending" : String(model.theoreticalRound);
  addText(panel, "h3", `Observed activity round ${observed} · theoretical opportunity round ${theoretical}`);
  panel.append(opportunityRow("same-level", model.sameLevel, model.state === "loading"));
  panel.append(opportunityRow("next-level", model.nextLevelRoundZero, model.state === "loading"));
  container.replaceChildren(panel);
}
