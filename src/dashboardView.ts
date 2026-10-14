export type Network = 'mainnet' | 'shadownet';
export interface VoteView {count: number; expected: number; power: number; total: number}
export interface DelegateView {address: string; alias?: string; power: number; forbidden?: boolean; eligibility?: 'eligible' | 'forbidden' | 'unavailable'}
export interface SourceView {name: string; url: string; status: string; detail?: string}
export interface RecentConsensusView {level: number; round: number; prePower: number; attPower: number; total: number; payload?: string}
export interface NetworkViewModel {
  status: 'loading' | 'healthy' | 'stalled' | 'degraded';
  level?: number; consensusLevel?: number; round?: number; activityRound?: number; hash?: string; payload?: string;
  appliedLevel?: number; appliedRound?: number;
  observedProposal?: {level: number; round: number; payload?: string; at?: number}; roundSource?: 'observed' | 'schedule';
  recentConsensus?: RecentConsensusView[];
  observedAt?: number; blockTimestamp?: number; lastOperationAt?: number;
  source?: string; connection?: string; error?: string; note?: string;
  preattestations?: VoteView; attestations?: VoteView; quorum?: number; committeePower?: number;
  timing?: {level?: number; round: number; nextRound: number; endsAt: number; startedAt?: number};
  nextBakers?: {label: string; alias?: string; address: string; round: number; level: number}[];
  missingPre?: DelegateView[]; missingAtt?: DelegateView[]; sources?: SourceView[];
}

const number = (value: number | undefined): string => value === undefined ? '—' : value.toLocaleString('en-US');
const clock = (value: number | undefined): string => value === undefined ? 'Unavailable' : new Date(value).toLocaleTimeString('en-GB');
const short = (value: string | undefined): string => value ? `${value.slice(0, 10)}…${value.slice(-7)}` : 'Unavailable';
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', value = ''): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag); node.className = className; node.textContent = value; return node;
};
const set = (node: HTMLElement, value: string): void => {if (node.textContent !== value) node.textContent = value;};
const saved = (key: string): boolean => {try {return localStorage.getItem(key) === 'open';} catch {return false;}};
function disclosure(title: string, key: string): {details: HTMLDetailsElement; summary: HTMLElement; body: HTMLElement} {
  const details = el('details', 'disclosure'); details.open = saved(key);
  const summary = el('summary', '', title), body = el('div', 'disclosure-body'); details.append(summary, body);
  // Persist synchronously: the native toggle event may be deferred past navigation.
  summary.addEventListener('click', event => {
    event.preventDefault(); details.open = !details.open;
    try {localStorage.setItem(key, details.open ? 'open' : 'closed');} catch { /* Storage is optional. */ }
  });
  details.addEventListener('toggle', () => {try {localStorage.setItem(key, details.open ? 'open' : 'closed');} catch { /* Storage is optional. */ }});
  return {details, summary, body};
}
function field(parent: HTMLElement, label: string): HTMLElement {
  const item = el('div', 'metric'); item.append(el('span', 'eyebrow', label)); const value = el('strong', '', '—'); item.append(value); parent.append(item); return value;
}
function gauge(label: string, kind: string) {
  const root = el('section', `vote-gauge ${kind}`), header = el('div', 'gauge-header');
  const title = el('h3', '', label), percentage = el('strong', 'gauge-percent', '—'); header.append(title, percentage);
  const track = el('div', 'gauge-track'); track.setAttribute('role', 'progressbar'); track.setAttribute('aria-label', `${label} voting power`);
  const fill = el('div', 'gauge-fill'), marker = el('span', 'quorum-marker'); track.append(fill, marker);
  const counts = el('div', 'gauge-counts'), power = el('span', '', 'Voting power unavailable'), ops = el('span', '', 'Operations unavailable'); counts.append(power, ops);
  const remaining = el('p', 'quorum-caption', 'Quorum unavailable'); root.append(header, track, counts, remaining);
  return {root, update(vote: VoteView | undefined, quorum: number | undefined) {
    const known = vote !== undefined && vote.total > 0, percent = known ? 100 * vote.power / vote.total : 0;
    set(percentage, known ? `${percent.toFixed(1)}%` : '—'); fill.style.width = `${Math.min(100, percent)}%`;
    track.setAttribute('aria-valuenow', known ? String(vote.power) : '0'); track.setAttribute('aria-valuemax', known ? String(vote.total) : '100');
    track.setAttribute('aria-valuetext', known ? `${vote.power} of ${vote.total} voting power` : 'Voting power unavailable');
    marker.hidden = !known || quorum === undefined;
    if (known && quorum !== undefined) marker.style.left = `${100 * quorum / vote.total}%`;
    set(power, known ? `${number(vote.power)} / ${number(vote.total)} power` : 'Voting power unavailable');
    set(ops, vote === undefined ? 'Operations unavailable' : `${number(vote.count)} / ${number(vote.expected)} signers`);
    set(remaining, known && quorum !== undefined ? (vote.power >= quorum ? `Quorum reached · ${number(quorum)} power required` : `${number(quorum - vote.power)} more power to quorum · ${number(quorum)} required`) : 'Quorum unavailable');
    root.dataset.reached = String(known && quorum !== undefined && vote.power >= quorum);
  }};
}

