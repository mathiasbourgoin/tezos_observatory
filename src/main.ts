import "./dashboard.css";
import {groupsFor, committeeAuthority, signerPower, observationContextCompatible} from "./consensus/phaseEvidence";
import {headFactsKey} from "./monitor/headGeneration";
import {
  createDashboard,
  type NetworkViewModel,
  type DelegateView,
} from "./dashboardView";
import {
  NetworkMonitor,
  type NetworkMonitorView,
} from "./monitor/networkMonitor";
import {
  NetworkData,
  sources,
  streamSources,
  type Derived,
  type DelegateRight,
} from "./rpc/networkData";
import type {
  NetworkName,
  BlockHeader,
} from "./rpc/models";
import { proposalRound, roundSchedule } from "./consensus/roundSchedule";
declare const __APP_REVISION__: string;

const root = document.getElementById("app");
if (!root) throw new Error("Missing dashboard root");
let userPaused = false;
let pageActive = true;
const collectionAllowed = (): boolean => pageActive && !userPaused && !document.hidden;
const runtimes = new Map<NetworkName, Runtime>();
const dashboard = createDashboard(root, {
  revision: __APP_REVISION__,
  onPauseChange(paused) {
    userPaused = paused;
    for (const runtime of runtimes.values()) syncCollection(runtime);
  },
  onSelect(network, identity) {
    const runtime = runtimes.get(network);
    if (!runtime) return;
    runtime.followLiveSelection=false;runtime.selectedIdentity = identity;
    if(runtime.view?.inspection.mode==="pin" || runtime.view?.history.some(snapshot=>snapshot.identity===identity)){if(!runtime.monitor.pinObservation(identity))runtime.monitor.followLive();}
    scheduleRender(runtime);
  },
  onPin(network){const runtime=runtimes.get(network),identity=runtime?.selectedIdentity??runtime?.view?.inspection.selectedIdentity;if(runtime&&identity)runtime.monitor.pinObservation(identity);},
  onFollow(network){const runtime=runtimes.get(network);if(runtime){delete runtime.selectedIdentity;runtime.followLiveSelection=true;runtime.monitor.followLive();}},
  onLatest(network){const runtime=runtimes.get(network);if(runtime){delete runtime.selectedIdentity;runtime.followLiveSelection=!runtime.monitor.latestObservation();}},
  onRetry(network,identity){if(collectionAllowed())runtimes.get(network)?.monitor.reconcileObservation(identity);},
  onReconnect() {
    if (collectionAllowed()) for (const runtime of runtimes.values()) {
      stopCollection(runtime);syncCollection(runtime);runtime.monitor.refreshDerived();
    }
  },
});

interface Runtime {
  network: NetworkName;
  collectionActive: boolean;
  selectedIdentity?: string;
  followLiveSelection:boolean;
  data: NetworkData;
  monitor: NetworkMonitor<Derived>;
  view: NetworkMonitorView<Derived> | null;
  opportunities: NonNullable<NetworkViewModel["nextBakers"]>;
  opportunityKey: string;
  opportunityAt: number;
  opportunityController: AbortController;
  eligibilityHead: string;
  requestFrame: number | null;
}


function stopCollection(runtime:Runtime):void {
  runtime.collectionActive=false;runtime.monitor.stop();runtime.data.pause();runtime.opportunityController.abort();
}

function syncCollection(runtime:Runtime):void {
  if(!collectionAllowed()) {
    if(runtime.collectionActive)stopCollection(runtime);
  } else if(!runtime.collectionActive) {
    runtime.collectionActive=true;runtime.data.resume();
    runtime.opportunityController=new AbortController();runtime.opportunityKey="";runtime.opportunityAt=0;runtime.eligibilityHead="";
    runtime.monitor.start();void runtime.data.loadAliases().then(()=>scheduleRender(runtime));
  }
  scheduleRender(runtime);
}

