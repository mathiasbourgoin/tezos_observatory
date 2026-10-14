import "./dashboard.css";
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
  MonitoredOperation,
  BlockHeader,
} from "./rpc/models";
import { proposalRound, roundSchedule } from "./consensus/roundSchedule";
declare const __APP_REVISION__: string;

const root = document.getElementById("app");
if (!root) throw new Error("Missing dashboard root");
let userPaused = false;
const runtimes = new Map<NetworkName, Runtime>();
const dashboard = createDashboard(root, {
  revision: __APP_REVISION__,
  onPauseChange(paused) {
    userPaused = paused;
    for (const runtime of runtimes.values()) {
      if (paused) {
        runtime.monitor.stop();
        runtime.data.pause();
        runtime.opportunityController.abort();
      } else if (!document.hidden) runtime.monitor.start();
    }
  },
  onReconnect() {
    if (!userPaused && !document.hidden)
      for (const runtime of runtimes.values()) runtime.monitor.refresh();
  },
});

interface Group {
  level: number;
  round: number;
  payload: string;
  pre: Set<string>;
  att: Set<string>;
}
interface Runtime {
  network: NetworkName;
  data: NetworkData;
  monitor: NetworkMonitor<Derived>;
  view: NetworkMonitorView<Derived> | null;
  opportunities: NonNullable<NetworkViewModel["nextBakers"]>;
  opportunityKey: string;
  opportunityAt: number;
  opportunityController: AbortController;
  eligibilityHead: string;
  requestFrame: number | null;
  lastDeriveRetry: number;
  recent: NonNullable<NetworkViewModel["recentConsensus"]>;
}

function groupsFor(
  operations: readonly MonitoredOperation[],
  rights: readonly DelegateRight[],
  level: number,
): Group[] {
  const bySlot = new Map(rights.map((right) => [right.slot, right.address]));
  const groups = new Map<string, Group>();
  for (const operation of operations)
    for (const content of operation.contents) {
      if (content.level !== level) continue;
      const address = bySlot.get(content.slot);
      if (!address) continue;
      const payload = content.block_payload_hash ?? "unknown";
      const key = `${content.round}:${payload}`;
      let group = groups.get(key);
      if (!group) {
        group = {
          level,
          round: content.round,
          payload,
          pre: new Set(),
          att: new Set(),
        };
        groups.set(key, group);
      }
      (content.kind === "preattestation" ? group.pre : group.att).add(address);
    }
  return [...groups.values()];
}