function recentConsensus() {
  const root = el('section', 'recent-consensus'); root.append(el('h3', '', 'Recent consensus'));
  root.append(el('p', 'table-note', 'Peak power observed by this browser · historical observations, not current votes'));
  const rows = el('div', 'recent-consensus-rows'); root.append(rows);
  const keyed = new Map<string, HTMLElement>();
  const placeholders = Array.from({length: 4}, () => {
    const row = el('div', 'recent-consensus-row recent-placeholder');
    row.append(el('span', 'recent-identity', 'Level — · round —'), el('span', '', 'Pre —'), el('span', '', 'Att —'));
    return row;
  });
  rows.append(...placeholders);
  return {root, update(history: RecentConsensusView[] | undefined) {
    const values = (history ?? []).slice(0, 5), keys = new Set<string>();
    for (const [index, value] of values.entries()) {
      const key = `${value.level}:${value.round}:${value.payload ?? ''}`; keys.add(key);
      let row = keyed.get(key);
      if (!row) {
        row = el('div', 'recent-consensus-row'); row.append(el('span', 'recent-identity'));
        for (const phase of ['pre', 'att']) {
          const cell = el('div', `recent-phase ${phase}`), label = el('span'), track = el('div', 'recent-track'), fill = el('div', 'recent-fill');
          track.append(fill); cell.append(label, track); row.append(cell);
        }
        keyed.set(key, row);
      }
      set(row.children[0] as HTMLElement, `${number(value.level)} · r${value.round}`);
      row.title = `Level ${value.level} · round ${value.round}${value.payload ? ` · payload ${value.payload}` : ''}`;
      for (const [offset, power] of [value.prePower, value.attPower].entries()) {
        const percent = value.total > 0 ? Math.min(100, Math.max(0, 100 * power / value.total)) : undefined;
        const cell = row.children[offset + 1] as HTMLElement;
        set(cell.children[0] as HTMLElement, `${offset === 0 ? 'Pre' : 'Att'} ${percent === undefined ? '—' : `${percent.toFixed(1)}%`}`);
        cell.title = `${number(power)} / ${number(value.total)} voting power`;
        (cell.querySelector('.recent-fill') as HTMLElement).style.width = `${percent ?? 0}%`;
      }
      if (rows.children[index] !== row) rows.insertBefore(row, rows.children[index] ?? null);
    }
    for (const [key, row] of keyed) if (!keys.has(key)) {row.remove(); keyed.delete(key);}
    // Reserve four complete rows even before the first observation arrives.
    placeholders.forEach((placeholder, index) => {
      const needed = index < Math.max(0, 4 - values.length);
      if (needed && !placeholder.isConnected) rows.append(placeholder);
      if (!needed) placeholder.remove();
    });
  }};
}