function sessionModel(runtime:Runtime):NonNullable<NetworkViewModel["session"]> {
 const view=runtime.view;if(!view)return {mode:"follow",frozen:false,newer:0,newerPartial:false,canPin:false,accepted:0,unresolved:0,raw:0,instances:[]};const selected=runtime.selectedIdentity??view.inspection.selectedIdentity;
 return {mode:view.inspection.mode,frozen:view.inspection.frozen,newer:view.inspection.newer,newerPartial:view.inspection.newerPartial,...(view.inspection.snapshot?{selected:view.inspection.snapshot.identity}:{}),canPin:selected!==undefined&&view.observationTargets.some(record=>record.identity===selected),accepted:view.observationTargets.filter(record=>record.target.candidate).length,unresolved:view.unresolvedTargets.length,raw:view.rawOperations.length,instances:view.history.map(snapshot=>({identity:snapshot.identity,label:`${snapshot.record.target.source.name} · ${snapshot.record.target.level}/${snapshot.record.target.round} · ${snapshot.record.target.payload??"payload unknown"} · ${snapshot.candidates.length} candidates`}))};
}
function capturedEvents(runtime:Runtime):NonNullable<NetworkViewModel["events"]> {const view=runtime.view;return view?view.acceptedEvents.map(event=>({identity:event.identity,observedAt:event.evidence.receivedAt,description:`${event.phase==="pre"?"Preattestation":"Attestation"} ${event.kind==="crossing"?"crossing":"observed quorum"} · level ${event.level} · round ${event.round} · payload ${event.payload} · power ${event.power} · threshold ${event.threshold} · source ${event.evidence.source.baseUrl} · chain ${event.chainId} · payload-shared attribution`})):[];}
function capturedRecent(runtime:Runtime):NonNullable<NetworkViewModel["recentConsensus"]> {
 return (runtime.view?.history??[]).slice(0,5).map(snapshot=>{const record=snapshot.record,pre=record.phases?.pre,att=record.phases?.att;return {identity:snapshot.identity,level:record.target.level,round:record.target.round,total:pre?.maximumTotal??att?.maximumTotal??record.admission?.constants.committee??0,...(pre?{prePower:pre.maximumPower,preTotal:pre.maximumTotal}:{}),...(att?{attPower:att.maximumPower,attTotal:att.maximumTotal}:{}),...(record.target.payload?{payload:record.target.payload}:{}),source:record.target.source.baseUrl};});
}
function renderPinned(runtime:Runtime):boolean {
 const view=runtime.view,pin=view?.inspection;if(!view||!pin||pin.mode!=="pin")return false;const snapshot=pin.snapshot,applied=view.snapshot?.head;
 if(!snapshot){dashboard.update(runtime.network,{status:"unknown",note:"Pinned session facts unavailable",session:sessionModel(runtime)});return true;}
 const record=snapshot.record,candidate=snapshot.candidates.find(value=>value.identity===pin.selectedIdentity)?.target.candidate,context=record.admission?.context,complete=record.coverage?.complete===true&&!snapshot.partial&&!record.coverageStale;
 const original=candidate?.evidence??snapshot.evidence;
 const live=view.observationTargets.find(value=>value.identity===pin.selectedIdentity),liveState=!live?"outside LIVE-active index":!collectionAllowed()||live.contextInvalid||live.coverageStale?"stale/unavailable":"coherent under last proven observer context";
 const delegate=(right:Readonly<DelegateRight>):DelegateView=>({address:right.address,power:right.power,...(runtime.data.alias(right.address)?{alias:`${runtime.data.alias(right.address)} · TzKT`}:{}),eligibility:"unavailable",eligibilityNote:"Historical eligibility was not captured; current helper state is not substituted"});
 const model:NetworkViewModel={status:view.headStream.error?"degraded":"unknown",session:sessionModel(runtime),level:record.target.level,consensusLevel:record.target.level,round:record.target.round,activityRound:record.target.round,roundSource:"observed",...(pin.selectedIdentity?{selectedIdentity:pin.selectedIdentity}:{}),...(record.target.payload?{payload:record.target.payload}:{}),...(applied?{appliedLevel:applied.level,...(proposalRound(applied.fitness,applied.level)===undefined?{}:{appliedRound:proposalRound(applied.fitness,applied.level)!}),hash:applied.hash,blockTimestamp:Date.parse(applied.timestamp),...(applied.evidence?{observedAt:applied.evidence.receivedAt,observedMonotonic:applied.evidence.receivedMonotonic}:{}),snapshotMonotonic:snapshot.evidence.receivedMonotonic}:{}),candidates:snapshot.candidates.map(value=>({identity:value.identity,hash:value.target.candidate!.header.hash,level:value.target.level,round:value.target.round,...(value.target.payload?{payload:value.target.payload}:{})})),...(candidate?{observedProposal:{level:candidate.header.level,round:record.target.round,...(candidate.header.payload_hash?{payload:candidate.header.payload_hash}:{}),at:candidate.evidence.receivedAt}}:{}),candidateEvidence:`${candidate?`Observed block hash ${candidate.header.hash}`:"Candidate hash unavailable"} · Producer unknown · Shared payload evidence; signatures are not candidate-specific · Source ${original.source.baseUrl} · requested head ${original.requestedHeadHash??"unknown"} · observed head ${original.observedHeadHash??"unknown"} · observed head parent ${original.predecessor??"unknown"} · original chain ${original.chainId??"unknown"} · protocol-level counter ${original.protocolLevel??"unknown"} · candidate parent ${candidate?.header.predecessor??"unknown"} · first received ${new Date(snapshot.evidence.receivedAt).toISOString()} · selected fact received ${new Date(original.receivedAt).toISOString()}${snapshot.partial?" · Historical inspection facts partially retained":""}${snapshot.unknownSlots.length?` · Unknown-rights signer slots: ${snapshot.unknownSlots.join(", ")}`:""}`,contextEvidence:context?`Captured source/context · ${context.observer.source.baseUrl} · chain ${context.observer.chainId} · context head ${context.observer.header.hash} · parent ${context.observer.header.predecessor} · anchor ${context.anchor.header.hash} · target ${context.level} · execution protocol ${context.protocolHash} · rights requested anchor ${record.admission?.rights[0]?.evidence?.requestedHeadHash??"unknown"} · rights received ${record.admission?.rights[0]?.evidence?new Date(record.admission.rights[0].evidence.receivedAt).toISOString():"unknown"}`:"Historical context unavailable",recentConsensus:capturedRecent(runtime),connection:collectionAllowed()?"Collection continues independently":"Paused",source:record.target.source.name,note:`${pin.frozen?"Pinned frozen snapshot outside retained history":"Pinned retained session instance"} · Current selected identity ${liveState} · As of ${new Date(record.phases?.pre?.maximumEvidence.receivedAt??snapshot.evidence.receivedAt).toISOString()} · ${complete?"Captured source-snapshot coverage; no global completeness claim":"Historical coverage partial/unavailable"}. ${record.coverage?`Source snapshot received ${new Date(record.coverage.evidence.receivedAt).toISOString()} · source ${record.coverage.evidence.source.baseUrl} · ${record.coverage.reasons.join("; ")||"complete validated category as received"}. `:""}Historical opportunity facts unavailable until captured; current timing and rights are not substituted.`,events:capturedEvents(runtime),sources:[]};
 for(const phase of ["pre","att"] as const){const fact=record.phases?.[phase],committee=snapshot.phaseCommittees[phase],addresses=phase==="pre"?snapshot.currentPre:snapshot.currentAtt;if(!fact||!committee)continue;const total=signerPower(new Set(committee.map(right=>right.address)),committee);if(total===undefined||total<=0||(fact.power===0&&!complete))continue;const value={count:addresses.length,expected:committee.length,power:fact.power,total};if(phase==="pre")model.preattestations=value;else model.attestations=value;model.quorum=fact.threshold;model.committeePower=total;}
 if(complete){model.missingPre=snapshot.committee.filter(right=>!snapshot.currentPre.includes(right.address)).map(delegate);model.missingAtt=snapshot.committee.filter(right=>!snapshot.currentAtt.includes(right.address)).map(delegate);}
 dashboard.update(runtime.network,model);return true;
}

