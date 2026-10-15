import {proposalRound} from './consensus/roundSchedule';
import type {ComparisonResult} from './rpc/sourceComparison';
export type Network = 'mainnet' | 'shadownet';
export interface VoteView {count: number; expected: number; power: number; total: number}
export interface DelegateView {address: string; alias?: string;searchAlias?:string; power: number; forbidden?: boolean; eligibility?: 'eligible' | 'forbidden' | 'unavailable'; eligibilityState?:'stale'|'context-invalid'; eligibilityNote?:string;preReceipt?:string;attReceipt?:string;contextNote?:string}
export interface SourceView {name: string; url: string; status: string; detail?: string}
export interface RecentConsensusView {identity?:string;level: number; round: number; prePower?: number; attPower?: number; preTotal?:number;attTotal?:number;total: number; payload?: string;source?:string}
export interface NetworkViewModel {
  comparison?:{providers:readonly {name:string;url:string}[];enabled:boolean;running:boolean;result?:()=>ComparisonResult|undefined};
  status: 'loading' | 'healthy' | 'unknown' | 'stalled' | 'degraded';
  level?: number; consensusLevel?: number; round?: number; activityRound?: number; hash?: string; payload?: string;
  appliedLevel?: number; appliedRound?: number;
  observedProposal?: {level: number; round: number; payload?: string; at?: number}; roundSource?: 'observed' | 'schedule';
  candidates?: readonly {identity:string;hash?:string;payload?:string;level:number;round:number}[];
  selectedIdentity?: string;
  session?:{mode:"follow"|"pin";frozen:boolean;newer:number;newerPartial:boolean;selected?:string;canPin:boolean;accepted:number;unresolved:number;raw:number;instances:readonly {identity:string;label:string}[]};
  retryIdentity?:string;
  canRetry?:boolean;
  candidateEvidence?: string;
  contextEvidence?: string;
  recentConsensus?: RecentConsensusView[];
  events?:readonly {readonly identity:string;readonly description:string;readonly observedAt:number}[];
  observedAt?: number; observedMonotonic?:number; snapshotMonotonic?:number; blockTimestamp?: number; lastOperationAt?: number;
  source?: string; connection?: string; error?: string; note?: string;
  preattestations?: VoteView; attestations?: VoteView; quorum?: number; committeePower?: number;committeeTotal?:number;
  timing?: {level?: number; round: number; nextRound: number; endsAt: number; startedAt?: number};
  nextBakers?: {label: string; alias?: string; address: string; round: number; level: number}[];
  missingPre?: DelegateView[]; missingAtt?: DelegateView[]; committee?:DelegateView[];unknownConsensus?:readonly string[]; sources?: SourceView[];
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
      const key = value.identity??`${value.level}:${value.round}:${value.payload ?? ''}`; keys.add(key);
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
      row.title = `Level ${value.level} · round ${value.round}${value.payload ? ` · payload ${value.payload}` : ''}${value.source?` · source ${value.source}`:""}`;
      for (const [offset, power] of [value.prePower, value.attPower].entries()) {
        const total=(offset===0?value.preTotal:value.attTotal)??value.total;
        const percent = power!==undefined && total > 0 ? Math.min(100, Math.max(0, 100 * power / total)) : undefined;
        const cell = row.children[offset + 1] as HTMLElement;
        set(cell.children[0] as HTMLElement, `${offset === 0 ? 'Pre' : 'Att'} ${percent === undefined ? '—' : `${percent.toFixed(1)}%`}`);
        cell.title = `${number(power)} / ${number(total)} voting power`;
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

function delegateList(network: Network, phase: 'Pre' | 'Att' | 'Committee') {
  const full=phase==='Committee',title = full?'Committee evidence':phase === 'Pre' ? 'Missing preattestations' : 'Missing attestations';
  const {details, summary, body} = disclosure(title, `consensus-v2:${network}:${phase}`);
  if(full)details.classList.add('committee-evidence');
  const intro = el('p', 'table-note', full?'Validated-rights delegates. Receipt and absence refer only to the selected source/context; no network-wide inactivity claim.':'Expected rights minus observed signers. Power is committee voting power, not token balance.');
  const viewport = el('div', 'delegate-scroll'); viewport.tabIndex = 0; viewport.setAttribute('aria-label', `${title} delegate list`);
  const table = el('table', 'delegate-table'), head = el('thead'), header = el('tr');
  for (const name of ['Baker', 'Address', 'Power', 'Share', 'Eligibility',...(full?['Preattestation','Attestation','Context']:[])]) header.append(el('th', '', name)); head.append(header);
  const tbody = el('tbody'); table.append(head, tbody); viewport.append(table); const empty = el('p', 'empty-state', 'Rights or observations unavailable.'); body.append(intro, viewport, empty);
  const rows = new Map<string, HTMLTableRowElement>();
  const search=el('input');search.type='search';search.setAttribute('aria-label','Search committee alias or address');
  const sort=el('select');sort.setAttribute('aria-label','Committee sort');for(const [value,label] of [['power','Power'],['address','Address'],['alias','Alias']]){const option=el('option','',label);option.value=value??'';sort.append(option);}
  const resort=el('button','','Resort committee');resort.type='button';
  const receipt=el('select');receipt.setAttribute('aria-label','Committee phase receipt filter');for(const [value,label] of [['all','All phase receipts'],['pre:received','Preattestation received'],['att:received','Attestation received'],['pre:absent','Preattestation snapshot absent'],['att:absent','Attestation snapshot absent'],['pre:unknown','Preattestation partial / unavailable'],['att:unknown','Attestation partial / unavailable']]){const option=el('option','',label);option.value=value??'';receipt.append(option);}
  const unknown=el('p','committee-unknown');
  if(full){body.insertBefore(search,viewport);body.insertBefore(sort,viewport);body.insertBefore(resort,viewport);body.insertBefore(receipt,viewport);body.append(unknown);}
  let current:DelegateView[]|undefined,currentTotal:number|undefined,unknownFacts:readonly string[]=[],order:string[]=[],reset=true;
  const explicit=()=>{reset=true;render();};search.addEventListener('input',explicit);sort.addEventListener('change',explicit);resort.addEventListener('click',explicit);receipt.addEventListener('change',explicit);
  tbody.addEventListener('focusout',()=>queueMicrotask(()=>render()));
  function render() {
    const delegates=current,total=currentTotal;
    const scrollTop = viewport.scrollTop;
    const known = delegates !== undefined,all=[...(delegates??[])],query=search.value.trim().toLowerCase();
    const matches=(delegate:DelegateView)=>{
      if(query&&!(delegate.searchAlias??delegate.alias??'').toLowerCase().includes(query)&&!delegate.address.toLowerCase().includes(query))return false;
      const [phase,state]=receipt.value.split(':');if(!state)return true;const fact=phase==='pre'?delegate.preReceipt:delegate.attReceipt;
      return state==='received'?fact==='Received':state==='absent'?fact==='Absent in selected source snapshot':fact!=='Received'&&fact!=='Absent in selected source snapshot';
    };
    const compare=(a:DelegateView,b:DelegateView)=>sort.value==='address'?a.address.localeCompare(b.address):sort.value==='alias'?(a.searchAlias??a.alias??'').localeCompare(b.searchAlias??b.alias??'')||a.address.localeCompare(b.address):b.power-a.power||a.address.localeCompare(b.address);
    let list:DelegateView[];
    if(full){const byAddress=new Map(all.map(delegate=>[delegate.address,delegate]));const matching=all.filter(matches);
      if(reset){order=matching.sort(compare).map(delegate=>delegate.address);reset=false;}
      else {order=order.filter(address=>{const delegate=byAddress.get(address);return delegate!==undefined&&(matches(delegate)||rows.get(address)?.contains(document.activeElement));});const retained=new Set(order);for(const delegate of matching)if(!retained.has(delegate.address)){order.push(delegate.address);retained.add(delegate.address);}}
      list=order.map(address=>byAddress.get(address)!);
      set(unknown,`Unknown-rights observations · ${unknownFacts.filter(fact=>!query||fact.toLowerCase().includes(query)).join('; ')||'None matching this query'}`);
    }else list=all.sort((a,b)=>b.power-a.power);
    if(full)set(intro,`Validated-rights delegates · ${!known||all.some(delegate=>delegate.preReceipt==='Partial / unavailable'||delegate.attReceipt==='Partial / unavailable')?'Coverage partial / unavailable; absence is not established for those phase rows':'Usable selected-source snapshot receipt states'} · no network-wide inactivity or global completeness claim.`);
    const forbidden = list.filter(item => item.forbidden || item.eligibility === 'forbidden').length;
    const sum = list.reduce((acc, item) => acc + item.power, 0);
    set(summary, known ? `${title} · ${list.length} bakers · ${number(sum)} power${forbidden ? ` · ${forbidden} forbidden` : ''}` : `${title} · unavailable`);
    const keep = new Set(list.map(item => item.address));
    for (const [address, row] of rows) if (!keep.has(address)) {row.remove(); rows.delete(address);}
    list.forEach((delegate, index) => {
      let row = rows.get(delegate.address);
      if (!row) {row = el('tr'); for (let i = 0; i < (full?8:5); i++) row.append(el('td')); rows.set(delegate.address, row);}
      const cells = row.children;
      const pending=full&&!matches(delegate);set(cells[0] as HTMLElement,`${delegate.alias??'No alias'}${pending?' · Pending exclusion until focus leaves':''}`);row.dataset.pendingExclusion=String(pending);
      const address = cells[1] as HTMLElement;
      let addressText = address.querySelector('span');
      if (!addressText) {
        addressText = el('span', 'address-text', short(delegate.address));
        const copy = el('button', 'address-copy', 'Copy'); copy.type = 'button';
        copy.setAttribute('aria-label', `Copy full address for ${delegate.alias ?? delegate.address}`);
        copy.addEventListener('click', () => {void navigator.clipboard?.writeText(delegate.address).then(() => {set(copy, 'Copied'); setTimeout(() => set(copy, 'Copy'), 1400);}).catch(() => set(copy, 'Unavailable'));});
        address.append(addressText, copy);
      }
      address.querySelector('button')?.setAttribute('aria-label',`Copy full address for ${delegate.alias??delegate.address}`);
      address.title = delegate.address;
      set(cells[2] as HTMLElement, number(delegate.power)); set(cells[3] as HTMLElement, total ? `${(100 * delegate.power / total).toFixed(2)}%` : '—');
      const eligibility = delegate.forbidden ? 'forbidden' : delegate.eligibility ?? 'unavailable';
      const badge = cells[4] as HTMLElement; set(badge, delegate.eligibilityState==='context-invalid'?'Context invalid':delegate.eligibilityState==='stale'?'Stale':eligibility === 'unavailable' ? 'Unknown' : eligibility === 'forbidden' ? 'Forbidden' : 'Eligible'); badge.dataset.eligibility = eligibility;badge.title=delegate.eligibilityNote??'Eligibility evidence unavailable';
      if(full){set(cells[5] as HTMLElement,delegate.preReceipt??'Partial / unavailable');set(cells[6] as HTMLElement,delegate.attReceipt??'Partial / unavailable');set(cells[7] as HTMLElement,delegate.contextNote??'Context unavailable');}
      if (tbody.children[index] !== row) tbody.insertBefore(row, tbody.children[index] ?? null);
    });
    empty.hidden = known && list.length > 0; viewport.hidden = !known || list.length === 0;
    set(empty, known ? full?'No validated committee delegates match these controls.':'All expected bakers observed for this phase.' : 'Rights or observations unavailable.');
    // Removing an observed signer can trigger browser scroll anchoring to a new row.
    viewport.scrollTop = scrollTop;
  }
  return {root:details,update(delegates:DelegateView[]|undefined,total:number|undefined,observations:readonly string[]=[]){current=delegates;currentTotal=total;unknownFacts=observations;render();}};
}

export function createDashboard(root: HTMLElement, options: {onPauseChange?: (paused: boolean) => void; onReconnect?: () => void; revision?: string; onSelect?: (network:Network, identity:string)=>void;onRetry?: (network:Network,identity:string)=>void;onPin?:(network:Network)=>void;onFollow?:(network:Network)=>void;onLatest?:(network:Network)=>void;onCompare?:(network:Network,url:string)=>void} = {}): {update(network: Network, model: NetworkViewModel): void; tick(now?: number): void} {
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
    const candidateControls = el('div', 'candidate-controls'); candidateControls.setAttribute('aria-label','Observed candidates and payloads');
    const candidateEvidence = el('p','candidate-evidence table-note');
    let retryIdentity:string|undefined;
    const retry=el("button","","Retry selected observer context");retry.type="button";retry.hidden=true;retry.addEventListener("click",()=>{if(retryIdentity)options.onRetry?.(network,retryIdentity);});
    const candidateButtons = new Map<string,HTMLButtonElement>();
    const gauges = el('div', 'gauges'), pre = gauge('Preattestations', 'pre'), att = gauge('Attestations', 'att'); gauges.append(pre.root, att.root); consensus.append(sectionTitle, selection, candidateControls, candidateEvidence,retry, gauges);
    const opportunities = el('section', 'opportunities'), timingHeader = el('div', 'section-heading'); timingHeader.append(el('h3', '', 'Next baking opportunities'));
    const countdown = el('span', 'countdown', 'Timing unavailable'); timingHeader.append(countdown);
    const timing = el('p', 'timing-detail', 'Calculated opportunity round unavailable');
    const bakerRows = el('div', 'baker-rows'); opportunities.append(timingHeader, timing, bakerRows);
    const missing = el('section', 'missing-section'); missing.append(el('h3', '', 'Expected bakers not observed'));
    const recent = recentConsensus();
    const missingPre = delegateList(network, 'Pre'), missingAtt = delegateList(network, 'Att'); missing.append(missingPre.root, missingAtt.root);
    const committee=delegateList(network,'Committee');missing.append(committee.root);
    const evidence = disclosure('Sources & observation evidence', `consensus-v2:${network}:evidence`);
    const metadata = el('dl', 'evidence-meta');
    const meta = new Map<string, HTMLElement>();
    for (const label of ['Primary source', 'Applied head', 'Block hash', 'Last successful head', 'Last operation', 'Block age', 'Snapshot age']) {metadata.append(el('dt', '', label)); const value = el('dd', '', 'Unavailable'); metadata.append(value); meta.set(label, value);}
    const sessionControls=el("div","session-controls"),sessionNote=el("p","table-note"),sessionSelect=el("select");sessionSelect.setAttribute("aria-label","Retained session instance");
    const pinSelected=el("button","control-button","Pin selected instance"),latest=el("button","control-button","Latest"),follow=el("button","control-button","Follow live");for(const button of [pinSelected,latest,follow])button.type="button";
    pinSelected.addEventListener("click",()=>options.onPin?.(network));latest.addEventListener("click",()=>options.onLatest?.(network));follow.addEventListener("click",()=>options.onFollow?.(network));sessionSelect.addEventListener("change",()=>{if(sessionSelect.value)options.onSelect?.(network,sessionSelect.value);});sessionControls.append(sessionNote,sessionSelect,pinSelected,latest,follow);evidence.body.append(sessionControls);
    const comparisonSection=el('section','source-comparison'),comparisonProvider=el('select'),compare=el('button','control-button','Compare selected observation'),comparisonResult=el('div','comparison-result table-note');
    comparisonProvider.setAttribute('aria-label','Comparison provider');compare.type='button';compare.addEventListener('click',()=>options.onCompare?.(network,comparisonProvider.value));comparisonSection.append(el('h4','','Independent source comparison'),comparisonProvider,compare,comparisonResult);evidence.body.append(comparisonSection);
    const comparisonOptions=new Map<string,HTMLOptionElement>();
    const sessionOptions=new Map<string,HTMLOptionElement>();
    const authorityEvidence=el('p','authority-evidence table-note');
    const sourceRows = el('div', 'source-rows'), history = el('ol', 'event-history'); evidence.body.append(metadata, authorityEvidence, sourceRows, el('h4', '', 'Recent network events'), history);
    panel.append(panelHeader, headline, appliedContext, proposalContext, connection, notice, consensus, recent.root, opportunities, missing, evidence.details); grid.append(panel);
    const keyedBakers = new Map<string, HTMLElement>(), keyedSources = new Map<string, HTMLElement>();
    let current: NetworkViewModel | undefined, previousStatus: NetworkViewModel['status'] | undefined;
    const tick = (now: number): void => {
      if (!current) return;
      const age = current.observedMonotonic === undefined ? undefined : Math.max(0, (performance.now() - current.observedMonotonic) / 1000);
      const snapshotAge=current.snapshotMonotonic===undefined?undefined:Math.max(0,(performance.now()-current.snapshotMonotonic)/1000);
      set(freshness, age === undefined ? 'No head message yet' : `Last head message ${age < 1 ? 'just now' : `${Math.floor(age)}s ago`}`);
      set(meta.get('Snapshot age')!, snapshotAge === undefined ? 'Unavailable' : `${Math.floor(snapshotAge)}s`);
      set(meta.get('Block age')!, current.blockTimestamp === undefined ? 'Unavailable' : current.observedAt===undefined||age===undefined?'Unavailable':`${Math.max(0,Math.floor((current.observedAt-current.blockTimestamp)/1000+age))}s`);
      const t = current.timing;
      if (!t) {set(countdown, 'Timing unavailable'); set(timing, 'Calculated opportunity round unavailable'); return;}
      const remaining = Math.ceil((t.endsAt - now) / 1000);
      set(countdown, remaining > 0 ? `${Math.floor(remaining / 60)}m ${String(remaining % 60).padStart(2, '0')}s` : 'Awaiting next opportunity');
      set(timing, `Scheduled opportunity · level ${number(t.level ?? current.consensusLevel)} · estimated round ${t.round} → ${t.nextRound} · boundary ${clock(t.endsAt)}${remaining <= 0 ? ' · waiting for fresh timing' : ''}`);
    };
    states.set(network, {tick, update(model) {
      current = model; panel.dataset.status = model.status;
      const labels = {loading: 'Connecting', healthy: 'Observed advance', unknown:'Progress unknown',stalled: 'Prediction elapsed', degraded: 'RPC coverage degraded'};
      set(status, labels[model.status]); set(tabStatus, labels[model.status]); tab.dataset.status = model.status; set(level, number(model.appliedLevel ?? model.level)); set(round, number(model.appliedRound ?? model.round));
      const levelLabel=level.parentElement?.querySelector('.eyebrow'), roundLabel=round.parentElement?.querySelector('.eyebrow');
      if(levelLabel)set(levelLabel as HTMLElement,'Applied block level');
      if(roundLabel)set(roundLabel as HTMLElement,'Applied block round');
      set(appliedContext, model.appliedLevel === undefined ? 'Last applied block unavailable' : `Last applied block · level ${number(model.appliedLevel)} · round ${number(model.appliedRound)}${model.blockTimestamp === undefined ? "" : ` · block timestamp ${clock(model.blockTimestamp)}`}`);
      set(proposalContext, model.roundSource === 'schedule' ? 'Proposal observation unavailable' : model.roundSource === 'observed' ? model.observedProposal && model.observedProposal.level===model.level&&model.observedProposal.round===model.round && model.payload && model.observedProposal.payload===model.payload ? `Observed proposal · level ${number(model.level)} · round ${model.round}` : `Observed votes · level ${number(model.level)} · round ${model.round}` : 'Proposal observation unavailable');
      if (model.observedProposal) proposalContext.title = `Last observed proposal: level ${model.observedProposal.level}, round ${model.observedProposal.round}${model.observedProposal.at === undefined ? '' : ` at ${clock(model.observedProposal.at)}`}`;
      else proposalContext.removeAttribute('title');
      const session=model.session;sessionControls.hidden=!session;
      if(session){set(sessionNote,`${session.mode==="follow"?"Follow live":session.frozen?"Pinned frozen snapshot outside retained history":"Pinned retained session instance"} · ${session.instances.length} / 150 session instances · ${session.accepted} / 100 active candidates · ${session.unresolved} / 100 unresolved identities · ${session.raw} / 10000 raw operations · ${session.newerPartial?"At least ":""}${session.newer} newer items${session.newerPartial?"; first-arrival history partial":""} · Browser-session history is nonarchival and resets on reload`);pinSelected.disabled=!session.canPin;follow.setAttribute("aria-pressed",String(session.mode==="follow"));latest.setAttribute("aria-pressed","false");const wanted=new Set(session.instances.map(instance=>instance.identity));for(const instance of session.instances){let option=sessionOptions.get(instance.identity);if(!option){option=el("option");option.value=instance.identity;sessionOptions.set(instance.identity,option);sessionSelect.append(option);}set(option,instance.label);}for(const [key,option] of sessionOptions)if(!wanted.has(key)){option.remove();sessionOptions.delete(key);}sessionSelect.value=session.selected??"";}
      const comparison=model.comparison;comparisonSection.hidden=!comparison;
      if(comparison){const wanted=new Set(comparison.providers.map(provider=>provider.url));for(const [url,option] of comparisonOptions)if(!wanted.has(url)){option.remove();comparisonOptions.delete(url);}for(const provider of comparison.providers)if(!comparisonOptions.has(provider.url)){const option=el('option','',`${provider.name} · ${provider.url}`);option.value=provider.url;comparisonOptions.set(provider.url,option);comparisonProvider.append(option);}compare.disabled=!comparison.enabled||comparison.running||!comparison.providers.length;comparisonProvider.disabled=comparison.running;const result=comparison.result?.();
        if(!result)set(comparisonResult,comparison.running?'Comparison in progress; LIVE authority remains separate':'Explicit one-shot comparison · at most 3 reads · 8 seconds per read including body · no polling');
        else{const raw=result.rawOperations.map(operation=>`${operation.hash} · source ${operation.evidence?.source.baseUrl??'unknown'} · requested head ${operation.evidence?.requestedHeadHash??'unknown'} · observed head ${operation.evidence?.observedHeadHash??'unknown'} · ${operation.contents.map(content=>`${content.kind} ${content.level}/${content.round}/${content.block_payload_hash??'unknown'} slot ${content.slot}`).join('; ')}`).join(' | ');
          const power=result.powers===undefined?'Power unknown: compatible cached committee proof unavailable':result.powers.length===0?'Phase power unknown: no captured compatible positive votes; empty pending does not certify zero':result.powers.map(group=>`${group.round}/${group.payload} · Pre ${group.pre===undefined?'unknown':`${group.pre}/${group.total}`} · Att ${group.att===undefined?'unknown':`${group.att}/${group.total}`} · threshold ${group.threshold}`).join('; ');
          const rightReceipt=result.rights?.[0]?.evidence;
          set(comparisonResult,`${result.outcome} · ${result.invalidated?'context-invalid · ':''}${result.stale?'stale · ':''}Selected ${result.selection.historical?'historical':'observed'} A ${result.selection.source.baseUrl} · ${result.selection.header?.hash??'hash unknown'} · ${result.selection.level}/${result.selection.round} · chain ${result.selection.chainId??'unknown'} · time ${result.selection.header?.timestamp??'unknown'} · fetched current B ${result.source.baseUrl} · chain ${result.chainId??'unknown'} · hash ${result.head?.hash??'unknown'} · level ${result.head?.level??'unknown'} · round ${result.head?proposalRound(result.head.fitness,result.head.level)??'unknown':'unknown'} · time ${result.head?.timestamp??'unknown'} · producing protocol ${result.protocolHash??'unknown'} · ${result.differences.join('; ')} · received ${result.evidence?new Date(result.evidence.receivedAt).toISOString():'unavailable'} · ${result.evidence?Math.max(0,Math.floor((performance.now()-result.evidence.receivedMonotonic)/1000)):'unknown'}s monotonic age · ${result.reads.length}/3 reads · Head comparison is not vote agreement or finality. Separate B source-limited observations; never pooled with LIVE power/events. ${power} · rights original responder ${rightReceipt?.source.baseUrl??'unknown'} · rights requested anchor ${rightReceipt?.requestedHeadHash??'unknown'} · rights context head ${rightReceipt?.contextHeadHash??'unknown'} · rights chain ${rightReceipt?.chainId??'unknown'} · rights protocol ${rightReceipt?.protocolHash??'unknown'} · rights target ${rightReceipt?.targetLevel??'unknown'} · rights received ${rightReceipt?new Date(rightReceipt.receivedAt).toISOString():'unknown'} · raw ${result.rawOperations.length} · ${raw||'Raw unavailable / no retained entries; no measured-zero claim'} · ${result.pendingReasons.join('; ')} · ${result.errors.join('; ')}`);
        }
      }
      recent.update(model.recentConsensus);
      set(transport, `${model.connection ?? 'Monitoring'}${model.source ? ` · ${model.source}` : ''}`);
      set(notice, model.error ?? model.note ?? (model.status === 'stalled' ? 'Proposal activity continues, but the level has not advanced.' : model.status === 'loading' ? 'Waiting for the first successful observation.' : 'Live observations from this browser.'));
      set(activity, `${model.roundSource==='schedule'?'Scheduled':'Observed'} round ${number(model.activityRound)}`); set(selection, `Level ${number(model.consensusLevel ?? model.level)} · payload ${short(model.payload)}`); selection.title = model.payload ?? '';
      const candidateKeys = new Set<string>();
      for (const candidate of model.candidates ?? []) {
        candidateKeys.add(candidate.identity);
        let button = candidateButtons.get(candidate.identity);
        if (!button) {
          button = el('button','control-button'); button.type = 'button';
          button.addEventListener('click', () => options.onSelect?.(network,candidate.identity));
          candidateButtons.set(candidate.identity,button); candidateControls.append(button);
        }
        set(button, candidate.hash ? `Candidate ${candidate.hash}` : `Payload ${short(candidate.payload)}`);
        button.setAttribute('aria-label', candidate.hash ? `Inspect candidate ${candidate.hash}` : `Inspect payload ${candidate.payload ?? 'unavailable'}`);
        button.setAttribute('aria-pressed',String(candidate.identity === model.selectedIdentity));
        button.title = `Level ${candidate.level} · round ${candidate.round} · payload ${candidate.payload ?? 'unavailable'}`;
      }
      for (const [key,button] of candidateButtons) if (!candidateKeys.has(key)) {button.remove();candidateButtons.delete(key);}
      retryIdentity=model.retryIdentity;retry.hidden=retryIdentity===undefined;retry.disabled=!model.canRetry;
      set(candidateEvidence,model.candidateEvidence ?? 'Candidate identity unavailable · producer unknown');
      set(authorityEvidence,model.contextEvidence??'Rights context unavailable');
      pre.update(model.preattestations, model.quorum); att.update(model.attestations, model.quorum);
      missingPre.update(model.missingPre, model.committeePower); missingAtt.update(model.missingAtt, model.committeePower);committee.update(model.committee,model.committeeTotal??model.committeePower,model.unknownConsensus);
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
      if (previousStatus !== model.status && model.status !== 'loading') {
        if (previousStatus !== undefined) set(announcements, `${name}: ${labels[model.status]}`);
      }
      history.replaceChildren(...(model.events??[]).slice(-12).reverse().map(event=>el('li','',`${clock(event.observedAt)} · ${event.description}`)));
      previousStatus = model.status; tick(Date.now());
    }});
  }
  try {root.dataset.selected = localStorage.getItem('consensus-v2:network') === 'shadownet' ? 'shadownet' : 'mainnet';} catch {root.dataset.selected = 'mainnet';}
  return {update(network, model) {states.get(network)!.update(model);}, tick(now = Date.now()) {for (const state of states.values()) state.tick(now);}};
}