function delegateList(network: Network, phase: 'Pre' | 'Att') {
  const title = phase === 'Pre' ? 'Missing preattestations' : 'Missing attestations';
  const {details, summary, body} = disclosure(title, `consensus-v2:${network}:${phase}`);
  const intro = el('p', 'table-note', 'Expected rights minus observed signers. Power is committee voting power, not token balance.');
  const viewport = el('div', 'delegate-scroll'); viewport.tabIndex = 0; viewport.setAttribute('aria-label', `${title} delegate list`);
  const table = el('table', 'delegate-table'), head = el('thead'), header = el('tr');
  for (const name of ['Baker', 'Address', 'Power', 'Share', 'Eligibility']) header.append(el('th', '', name)); head.append(header);
  const tbody = el('tbody'); table.append(head, tbody); viewport.append(table); const empty = el('p', 'empty-state', 'Rights or observations unavailable.'); body.append(intro, viewport, empty);
  const rows = new Map<string, HTMLTableRowElement>();
  return {root: details, update(delegates: DelegateView[] | undefined, total: number | undefined) {
    const scrollTop = viewport.scrollTop;
    const known = delegates !== undefined, list = [...(delegates ?? [])].sort((a, b) => b.power - a.power);
    const forbidden = list.filter(item => item.forbidden || item.eligibility === 'forbidden').length;
    const sum = list.reduce((acc, item) => acc + item.power, 0);
    set(summary, known ? `${title} · ${list.length} bakers · ${number(sum)} power${forbidden ? ` · ${forbidden} forbidden` : ''}` : `${title} · unavailable`);
    const keep = new Set(list.map(item => item.address));
    for (const [address, row] of rows) if (!keep.has(address)) {row.remove(); rows.delete(address);}
    list.forEach((delegate, index) => {
      let row = rows.get(delegate.address);
      if (!row) {row = el('tr'); for (let i = 0; i < 5; i++) row.append(el('td')); rows.set(delegate.address, row);}
      const cells = row.children;
      set(cells[0] as HTMLElement, delegate.alias ?? 'No alias');
      const address = cells[1] as HTMLElement;
      let addressText = address.querySelector('span');
      if (!addressText) {
        addressText = el('span', 'address-text', short(delegate.address));
        const copy = el('button', 'address-copy', 'Copy'); copy.type = 'button';
        copy.setAttribute('aria-label', `Copy full address for ${delegate.alias ?? delegate.address}`);
        copy.addEventListener('click', () => {void navigator.clipboard?.writeText(delegate.address).then(() => {set(copy, 'Copied'); setTimeout(() => set(copy, 'Copy'), 1400);}).catch(() => set(copy, 'Unavailable'));});
        address.append(addressText, copy);
      }
      address.title = delegate.address;
      set(cells[2] as HTMLElement, number(delegate.power)); set(cells[3] as HTMLElement, total ? `${(100 * delegate.power / total).toFixed(2)}%` : '—');
      const eligibility = delegate.forbidden ? 'forbidden' : delegate.eligibility ?? 'unavailable';
      const badge = cells[4] as HTMLElement; set(badge, eligibility === 'unavailable' ? 'Unknown' : eligibility === 'forbidden' ? 'Forbidden' : 'Eligible'); badge.dataset.eligibility = eligibility;
      if (tbody.children[index] !== row) tbody.insertBefore(row, tbody.children[index] ?? null);
    });
    empty.hidden = known && list.length > 0; viewport.hidden = !known || list.length === 0;
    set(empty, known ? 'All expected bakers observed for this phase.' : 'Rights or observations unavailable.');
    // Removing an observed signer can trigger browser scroll anchoring to a new row.
    viewport.scrollTop = scrollTop;
  }};
}