function render(runtime: Runtime): void {
  const view = runtime.view;
  const snapshot = view?.snapshot;
  if (!view || !snapshot) {
    const error = view?.headStream.error;
    dashboard.update(runtime.network, {
      status: error ? "degraded" : "loading",
      connection: !collectionAllowed() ? "Paused" : "Connecting",
      ...(error ? { error } : {}),
      sources: sources[runtime.network].map((s) => ({
        name: s.name,
        url: s.baseUrl,
        status: "Standby",
      })),
    });
    return;
  }
  if(renderPinned(runtime))return;
  const appliedHead=snapshot.head,appliedRound=proposalRound(snapshot.head.fitness,snapshot.head.level);
  const retainedTargets=[...view.observationTargets,...view.unresolvedTargets];
  const sourceLocalTargets=retainedTargets.filter(target=>target.target.source.baseUrl!==appliedHead.evidence?.source.baseUrl || (target.admission!==undefined && target.admission.head.hash!==appliedHead.hash) || target.target.level>appliedHead.level+1).sort((a,b)=>b.evidence.receivedMonotonic-a.evidence.receivedMonotonic||a.identity.localeCompare(b.identity));
  const selectedIdentity=runtime.followLiveSelection?view.inspection.selectedIdentity:runtime.selectedIdentity;
  const sourceTarget=retainedTargets.find(target=>target.identity===selectedIdentity)??(runtime.followLiveSelection?undefined:sourceLocalTargets.find(target=>target.admission&&!target.contextInvalid)??sourceLocalTargets[0]);
  const admitted=sourceTarget && !sourceTarget.contextInvalid?sourceTarget.admission:undefined;
  const head=admitted?.head??snapshot.head,derived=sourceTarget?admitted?.derived??null:snapshot.derived,operations=sourceTarget?view.rawOperations:snapshot.operations;
  const now = Date.now(),
    headRound = proposalRound(head.fitness,head.level);
  if(headRound===undefined) {
    dashboard.update(runtime.network,{status:"degraded",appliedLevel:appliedHead.level,hash:appliedHead.hash,blockTimestamp:Date.parse(appliedHead.timestamp),note:"Applied round unavailable: unsupported or malformed fitness; consensus authority unavailable",connection:collectionAllowed()?"Observation unavailable":"Paused"});
    return;
  }
  let constants = derived?.constants;
  // An applied head can still be collecting votes. Move to its successor
  // once votes establish that level or its scheduled round-zero starts.
  const observedLevel = operations.reduce(
    (level, operation) =>
      Math.max(level, ...operation.contents.map((content) => content.level)),
    head.level,
  );
  const successorAnchor = constants
    ? Date.parse(head.timestamp) +
      (constants.minimum + headRound * constants.increment) * 1000
    : undefined;
  let consensusLevel =
    successorAnchor !== undefined && now >= successorAnchor
      ? head.level + 1
      : Math.min(head.level + 1, observedLevel);
  const headAge=Math.max(0,(now-Date.parse(head.timestamp))/1000);
  const headFresh=headAge<Math.max(15,(constants?.minimum??6)+headRound*(constants?.increment??0))*1.5;
  let observedInstance:{level:number;round:number}|undefined;
  if(headFresh) {
    const candidates=operations.flatMap(operation=>operation.contents).filter(content=>{
      if(!content.block_payload_hash || content.level<head.level||content.level>head.level+1)return false;
      const ceiling=content.level===head.level?headRound:constants&&successorAnchor!==undefined?
        roundSchedule(successorAnchor,constants.minimum,constants.increment,now).round+1:0;
      return content.round<=ceiling && (content.level!==head.level||content.round>=headRound);
    }).sort((a,b)=>b.level-a.level||b.round-a.round);
    const latest=candidates[0];if(latest)observedInstance={level:latest.level,round:latest.round};
  } else if(constants&&successorAnchor!==undefined) {
    const scheduled=roundSchedule(successorAnchor,constants.minimum,constants.increment,now).round;
    if(operations.some(operation=>operation.contents.some(content=>content.block_payload_hash&&content.level===head.level+1&&content.round===scheduled)))
      observedInstance={level:head.level+1,round:scheduled};
  }
  const proposal=view.latestProposal;
  const observedProposalRound=proposal?proposalRound(proposal.fitness,proposal.level):undefined;
  if(proposal && observedProposalRound!==undefined && proposal.payload_hash && proposal.level>=head.level && proposal.level<=head.level+1 && constants && now-Date.parse(proposal.timestamp)<Math.max(15,constants.minimum+observedProposalRound*constants.increment)*1500 &&
    (!observedInstance||proposal.level>observedInstance.level||(proposal.level===observedInstance.level&&observedProposalRound>observedInstance.round))) {
    observedInstance={level:proposal.level,round:observedProposalRound};
  }
  if(sourceTarget){observedInstance={level:sourceTarget.target.level,round:sourceTarget.target.round};}
  if(observedInstance)consensusLevel=observedInstance.level;
  const retainedCandidates=[...view.candidates,...view.unresolvedCandidates];
  const selectedCandidate = retainedCandidates.find(candidate => candidate.identity === runtime.selectedIdentity && candidate.header.level >= head.level && candidate.header.level <= head.level + 1);
  const selectedCandidateRound=selectedCandidate?proposalRound(selectedCandidate.header.fitness,selectedCandidate.header.level):undefined;
  if (selectedCandidate && selectedCandidateRound!==undefined) {
    consensusLevel = selectedCandidate.header.level;
    observedInstance = {level: consensusLevel,round:selectedCandidateRound};
  }
  if(derived?.constantsByLevel)constants=derived.constantsByLevel.get(consensusLevel)??null;
  const targetContext=derived?.contexts?.get(consensusLevel);
  const receivedRights = targetContext&&runtime.monitor.contextAuthorized(targetContext)?derived?.rights.get(consensusLevel):undefined;
  const authority = committeeAuthority(receivedRights ?? [],constants?.committee,constants?.quorum);
  const rights = authority.usable && constants ? receivedRights : undefined;
  const groups = groupsFor(operations,rights ?? [],consensusLevel);
  const base = consensusLevel === head.level + 1 ? head : derived?.predecessor;
  const baseRound=base?proposalRound(base.fitness,base.level):undefined;
  const schedule =
    consensusLevel === head.level && successorAnchor !== undefined
      ? {
          round: headRound,
          startedAt: Date.parse(head.timestamp),
          endsAt: successorAnchor,
        }
      : constants && base && baseRound!==undefined
        ? roundSchedule(
            Date.parse(base.timestamp) +
              (constants.minimum +
                baseRound * constants.increment) *
                1000,
            constants.minimum,
            constants.increment,
            now,
          )
        : undefined;
  const currentRound = observedInstance?.round ?? (schedule
    ? Math.max(schedule.round, consensusLevel === head.level ? headRound : 0)
    : undefined);
  const power = (signers: Set<string>): number => signerPower(signers,rights ?? []) ?? 0;
  const currentGroups = groups.filter((group) => group.round === currentRound);
  currentGroups.sort(
    (a, b) =>
      b.round - a.round ||
      power(b.pre) + power(b.att) - power(a.pre) - power(a.att) ||
      a.payload.localeCompare(b.payload),
  );
  const groupIdentity = (group: typeof groups[number]): string => JSON.stringify([group.contextKey,group.level,group.round,group.payload]);
  const matchingCandidates = retainedCandidates.filter(candidate => candidate.header.level === consensusLevel && proposalRound(candidate.header.fitness,candidate.header.level) === currentRound);
  const selected = selectedCandidate
    ? currentGroups.find(group => group.payload === selectedCandidate.header.payload_hash && (!group.evidence || group.evidence.source.baseUrl === selectedCandidate.evidence.source.baseUrl))
    : sourceTarget?currentGroups.find(group=>group.payload===sourceTarget.target.payload && group.evidence?.source.baseUrl===sourceTarget.target.source.baseUrl)
    : currentGroups.find(group => groupIdentity(group) === runtime.selectedIdentity) ?? currentGroups[0];
  const activeCandidate = sourceTarget?sourceTarget.target.candidate:selectedCandidate ?? matchingCandidates.find(candidate => candidate.header.payload_hash === selected?.payload && candidate.evidence.source.baseUrl === selected?.evidence?.source.baseUrl);
  const selectable:{identity:string;hash?:string;payload?:string;level:number;round:number}[] = [
    ...matchingCandidates.flatMap(candidate => {const round=proposalRound(candidate.header.fitness,candidate.header.level);return round===undefined?[]:[{identity:candidate.identity,hash:candidate.header.hash,...(candidate.header.payload_hash ? {payload:candidate.header.payload_hash} : {}),level:candidate.header.level,round}];}),
    ...currentGroups.filter(group => !matchingCandidates.some(candidate => candidate.header.payload_hash === group.payload && candidate.evidence.source.baseUrl === group.evidence?.source.baseUrl)).map(group => ({identity:groupIdentity(group),payload:group.payload,level:group.level,round:group.round})),
  ];
  for(const target of retainedTargets){
    const representedGroup=currentGroups.find(group=>group.payload===target.target.payload && group.level===target.target.level && group.round===target.target.round && group.evidence?.source.baseUrl===target.target.source.baseUrl);
    const represented=representedGroup?selectable.findIndex(choice=>choice.identity===groupIdentity(representedGroup)):-1;
    if(represented>=0)selectable.splice(represented,1);
    if(!selectable.some(choice=>choice.identity===target.identity))selectable.push({identity:target.identity,...(target.target.payload?{payload:target.target.payload}:{}),level:target.target.level,round:target.target.round,...(target.target.candidate?{hash:target.target.candidate.header.hash}:{})});
  }
  const chosenIdentity = sourceTarget?.identity??activeCandidate?.identity ?? (selected ? groupIdentity(selected) : undefined);
  const selectedEvidence = sourceTarget?.evidence??activeCandidate?.evidence??selected?.evidence;
  const sharedPayload = activeCandidate && matchingCandidates.filter(candidate => candidate.header.payload_hash === activeCandidate.header.payload_hash && candidate.evidence.source.baseUrl === activeCandidate.evidence.source.baseUrl).length > 1;
  const candidateEvidence = `${sourceTarget&&!admitted?`Unresolved${sourceTarget.contextInvalid?" · context invalid":""}${sourceTarget.error?` · ${sourceTarget.error}`:""} · level ${sourceTarget.target.level} · round ${sourceTarget.target.round} · payload ${sourceTarget.target.payload} · `:""}${activeCandidate ? `Observed block hash ${activeCandidate.header.hash}` : 'Candidate hash unavailable'} · Producer unknown${sharedPayload ? ' · Shared payload evidence; signatures are not candidate-specific' : ''}${selected?.conflicts.length ? ` · Conflicting payload signer(s): ${selected.conflicts.join(', ')}` : ''}${selected?.unknownSlots.length ? ` · Unknown-rights signer slots: ${selected.unknownSlots.join(', ')}` : ''}${selectedEvidence ? ` · Source ${selectedEvidence.source.baseUrl} · requested head ${selectedEvidence.requestedHeadHash ?? 'unknown'} · observed head ${selectedEvidence.observedHeadHash ?? 'unknown'} · parent ${selectedEvidence.predecessor ?? 'unknown'} · chain ${selectedEvidence.chainId ?? 'unknown'} · protocol-level counter ${selectedEvidence.protocolLevel ?? 'unknown'} · received ${new Date(selectedEvidence.receivedAt).toISOString()} · age ${Math.max(0,Math.floor((performance.now()-selectedEvidence.receivedMonotonic)/1000))}s` : ' · Source/context unavailable'}${authority.usable ? '' : ` · Numerical authority unavailable: ${authority.reason}`}`;
  const sourceFacts=sourceTarget?.sourceContext?.context,sourceHead=sourceTarget?runtime.monitor.observedHead(sourceTarget.target.source):undefined;
  const identityEvidence=view.networkIdentity?`Expected network chain ${view.networkIdentity.chainId} · identity source ${view.networkIdentity.source.baseUrl} · proven head ${view.networkIdentity.header.hash}`:"Expected network identity unavailable";
  const contextEvidence=(rights&&targetContext?`Rights responder ${rights[0]?.evidence?.source.baseUrl??"unknown"} · authority observer ${targetContext.observer.source.baseUrl} · chain ${targetContext.observer.chainId} · context head ${targetContext.observer.header.hash} · requested anchor ${targetContext.anchor.header.hash} · target ${targetContext.level} · execution protocol ${targetContext.protocolHash} · rights received ${rights[0]?.evidence?new Date(rights[0].evidence.receivedAt).toISOString():"unknown"}`:sourceFacts?`Source-local proof · observer ${sourceFacts.observer.source.baseUrl} · chain ${sourceFacts.observer.chainId} · context head ${sourceFacts.observer.header.hash} · requested anchor ${sourceFacts.anchor.header.hash} · execution protocol ${sourceFacts.protocolHash} · numerical authority unavailable`:"Rights context unavailable")+` · ${identityEvidence}${sourceHead?` · Source-local observed head ${sourceHead.hash} · observed chain ${sourceHead.chainId??"unknown"}`:""}`;
  const activityRound = currentRound;
  const hasObservation = selected!==undefined && targetContext!==undefined && observationContextCompatible(selected.evidence,targetContext,selected.admission) && observedInstance!==undefined &&
    view.lastOperationAt !== null &&
    ((!collectionAllowed()) || (view.operationMode === "stream" &&
      view.operationStream.mode === "stream") ||
      (view.operationGeneration === snapshot.generation &&
        schedule !== undefined &&
        view.lastOperationAt >= schedule.startedAt));
  const coverage=sourceTarget?.coverage;
  const hasCoverage=coverage?.complete===true && coverage.reasons.length===0 && sourceTarget?.coverageStale!==true && sourceTarget?.contextInvalid!==true && targetContext!==undefined && runtime.monitor.contextAuthorized(targetContext);
  const total = rights && authority.usable ? authority.total : undefined;
  const pre = selected?.pre ?? new Set<string>(),
    att = selected?.att ?? new Set<string>();
  const delegateView = (right: DelegateRight): DelegateView => {
    const alias = runtime.data.alias(right.address),
      eligibilityEvidence=runtime.data.eligibilityStatus(right.address),
      forbidden = eligibilityEvidence.value;
    return {
      address: right.address,
      power: right.power,
      ...(eligibilityEvidence.contextInvalid?{eligibilityState:"context-invalid" as const}:eligibilityEvidence.stale?{eligibilityState:"stale" as const}:{}),
      ...(eligibilityEvidence.evidence?{eligibilityNote:`Source ${eligibilityEvidence.evidence.source.baseUrl} · requested head ${eligibilityEvidence.evidence.requestedHeadHash??"unknown"} · context head ${eligibilityEvidence.evidence.contextHeadHash??"unknown"} · chain ${eligibilityEvidence.evidence.chainId??"unknown"} · protocol ${eligibilityEvidence.evidence.protocolHash??"unknown"} · received ${new Date(eligibilityEvidence.evidence.receivedAt).toISOString()} · age ${Math.floor((eligibilityEvidence.ageMs??0)/1000)}s · retained fact ${eligibilityEvidence.rawValue?"forbidden":"eligible"}`} : {}),
      ...(alias ? { alias: `${alias} · TzKT` } : {}),
      eligibility:
        forbidden === undefined
          ? "unavailable"
          : forbidden
            ? "forbidden"
            : "eligible",
    };
  };
  const degraded = view.headStream.error !== null;
  const paused = !collectionAllowed();
  const model: NetworkViewModel = {
    status: degraded ? "degraded" : view.progression?.to.header.hash===appliedHead.hash && view.progression.to.source.baseUrl===appliedHead.evidence?.source.baseUrl && ["next-level","same-level-round","skipped-levels"].includes(view.progression.kind)?"healthy":"unknown",
    candidates: selectable,
    session:sessionModel(runtime),
    ...(chosenIdentity ? {selectedIdentity:chosenIdentity} : {}),
    candidateEvidence,
    ...(sourceTarget&&(sourceTarget.error || sourceTarget.coverageStale)?{retryIdentity:sourceTarget.identity,canRetry:collectionAllowed()}:{}),
    contextEvidence,
    level: consensusLevel,
    consensusLevel,
    ...(currentRound === undefined ? {} : { round: currentRound }),
    appliedLevel: appliedHead.level,
    ...(appliedRound===undefined?{}:{appliedRound}),
    hash: appliedHead.hash,
    blockTimestamp: Date.parse(appliedHead.timestamp),
    ...(appliedHead.evidence?{observedMonotonic:appliedHead.evidence.receivedMonotonic}:{}),
    ...((selectedEvidence??appliedHead.evidence)?{snapshotMonotonic:(selectedEvidence??appliedHead.evidence)!.receivedMonotonic}:{}),
    ...(view.headObservedAt === null
      ? {}
      : { observedAt: view.headObservedAt }),
    ...(view.lastOperationAt === null
      ? {}
      : { lastOperationAt: view.lastOperationAt }),
    ...(activityRound === undefined ? {} : { activityRound }),
    roundSource: observedInstance ? "observed" : "schedule",
    ...(proposal && observedProposalRound!==undefined?{observedProposal:{level:proposal.level,round:observedProposalRound,...(proposal.payload_hash?{payload:proposal.payload_hash}:{})}}:{}),
    ...(selected
      ? { payload: selected.payload }
      : observedInstance && proposal?.payload_hash && proposal.level===consensusLevel && proposalRound(proposal.fitness)===currentRound
        ? { payload: proposal.payload_hash }
        : consensusLevel === head.level &&
          currentRound === headRound &&
          head.payload_hash
        ? { payload: head.payload_hash }
        : {}),
    source: head.evidence?.source.name ?? view.headStream.source?.name ?? runtime.data.source.name,
    connection: paused
      ? "Paused"
      : view.headStream.mode === "fallback"
        ? "Heads polling (15s) · reduced coverage"
        : view.operationMode === "fallback"
          ? "Heads stream · operations polling (30s)"
          : view.headStream.mode === "stream"
            ? "Live RPC streams"
            : "Reconnecting",
    note: paused
      ? `Monitoring paused. Values below are retained observations.${coverage?` Retained source snapshot stale · source ${coverage.evidence.source.baseUrl} · original received ${new Date(coverage.evidence.receivedAt).toISOString()}.`:""}`
      : `${hasObservation||hasCoverage ? `Observed votes · level ${consensusLevel.toLocaleString("en-US")} · round ${currentRound ?? "unavailable"}` : `Matching votes unavailable${schedule ? ` · scheduled level ${consensusLevel.toLocaleString("en-US")} · estimated round ${schedule.round}` : ""}`}${currentGroups.length > 1 ? ` · ${currentGroups.length} competing payloads; selected payload shown` : ""}${groups.some((group) => group.round !== currentRound) ? " · older/future-round votes excluded" : ""}. ${hasCoverage?`Source-snapshot measured zero for phases without received votes · source ${coverage.evidence.source.baseUrl} · snapshot received ${new Date(coverage.evidence.receivedAt).toISOString()} · no global completeness claim. `:hasObservation?`Source ${selectedEvidence?.source.baseUrl??"unknown"} · partial positive observations; absent phase evidence is unproven. `:""}${coverage&&sourceTarget?.coverageStale?`Retained source snapshot stale · original received ${new Date(coverage.evidence.receivedAt).toISOString()}. `:""}`,
    nextBakers: runtime.opportunities.filter(baker=>baker.label.startsWith("Next round") ?
      baker.level===consensusLevel && baker.round===(schedule?.round??currentRound??-2)+1 :
      baker.level===consensusLevel+1 && baker.round===0),
    sources: [
      {
        name: "Heads",
        url: view.headStream.source?.baseUrl ?? "",
        status: paused ? "Paused" : view.headStream.mode,
        detail: `${view.headStream.metrics.messages} messages · ${view.headStream.metrics.reconnects} reconnects${view.headStream.error ? ` · ${view.headStream.error}` : ""}`,
      },
      {
        name: "Consensus operations",
        url: view.operationStream.source?.baseUrl ?? "mempool",
        status: view.operationMode,
        detail: `${view.operationStream.metrics.messages} batches · ${view.fallbackRequests} fallback reads${view.operationStream.error ? ` · ${view.operationStream.error}` : ""}`,
      },
      {
        name: "Validated proposals",
        url: view.proposalStream.source?.baseUrl??"proposals",
        status: view.proposalStream.mode,
        detail: `${view.proposalStream.metrics.messages} messages${view.proposalStream.error?` · ${view.proposalStream.error}`:""}`,
      },
      {
        name: "Auxiliary RPC reads",
        url: runtime.data.source.baseUrl,
        status: `${runtime.data.requests} requests`,
        detail:
          derived?.errors.join("; ") ||
          "Committee authority requires exact source, chain, head, parent, target level and protocol context",
      },
    ],
  };
  model.events=capturedEvents(runtime);
  const progress=view.progression;
  model.note+=progress?` Last source transition: ${progress.kind==="next-level"?"Observed next-level advance":progress.kind==="same-level-round"?"Observed same-level round advance":progress.kind==="same-height-reorg"?"Observed same-height reorg":progress.kind==="skipped-levels"?"Skipped delivered levels; intermediate path unobserved":"Observed head change; ancestry unavailable"} · source ${progress.evidence.source.baseUrl} · ${progress.from.header.hash} → ${progress.to.header.hash} · received ${new Date(progress.evidence.receivedAt).toISOString()}.`:" Source progress unknown.";
  const liveUnavailable=runtime.followLiveSelection&&!view.inspection.snapshot?" Live unavailable: no coherent current selection.":"";
  model.note+=liveUnavailable;
  if(view.crossingHistoryPartial)model.note+=" Crossing history partial after bounded fact retirement; uncertain histories cannot emit a new crossing.";
  if (degraded)
    model.error = `Heads connection interrupted: ${view.headStream.error}. Retaining the last coherent observation.${liveUnavailable}`;
  if (authority.usable && constants) model.quorum = authority.threshold;
  if (total !== undefined) model.committeePower = total;
  if (
    rights &&
    total !== undefined &&
    (hasObservation||hasCoverage) &&
    currentRound !== undefined
  ) {
    if (pre.size > 0 || hasCoverage) model.preattestations = {
      count: pre.size,
      expected: rights.length,
      power: power(pre),
      total,
    };
    if (att.size > 0 || hasCoverage) model.attestations = {
      count: att.size,
      expected: rights.length,
      power: power(att),
      total,
    };
    if(hasCoverage)model.missingPre = rights
      .filter((r) => !pre.has(r.address))
      .map(delegateView);
    if(hasCoverage)model.missingAtt = rights
      .filter((r) => !att.has(r.address))
      .map(delegateView);
  }
  if (constants && !paused && !degraded) {
    if (schedule && currentRound !== undefined) {
      model.timing = {
        ...schedule,
        level: consensusLevel,
        round: schedule.round,
        nextRound: schedule.round + 1,
      };
      void loadOpportunities(runtime, head, consensusLevel, schedule.round + 1);
    }
  }
  model.recentConsensus=capturedRecent(runtime);
  dashboard.update(runtime.network, model);
  if (rights && runtime.eligibilityHead !== head.hash && !paused) {
    runtime.eligibilityHead = head.hash;
    void runtime.data
      .loadEligibility(head, rights, runtime.opportunityController.signal)
      .then(() => scheduleRender(runtime));
  }
}

