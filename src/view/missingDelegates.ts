import type {DelegateEligibility, DelegateProtocolStatus} from "../rpc/models";
import {delegateBadge} from "./delegateBadge";

export type MissingPhase = "preattestation" | "attestation";
export interface MissingDelegate { readonly address: string; readonly alias: string | null; readonly power: number; readonly protocolStatus: DelegateProtocolStatus }
export interface MissingPhaseModel { readonly phase: MissingPhase; readonly delegates: readonly MissingDelegate[]; readonly committeePower: number }
export interface EligibilitySummary { readonly count: number; readonly power: number }
export type MissingSummary = Readonly<Record<DelegateEligibility, EligibilitySummary>>;

const initial = (): Record<DelegateEligibility, EligibilitySummary> => ({forbidden:{count:0,power:0},eligible:{count:0,power:0},unavailable:{count:0,power:0}});
export function summarizeMissing(delegates: readonly MissingDelegate[]): MissingSummary {
  const summary=initial();
  for(const delegate of delegates){const key=delegate.protocolStatus.eligibility,current=summary[key];summary[key]={count:current.count+1,power:current.power+delegate.power};}
  return summary;
}
const text=(tag:keyof HTMLElementTagNameMap,value:string,className?:string):HTMLElement=>{const element=document.createElement(tag);element.textContent=value;if(className!==undefined)element.className=className;return element;};
export function renderMissingPhase(container:HTMLElement,model:MissingPhaseModel):void{
  const counts=summarizeMissing(model.delegates),details=document.createElement("details");details.className="missing-phase";details.dataset.phase=model.phase;
  const title=model.phase==="preattestation"?"Missing preattestations":"Missing attestations",summary=document.createElement("summary");summary.dataset.testid=`${model.phase}-summary`;
  summary.textContent=`${title}: ${model.delegates.length} · ${counts.forbidden.count} forbidden (${counts.forbidden.power} power) · ${counts.eligible.count} eligible (${counts.eligible.power} power) · ${counts.unavailable.count} status unavailable (${counts.unavailable.power} power)`;details.append(summary);
  const body=document.createElement("div");body.className="missing-body";
  for(const delegate of [...model.delegates].sort((a,b)=>b.power-a.power)){const row=document.createElement("div");row.className="missing-row";row.dataset.delegate=delegate.address;row.append(text("span",delegate.alias??"No alias","missing-alias"));const address=text("code",delegate.address,"missing-address");address.title=delegate.address;row.append(address,text("span",`${delegate.power} power`,`missing-power`),text("span",model.committeePower>0?`${(100*delegate.power/model.committeePower).toFixed(2)}%`:"unavailable","missing-percentage"));const badgeModel=delegateBadge(delegate.protocolStatus),badge=text("span",badgeModel.label,`delegate-badge ${badgeModel.className}`);badge.title=badgeModel.title;badge.dataset.testid=`status-${delegate.address}`;row.append(badge);body.append(row);}
  details.append(body);container.replaceChildren(details);
}