export function createDashboard(root: HTMLElement, options: {onPauseChange?: (paused: boolean) => void; onReconnect?: () => void; revision?: string} = {}): {update(network: Network, model: NetworkViewModel): void; tick(now?: number): void} {
  root.classList.add('consensus-app');
  const header = el('header', 'masthead'), brand = el('div', 'header-brand');
  const mark = el('img', 'header-mark'); mark.src='./observatory-mark.svg'; mark.alt=''; mark.width=40; mark.height=40;
  const brandText = el('div', 'header-brand-text');
  brandText.append(el('div', 'eyebrow', 'TEZOS / NETWORK OBSERVATORY'), el('h1', '', 'Live consensus'));
  brand.append(mark, brandText);
  const controls = el('div', 'header-controls');
  const live = el('div', 'live-label', `Browser monitoring · v2${options.revision ? ` / ${options.revision}` : ''}`); live.prepend(el('span', 'live-dot'));
  const pause = el('button', 'control-button', 'Pause'), reconnect = el('button', 'control-button', 'Reconnect'); pause.type = reconnect.type = 'button';
  let paused = false;
  pause.addEventListener('click', () => {paused = !paused; set(pause, paused ? 'Resume' : 'Pause'); pause.setAttribute('aria-pressed', String(paused)); options.onPauseChange?.(paused);});
  reconnect.addEventListener('click', () => options.onReconnect?.()); controls.append(live, pause, reconnect); header.append(brand, controls);
  const intro = el('p', 'intro', 'Follow proposal activity, committee voting power and the next baking opportunities.');
  const tabs = el('nav', 'network-tabs'); tabs.setAttribute('aria-label', 'Network');
  const grid = el('div', 'network-grid');
  const announcements = el('div', 'sr-only'); announcements.setAttribute('aria-live', 'polite'); announcements.setAttribute('role', 'status');
  const footer = el('footer', 'page-footer', 'Read-only monitoring · RPC streams are opened by this browser while the page is visible. No signatures, no node changes.');
  root.replaceChildren(header, intro, tabs, grid, footer, announcements);
  const states = new Map<Network, {model?: NetworkViewModel; tick(now: number): void; update(model: NetworkViewModel): void}>();
  for (const network of ['mainnet', 'shadownet'] as const) {
    const name = network === 'mainnet' ? 'Mainnet' : 'Shadownet';
    const tab = el('button', `network-tab ${network}`), tabName = el('span', '', name), tabStatus = el('span', 'tab-status', 'Connecting'); tab.append(tabName, tabStatus); tab.type = 'button';
    let selected = 'mainnet'; try {selected = localStorage.getItem('consensus-v2:network') ?? selected;} catch { /* Optional storage. */ }
    tab.setAttribute('aria-pressed', String(network === selected));
    tab.addEventListener('click', () => {root.dataset.selected = network; try {localStorage.setItem('consensus-v2:network', network);} catch { /* Optional storage. */ } for (const button of tabs.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button === tab));}); tabs.append(tab);
    const panel = el('article', `network-panel ${network}`); panel.dataset.network = network; panel.dataset.status = 'loading';
    const panelHeader = el('div', 'panel-header'), heading = el('h2', '', name), status = el('span', 'status-chip', 'Connecting'); panelHeader.append(heading, status);
    const headline = el('div', 'headline'), level = field(headline, 'Consensus level'), round = field(headline, 'Current round');
    const appliedContext = el('p', 'applied-context table-note', 'Last applied block unavailable');
    const proposalContext = el('p', 'proposal-context', 'Proposal observation unavailable');
    const connection = el('div', 'connection-line'), transport = el('span', '', 'Connecting to RPC streams…'), freshness = el('span', '', 'No observation yet'); connection.append(transport, freshness);
    const notice = el('div', 'network-notice', 'Waiting for the first successful observation.');
    const consensus = el('section', 'consensus-section'), sectionTitle = el('div', 'section-heading');
    sectionTitle.append(el('h3', '', 'Committee participation')); const activity = el('span', 'subtle', 'Activity round —'); sectionTitle.append(activity);
    const selection = el('p', 'selection-label', 'Level — · payload unavailable');
    const gauges = el('div', 'gauges'), pre = gauge('Preattestations', 'pre'), att = gauge('Attestations', 'att'); gauges.append(pre.root, att.root); consensus.append(sectionTitle, selection, gauges);
    const opportunities = el('section', 'opportunities'), timingHeader = el('div', 'section-heading'); timingHeader.append(el('h3', '', 'Next baking opportunities'));
    const countdown = el('span', 'countdown', 'Timing unavailable'); timingHeader.append(countdown);
    const timing = el('p', 'timing-detail', 'Calculated opportunity round unavailable');
    const bakerRows = el('div', 'baker-rows'); opportunities.append(timingHeader, timing, bakerRows);
    const missing = el('section', 'missing-section'); missing.append(el('h3', '', 'Expected bakers not observed'));
    const recent = recentConsensus();
    const missingPre = delegateList(network, 'Pre'), missingAtt = delegateList(network, 'Att'); missing.append(missingPre.root, missingAtt.root);
    const evidence = disclosure('Sources & observation evidence', `consensus-v2:${network}:evidence`);
    const metadata = el('dl', 'evidence-meta');
    const meta = new Map<string, HTMLElement>();
    for (const label of ['Primary source', 'Applied head', 'Block hash', 'Last successful head', 'Last operation', 'Block age', 'Snapshot age']) {metadata.append(el('dt', '', label)); const value = el('dd', '', 'Unavailable'); metadata.append(value); meta.set(label, value);}
    const sourceRows = el('div', 'source-rows'), history = el('ol', 'event-history'); evidence.body.append(metadata, sourceRows, el('h4', '', 'Recent network events'), history);
    panel.append(panelHeader, headline, appliedContext, proposalContext, connection, notice, consensus, recent.root, opportunities, missing, evidence.details); grid.append(panel);
    const keyedBakers = new Map<string, HTMLElement>(), keyedSources = new Map<string, HTMLElement>();
    let current: NetworkViewModel | undefined, previousStatus: NetworkViewModel['status'] | undefined;
    const tick = (now: number): void => {
      if (!current) return;
      const age = current.observedAt === undefined ? undefined : Math.max(0, (now - current.observedAt) / 1000);
      set(freshness, age === undefined ? 'No head message yet' : `Last head message ${age < 1 ? 'just now' : `${Math.floor(age)}s ago`}`);
      set(meta.get('Snapshot age')!, age === undefined ? 'Unavailable' : `${Math.floor(age)}s`);
      set(meta.get('Block age')!, current.blockTimestamp === undefined ? 'Unavailable' : `${Math.max(0, Math.floor((now - current.blockTimestamp) / 1000))}s`);
      const t = current.timing;
      if (!t) {set(countdown, 'Timing unavailable'); set(timing, 'Calculated opportunity round unavailable'); return;}
      const remaining = Math.ceil((t.endsAt - now) / 1000);
      set(countdown, remaining > 0 ? `${Math.floor(remaining / 60)}m ${String(remaining % 60).padStart(2, '0')}s` : 'Awaiting next opportunity');
      set(timing, `Scheduled opportunity · level ${number(t.level ?? current.consensusLevel)} · estimated round ${t.round} → ${t.nextRound} · boundary ${clock(t.endsAt)}${remaining <= 0 ? ' · waiting for fresh timing' : ''}`);
    };
    states.set(network, {tick, update(model) {
      const previous = current; current = model; panel.dataset.status = model.status;
      const labels = {loading: 'Connecting', healthy: 'Progressing', stalled: 'Level stalled', degraded: 'RPC coverage degraded'};
      set(status, labels[model.status]); set(tabStatus, labels[model.status]); tab.dataset.status = model.status; set(level, number(model.appliedLevel ?? model.level)); set(round, number(model.appliedRound ?? model.round));
      const levelLabel=level.parentElement?.querySelector('.eyebrow'), roundLabel=round.parentElement?.querySelector('.eyebrow');
      if(levelLabel)set(levelLabel as HTMLElement,'Applied block level');
      if(roundLabel)set(roundLabel as HTMLElement,'Applied block round');
      set(appliedContext, model.appliedLevel === undefined ? 'Last applied block unavailable' : `Last applied block · level ${number(model.appliedLevel)} · round ${number(model.appliedRound)}${model.blockTimestamp === undefined ? "" : ` · block timestamp ${clock(model.blockTimestamp)}`}`);
      set(proposalContext, model.roundSource === 'schedule' ? 'Proposal observation unavailable' : model.roundSource === 'observed' ? model.observedProposal && model.observedProposal.level===model.level&&model.observedProposal.round===model.round && model.payload && model.observedProposal.payload===model.payload ? `Observed proposal · level ${number(model.level)} · round ${model.round}` : `Observed votes · level ${number(model.level)} · round ${model.round}` : 'Proposal observation unavailable');
      if (model.observedProposal) proposalContext.title = `Last observed proposal: level ${model.observedProposal.level}, round ${model.observedProposal.round}${model.observedProposal.at === undefined ? '' : ` at ${clock(model.observedProposal.at)}`}`;
      else proposalContext.removeAttribute('title');
      recent.update(model.recentConsensus);
      set(transport, `${model.connection ?? 'Monitoring'}${model.source ? ` · ${model.source}` : ''}`);
      set(notice, model.error ?? model.note ?? (model.status === 'stalled' ? 'Proposal activity continues, but the level has not advanced.' : model.status === 'loading' ? 'Waiting for the first successful observation.' : 'Live observations from this browser.'));
      set(activity, `${model.roundSource==='schedule'?'Scheduled':'Observed'} round ${number(model.activityRound)}`); set(selection, `Level ${number(model.consensusLevel ?? model.level)} · payload ${short(model.payload)}`); selection.title = model.payload ?? '';
      pre.update(model.preattestations, model.quorum); att.update(model.attestations, model.quorum);
      missingPre.update(model.missingPre, model.committeePower); missingAtt.update(model.missingAtt, model.committeePower);
      const bakers = model.nextBakers ?? [], bakerKeys = new Set<string>();
      for (const [index, baker] of bakers.entries()) {
        const key = `${baker.label}:${baker.level}:${baker.round}:${baker.address}`; bakerKeys.add(key);
        let row = keyedBakers.get(key);
        if (!row) {row = el('div', 'baker-opportunity'); row.append(el('span', 'eyebrow', baker.label === 'Next round · same level' ? 'Next scheduled proposal' : baker.label === 'Following level · round 0' ? 'Following level · conditional' : baker.label), el('strong', '', baker.alias ?? short(baker.address)), el('span', 'subtle', `Level ${number(baker.level)} · round ${baker.round}`)); row.title = baker.address; keyedBakers.set(key, row);}
        if (bakerRows.children[index] !== row) bakerRows.insertBefore(row, bakerRows.children[index] ?? null);
      }
      for (const [key, row] of keyedBakers) if (!bakerKeys.has(key)) {row.remove(); keyedBakers.delete(key);}
      if (!bakers.length && !bakerRows.querySelector('.empty-state')) {
        for (const label of ['Next scheduled proposal', 'Following level · conditional']) {
          const placeholder = el('div', 'baker-opportunity empty-state');
          placeholder.append(el('span', 'eyebrow', label), el('strong', '', 'Baking rights unavailable'), el('span', 'subtle', 'Level — · round —'));
          bakerRows.append(placeholder);
        }
      }
      if (bakers.length) for (const placeholder of bakerRows.querySelectorAll('.empty-state')) placeholder.remove();
      set(meta.get('Primary source')!, model.source ?? 'Unavailable'); set(meta.get('Block hash')!, model.hash ?? 'Unavailable');
      set(meta.get('Applied head')!, model.appliedLevel === undefined ? 'Unavailable' : `Level ${number(model.appliedLevel)} · round ${number(model.appliedRound)}`);
      set(meta.get('Last successful head')!, clock(model.observedAt)); set(meta.get('Last operation')!, clock(model.lastOperationAt));
      const sources = model.sources ?? [], sourceKeys = new Set(sources.map(source => source.url));
      for (const source of sources) {let row = keyedSources.get(source.url); if (!row) {row = el('div', 'source-row'); sourceRows.append(row); keyedSources.set(source.url, row);} set(row, `${source.name} · ${source.status}${source.detail ? ` · ${source.detail}` : ''}`); row.title = source.url;}
      for (const [key, row] of keyedSources) if (!sourceKeys.has(key)) {row.remove(); keyedSources.delete(key);}
      const events: string[] = [];
      if (previous && model.level !== undefined && previous.level !== model.level) events.push(`${model.roundSource==='schedule'?'Scheduled opportunity':'Observed activity'} · level ${number(model.level)} · round ${number(model.round)}`);
      else if (previous && model.activityRound !== undefined && previous.activityRound !== model.activityRound) events.push(`${model.roundSource==='schedule'?'Scheduled':'Observed'} round ${model.activityRound}`);
      for (const phase of ['preattestations', 'attestations'] as const) if (previous?.[phase] && model[phase] && model.quorum !== undefined && previous[phase].power < model.quorum && model[phase].power >= model.quorum) events.push(`${phase === 'preattestations' ? 'Preattestation' : 'Attestation'} quorum reached`);
      if (previousStatus !== model.status && model.status !== 'loading') {
        events.push(labels[model.status]);
        if (previousStatus !== undefined) set(announcements, `${name}: ${labels[model.status]}`);
      }
      for (const event of events) history.prepend(el('li', '', `${clock(Date.now())} · ${event}`));
      while (history.children.length > 12) history.lastElementChild?.remove();
      previousStatus = model.status; tick(Date.now());
    }});
  }
  try {root.dataset.selected = localStorage.getItem('consensus-v2:network') === 'shadownet' ? 'shadownet' : 'mainnet';} catch {root.dataset.selected = 'mainnet';}
  return {update(network, model) {states.get(network)!.update(model);}, tick(now = Date.now()) {for (const state of states.values()) state.tick(now);}};
}