function scheduleRender(runtime: Runtime): void {
  if (runtime.requestFrame !== null) return;
  runtime.requestFrame = requestAnimationFrame(() => {
    runtime.requestFrame = null;
    render(runtime);
  });
}

async function loadOpportunities(
  runtime: Runtime,
  head: BlockHeader,
  level: number,
  round: number,
): Promise<void> {
  const key = `${head.hash}:${level}:${round}`;
  if (
    key === runtime.opportunityKey
  )
    return;
  runtime.opportunityKey = key;
  runtime.opportunityAt = Date.now();
  runtime.opportunityController.abort();
  runtime.opportunityController = new AbortController();
  const signal = runtime.opportunityController.signal;
  // A new head must never retain an old level's proposer names.
  runtime.opportunities = [];
  const result = await Promise.allSettled([
    runtime.data.bakers(head, level, round, signal),
    runtime.data.bakers(head, level + 1, 0, signal),
  ]);
  if (signal.aborted || !collectionAllowed() || !runtime.collectionActive || runtime.view?.snapshot?.head.hash !== head.hash) return;
  const opportunities: NonNullable<NetworkViewModel["nextBakers"]> = [];
  result.forEach((item, index) => {
    if (item.status === "fulfilled")
      for (const right of item.value) {
        const alias = runtime.data.alias(right.delegate);
        opportunities.push({
          label:
            index === 0
              ? "Next round · same level"
              : "Following level · round 0",
          address: right.delegate,
          level: right.level,
          round: right.round,
          ...(alias ? { alias: `${alias} · TzKT` } : {}),
        });
      }
  });
  runtime.opportunities = opportunities;
  scheduleRender(runtime);
}