function render(runtime: Runtime): void {
  const view = runtime.view;
  const snapshot = view?.snapshot;
  if (!view || !snapshot) {
    const error = view?.headStream.error;
    dashboard.update(runtime.network, {
      status: error ? "degraded" : "loading",
      connection: document.hidden || userPaused ? "Paused" : "Connecting",
      ...(error ? { error } : {}),
      sources: sources[runtime.network].map((s) => ({
        name: s.name,
        url: s.baseUrl,
        status: "Standby",
      })),
    });
    return;
  }
  const { head, derived, operations } = snapshot;
  const now = Date.now(),
    headRound = proposalRound(head.fitness);
  const constants = derived?.constants;
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
      if(content.level<head.level||content.level>head.level+1)return false;
      const ceiling=content.level===head.level?headRound:constants&&successorAnchor!==undefined?
        roundSchedule(successorAnchor,constants.minimum,constants.increment,now).round+1:0;
      return content.round<=ceiling && (content.level!==head.level||content.round>=headRound);
    }).sort((a,b)=>b.level-a.level||b.round-a.round);
    const latest=candidates[0];if(latest)observedInstance={level:latest.level,round:latest.round};
  } else if(constants&&successorAnchor!==undefined) {
    const scheduled=roundSchedule(successorAnchor,constants.minimum,constants.increment,now).round;
    if(operations.some(operation=>operation.contents.some(content=>content.level===head.level+1&&content.round===scheduled)))
      observedInstance={level:head.level+1,round:scheduled};
  }
  const proposal=view.latestProposal;
  if(proposal && constants && now-Date.parse(proposal.timestamp)<Math.max(15,constants.minimum+proposalRound(proposal.fitness)*constants.increment)*1500 &&
    (!observedInstance||proposal.level>observedInstance.level||(proposal.level===observedInstance.level&&proposalRound(proposal.fitness)>observedInstance.round))) {
    observedInstance={level:proposal.level,round:proposalRound(proposal.fitness)};
  }
  if(observedInstance)consensusLevel=observedInstance.level;
  const rights = derived?.rights.get(consensusLevel);
  const groups = rights ? groupsFor(operations, rights, consensusLevel) : [];
  const base = consensusLevel === head.level + 1 ? head : derived?.predecessor;
  const schedule =
    consensusLevel === head.level && successorAnchor !== undefined
      ? {
          round: headRound,
          startedAt: Date.parse(head.timestamp),
          endsAt: successorAnchor,
        }
      : constants && base
        ? roundSchedule(
            Date.parse(base.timestamp) +
              (constants.minimum +
                proposalRound(base.fitness) * constants.increment) *
                1000,
            constants.minimum,
            constants.increment,
            now,
          )
        : undefined;
  const currentRound = observedInstance?.round ?? (schedule
    ? Math.max(schedule.round, consensusLevel === head.level ? headRound : 0)
    : undefined);
  const power = (signers: Set<string>): number =>
    (rights ?? []).reduce(
      (sum, r) => sum + (signers.has(r.address) ? r.power : 0),
      0,
    );
  const currentGroups = groups.filter((group) => group.round === currentRound);
  currentGroups.sort(
    (a, b) =>
      b.round - a.round ||
      power(b.pre) + power(b.att) - power(a.pre) - power(a.att) ||
      a.payload.localeCompare(b.payload),
  );
  const selected = currentGroups[0];
  const activityRound = currentRound;
  const hasCoverage = observedInstance!==undefined &&
    view.lastOperationAt !== null &&
    ((view.operationMode === "stream" &&
      view.operationStream.mode === "stream") ||
      (view.operationGeneration === snapshot.generation &&
        schedule !== undefined &&
        view.lastOperationAt >= schedule.startedAt));
  const total = rights?.reduce((sum, right) => sum + right.power, 0);
  const pre = selected?.pre ?? new Set<string>(),
    att = selected?.att ?? new Set<string>();
  const delegateView = (right: DelegateRight): DelegateView => {
    const alias = runtime.data.alias(right.address),
      forbidden = runtime.data.forbidden(right.address);
    return {
      address: right.address,
      power: right.power,
      ...(alias ? { alias: `${alias} · TzKT` } : {}),
      eligibility:
        forbidden === undefined
          ? "unavailable"
          : forbidden
            ? "forbidden"
            : "eligible",
    };
  };
  const age = Math.max(0, (now - Date.parse(head.timestamp)) / 1000);
  const degraded = view.headStream.error !== null;
  const stalled =
    headRound >= 3 || age > Math.max(30, (constants?.minimum ?? 6) * 5);
  const paused = userPaused || document.hidden;
  const model: NetworkViewModel = {
    status: degraded ? "degraded" : stalled ? "stalled" : "healthy",
    level: consensusLevel,
    consensusLevel,
    ...(currentRound === undefined ? {} : { round: currentRound }),
    appliedLevel: head.level,
    appliedRound: headRound,
    hash: head.hash,
    blockTimestamp: Date.parse(head.timestamp),
    ...(view.headObservedAt === null
      ? {}
      : { observedAt: view.headObservedAt }),
    ...(view.lastOperationAt === null
      ? {}
      : { lastOperationAt: view.lastOperationAt }),
    ...(activityRound === undefined ? {} : { activityRound }),
    roundSource: observedInstance ? "observed" : "schedule",
    ...(view.latestProposal?{observedProposal:{level:view.latestProposal.level,round:proposalRound(view.latestProposal.fitness)}}:{}),
    ...(selected
      ? { payload: selected.payload }
      : consensusLevel === head.level &&
          currentRound === headRound &&
          head.payload_hash
        ? { payload: head.payload_hash }
        : {}),
    source: view.headStream.source?.name ?? runtime.data.source.name,
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
      ? "Monitoring paused. Values below are retained observations."
      : `${hasCoverage ? `Current round ${currentRound ?? "unavailable"} only · validated mempool observations` : "Waiting for current-round mempool observation"}${currentGroups.length > 1 ? ` · ${currentGroups.length} competing payloads; strongest shown` : ""}${groups.some((group) => group.round !== currentRound) ? " · older/future-round votes excluded" : ""}. ${stalled ? "Level progression is delayed." : ""}`,
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
          "Committee rights cached per protocol/level; RPC requests pinned by block hash",
      },
    ],
  };
  if(rights && total!==undefined && hasCoverage) {
    for(const group of groups) {
      const key=`${group.level}:${group.round}:${group.payload}`;
      let record=runtime.recent.find(item=>`${item.level}:${item.round}:${item.payload}`===key);
      if(!record) {
        record={level:group.level,round:group.round,prePower:0,attPower:0,total,payload:group.payload};
        runtime.recent.push(record);
      }
      record.prePower=Math.max(record.prePower,power(group.pre));
      record.attPower=Math.max(record.attPower,power(group.att));
    }
    runtime.recent.sort((a,b)=>b.level-a.level||b.round-a.round||b.prePower+b.attPower-a.prePower-a.attPower);
    runtime.recent.splice(5);
  }
  model.recentConsensus=runtime.recent;
  if (degraded)
    model.error = `Heads connection interrupted: ${view.headStream.error}. Retaining the last coherent observation.`;
  if (constants) model.quorum = constants.quorum;
  if (total !== undefined) model.committeePower = total;
  if (
    rights &&
    total !== undefined &&
    hasCoverage &&
    currentRound !== undefined
  ) {
    model.preattestations = {
      count: pre.size,
      expected: rights.length,
      power: power(pre),
      total,
    };
    model.attestations = {
      count: att.size,
      expected: rights.length,
      power: power(att),
      total,
    };
    model.missingPre = rights
      .filter((r) => !pre.has(r.address))
      .map(delegateView);
    model.missingAtt = rights
      .filter((r) => !att.has(r.address))
      .map(delegateView);
  }
  if (constants && !paused && !degraded) {
    if (schedule && currentRound !== undefined) {
      model.timing = {
        ...schedule,
        round: schedule.round,
        nextRound: schedule.round + 1,
      };
      void loadOpportunities(runtime, head, consensusLevel, schedule.round + 1);
    }
  }
  dashboard.update(runtime.network, model);
  if (
    (derived?.errors.length || (derived && !rights)) &&
    !paused &&
    now - runtime.lastDeriveRetry > (rights?30_000:1500)
  ) {
    runtime.lastDeriveRetry = now;
    runtime.monitor.refreshDerived();
  }
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
    key === runtime.opportunityKey &&
    (runtime.opportunities.length > 0 ||
      Date.now() - runtime.opportunityAt < 30_000)
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
  if (signal.aborted || runtime.view?.snapshot?.head.hash !== head.hash) return;
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
    headSources: sources[network],
    operationSources: streamSources[network],
    proposalSources:network==="mainnet"?streamSources.mainnet.slice(0,1):sources.shadownet,
    derive: (head, signal) => data.derive(head, signal),
    fallbackOperations: (_head, signal) => data.pending(signal),
    fallbackHead: (signal) => data.head(signal),
    onUpdate(view) {
      if (!runtime) return;
      runtime.view = view;
      scheduleRender(runtime);
    },
  });
  runtime = {
    network,
    data,
    monitor,
    view: null,
    opportunities: [],
    opportunityKey: "",
    opportunityAt: 0,
    opportunityController: new AbortController(),
    eligibilityHead: "",
    requestFrame: null,
    lastDeriveRetry: Date.now(),
    recent: [],
  };
  data.onChange=()=>scheduleRender(runtime);
  runtimes.set(network, runtime);
  dashboard.update(network, { status: "loading" });
  void data.loadAliases().then(() => scheduleRender(runtime));
  if (!document.hidden) monitor.start();
}
document.addEventListener("visibilitychange", () => {
  for (const runtime of runtimes.values()) {
    if (document.hidden || userPaused) {
      runtime.monitor.stop();
      runtime.data.pause();
      runtime.opportunityController.abort();
    } else runtime.monitor.start();
    scheduleRender(runtime);
  }
});
window.addEventListener("pagehide", () => {
  for (const runtime of runtimes.values()) runtime.monitor.stop();
});
setInterval(() => {
  dashboard.tick();
  if (!document.hidden)
    for (const runtime of runtimes.values()) scheduleRender(runtime);
}, 1000);