for (const network of ["mainnet", "shadownet"] as const) {
  const data = new NetworkData(network);
  let runtime: Runtime;
  const monitor = new NetworkMonitor<Derived>({
    network,
    headSources: streamSources[network],
    operationSources: streamSources[network],
    proposalSources:network==="mainnet"?streamSources.mainnet.slice(0,1):sources.shadownet,
    derive: (head, signal) => data.derive(head, signal),
    reconcile:async(target,signal,onObservedHead)=>{
      const proof=await data.reconcile(target,signal,onObservedHead);
      let changed=false;
      try {
        const snapshot=await data.pending(signal,proof.head,proof.context,head=>{changed ||= headFactsKey(head)!==headFactsKey(proof.context.observer.header);onObservedHead(head);});
        if(changed)throw new Error("Observer changed during source snapshot");
        return {...proof,snapshot};
      }catch(error){if(changed || signal.aborted)throw error;return {...proof,snapshotError:String(error)};}
    },
    fallbackOperations: (head, signal) => data.pending(signal,head),
    fallbackHead: (signal) => data.head(signal),
    onUpdate(view) {
      if (!runtime) return;
      runtime.view = view;
      scheduleRender(runtime);
    },
  });
  runtime = {
    network,
    collectionActive:false,followLiveSelection:false,
    data,
    monitor,
    view: null,
    opportunities: [],
    opportunityKey: "",
    opportunityAt: 0,
    opportunityController: new AbortController(),
    eligibilityHead: "",
    requestFrame: null,
  };
  data.onChange=()=>scheduleRender(runtime);
  runtimes.set(network, runtime);
  dashboard.update(network, { status: "loading" });
  data.pause();syncCollection(runtime);
}
document.addEventListener("visibilitychange", () => {
  for(const runtime of runtimes.values())syncCollection(runtime);
});
window.addEventListener("pagehide", () => {
  pageActive=false;for(const runtime of runtimes.values())syncCollection(runtime);
});
window.addEventListener("pageshow", () => {
  pageActive=true;for(const runtime of runtimes.values())syncCollection(runtime);
});
setInterval(() => {
  dashboard.tick();
  if (!document.hidden)
    for (const runtime of runtimes.values()) scheduleRender(runtime);
}, 1000);
