import {expect, test, type Page} from '@playwright/test';

// Runtime/import failures must remain execution errors in semantic reports.
const executionErrors=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{
  const errors:string[]=[];executionErrors.set(page,errors);
  page.on('pageerror',error=>errors.push(`Browser runtime error: ${error.message}`));
  page.on('response',response=>{
    const url=new URL(response.url());
    if(url.hostname==='127.0.0.1' && response.status()>=400 && /\.(?:ts|js|css)(?:$|\?)/.test(url.pathname))errors.push(`Production asset failed: ${url.pathname} HTTP ${response.status()}`);
  });
});
test.afterEach(async({page})=>{
  const errors=executionErrors.get(page)??[];
  if(errors.length)throw new Error(errors.join('\n'));
});

type Channel = 'mainnet-head' | 'mainnet-operations' | 'shadownet-head' | 'shadownet-operations' | 'mainnet-proposals' | 'shadownet-proposals';
declare global {
  interface Window {
    mockStreams: Record<string, ReadableStreamDefaultController<Uint8Array>>;
    mockInitialOperations: boolean;
    mockHidden: boolean;
    mockRequests: {url:string;aborted:boolean}[];
  }
}

const head = (level = 100, round = 0) => ({
  level, hash: `BBlock${level}`, predecessor: `BBlock${level - 1}`,
  timestamp: new Date().toISOString(), fitness: ['02', level.toString(16).padStart(8,'0'), '', 'ffffffff', round.toString(16).padStart(8, '0')],
  payload_hash: `vhPayload${level}`,
});
const vote = (slot: number, level = 101, round = 0) => ({
  hash: `operation-${slot}-${level}-${round}`,
  contents: [{kind: 'preattestation', slot, level, round, block_payload_hash: `vhPayload${level}`}],
});

const headers=new WeakMap<Page,Map<string,ReturnType<typeof head>>>();
async function send(page: Page, channel: Channel, value: unknown): Promise<void> {
  if(channel.endsWith("-head")){
    let observed=value as ReturnType<typeof head>;const records=headers.get(page),parent=records?.get(observed.predecessor);
    if(parent){const parentRound=Number.parseInt(parent.fitness[4]??"0",16);observed={...observed,fitness:[...observed.fitness.slice(0,3),(0xffffffff-parentRound).toString(16).padStart(8,"0"),observed.fitness[4]??"00000000"]};value=observed;}
    records?.set(observed.hash,observed);
    if(!records?.has(observed.predecessor))records?.set(observed.predecessor,{...head(observed.level-1),hash:observed.predecessor});
  }
  await page.evaluate(({channel, value}) => {
    const stream = window.mockStreams[channel];
    if (!stream) throw new Error(`Missing stream ${channel}`);
    stream.enqueue(new TextEncoder().encode(`${JSON.stringify(value)}\n`));
  }, {channel, value});
}

async function prepare(page: Page, initialOperations = true, initialHead=head(),expectedLevel=initialHead.level,initiallyHidden=false,sourceB=false,rpcCommittee?:{total:number;quorum:number;powers:readonly number[]},aliases?:readonly {address:string;alias:string}[]): Promise<void> {
  headers.set(page,new Map([[initialHead.hash,initialHead],[initialHead.predecessor,{...head(initialHead.level-1),hash:initialHead.predecessor}]]));
  await page.addInitScript(({initialOperations, initialHead, initiallyHidden,sourceB}) => {
    window.mockHidden=initiallyHidden;window.mockRequests=[];
    Object.defineProperty(document,"hidden",{configurable:true,get:()=>window.mockHidden});
    window.mockStreams = {};
    window.mockInitialOperations = initialOperations;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, options) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      const entry={url:url.href,aborted:options?.signal?.aborted??false};window.mockRequests.push(entry);
      options?.signal?.addEventListener('abort',()=>{entry.aborted=true;},{once:true});
      const monitoring = url.pathname.includes('/monitor/heads/') || url.pathname.endsWith('/monitor_operations') || url.pathname.includes('/monitor/validated_blocks');
      if (!monitoring) return originalFetch(input, options);
      const network = url.hostname.includes('shadownet') ? 'shadownet' : 'mainnet';
      const kind = url.pathname.includes('/monitor/heads/') ? 'head' : url.pathname.includes('/monitor/validated_blocks') ? 'proposals' : 'operations';
      if(sourceB && network==="mainnet" && kind==="operations" && url.hostname==="rpc.tzkt.io")return new Response("Unavailable A operations",{status:503});
      const body = new ReadableStream<Uint8Array>({start(controller) {
        window.mockStreams[`${network}-${kind}`] = controller;
        options?.signal?.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), {once: true});
        if (kind === 'head') controller.enqueue(new TextEncoder().encode(`${JSON.stringify(initialHead)}\n`));
        else if (kind === 'operations' && initialOperations) controller.enqueue(new TextEncoder().encode('[]\n'));
      }});
      return new Response(body, {headers: {'Content-Type': 'application/json'}});
    };
  }, {initialOperations, initialHead,initiallyHidden,sourceB});

  await page.route('https://**/*', async route => {
    const url = new URL(route.request().url());
    const level = Number(url.searchParams.get('level') ?? 100);
    let result: unknown;
    if (url.pathname.includes('attestation_rights')) result = [{level, delegates: Array.from({length: rpcCommittee?.powers.length??50}, (_, slot) => ({
      delegate: `tz1BakerAddress${String(slot).padStart(25, '0')}`, first_slot: slot, attesting_power: rpcCommittee?.powers[slot]??600,
    }))}];
    else if (url.pathname.endsWith('/context/constants')) result = {
      minimal_block_delay: '6', delay_increment_per_round: '3', consensus_threshold_size: rpcCommittee?.quorum??20000, consensus_committee_size: rpcCommittee?.total??30000,
    };
    else if (url.pathname.includes('baking_rights')) result = [{level, round: Number(url.searchParams.get('max_round') ?? 0), delegate: 'tz1BakerAddress0000000000000000000000000'}];
    else if (url.pathname.endsWith('/is_forbidden')) result = false;
    else if (url.pathname.endsWith('/protocols')) result={protocol:'PFixture',next_protocol:'PFixture'};
    else if (url.pathname.endsWith('/header')) {
      const hash=url.pathname.split('/blocks/')[1]?.split('/')[0]??'';
      const observed=headers.get(page)?.get(hash);
      if(!observed){await route.fulfill({status:404,json:{error:'Unobserved fixture header'}});return;}
      result={...observed,chain_id:'NetFixture'};
    }
    else if (url.pathname.includes('/v1/delegates')) result = aliases??Array.from({length: 50}, (_, slot) => ({address: `tz1BakerAddress${String(slot).padStart(25, '0')}`, alias: `Baker ${slot}`}));
    else if (url.pathname.includes('pending_operations')) result = {}; // No full snapshot is claimed by ordinary stream fixtures.
    else {await route.abort(); return;}
    await route.fulfill({json: result, headers: {'Access-Control-Allow-Origin': '*'}});
  });
  await page.goto('/');
  if(initiallyHidden)return;
  await expect(page.locator('.mainnet .headline')).toContainText(initialHead.level.toLocaleString('en-US'));
  await expect(page.locator('.shadownet .headline')).toContainText(initialHead.level.toLocaleString('en-US'));
}

test('monitor operations update the production dashboard without losing list scroll or focus', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await prepare(page,false);
  const pinned=headers.get(page)!.get("BBlock100")!;
  await page.route("https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header",route=>route.fulfill({json:{...pinned,chain_id:"NetFixture"}}));
  await page.route("https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*",route=>route.fulfill({json:{validated:[],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}}));
  await send(page, 'mainnet-operations', [vote(0)]);
  const panel = page.locator('.network-panel.mainnet');
  await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');
  await panel.getByRole("button",{name:"Inspect payload vhPayload101",exact:true}).click();
  await expect(panel).toContainText("Source-snapshot measured zero");
  const details = panel.locator('.missing-section details').first();
  await details.locator('summary').click();
  const viewport = details.locator('.delegate-scroll');
  await viewport.evaluate(element => {element.scrollTop = 200;});
  const copy = details.getByRole('button', {name: 'Copy full address for Baker 11 · TzKT', exact: true});
  await copy.focus();
  const position = await viewport.evaluate(element => element.scrollTop);
  await send(page, 'mainnet-operations', [vote(1)]);
  await expect(panel.locator('.pre .gauge-counts')).toContainText('1,200 / 30,000 power');
  await expect(details).toHaveAttribute('open', '');
  await expect(copy).toBeFocused();
  // Firefox may round scroll positions to subpixel row boundaries.
  expect(Math.abs(await viewport.evaluate(element => element.scrollTop) - position)).toBeLessThan(1);
  await send(page, 'mainnet-operations', [vote(1)]);
  await expect(panel.locator('.pre .gauge-counts')).toContainText('1,200 / 30,000 power');
  await expect(panel.locator('.pre .gauge-counts')).toContainText('2 / 50 signers');
  await page.screenshot({path: '/tmp/consensus-v2-redesign.png', fullPage: true});
});

test('one network can lose its head stream while the other continues receiving votes', async ({page}) => {
  await prepare(page);
  await page.evaluate(() => window.mockStreams['shadownet-head']!.error(new Error('Fixture outage')));
  await expect(page.locator('.shadownet .status-chip')).toHaveText('RPC coverage degraded');
  await send(page, 'mainnet-operations', [vote(0)]);
  await expect(page.locator('.mainnet .pre .gauge-counts')).toContainText('600 / 30,000 power');
  await expect(page.locator('.mainnet .status-chip')).toHaveText('Progress unknown');
});

test('recent consensus retains peak power after the current level moves on',async({page})=>{
  await prepare(page);
  await send(page,'mainnet-operations',[vote(0),vote(1)]);
  await expect(page.locator('.mainnet .pre .gauge-counts')).toContainText('1,200 / 30,000 power');
  await send(page,'mainnet-head',head(102));
  await expect(page.locator('.mainnet .headline')).toContainText('102');
  await expect(page.locator('.mainnet .recent-consensus')).toContainText('101 · r0');
  await expect(page.locator('.mainnet .recent-consensus')).toContainText('Pre 4.0%');
  await expect(page.locator('.mainnet .pre .gauge-counts')).not.toContainText('1,200');
});

test('unknown observations stay unavailable and votes outside the current round are excluded', async ({page}) => {
  await prepare(page, false);
  await expect(page.locator('.mainnet .pre .gauge-percent')).toHaveText('—');
  await expect(page.locator('.mainnet .pre .gauge-counts')).toContainText('Voting power unavailable');
  await send(page, 'mainnet-operations', [vote(0, 101, 9)]);
  await expect(page.locator('.mainnet .section-heading')).toContainText(['Scheduled round 0']);
  await expect(page.locator('.mainnet .pre .gauge-counts')).toContainText('Voting power unavailable');
  await send(page, 'mainnet-operations', [vote(0, 101, 0)]);
  await expect(page.locator('.mainnet .pre .gauge-counts')).toContainText('600 / 30,000 power');
  await send(page, 'mainnet-head', head(102));
  await expect(page.locator('.mainnet .headline')).toContainText('102');
  await expect(page.locator('.mainnet .consensus-section')).not.toContainText('Current round 9');
  await expect(page.locator('.mainnet .consensus-section')).not.toContainText('vhPayload100');
});

test('a round boundary clears the gauges instead of retaining old quorum', async ({page}) => {
  await page.clock.install({time: new Date()});
  await prepare(page);
  await send(page, 'mainnet-operations', [vote(0),vote(1)]);
  await expect(page.locator('.mainnet .pre .gauge-counts')).toContainText('1,200 / 30,000 power');
  await page.clock.fastForward(31_000);
  await expect(page.locator('.mainnet .section-heading')).toContainText(['Scheduled round 2']);
  await expect(page.locator('.mainnet .pre .gauge-counts')).toContainText('Voting power unavailable');
  await send(page, 'mainnet-operations', [vote(3,101,2)]);
  await expect(page.locator('.mainnet .pre .gauge-counts')).toContainText('600 / 30,000 power');
});

test('a stalled applied head and old votes cannot establish a current observed round',async({page})=>{
  const old=head(100,75);old.timestamp=new Date(Date.now()-3_600_000).toISOString();
  await prepare(page,true,old,101);
  await send(page,'shadownet-operations',[vote(0,101,0)]);
  const panel=page.locator('.network-panel.shadownet');
  await expect(panel.locator('.headline')).toContainText('Applied block round75');
  await expect(panel).toContainText('Proposal observation unavailable');
  await expect(panel.locator('.pre .gauge-percent')).toHaveText('—');
  await expect(panel.locator('.pre .gauge-counts')).toContainText('Voting power unavailable');
});

test('desktop and mobile layouts use the viewport without horizontal clipping', async ({page}) => {
  await prepare(page);
  for (const width of [1440, 390]) {
    await page.setViewportSize({width, height: 900});
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const panel = page.locator('.mainnet');
    expect(await panel.locator('.gauges').evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(900);
    await expect(panel.locator('.pre .gauge-percent')).toBeVisible();
  }
});

test('mobile network selection and disclosures persist, and pause stops stream updates', async ({page}) => {
  await page.setViewportSize({width: 390, height: 900});
  await prepare(page);
  await page.getByRole('button', {name: 'Shadownet Connecting'}).or(page.getByRole('button', {name: 'Shadownet Progress unknown'})).click();
  await expect(page.locator('.network-panel.shadownet')).toBeVisible();
  await page.locator('.shadownet .missing-section summary').first().click();
  await page.reload();
  await expect(page.locator('.network-panel.shadownet')).toBeVisible();
  await expect(page.locator('.network-panel.mainnet')).toBeHidden();
  await expect(page.locator('.shadownet .missing-section details').first()).toHaveAttribute('open', '');
  await page.getByRole('button', {name: 'Pause', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Resume', exact: true})).toBeVisible();
  await expect(page.locator('.shadownet .connection-line')).toContainText('Paused');
});


test('production stalled successor shows scheduled 37 and visible applied round 101 with no measured zero', async ({page}, testInfo) => {
  await page.clock.install({time: new Date('2026-10-14T18:54:31Z')});
  const applied = {...head(5489251, 101), timestamp: '2026-10-14T18:12:09Z'};
  await prepare(page, false, applied, 5489252);
  await send(page, 'shadownet-operations', [vote(0, 5489251, 101), vote(1, 5489252, 0), vote(2, 5489252, 36)]);
  const panel = page.locator('.network-panel.shadownet');
  await expect(panel.locator('.headline')).toHaveText('Applied block level5,489,251Applied block round101');
  await expect(panel.locator('.timing-detail')).toContainText('Scheduled opportunity · level 5,489,252 · estimated round 37');
  await expect(panel.locator('.applied-context')).toContainText('Last applied block · level 5,489,251 · round 101 · block timestamp');
  await expect(panel.locator('.applied-context')).toBeVisible();
  await expect(panel.locator('.pre .gauge-percent')).toHaveText('—');
  await expect(panel.locator('.att .gauge-percent')).toHaveText('—');
  await expect(panel.locator('.selection-label')).toContainText('payload Unavailable');
  await expect(panel.locator('.network-notice')).toContainText('Matching votes unavailable · scheduled level 5,489,252 · estimated round 37');
  const opportunities = panel.locator('.baker-opportunity');
  await expect(opportunities.nth(0)).toContainText('Next scheduled proposal');
  await expect(opportunities.nth(0)).toContainText('Level 5,489,252 · round 38');
  await expect(opportunities.nth(1)).toContainText('Following level · conditional');
  await expect(opportunities.nth(1)).toContainText('Level 5,489,253 · round 0');
  await expect(panel.locator('.opportunities')).not.toContainText('same level');
  await panel.screenshot({path: testInfo.outputPath('stalled-successor-hotfix.png')});
});

test('a validated proposal without matching payload votes never measures zero', async ({page}) => {
  await prepare(page, false);
  await send(page, 'mainnet-proposals', {chain_id: 'NetFixture', hash: 'BProposal', header: {...head(101), payload_hash: 'vhProposalA'}});
  const panel = page.locator('.mainnet');
  await expect(panel.locator('.proposal-context')).toContainText('Observed proposal');
  await expect(panel.locator('.pre .gauge-percent')).toHaveText('—');
  const malformed = vote(0);
  delete (malformed.contents[0] as {block_payload_hash?: string}).block_payload_hash;
  await send(page, 'mainnet-operations', [malformed]);
  await expect(panel.locator('.evidence-meta dd').nth(4)).not.toHaveText('Unavailable');
  await expect(panel.locator('.pre .gauge-percent')).toHaveText('—');
  await expect(panel.locator('.selection-label')).not.toContainText('unknown');
  await send(page, 'mainnet-operations', [vote(1)]);
  await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');
  await expect(panel.locator('.proposal-context')).toContainText('Observed votes');
  await expect(panel.locator('.proposal-context')).not.toContainText('Observed proposal');
  await expect(panel.locator('.att .gauge-percent')).toHaveText('—');
  await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');
  await expect(panel.locator('.network-notice')).toContainText('Observed votes · level 101 · round 0');
  await expect(panel.locator('.network-notice')).toContainText('partial positive observations');
  await expect(panel.locator('.network-notice')).not.toContainText('Current round');
});


test('observed votes and scheduled proposals name their own levels and rounds', async ({page}) => {
  await page.clock.install({time: new Date('2026-10-14T18:54:31Z')});
  const applied = {...head(5489251, 114), timestamp: '2026-10-14T18:47:21Z'};
  await prepare(page, false, applied, 5489251);
  await send(page, 'shadownet-operations', [vote(0, 5489252, 0)]);
  const panel = page.locator('.network-panel.shadownet');
  await expect(panel.locator('.headline')).toHaveText('Applied block level5,489,251Applied block round114');
  await expect(panel.locator('.network-notice')).toContainText('Observed votes · level 5,489,252 · round 0');
  await expect(panel.locator('.network-notice')).toContainText('partial positive observations');
  await expect(panel.locator('.network-notice')).not.toContainText('Current round');
  await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');
  await expect(panel.locator('.timing-detail')).toContainText('estimated round 6');
  const opportunities = panel.locator('.baker-opportunity');
  await expect(opportunities.nth(0)).toContainText('Next scheduled proposal');
  await expect(opportunities.nth(0)).toContainText('Level 5,489,252 · round 7');
  await expect(opportunities.nth(1)).toContainText('Following level · conditional');
  await expect(opportunities.nth(1)).toContainText('Level 5,489,253 · round 0');
});

 test("foundations slice 1 selects same-round shared-payload candidates and isolates competing power",async({page},testInfo)=>{
  await prepare(page,false);const panel=page.locator(".network-panel.mainnet");
  for(const hash of ["H1","H2"]) await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash,header:{...head(101),payload_hash:"vhPayload101"}});
  await send(page,"mainnet-operations",[vote(0)]);
  await expect(panel.getByRole("button",{name:"Inspect candidate H1",exact:true})).toBeVisible();
  await expect(panel.getByRole("button",{name:"Inspect candidate H2",exact:true})).toBeVisible();
  await panel.getByRole("button",{name:"Inspect candidate H1",exact:true}).click();
  await expect(panel.locator(".candidate-evidence")).toContainText("H1");
  await expect(panel.locator(".candidate-evidence")).toContainText("Producer unknown");
  await expect(panel.locator(".candidate-evidence")).toContainText("Shared payload evidence");
  await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");
  await panel.getByRole("button",{name:"Inspect candidate H2",exact:true}).click();
  await expect(panel.locator(".candidate-evidence")).toContainText("H2");
  await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");
  const competing=vote(1);competing.contents[0]!.block_payload_hash="vhOtherPayload";
  await send(page,"mainnet-operations",[competing]);
  await panel.getByRole("button",{name:"Inspect payload vhOtherPayload",exact:true}).click();
  await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");
  await panel.getByRole("button",{name:"Inspect candidate H1",exact:true}).click();
  const aggregate={hash:"replay-aggregate",contents:[{kind:"preattestations_aggregate",consensus_content:{level:101,round:0,block_payload_hash:"vhPayload101"},committee:[0,0]}]};
  await send(page,"mainnet-operations",[aggregate,aggregate]);
  await expect(panel.locator(".pre .gauge-counts")).toContainText("1 / 50 signers");
  await expect(panel.locator(".pre .quorum-caption")).toContainText("19,400 more power");
  await expect(panel.locator(".candidate-evidence")).toContainText("rpc.tzkt.io");
  await panel.getByText("Sources & observation evidence",{exact:true}).click();
  await expect(panel.locator(".authority-evidence")).toBeVisible();
  await expect(panel.locator(".authority-evidence")).toContainText("Rights responder https://mainnet.smartpy.io");
  await expect(panel.locator(".authority-evidence")).toContainText("authority observer https://rpc.tzkt.io/mainnet");
  await expect(panel.locator(".authority-evidence")).toContainText("chain NetFixture · context head BBlock100 · requested anchor BBlock100 · target 101 · execution protocol PFixture");
  await expect(panel.locator(".authority-evidence")).toContainText("rights received");
  await panel.getByText("Sources & observation evidence",{exact:true}).click();
  await panel.screenshot({path:`roster/observatory-foundations/slice-1-${testInfo.project.name}.png`});
 });

 test("foundations AC-4 initially hidden starts no work and permitted generations restart",async({page},testInfo)=>{
  await prepare(page,false,head(),100,true);
  expect(await page.evaluate(()=>window.mockRequests.length)).toBe(0);
  await page.evaluate(()=>{window.mockHidden=false;document.dispatchEvent(new Event("visibilitychange"));});
  await expect(page.locator(".mainnet .headline")).toContainText("100");
  await expect.poll(()=>page.evaluate(()=>window.mockRequests.filter(request=>request.url.includes("/v1/delegates")).length)).toBe(2);
  await page.evaluate(()=>{window.mockHidden=true;document.dispatchEvent(new Event("visibilitychange"));});
  const paused=await page.evaluate(()=>window.mockRequests.length);
  await page.waitForTimeout(100);expect(await page.evaluate(()=>window.mockRequests.length)).toBe(paused);
  expect(await page.evaluate(()=>window.mockRequests.filter(request=>request.url.includes("/monitor/")).every(request=>request.aborted))).toBe(true);
  await page.evaluate(()=>{window.mockHidden=false;document.dispatchEvent(new Event("visibilitychange"));});
  await expect.poll(()=>page.evaluate(()=>window.mockRequests.length)).toBeGreaterThan(paused);
  await send(page,"mainnet-operations",[vote(0)]);await expect(page.locator(".mainnet .pre .gauge-counts")).toContainText("600 / 30,000 power");
  testInfo.annotations.push({type:"foundation-verified",description:"AC-4"});
 });
 test("foundations AC-20 manual pause survives pagehide pageshow and visibility restoration",async({page},testInfo)=>{
  await prepare(page);await page.getByRole("button",{name:"Pause",exact:true}).click();
  const count=await page.evaluate(()=>window.mockRequests.length);
  await page.evaluate(()=>{window.dispatchEvent(new Event("pagehide"));window.dispatchEvent(new Event("pageshow"));window.mockHidden=true;document.dispatchEvent(new Event("visibilitychange"));window.mockHidden=false;document.dispatchEvent(new Event("visibilitychange"));});
  await expect(page.getByRole("button",{name:"Resume",exact:true})).toBeVisible();
  await page.waitForTimeout(100);expect(await page.evaluate(()=>window.mockRequests.length)).toBe(count);
  await page.getByRole("button",{name:"Resume",exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.mockRequests.length)).toBeGreaterThan(count);
  testInfo.annotations.push({type:"foundation-verified",description:"AC-20"});
 });
 test("paused local candidate inspection starts no external reads",async({page},testInfo)=>{
  await prepare(page,false);
  for(const hash of ["H1","H2"])await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash,header:{...head(101),payload_hash:"vhPayload101"}});
  await send(page,"mainnet-operations",[vote(0)]);const panel=page.locator(".network-panel.mainnet");
  await expect(panel.getByRole("button",{name:"Inspect candidate H1",exact:true})).toBeVisible();
  await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");
  await page.getByRole("button",{name:"Pause",exact:true}).click();const count=await page.evaluate(()=>window.mockRequests.length);
  await panel.getByRole("button",{name:"Inspect candidate H2",exact:true}).click();
  await expect(panel.locator(".candidate-evidence")).toContainText("H2");await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");
  await panel.locator(".missing-section summary").first().click();await expect(panel.locator(".missing-section details").first()).toHaveAttribute("open","");
  expect(await page.evaluate(()=>window.mockRequests.length)).toBe(count);
  testInfo.annotations.push({type:"foundation-verified",description:"AC-21"});
 });


test("source B ahead votes promote under B proof while applied A remains independent",async({page},testInfo)=>{
 await prepare(page,false,head(120),120,false,true);
 const bHead=head(122),records=headers.get(page);records?.set("BBlock122",bHead);records?.set("BBlock121",head(121));
 let release:()=>void=()=>undefined;const held=new Promise<void>(resolve=>{release=resolve;});
 await page.route("https://mainnet.smartpy.io/chains/main/blocks/head/header",async route=>{await held;await route.fulfill({json:{...bHead,chain_id:"NetFixture"}});});
 await expect.poll(()=>page.evaluate(()=>Boolean(window.mockStreams["mainnet-operations"]))).toBe(true);
 await send(page,"mainnet-operations",[vote(0,123)]);
 const panel=page.locator(".network-panel.mainnet");
 await expect(panel.locator(".candidate-evidence")).toContainText("Unresolved");
 await expect(panel.locator(".candidate-evidence")).toContainText("mainnet.smartpy.io");
 await expect(panel.getByRole("button",{name:"Inspect payload vhPayload123",exact:true})).toBeVisible();
 await expect(panel.locator(".pre .gauge-counts")).toContainText("Voting power unavailable");release();
 await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");
 await expect(panel.locator(".headline")).toContainText("120");
 await expect(panel).toContainText("context head BBlock122");
 await expect(panel.locator(".att .gauge-percent")).toHaveText("—");
 await panel.getByRole("button",{name:"Inspect payload vhPayload123",exact:true}).click();
 const q1=vote(1,123),q2=vote(2,123);q1.contents[0]!.block_payload_hash="OtherPayload";q2.contents[0]!.block_payload_hash="OtherPayload";
 await send(page,"mainnet-operations",[q1,q2]);
 await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");
 await panel.getByRole("button",{name:"Inspect payload OtherPayload",exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("1,200 / 30,000 power");
 await panel.getByRole("button",{name:"Inspect payload vhPayload123",exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");
 await send(page,"mainnet-operations",[vote(0,123)]);await expect(panel.getByRole("button",{name:"Inspect payload vhPayload123",exact:true})).toHaveCount(1);
 const requests=await page.evaluate(()=>window.mockRequests.map(value=>value.url).filter(url=>url.includes("/blocks/head/header")));
 expect(requests).toContain("https://mainnet.smartpy.io/chains/main/blocks/head/header");
 await panel.getByText("Sources & observation evidence",{exact:true}).click();await expect(panel.locator(".authority-evidence")).toBeVisible();
 await panel.screenshot({path:`roster/observatory-foundations/slice-4-${testInfo.project.name}.png`});
});


test("failed B evidence retries only through a fresh permitted explicit action",async({page})=>{
 await prepare(page,false,head(120),120,false,true);
 let attempts=0;await page.route("https://mainnet.smartpy.io/chains/main/blocks/head/header",async route=>{attempts++;await route.fulfill({status:503,json:{error:"B unavailable"}});});
 await expect.poll(()=>page.evaluate(()=>Boolean(window.mockStreams["mainnet-operations"]))).toBe(true);
 await send(page,"mainnet-operations",[vote(0,123)]);const panel=page.locator(".network-panel.mainnet");
 await expect(panel.locator(".candidate-evidence")).toContainText("Unresolved");
 await expect.poll(()=>attempts).toBe(1);
 const retry=panel.getByRole("button",{name:"Retry selected observer context",exact:true});await expect(retry).toBeVisible();
 await retry.click();await page.waitForTimeout(100);expect(attempts).toBe(1);
 await page.clock.install();await page.clock.runFor(20000);expect(attempts).toBe(1);
 await send(page,"mainnet-operations",[vote(0,123)]);await page.clock.runFor(100);expect(attempts).toBe(1);
 await retry.click();await expect.poll(()=>attempts).toBe(2);
 await page.getByRole("button",{name:"Pause",exact:true}).click();await expect(retry).toBeDisabled();
});


test("late B response bodies cannot authorize after pause and resume",async({page})=>{
 await prepare(page,false,head(120),120,false,true);const bHead=head(122);headers.get(page)?.set(bHead.hash,bHead);headers.get(page)?.set(bHead.predecessor,head(121));
 await page.route("https://mainnet.smartpy.io/chains/main/blocks/head/header",route=>route.fulfill({json:{...bHead,chain_id:"NetFixture"}}));
 await expect.poll(()=>page.evaluate(()=>Boolean(window.mockStreams["mainnet-operations"]))).toBe(true);
 await page.evaluate(()=>{const original=window.fetch.bind(window);const state={waiting:false,release:()=>{}};Object.assign(window,{heldBBody:state});
 window.fetch=async(input,options)=>{const response=await original(input,options),url=typeof input==="string"?input:input instanceof URL?input.href:input.url;
 if(url==="https://mainnet.smartpy.io/chains/main/blocks/head/header"){const body=await response.json();response.json=()=>new Promise(resolve=>{state.waiting=true;state.release=()=>resolve(body);});}return response;};});
 await send(page,"mainnet-operations",[vote(0,123)]);await expect.poll(()=>page.evaluate(()=>(window as unknown as {heldBBody:{waiting:boolean}}).heldBBody.waiting)).toBe(true);
 await page.getByRole("button",{name:"Pause",exact:true}).click();
 const count=await page.evaluate(()=>window.mockRequests.length);await page.getByRole("button",{name:"Resume",exact:true}).click();
 await page.evaluate(()=>(window as unknown as {heldBBody:{release:()=>void}}).heldBBody.release());
 const panel=page.locator(".network-panel.mainnet");await expect(panel.locator(".candidate-evidence")).toContainText("Unresolved");
 await expect(panel.locator(".pre .gauge-counts")).toContainText("Voting power unavailable");await expect(panel.locator(".headline")).toContainText("120");
 expect(await page.evaluate(()=>window.mockRequests.filter(request=>request.url==="https://mainnet.smartpy.io/chains/main/blocks/head/header").every(request=>request.aborted))).toBe(true);
 expect(count).toBeGreaterThan(0);
});


test("reader selects retained A and B contexts without pooling their power",async({page})=>{
 await prepare(page,false,head(120));await send(page,"mainnet-operations",[vote(0,121)]);const panel=page.locator(".network-panel.mainnet");await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");
 const bHead=head(122);headers.get(page)?.set(bHead.hash,bHead);headers.get(page)?.set(bHead.predecessor,head(121));await page.route("https://mainnet.smartpy.io/chains/main/blocks/head/header",route=>route.fulfill({json:{...bHead,chain_id:"NetFixture"}}));
 await page.evaluate(()=>window.mockStreams["mainnet-operations"]!.error(new Error("A operations unavailable")));
 await expect.poll(()=>page.evaluate(()=>window.mockRequests.some(request=>request.url.startsWith("https://mainnet.smartpy.io")&&request.url.includes("monitor_operations")))).toBe(true);
 await send(page,"mainnet-operations",[vote(1,123),vote(2,123)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("1,200 / 30,000 power");
 await panel.getByRole("button",{name:"Inspect payload vhPayload121",exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");await expect(panel).toContainText("context head BBlock120");
 await panel.getByRole("button",{name:"Inspect payload vhPayload123",exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("1,200 / 30,000 power");await expect(panel).toContainText("context head BBlock122");
 await expect(panel.locator(".headline")).toContainText("120");
});


test("foundations AC-13 coherent source zero becomes stale while historical receipt stays inspectable",async({page},testInfo)=>{
 await page.clock.install();
 const current=head(100);await prepare(page,false,current);
 const candidate={...head(101),hash:"BZeroCandidate",payload_hash:"vhZeroPayload"};headers.get(page)?.set(candidate.hash,candidate);
 await page.route("https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header",route=>route.fulfill({json:{...current,chain_id:"NetFixture"}}));
 await page.route("https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*",route=>route.fulfill({json:{validated:[{hash:"unrelated",branch:current.hash,contents:[{kind:"transaction",source:"tz1Source",destination:"tz1Destination",fee:"1",counter:"1",gas_limit:"100",storage_limit:"0",amount:"1"}]}],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}}));
 await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash:candidate.hash,header:candidate});const panel=page.locator(".network-panel.mainnet");
 await panel.getByRole("button",{name:`Inspect candidate ${candidate.hash}`,exact:true}).click();await expect(panel.locator(".candidate-evidence")).toContainText(candidate.hash);
 await expect(panel.locator(".pre .gauge-counts")).toContainText("0 / 30,000 power");await expect(panel.locator(".att .gauge-counts")).toContainText("0 / 30,000 power");await expect(panel).toContainText("Source-snapshot measured zero");
 const asOf=(await panel.textContent())?.match(/snapshot received (\d{4}-[^ ]+)/)?.[1];expect(asOf).toBeTruthy();
 await page.evaluate(()=>window.mockStreams["mainnet-operations"]!.error(new Error("Source coverage interrupted")));
 await expect(panel.locator(".pre .gauge-counts")).toContainText("Voting power unavailable");await expect(panel).toContainText("Retained source snapshot stale");await expect(panel).toContainText(asOf!);await expect(panel.locator(".recent-phase.pre")).toContainText("Pre 0.0%");
 await page.getByRole("button",{name:"Pause",exact:true}).click();await page.clock.setSystemTime(new Date("2030-01-01T00:00:00Z"));await page.clock.runFor(1000);await expect(panel).toContainText(asOf!);await expect(panel.locator(".att .gauge-counts")).toContainText("Voting power unavailable");
 await page.getByRole("button",{name:"Resume",exact:true}).click();await expect(panel).toContainText(asOf!);await expect(panel.locator(".pre .gauge-counts")).toContainText("Voting power unavailable");
 testInfo.annotations.push({type:"foundation-verified",description:"AC-13"});
});


test("foundations AC-8 accepted crossing is attributed once and applied values stay separate",async({page},testInfo)=>{
 await prepare(page,false,head(100),100,false,false,{total:5,quorum:4,powers:[3,1,1]});const panel=page.locator(".network-panel.mainnet");
 await send(page,"mainnet-operations",[vote(0)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("3 / 5 power");
 await send(page,"mainnet-operations",[vote(1)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("4 / 5 power");
 const crossings=panel.locator(".event-history li").filter({hasText:/Preattestation.*(?:quorum reached|crossing)/});await expect(crossings).toHaveCount(1);
 const other={hash:"other-payload",contents:[{kind:"preattestation",level:101,round:0,slot:0,block_payload_hash:"vhOtherPayload"}]};await send(page,"mainnet-operations",[other]);
 await panel.getByRole("button",{name:"Inspect payload vhOtherPayload",exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("3 / 5 power");
 await panel.getByRole("button",{name:"Inspect payload vhPayload101",exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("4 / 5 power");await expect(crossings).toHaveCount(1);await expect(crossings).toContainText("rpc.tzkt.io/mainnet");await expect(panel.locator(".headline")).toContainText("100");await expect(panel).toContainText("Expected bakers not observed");
 testInfo.annotations.push({type:"foundation-verified",description:"AC-8"});
});


test("transport connectivity and observed source progress remain independent",async({page})=>{
 const current=head(100);await prepare(page,false,current);const panel=page.locator(".network-panel.mainnet");
 await expect(panel.locator(".status-chip")).toHaveText("Progress unknown");
 await expect(panel.locator(".authority-evidence")).toContainText("NetFixture");
 await send(page,"mainnet-head",head(101));await expect(panel.locator(".headline")).toContainText("101");await expect(panel).toContainText("Observed next-level advance");
 await page.evaluate(()=>window.mockStreams["mainnet-head"]!.error(new Error("Source head transport interrupted")));
 await expect(panel.locator(".status-chip")).toHaveText("RPC coverage degraded");await expect(panel).toContainText("Observed next-level advance");
});


test("malformed source coverage stays partial until a fresh permitted coherent snapshot",async({page})=>{
 await page.clock.install();const current=head(100);await prepare(page,false,current,100,false,false,{total:5,quorum:4,powers:[3,1,1]});
 await page.route("https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header",route=>route.fulfill({json:{...current,chain_id:"NetFixture"}}));
 let reads=0,usable=false;await page.route("https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*",route=>{reads++;return route.fulfill({json:{validated:usable?[{hash:"unrelated",branch:current.hash,contents:[{kind:"transaction",source:"tz1Source",destination:"tz1Destination",fee:"1",counter:"1",gas_limit:"100",storage_limit:"0",amount:"1"}]}]:[{hash:"malformed",contents:[{kind:"preattestations_aggregate",consensus_content:{level:101,round:0,block_payload_hash:"vhPayload101"},committee:[0,-1]}]}],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}});});
 await send(page,"mainnet-operations",[vote(0)]);const panel=page.locator(".network-panel.mainnet");await panel.getByRole("button",{name:"Inspect payload vhPayload101",exact:true}).click();
 await expect(panel.locator(".pre .gauge-counts")).toContainText("3 / 5 power");await expect(panel.locator(".att .gauge-counts")).toContainText("Voting power unavailable");await expect(panel).toContainText("partial positive observations");await expect(panel.getByText("Missing attestations · unavailable",{exact:true})).toBeVisible();
 const retry=panel.getByRole("button",{name:"Retry selected observer context"});await expect(retry).toBeVisible();await expect.poll(()=>reads).toBe(1);
 usable=true;await send(page,"mainnet-operations",[vote(0)]);await page.clock.runFor(20000);expect(reads).toBe(1);
 await retry.click();await expect.poll(()=>reads).toBe(2);await expect(panel.locator(".pre .gauge-counts")).toContainText("3 / 5 power");await expect(panel.locator(".att .gauge-counts")).toContainText("0 / 5 power");await expect(panel).toContainText("Source-snapshot measured zero");
});


test("foundations AC-31 accepted maxima survive replay retirement and proven reorg return",async({page},testInfo)=>{
 const current=head(100);await prepare(page,false,current,100,false,false,{total:5,quorum:4,powers:[3,1,1]});const panel=page.locator(".network-panel.mainnet");
 await send(page,"mainnet-operations",[vote(0)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("3 / 5 power");await send(page,"mainnet-operations",[vote(1)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("4 / 5 power");
 const preCrossings=panel.locator(".event-history li").filter({hasText:"Preattestation crossing"});await expect(preCrossings).toHaveCount(1);
 await send(page,"mainnet-operations",[{hash:"first-att-quorum",contents:[{kind:"attestations_aggregate",consensus_content:{level:101,round:0,block_payload_hash:"vhPayload101"},committee:[{slot:0},{slot:1}]}]}]);await expect(panel.locator(".att .gauge-counts")).toContainText("4 / 5 power");await expect(panel.locator(".event-history li").filter({hasText:/\bAttestation observed quorum/})).toHaveCount(1);await expect(panel.locator(".event-history li").filter({hasText:/\bAttestation crossing/})).toHaveCount(0);
 const oldEvents=await panel.locator(".event-history li").allTextContents();
 await page.getByRole("button",{name:"Pause",exact:true}).click();await page.getByRole("button",{name:"Resume",exact:true}).click();await send(page,"mainnet-operations",[vote(0),vote(1)]);await expect(panel.locator(".event-history li")).toHaveText(oldEvents);
 const below={hash:"forgotten-below",contents:[{kind:"preattestation",level:101,round:0,slot:0,block_payload_hash:"vhBelow"}]};await send(page,"mainnet-operations",[below]);
 await send(page,"mainnet-operations",Array.from({length:151},(_,index)=>({hash:`retire-${index}`,contents:[{kind:"preattestation",level:101,round:0,slot:0,block_payload_hash:`vhRetire${index}`}]})));await expect(panel).toContainText("Crossing history partial");
 await send(page,"mainnet-operations",Array.from({length:10001},(_,index)=>({hash:`unrelated-bound-${index}`,contents:[{kind:"transaction",source:"tz1Source",destination:"tz1Destination",fee:"1",counter:"1",gas_limit:"100",storage_limit:"0",amount:"1"}]})));
 const fork={...current,hash:"BProvenFork100"};await send(page,"mainnet-head",fork);await expect(panel).toContainText("Observed same-height reorg");await send(page,"mainnet-head",current);await expect(panel.locator(".authority-evidence")).toContainText("context head BBlock100");
 await send(page,"mainnet-operations",[vote(0),vote(1),below]);await send(page,"mainnet-operations",[{hash:"forgotten-below-threshold",contents:[{kind:"preattestation",level:101,round:0,slot:1,block_payload_hash:"vhBelow"}]}]);
 await panel.getByRole("button",{name:"Inspect payload vhBelow",exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("4 / 5 power");await expect(preCrossings).toHaveCount(1);await expect(panel).toContainText("Crossing history partial");await expect(panel.locator(".event-history li").filter({hasText:/\bAttestation crossing/})).toHaveCount(0);
 await send(page,"mainnet-operations",[{hash:"reconstructed-att-quorum",contents:[{kind:"attestations_aggregate",consensus_content:{level:101,round:0,block_payload_hash:"vhPayload101"},committee:[{slot:0},{slot:1}]}]}]);await expect(panel.locator(".event-history li").filter({hasText:/\bAttestation observed quorum/})).toHaveCount(1);
 testInfo.annotations.push({type:"foundation-verified",description:"AC-31"});
});


test("late pending snapshot body cannot restore coverage after pause and resume",async({page})=>{
 const current=head(100);await prepare(page,false,current);await page.route("https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header",route=>route.fulfill({json:{...current,chain_id:"NetFixture"}}));
 await page.route("https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*",route=>route.fulfill({json:{validated:[],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}}));
 await page.evaluate(()=>{const original=window.fetch.bind(window);const state={waiting:false,release:()=>{}};Object.assign(window,{heldPendingBody:state});window.fetch=async(input,options)=>{const response=await original(input,options),url=typeof input==="string"?input:input instanceof URL?input.href:input.url;if(url.startsWith("https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?")){const body=await response.json();response.json=()=>new Promise(resolve=>{state.waiting=true;state.release=()=>resolve(body);});}return response;};});
 await send(page,"mainnet-operations",[vote(0)]);await expect.poll(()=>page.evaluate(()=>(window as unknown as {heldPendingBody:{waiting:boolean}}).heldPendingBody.waiting)).toBe(true);
 const panel=page.locator(".network-panel.mainnet");await page.getByRole("button",{name:"Pause",exact:true}).click();await page.getByRole("button",{name:"Resume",exact:true}).click();await page.evaluate(()=>(window as unknown as {heldPendingBody:{release:()=>void}}).heldPendingBody.release());
 await expect(panel.locator(".pre .gauge-counts")).toContainText("Voting power unavailable");await expect(panel.locator(".att .gauge-counts")).toContainText("Voting power unavailable");await expect(panel).not.toContainText("Source-snapshot measured zero");await expect(panel.locator(".event-history li")).toHaveCount(0);await expect(panel.locator(".headline")).toContainText("100");
});


test("supporting raw snapshot eviction withdraws measured coverage without fabricating zero",async({page})=>{
 const current=head(100);await prepare(page,false,current,100,false,false,{total:5,quorum:4,powers:[3,1,1]});
 await page.route("https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header",route=>route.fulfill({json:{...current,chain_id:"NetFixture"}}));
 await page.route("https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*",route=>route.fulfill({json:{validated:[vote(0)],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}}));
 const candidate={...head(101),hash:"BSupportingCandidate",payload_hash:"vhPayload101"};headers.get(page)?.set(candidate.hash,candidate);await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash:candidate.hash,header:candidate});const panel=page.locator(".network-panel.mainnet");await panel.getByRole("button",{name:`Inspect candidate ${candidate.hash}`,exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("3 / 5 power");await expect(panel.locator(".att .gauge-counts")).toContainText("0 / 5 power");
 const receipt=(await panel.textContent())?.match(/snapshot received (\d{4}-[^ ]+)/)?.[1];expect(receipt).toBeTruthy();
 await send(page,"mainnet-operations",Array.from({length:10000},(_,index)=>({hash:`raw-loss-${index}`,contents:[{kind:"transaction",source:"tz1Source",destination:"tz1Destination",fee:"1",counter:"1",gas_limit:"100",storage_limit:"0",amount:"1"}]})));
 await expect(panel.locator(".pre .gauge-counts")).toContainText("Voting power unavailable");await expect(panel.locator(".att .gauge-counts")).toContainText("Voting power unavailable");await expect(panel).toContainText("Retained source snapshot stale");await expect(panel).toContainText(receipt!);await expect(panel.locator(".recent-phase.pre")).toContainText("Pre 60.0%");await expect(panel.locator(".event-history li")).toHaveCount(0);
});


test("unrelated raw eviction preserves a first proven below-to-quorum crossing",async({page})=>{
 await prepare(page,false,head(100),100,false,false,{total:5,quorum:4,powers:[3,1,1]});const panel=page.locator(".network-panel.mainnet");
 await send(page,"mainnet-operations",Array.from({length:10001},(_,index)=>({hash:`unrelated-only-${index}`,contents:[{kind:"transaction",source:"tz1Source",destination:"tz1Destination",fee:"1",counter:"1",gas_limit:"100",storage_limit:"0",amount:"1"}]})));
 await send(page,"mainnet-operations",[vote(0)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("3 / 5 power");await send(page,"mainnet-operations",[vote(1)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("4 / 5 power");await expect(panel.locator(".event-history li").filter({hasText:/\bPreattestation crossing/})).toHaveCount(1);await expect(panel).not.toContainText("Crossing history partial");
});


test("foundations AC-5 pinned full session evidence and reader controls survive continued collection",async({page},testInfo)=>{
 await page.clock.install();const current=head(100);await prepare(page,false,current);
 await page.route("https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header",route=>route.fulfill({json:{...current,chain_id:"NetFixture"}}));
 await page.route("https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*",route=>route.fulfill({json:{validated:[vote(0)],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}}));
 const panel=page.locator(".network-panel.mainnet");
 const add=async(hash:string,payload:string)=>{const candidate={...head(101),hash,payload_hash:payload};headers.get(page)?.set(hash,candidate);await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash,header:candidate});};
 await add("BSessionPinned","vhPayload101");await panel.getByRole("button",{name:"Inspect candidate BSessionPinned",exact:true}).click();
 await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");await expect(panel.locator(".att .gauge-counts")).toContainText("0 / 30,000 power");await expect(panel).toContainText("Source-snapshot measured zero");
 await panel.getByText("Sources & observation evidence",{exact:true}).click();await panel.getByRole("button",{name:"Pin selected instance",exact:true}).click();await expect(panel.locator(".session-controls")).toContainText("Pinned retained session instance");
 const receipt=await panel.locator(".candidate-evidence").textContent(),authority=await panel.locator(".authority-evidence").textContent(),originalReceipt=receipt?.match(/received (\S+)/)?.[1];expect(receipt).toContain("Source https://rpc.tzkt.io/mainnet");expect(originalReceipt).toBeTruthy();expect(authority).toContain("chain NetFixture");expect(authority).toContain("context head BBlock100");expect(authority).toContain("execution protocol PFixture");
 const snapshotReceipt=(await panel.textContent())?.match(/snapshot received (\d{4}-[^ ]+)/)?.[1];expect(snapshotReceipt).toBeTruthy();
 const pre=panel.locator(".missing-section details").nth(0),att=panel.locator(".missing-section details").nth(1);await pre.locator("summary").click();await att.locator("summary").click();
 await expect(pre.locator("summary")).toContainText("49 bakers · 29,400 power");await expect(att.locator("summary")).toContainText("50 bakers · 30,000 power");
 const baker=pre.locator("tbody tr").filter({hasText:"Baker 11 · TzKT"});await expect(baker.locator("td").nth(2)).toHaveText("600");await expect(baker.locator("td").nth(3)).toHaveText("2.00%");
 const viewport=pre.locator(".delegate-scroll"),copy=pre.getByRole("button",{name:"Copy full address for Baker 11 · TzKT",exact:true});await viewport.evaluate(element=>{element.scrollTop=200;});await copy.focus();const scroll=await viewport.evaluate(element=>element.scrollTop);
 await send(page,"mainnet-operations",[vote(1)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("1,200 / 30,000 power");
 await send(page,"mainnet-operations",[{hash:"session-attestation-2",contents:[{kind:"attestation",level:101,round:0,slot:2,block_payload_hash:"vhPayload101"}]}]);await expect(panel.locator(".att .gauge-counts")).toContainText("600 / 30,000 power");
 await add("BSessionShared","vhPayload101");await add("BSessionNewer","vhDifferent101");await send(page,"mainnet-operations",[vote(3)]);
 await expect(panel.locator(".pre .gauge-counts")).toContainText("1,800 / 30,000 power");await expect(panel.locator(".att .gauge-counts")).toContainText("600 / 30,000 power");
 await expect(panel.getByRole("button",{name:"Inspect candidate BSessionPinned",exact:true})).toHaveAttribute("aria-pressed","true");await expect(panel.getByRole("button",{name:"Inspect candidate BSessionShared",exact:true})).toBeVisible();
 await expect(panel.locator(".session-controls")).toContainText("2 newer items");await expect(panel.locator(".candidate-evidence")).toContainText("Observed block hash BSessionPinned");await expect(panel.locator(".candidate-evidence")).toContainText(originalReceipt!);await expect(panel.locator(".candidate-evidence")).toContainText("Source https://rpc.tzkt.io/mainnet");await expect(panel.locator(".authority-evidence")).toHaveText(authority!);await expect(panel).toContainText(snapshotReceipt!);
 await expect(pre).toHaveAttribute("open","");await expect(att).toHaveAttribute("open","");await expect(copy).toBeFocused();expect(Math.abs(await viewport.evaluate(element=>element.scrollTop)-scroll)).toBeLessThan(1);
 await expect(pre.locator("summary")).toContainText("47 bakers · 28,200 power");await expect(att.locator("summary")).toContainText("49 bakers · 29,400 power");await expect(baker.locator("td").nth(2)).toHaveText("600");await expect(baker.locator("td").nth(3)).toHaveText("2.00%");
 const peak=panel.locator('.recent-consensus-row[title*="payload vhPayload101"]');await expect(peak.locator(".recent-phase.pre")).toContainText("Pre 6.0%");await expect(peak.locator(".recent-phase.att")).toContainText("Att 2.0%");
 const committee=panel.locator('.committee-evidence');await committee.locator('summary').click();const committeeQuery=committee.getByRole('searchbox',{name:'Search committee alias or address'}),committeeSort=committee.getByRole('combobox',{name:'Committee sort'});await committeeSort.selectOption('alias');await committeeQuery.fill('  bAkEr  ');await expect(committee.locator('tbody tr')).toHaveCount(50);
 const committeeViewport=committee.locator('.delegate-scroll');await committeeViewport.evaluate(element=>{element.scrollTop=200;});const committeeScroll=await committeeViewport.evaluate(element=>element.scrollTop),committeeOrder=await committee.locator('tbody tr').evaluateAll(rows=>rows.map(row=>row.children[1]?.getAttribute('title')));await committeeQuery.focus();
 await send(page,'mainnet-operations',[vote(4)]);await expect(panel.locator('.pre .gauge-counts')).toContainText('2,400 / 30,000 power');await expect(committeeQuery).toBeFocused();await expect(committeeQuery).toHaveValue('  bAkEr  ');await expect(committeeSort).toHaveValue('alias');await expect(committee).toHaveAttribute('open','');expect(await committee.locator('tbody tr').evaluateAll(rows=>rows.map(row=>row.children[1]?.getAttribute('title')))).toEqual(committeeOrder);expect(Math.abs(await committeeViewport.evaluate(element=>element.scrollTop)-committeeScroll)).toBeLessThan(1);await expect(panel.locator('.candidate-evidence')).toContainText('BSessionPinned');await expect(panel.locator('.candidate-evidence')).toContainText(originalReceipt!);await expect(panel.locator('.session-controls')).toContainText('2 newer items');await expect(peak.locator('.recent-phase.pre')).toContainText('Pre 8.0%');
 await page.getByRole("button",{name:"Pause",exact:true}).click();const reads=await page.evaluate(()=>window.mockRequests.length);await panel.getByRole("button",{name:"Follow live",exact:true}).click();await expect(panel.locator(".session-controls")).toContainText("Follow live");await expect(panel.locator(".candidate-evidence")).toContainText("BSessionNewer");await expect(page.getByRole("button",{name:"Resume",exact:true})).toBeVisible();expect(await page.evaluate(()=>window.mockRequests.length)).toBe(reads);
 await page.getByRole("button",{name:"Resume",exact:true}).click();await add("BSessionFollowing","vhFollowing101");await expect(panel.locator(".candidate-evidence")).toContainText("BSessionFollowing");await expect(panel.locator(".session-controls")).toContainText("Follow live");
 testInfo.annotations.push({type:"foundation-verified",description:"AC-5"});
});

test("foundations AC-16 retained source receipt and monotonic age survive provider switch and clock jump",async({page},testInfo)=>{
 await page.clock.install();const current=head(100);await prepare(page,false,current);
 await page.route("https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header",route=>route.fulfill({json:{...current,chain_id:"NetFixture"}}));await page.route("https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*",route=>route.fulfill({json:{validated:[vote(0)],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}}));
 const candidate=(hash:string,payload:string)=>({...head(101),hash,payload_hash:payload});const a=candidate("BHistoryA","vhPayload101"),b=candidate("BHistoryB","vhOther101");for(const value of [a,b])headers.get(page)?.set(value.hash,value);
 await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash:a.hash,header:a});const panel=page.locator(".network-panel.mainnet");await panel.getByRole("button",{name:`Inspect candidate ${a.hash}`,exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");
 await panel.getByText("Sources & observation evidence",{exact:true}).click();await panel.getByRole("button",{name:"Pin selected instance",exact:true}).click();await expect(panel.locator(".session-controls")).toContainText("Pinned retained session instance");
 const details=panel.locator(".missing-section details").first();await details.locator("summary").click();const viewport=details.locator(".delegate-scroll");await viewport.evaluate(element=>{element.scrollTop=200;});const copy=details.getByRole("button",{name:"Copy full address for Baker 11 · TzKT",exact:true});await copy.focus();const scroll=await viewport.evaluate(element=>element.scrollTop),receipt=await panel.locator(".candidate-evidence").textContent();
 await send(page,"mainnet-operations",[vote(1)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("1,200 / 30,000 power");await expect(copy).toBeFocused();expect(Math.abs(await viewport.evaluate(element=>element.scrollTop)-scroll)).toBeLessThan(1);await expect(details).toHaveAttribute("open","");await expect(panel.locator(".candidate-evidence")).toHaveText(receipt!);
 await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash:b.hash,header:b});await expect(panel.locator(".session-controls")).toContainText("1 newer items");await expect(panel.locator(".candidate-evidence")).toContainText(a.hash);
 await page.evaluate(()=>window.mockStreams["mainnet-head"]!.error(new Error("A head provider disconnected")));await expect.poll(()=>page.evaluate(()=>window.mockRequests.some(request=>request.url.startsWith("https://mainnet.smartpy.io")&&request.url.includes("monitor/heads")))).toBe(true);await expect(panel.locator(".candidate-evidence")).toHaveText(receipt!);await expect(panel.locator(".authority-evidence")).toContainText("https://rpc.tzkt.io/mainnet");await expect(panel).toContainText("Current selected identity stale/unavailable");
 await page.getByRole("button",{name:"Pause",exact:true}).click();const reads=await page.evaluate(()=>window.mockRequests.length),age=Number.parseInt(await panel.locator('.evidence-meta dt:has-text("Snapshot age") + dd').textContent()??"0",10);await page.clock.setSystemTime(new Date("2030-01-01T00:00:00Z"));await page.clock.runFor(2000);const later=Number.parseInt(await panel.locator('.evidence-meta dt:has-text("Snapshot age") + dd').textContent()??"0",10);expect(later-age).toBeGreaterThanOrEqual(1);expect(later-age).toBeLessThan(4);await expect(panel.locator(".candidate-evidence")).toHaveText(receipt!);
 await panel.getByRole("button",{name:"Latest",exact:true}).click();await expect(panel.locator(".candidate-evidence")).toContainText(b.hash);await expect(page.getByRole("button",{name:"Resume",exact:true})).toBeVisible();await panel.getByRole("button",{name:"Follow live",exact:true}).click();await expect(panel.locator(".session-controls")).toContainText("Follow live");await expect(panel.locator(".candidate-evidence")).toContainText(b.hash);expect(await page.evaluate(()=>window.mockRequests.length)).toBe(reads);
 testInfo.annotations.push({type:"foundation-verified",description:"AC-16"});
});


test("foundations AC-17 historical H1 remains inspectable after reorg and obsolete body completion",async({page},testInfo)=>{
 await page.clock.install();let current=head(100);await prepare(page,false,current);await page.route("https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header",route=>route.fulfill({json:{...current,chain_id:"NetFixture"}}));await page.route("https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*",route=>route.fulfill({json:{validated:[vote(0)],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}}));
 const a={...head(101),hash:"BH1Retained",payload_hash:"vhPayload101"},b={...head(101),hash:"BH1Pending",payload_hash:"vhPending101"};for(const candidate of [a,b])headers.get(page)?.set(candidate.hash,candidate);
 await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash:a.hash,header:a});const panel=page.locator(".network-panel.mainnet");await panel.getByRole("button",{name:`Inspect candidate ${a.hash}`,exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");await panel.getByText("Sources & observation evidence",{exact:true}).click();await panel.getByRole("button",{name:"Pin selected instance",exact:true}).click();await expect(panel.locator(".session-controls")).toContainText("Pinned retained session instance");await expect(panel.locator(".authority-evidence")).toContainText("context head BBlock100");const receipt=await panel.locator(".candidate-evidence").textContent();
 await page.evaluate(()=>{const original=window.fetch.bind(window),state={waiting:false,release:()=>{}};Object.assign(window,{oldHistoryBody:state});window.fetch=async(input,options)=>{const response=await original(input,options),url=typeof input==="string"?input:input instanceof URL?input.href:input.url;if(url.startsWith("https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?")){const body=await response.json();response.json=()=>new Promise(resolve=>{state.waiting=true;state.release=()=>resolve(body);});}return response;};});
 await page.clock.runFor(15000);await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash:b.hash,header:b});await expect.poll(()=>page.evaluate(()=>(window as unknown as {oldHistoryBody:{waiting:boolean}}).oldHistoryBody.waiting)).toBe(true);
 current={...current,hash:"BH2SameHeight",payload_hash:"vhH2"};await send(page,"mainnet-head",current);await expect(panel.locator('.evidence-meta dt:has-text("Block hash") + dd')).toContainText("BH2SameHeight");await page.getByRole("button",{name:"Pause",exact:true}).click();const reads=await page.evaluate(()=>window.mockRequests.length);await page.evaluate(()=>(window as unknown as {oldHistoryBody:{release:()=>void}}).oldHistoryBody.release());
 await expect(panel.locator(".candidate-evidence")).toHaveText(receipt!);await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");await panel.getByRole("button",{name:"Follow live",exact:true}).click();await expect(panel).toContainText("Live unavailable: no coherent current selection");await expect(panel.locator(".pre .gauge-counts")).toContainText("Voting power unavailable");
 const option=panel.getByRole("combobox",{name:"Retained session instance"}).locator("option").filter({hasText:"vhPayload101"});const identity=await option.getAttribute("value");expect(identity).toBeTruthy();await panel.getByRole("combobox",{name:"Retained session instance"}).selectOption(identity!);await panel.getByRole("button",{name:`Inspect candidate ${a.hash}`,exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");await expect(panel.locator(".authority-evidence")).toContainText("context head BBlock100");await expect(panel.locator(".authority-evidence")).toContainText("execution protocol PFixture");await expect(panel.locator(".candidate-evidence")).toHaveText(receipt!);expect(await page.evaluate(()=>window.mockRequests.length)).toBe(reads);
 testInfo.annotations.push({type:"foundation-verified",description:"AC-17"});
});


test("foundations AC-22 active eviction enriches retained pin and full history eviction freezes it",async({page},testInfo)=>{
 const current=head(100);await prepare(page,false,current);await page.route("https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header",route=>route.fulfill({json:{...current,chain_id:"NetFixture"}}));await page.route("https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*",route=>route.fulfill({json:{validated:[vote(0)],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}}));
 const a={...head(101),hash:"BPinProtected",payload_hash:"vhPayload101"};headers.get(page)?.set(a.hash,a);await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash:a.hash,header:a});const panel=page.locator(".network-panel.mainnet");await panel.getByRole("button",{name:`Inspect candidate ${a.hash}`,exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");await panel.getByText("Sources & observation evidence",{exact:true}).click();await panel.getByRole("button",{name:"Pin selected instance",exact:true}).click();await expect(panel.locator(".session-controls")).toContainText("Pinned retained session instance");
 const candidates=Array.from({length:100},(_,index)=>({...head(101),hash:`BShared${index}`,payload_hash:"vhPayload101"}));for(const candidate of candidates)headers.get(page)?.set(candidate.hash,candidate);await page.evaluate(values=>{window.mockStreams["mainnet-proposals"]!.enqueue(new TextEncoder().encode(values.map(header=>JSON.stringify({chain_id:"NetFixture",hash:header.hash,header})).join("\n")+"\n"));},candidates);
 await expect(panel.locator(".candidate-evidence")).toContainText("Historical inspection facts partially retained");await expect(panel.locator(".session-controls")).toContainText("Pinned retained session instance");await expect(panel.getByRole("button",{name:`Inspect candidate ${a.hash}`,exact:true})).toBeVisible();await expect(panel.locator(".candidate-controls button")).toHaveCount(100);
 await send(page,"mainnet-operations",[vote(1)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("1,200 / 30,000 power");await expect(panel.locator(".candidate-evidence")).toContainText(a.hash);
 const histories=Array.from({length:151},(_,index)=>({...head(101),hash:`BHistory${index}`,payload_hash:`vhHistory${index}`}));for(const candidate of histories)headers.get(page)?.set(candidate.hash,candidate);await page.evaluate(values=>{window.mockStreams["mainnet-proposals"]!.enqueue(new TextEncoder().encode(values.map(header=>JSON.stringify({chain_id:"NetFixture",hash:header.hash,header})).join("\n")+"\n"));},histories);
 await expect(panel.locator(".session-controls")).toContainText("Pinned frozen snapshot outside retained history");await panel.getByRole("button",{name:"Inspect candidate BPinProtected",exact:true}).click();await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));await expect(panel.locator(".session-controls")).toContainText("Pinned frozen snapshot outside retained history");await panel.getByRole("button",{name:"Inspect candidate BShared99",exact:true}).click();await expect(panel.locator(".candidate-evidence")).toContainText("BShared99");await expect(panel.locator(".session-controls")).toContainText("Pinned frozen snapshot outside retained history");await expect(panel.locator(".pre .gauge-counts")).toContainText("1,200 / 30,000 power");await panel.getByRole("button",{name:"Inspect candidate BPinProtected",exact:true}).click();await expect(panel.locator(".candidate-evidence")).toContainText("BPinProtected");await expect(panel.getByRole("combobox",{name:"Retained session instance"}).locator("option")).toHaveCount(150);const evidence=await panel.locator(".candidate-evidence").textContent(),authority=await panel.locator(".authority-evidence").textContent();
 await send(page,"mainnet-operations",[vote(2)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("1,200 / 30,000 power");await expect(panel.locator(".candidate-evidence")).toHaveText(evidence!);await expect(panel.locator(".authority-evidence")).toHaveText(authority!);await page.getByRole("button",{name:"Pause",exact:true}).click();const reads=await page.evaluate(()=>window.mockRequests.length);await panel.getByRole("button",{name:"Latest",exact:true}).click();await expect(panel.locator(".session-controls")).toContainText("Pinned retained session instance");await expect(panel.locator(".candidate-evidence")).not.toContainText(a.hash);expect(await page.evaluate(()=>window.mockRequests.length)).toBe(reads);
 testInfo.annotations.push({type:"foundation-verified",description:"AC-22"});
});


test("foundations AC-23 source-distinct shared payload candidates and hash-unknown promotion retain separate identities",async({page},testInfo)=>{
 await page.clock.install();const current=head(100);await prepare(page,false,current);let observerB=current;
 await page.route("https://rpc.shadownet.teztnets.com/chains/main/blocks/head/header",route=>route.fulfill({json:{...current,chain_id:"NetFixture"}}));await page.route("https://tezos-shadownet.octez.io/chains/main/blocks/head/header",route=>route.fulfill({json:{...observerB,chain_id:"NetFixture"}}));
 const a={...head(101),hash:"BObserverA",payload_hash:"vhPayload101"},b={...head(101),hash:"BObserverB",payload_hash:"vhPayload101"};for(const candidate of [a,b])headers.get(page)?.set(candidate.hash,candidate);await send(page,"shadownet-operations",[vote(0)]);await send(page,"shadownet-proposals",{chain_id:"NetFixture",hash:a.hash,header:a});const panel=page.locator(".network-panel.shadownet");await panel.getByRole("button",{name:`Inspect candidate ${a.hash}`,exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");await panel.getByText("Sources & observation evidence",{exact:true}).click();await panel.getByRole("button",{name:"Pin selected instance",exact:true}).click();await expect(panel.locator(".session-controls")).toContainText("Pinned retained session instance");
 await page.evaluate(()=>{window.mockStreams["shadownet-proposals"]!.error(new Error("A proposals disconnected"));window.mockStreams["shadownet-operations"]!.error(new Error("A operations disconnected"));});await expect.poll(()=>page.evaluate(()=>window.mockRequests.some(request=>request.url.startsWith("https://tezos-shadownet.octez.io")&&request.url.includes("monitor/validated_blocks")))).toBe(true);await expect.poll(()=>page.evaluate(()=>window.mockRequests.some(request=>request.url.startsWith("https://tezos-shadownet.octez.io")&&request.url.includes("monitor_operations")))).toBe(true);
 await send(page,"shadownet-proposals",{chain_id:"NetFixture",hash:b.hash,header:b});await send(page,"shadownet-operations",[vote(1),vote(2)]);await page.clock.runFor(15000);await expect(panel.locator(".candidate-evidence")).toContainText(a.hash);await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");
 const choice=panel.getByRole("combobox",{name:"Retained session instance"}).locator("option").filter({hasText:"Octez public"});await expect(choice).toHaveCount(1);await panel.getByRole("combobox",{name:"Retained session instance"}).selectOption((await choice.getAttribute("value"))!);await panel.getByRole("button",{name:`Inspect candidate ${b.hash}`,exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("1,200 / 30,000 power");await expect(panel.locator(".candidate-evidence")).toContainText("https://tezos-shadownet.octez.io");
 await panel.getByRole("button",{name:"Follow live",exact:true}).click();await send(page,"shadownet-operations",[vote(0,123)]);await panel.getByRole("button",{name:"Inspect payload vhPayload123",exact:true}).click();await expect(panel.locator(".candidate-evidence")).toContainText("Unresolved");await expect(panel.locator(".candidate-evidence")).toContainText("Candidate hash unavailable");await expect(panel.locator(".pre .gauge-counts")).toContainText("Voting power unavailable");await page.clock.runFor(15000);
 observerB=head(122);headers.get(page)?.set(observerB.hash,observerB);headers.get(page)?.set(observerB.predecessor,head(121));await page.clock.runFor(15000);await panel.getByRole("button",{name:"Retry selected observer context",exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");await expect(panel.locator(".candidate-evidence")).not.toContainText("Unresolved");await expect(panel.locator(".candidate-evidence")).toContainText("Candidate hash unavailable");await expect(panel.locator(".authority-evidence")).toContainText("context head BBlock122");await expect(panel.getByRole("button",{name:"Inspect payload vhPayload123",exact:true})).toHaveCount(1);
 const rights=await page.evaluate(()=>window.mockRequests.filter(request=>request.url.includes("attestation_rights")&&new URL(request.url).searchParams.get("level")==="123").map(request=>request.url));expect(rights.length).toBeGreaterThan(0);expect(rights.every(url=>url.startsWith("https://tezos-shadownet.octez.io"))).toBe(true);
 testInfo.annotations.push({type:"foundation-verified",description:"AC-23"});
});


test("foundations AC-24 independent products use first receipt lexical ties and bounded raw facts",async({page},testInfo)=>{
 const current=head(100);await prepare(page,false,current);await page.route("https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header",route=>route.fulfill({json:{...current,chain_id:"NetFixture"}}));await send(page,"mainnet-operations",[vote(0)]);const panel=page.locator(".network-panel.mainnet");await expect(panel.locator(".pre .gauge-counts")).toContainText("600 / 30,000 power");await panel.getByText("Sources & observation evidence",{exact:true}).click();
 const candidates=Array.from({length:151},(_,index)=>({...head(101),hash:`BArray${String(index).padStart(3,"0")}`,payload_hash:`P${String(index).padStart(3,"0")}`}));for(const candidate of candidates)headers.get(page)?.set(candidate.hash,candidate);
 await page.evaluate(values=>{const original=performance.now.bind(performance),receipt=original();Object.assign(window,{originalReceiptClock:original});Object.defineProperty(performance,"now",{configurable:true,value:()=>receipt});window.mockStreams["mainnet-proposals"]!.enqueue(new TextEncoder().encode(values.map(header=>JSON.stringify({chain_id:"NetFixture",hash:header.hash,header})).join("\n")+"\n"));},candidates);
 await expect(panel.locator(".session-controls")).toContainText("150 / 150 session instances");await expect(panel.locator(".session-controls")).toContainText("100 / 100 active candidates");await page.evaluate(()=>Object.defineProperty(performance,"now",{configurable:true,value:(window as unknown as {originalReceiptClock:()=>number}).originalReceiptClock}));
 const choices=panel.getByRole("combobox",{name:"Retained session instance"});await expect(choices.locator("option").filter({hasText:"P000"})).toHaveCount(0);await expect(choices.locator("option").filter({hasText:"P001"})).toHaveCount(1);await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash:candidates[1]!.hash,header:candidates[1]});const extra={...head(101),hash:"BArray151",payload_hash:"P151"};headers.get(page)?.set(extra.hash,extra);await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash:extra.hash,header:extra});await expect(choices.locator("option").filter({hasText:"P001"})).toHaveCount(0);await expect(choices.locator("option").filter({hasText:"P002"})).toHaveCount(1);
 const unresolved=Array.from({length:101},(_,index)=>({...head(2147483647),hash:`BUnresolved${index}`,payload_hash:`Unresolved${index}`}));for(const candidate of unresolved)headers.get(page)?.set(candidate.hash,candidate);await page.evaluate(values=>window.mockStreams["mainnet-proposals"]!.enqueue(new TextEncoder().encode(values.map(header=>JSON.stringify({chain_id:"NetFixture",hash:header.hash,header})).join("\n")+"\n")),unresolved);await expect(panel.locator(".session-controls")).toContainText("100 / 100 unresolved identities");await expect(panel.locator(".session-controls")).toContainText("100 / 100 active candidates");await expect(choices.locator("option")).toHaveCount(150);
 await send(page,"mainnet-operations",Array.from({length:10001},(_,index)=>({hash:`bounded-raw-${index}`,contents:[{kind:"transaction",source:"tz1Source",destination:"tz1Destination",fee:"1",counter:"1",gas_limit:"100",storage_limit:"0",amount:"1"}]})));await expect(panel.locator(".session-controls")).toContainText("10000 / 10000 raw operations");await expect(panel.locator(".session-controls")).toContainText("100 / 100 active candidates");await expect(choices.locator("option")).toHaveCount(150);
 testInfo.annotations.push({type:"foundation-verified",description:"AC-24"});
});


test("foundations AC-25 newer units deduplicate representation while Latest pins once and Follow stays live",async({page},testInfo)=>{
 const current=head(100);await prepare(page,false,current,100,false,false,{total:5,quorum:4,powers:[3,1,1]});await page.route("https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header",route=>route.fulfill({json:{...current,chain_id:"NetFixture"}}));await send(page,"mainnet-operations",[vote(0)]);const panel=page.locator(".network-panel.mainnet");await expect(panel.locator(".pre .gauge-counts")).toContainText("3 / 5 power");
 const add=async(hash:string,payload:string)=>{const header={...head(101),hash,payload_hash:payload};headers.get(page)?.set(hash,header);await send(page,"mainnet-proposals",{chain_id:"NetFixture",hash,header});};await panel.getByText("Sources & observation evidence",{exact:true}).click();await panel.getByRole("button",{name:"Pin selected instance",exact:true}).click();await expect(panel.locator(".session-controls")).toContainText("0 newer items");await add("BNewerA","vhPayload101");await expect(panel.locator(".session-controls")).toContainText("0 newer items");await panel.getByRole("button",{name:"Follow live",exact:true}).click();await panel.getByRole("button",{name:"Inspect candidate BNewerA",exact:true}).click();await panel.getByRole("button",{name:"Pin selected instance",exact:true}).click();await expect(panel.locator(".session-controls")).toContainText("0 newer items");await send(page,"mainnet-operations",[vote(0),vote(1)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("4 / 5 power");await expect(panel.locator(".session-controls")).toContainText("0 newer items");
 await add("BNewerB","vhPayload101");await expect(panel.locator(".session-controls")).toContainText("1 newer items");const q={hash:"candidate-free-Q",contents:[{kind:"preattestation",level:101,round:0,slot:0,block_payload_hash:"vhQ"}]};await send(page,"mainnet-operations",[q]);await expect(panel.locator(".session-controls")).toContainText("2 newer items");await add("BNewerC","vhQ");await expect(panel.locator(".session-controls")).toContainText("2 newer items");await add("BNewerD","vhQ");await expect(panel.locator(".session-controls")).toContainText("3 newer items");await add("BNewerB","vhPayload101");await send(page,"mainnet-operations",[q,vote(0,2147483647)]);await expect(panel.locator(".session-controls")).toContainText("3 newer items");
 await panel.getByRole("button",{name:"Latest",exact:true}).click();await expect(panel.locator(".candidate-evidence")).toContainText("BNewerD");await add("BNewerE","vhR");await expect(panel.locator(".session-controls")).toContainText("1 newer items");await expect(panel.locator(".candidate-evidence")).toContainText("BNewerD");await panel.getByRole("button",{name:"Follow live",exact:true}).click();await expect(panel.locator(".candidate-evidence")).toContainText("BNewerE");
 await send(page,"mainnet-head",{...current,hash:"BNewerFork",payload_hash:"vhFork"});await expect(panel).toContainText("Live unavailable: no coherent current selection");await expect(panel.locator(".pre .gauge-counts")).toContainText("Voting power unavailable");await page.evaluate(()=>window.mockStreams["mainnet-head"]!.error(new Error("Review head transport interrupted")));await expect(panel.locator(".network-notice")).toContainText("Heads connection interrupted");const combinedNotice=await panel.locator(".network-notice").textContent();expect(combinedNotice).toContain("Heads connection interrupted");expect(combinedNotice).toContain("Live unavailable: no coherent current selection");await page.getByRole("button",{name:"Pause",exact:true}).click();const reads=await page.evaluate(()=>window.mockRequests.length);await panel.getByRole("button",{name:"Latest",exact:true}).click();await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));await expect(panel).toContainText("Live unavailable: no coherent current selection");await expect(panel.locator(".session-controls")).toContainText("Follow live");await panel.getByRole("button",{name:"Follow live",exact:true}).click();expect(await page.evaluate(()=>window.mockRequests.length)).toBe(reads);await expect(page.getByRole("button",{name:"Resume",exact:true})).toBeVisible();
 testInfo.annotations.push({type:"foundation-verified",description:"AC-25"});
});


test("foundations AC-32 immutable twelve events survive history eviction inspection replay and resume",async({page},testInfo)=>{
 const current=head(100);await prepare(page,false,current,100,false,false,{total:5,quorum:4,powers:[3,1,1]});await page.route("https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header",route=>route.fulfill({json:{...current,chain_id:"NetFixture"}}));const panel=page.locator(".network-panel.mainnet"),events=panel.locator(".event-history li");
 const packet=(index:number,slot:number)=>({hash:`event-${index}-${slot}`,contents:[{kind:"preattestation",level:101,round:0,slot,block_payload_hash:`vhEvent${index}`} ]});
 for(let index=0;index<14;index++){await send(page,"mainnet-operations",[packet(index,0)]);await panel.getByRole("button",{name:`Inspect payload vhEvent${index}`,exact:true}).click();await expect(panel.locator(".pre .gauge-counts")).toContainText("3 / 5 power");await send(page,"mainnet-operations",[packet(index,1)]);await expect(panel.locator(".pre .gauge-counts")).toContainText("4 / 5 power");await expect(events).toHaveCount(Math.min(index+1,12));}
 const original=await events.allTextContents();expect(original.every(text=>text.includes("rpc.tzkt.io/mainnet")&&text.includes("NetFixture"))).toBe(true);await panel.getByText("Sources & observation evidence",{exact:true}).click();await panel.getByRole("button",{name:"Pin selected instance",exact:true}).click();await expect(panel.locator(".session-controls")).toContainText("Pinned retained session instance");
 await send(page,"mainnet-operations",Array.from({length:151},(_,index)=>({hash:`history-retire-${index}`,contents:[{kind:"preattestation",level:101,round:0,slot:0,block_payload_hash:`vhRetired${index}`}]})));await expect(panel.locator(".session-controls")).toContainText("Pinned frozen snapshot outside retained history");await expect(events).toHaveText(original);
 await send(page,"mainnet-operations",[{hash:"reconstructed-crossed-payload",contents:[...packet(13,0).contents,...packet(13,1).contents]}]);await expect(events).toHaveText(original);await page.getByRole("button",{name:"Pause",exact:true}).click();const reads=await page.evaluate(()=>window.mockRequests.length);await panel.getByRole("button",{name:"Latest",exact:true}).click();await panel.getByRole("button",{name:"Follow live",exact:true}).click();await expect(events).toHaveText(original);expect(await page.evaluate(()=>window.mockRequests.length)).toBe(reads);await page.getByRole("button",{name:"Resume",exact:true}).click();await send(page,"mainnet-operations",[packet(13,0),packet(13,1)]);await expect(events).toHaveText(original);await expect(panel.locator(".headline")).toContainText("100");await expect(panel.locator(".status-chip")).not.toHaveText("Observed advance");
 testInfo.annotations.push({type:"foundation-verified",description:"AC-32"});
});

test('foundations AC-27 phase receipt filters preserve source-limited absence and unknown signer evidence',async({page},testInfo)=>{
 await page.clock.install();let current=head(100);await prepare(page,false,current,100,false,false,{total:5,quorum:4,powers:[3,2]});await page.route('https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header',route=>route.fulfill({json:{...current,chain_id:'NetFixture'}}));
 await send(page,'mainnet-operations',[vote(0),vote(999)]);const panel=page.locator('.network-panel.mainnet');await expect(panel.locator('.pre .gauge-counts')).toContainText('3 / 5 power');await expect(panel.locator('.att .gauge-counts')).toContainText('Voting power unavailable');
 const committee=panel.locator('.committee-evidence');await committee.locator('summary').click();const rows=committee.locator('tbody tr'),filter=committee.getByRole('combobox',{name:'Committee phase receipt filter'}),query=committee.getByRole('searchbox',{name:'Search committee alias or address'});
 await expect(rows).toHaveCount(2);await expect(rows.nth(0).locator('td').nth(5)).toHaveText('Received');await expect(rows.nth(0).locator('td').nth(6)).toHaveText('Partial / unavailable');await expect(rows.nth(1).locator('td').nth(5)).toHaveText('Partial / unavailable');await expect(committee.locator('.committee-unknown')).toContainText('slot 999');await expect(committee.locator('.committee-unknown')).toContainText('unknown power');await expect(committee.locator('tbody')).not.toContainText('999');
 await filter.selectOption('att:absent');await expect(rows).toHaveCount(0);await expect(committee).toContainText('no network-wide inactivity or global completeness claim');await expect(committee).toContainText('Coverage partial / unavailable');await filter.selectOption('att:unknown');await expect(rows).toHaveCount(2);
 await page.route('https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*',route=>route.fulfill({json:{validated:[vote(0)],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}}));
 const candidate={...head(101),hash:'BCommitteeSnapshot',payload_hash:'vhPayload101'};headers.get(page)?.set(candidate.hash,candidate);await page.clock.runFor(15000);await send(page,'mainnet-proposals',{chain_id:'NetFixture',hash:candidate.hash,header:candidate});await panel.getByRole('button',{name:`Inspect candidate ${candidate.hash}`,exact:true}).click();await expect(panel.locator('.att .gauge-counts')).toContainText('0 / 5 power');
 await filter.selectOption('att:absent');await expect(rows).toHaveCount(2);await expect(rows.nth(0).locator('td').nth(6)).toHaveText('Absent in selected source snapshot');await expect(rows.nth(1).locator('td').nth(6)).toHaveText('Absent in selected source snapshot');await expect(rows.nth(0).locator('td').nth(7)).toContainText('Source https://rpc.tzkt.io/mainnet');await expect(rows.nth(0).locator('td').nth(7)).toContainText('head BBlock100');await expect(panel).toContainText('Source-snapshot measured zero');
 await page.route('https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*',route=>route.fulfill({json:{}}));await page.evaluate(()=>window.mockStreams['mainnet-operations']!.error(new Error('Selected source coverage interrupted')));await expect(rows).toHaveCount(0);await expect(panel).toContainText('Retained source snapshot stale');await filter.selectOption('att:unknown');await expect(rows).toHaveCount(2);await expect(rows.nth(0).locator('td').nth(6)).toHaveText('Partial / unavailable');await expect(panel.locator('.att .gauge-counts')).toContainText('Voting power unavailable');
 await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Resume',exact:true}).click();await page.route('**/helpers/attestation_rights?*',route=>route.fulfill({json:[{level:Number(new URL(route.request().url()).searchParams.get('level')),delegates:[]}]}));current={...current,hash:'BCommitteeMissingRights',payload_hash:'vhFork'};await page.route('https://mainnet.smartpy.io/chains/main/blocks/head/header',route=>route.fulfill({json:{...current,chain_id:'NetFixture'}}));await send(page,'mainnet-head',current);
 await send(page,'mainnet-operations',[{...vote(999),hash:'unknown-under-missing-rights'}]);await expect(panel.getByRole('button',{name:'Inspect payload vhPayload101',exact:true})).toHaveCount(2);await panel.getByRole('button',{name:'Inspect payload vhPayload101',exact:true}).last().click();await expect(panel.locator('.candidate-evidence')).toContainText('Source https://mainnet.smartpy.io');await expect(panel.locator('.candidate-evidence')).toContainText('observed head unknown');await expect.poll(()=>page.evaluate(()=>window.mockRequests.some(request=>request.url.startsWith('https://mainnet.smartpy.io/')&&request.url.includes('attestation_rights')))).toBe(true);await filter.selectOption('all');await query.fill('999');await expect(rows).toHaveCount(0);await expect(committee.locator('.committee-unknown')).toContainText('slot 999');await expect(committee.locator('.committee-unknown')).toContainText('unknown-under-missing-rights');await expect(committee.locator('.committee-unknown')).toContainText('https://mainnet.smartpy.io');await expect(panel.locator('.pre .gauge-counts')).toContainText('Voting power unavailable');await expect(panel.locator('.att .gauge-counts')).toContainText('Voting power unavailable');
 testInfo.annotations.push({type:'foundation-verified',description:'AC-27'});
});

test('foundations AC-26 committee matching and explicit order stay stable across aliases and receipts',async({page},testInfo)=>{
 const address=(slot:number)=>`tz1BakerAddress${String(slot).padStart(25,'0')}`,addresses=Array.from({length:50},(_,slot)=>address(slot));
 const aliases=addresses.map((address,slot)=>({address,alias:slot===0?'Zeta':slot===1||slot===3?`${addresses[0]} Alpha`:slot===4?'Sort':slot===5?'Sort A':`Group ${String(slot).padStart(2,'0')}`}));
 await page.addInitScript(()=>{const original=window.fetch.bind(window),gate={waiting:false,release:()=>{}};Object.assign(window,{committeeAliasGate:gate});window.fetch=async(input,options)=>{const response=await original(input,options),url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);if(url.hostname==='api.tzkt.io'&&url.pathname.includes('/v1/delegates')){const body=await response.json();response.json=()=>new Promise(resolve=>{gate.waiting=true;gate.release=()=>resolve(body);});}return response;};});
 await prepare(page,false,head(),100,false,false,{total:52,quorum:4,powers:[3,...Array(49).fill(1)]},aliases);await send(page,'mainnet-operations',[vote(0)]);await expect(page.locator('.mainnet .pre .gauge-counts')).toContainText('3 / 52 power');
 const committee=page.locator('.mainnet .committee-evidence');await committee.locator('summary').click();const query=committee.getByRole('searchbox',{name:'Search committee alias or address'}),sort=committee.getByRole('combobox',{name:'Committee sort'}),resort=committee.getByRole('button',{name:'Resort committee'}),rows=committee.locator('tbody tr');
 const order=()=>rows.evaluateAll(elements=>elements.map(row=>row.children[1]?.getAttribute('title')));
 await sort.selectOption('alias');await query.fill(`  ${address(0).toUpperCase()}  `);await expect(rows).toHaveCount(1);await expect(rows).toContainText('No alias');await expect(query).toBeFocused();
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {committeeAliasGate:{waiting:boolean}}).committeeAliasGate.waiting)).toBe(true);await page.evaluate(()=>(window as unknown as {committeeAliasGate:{release:()=>void}}).committeeAliasGate.release());
 await expect(rows).toHaveCount(3);expect(await order()).toEqual([address(0),address(1),address(3)]);await expect(rows.first()).toContainText('Zeta');await expect(query).toHaveValue(`  ${address(0).toUpperCase()}  `);await expect(query).toBeFocused();
 await sort.focus();expect(await order()).toEqual([address(0),address(1),address(3)]);await resort.click();expect(await order()).toEqual([address(1),address(3),address(0)]);
 // Match raw alias OR address, never decoration or text spanning both fields.
 for(const text of ['zeta · tzkt tz1baker','zeta tz1baker','TzKT']){await query.fill(text);await expect(rows).toHaveCount(0);}
 await query.fill('  zEtA  ');await expect(rows).toHaveCount(1);expect(await order()).toEqual([address(0)]);
 await query.fill('');await resort.click();await expect(rows).toHaveCount(50);const aliasOrder=await order();expect(aliasOrder.indexOf(address(4))).toBeLessThan(aliasOrder.indexOf(address(5)));
 await sort.selectOption('address');expect(await order()).toEqual(addresses);await sort.selectOption('power');expect(await order()).toEqual(addresses);
 const viewport=committee.locator('.delegate-scroll');await viewport.evaluate(element=>{element.scrollTop=200;});const scroll=await viewport.evaluate(element=>element.scrollTop);expect(scroll).toBeGreaterThan(0);await query.focus();
 await send(page,'mainnet-operations',[vote(1),vote(2),vote(4)]);await expect(page.locator('.mainnet .pre .gauge-counts')).toContainText('6 / 52 power');expect(await order()).toEqual(addresses);await expect(query).toBeFocused();await expect(query).toHaveValue('');await expect(sort).toHaveValue('power');await expect(committee).toHaveAttribute('open','');expect(Math.abs(await viewport.evaluate(element=>element.scrollTop)-scroll)).toBeLessThan(1);
 const filter=committee.getByRole('combobox',{name:'Committee phase receipt filter'});await filter.selectOption('pre:unknown');await expect(rows).toHaveCount(46);const pendingRow=rows.filter({has:page.locator(`td[title="${address(3)}"]`)}),copy=pendingRow.locator('.address-copy');await copy.focus();await send(page,'mainnet-operations',[vote(3)]);
 await expect(pendingRow.locator('td').nth(5)).toHaveText('Received');await expect(pendingRow).toHaveAttribute('data-pending-exclusion','true');await expect(pendingRow).toContainText('Pending exclusion until focus leaves');await expect(copy).toBeFocused();await query.focus();await expect(pendingRow).toHaveCount(0);await expect(rows).toHaveCount(45);
 expect(await order()).toEqual(addresses.filter((_,slot)=>![0,1,2,3,4].includes(slot)));await filter.selectOption('all');await expect(rows).toHaveCount(50);
 // Correct a raw alias at the existing consumer boundary; no network refresh is claimed.
 await query.fill('alpha');await expect(rows).toHaveCount(2);const correctedRow=rows.filter({has:page.locator(`td[title="${address(1)}"]`)}),correctedCopy=correctedRow.locator('.address-copy');await correctedCopy.focus();
 await page.evaluate(async changedAddress=>{const path='/rpc/networkData.ts';const module=await import(path);const original=module.NetworkData.prototype.alias;module.NetworkData.prototype.alias=function(address:string){return this.network==='mainnet'&&address===changedAddress?'Gamma':original.call(this,address);};Object.assign(window,{restoreCommitteeAlias:()=>{module.NetworkData.prototype.alias=original;}});},address(1));await send(page,'mainnet-operations',[vote(5)]);
 await expect(correctedRow.locator('td').first()).toContainText('Gamma · TzKT');await expect(correctedRow).toContainText('Pending exclusion until focus leaves');await expect(correctedCopy).toHaveAttribute('aria-label','Copy full address for Gamma · TzKT');await expect(correctedCopy).toBeFocused();await query.focus();await expect(correctedRow).toHaveCount(0);await expect(rows).toHaveCount(1);await page.evaluate(()=>(window as unknown as {restoreCommitteeAlias:()=>void}).restoreCommitteeAlias());await query.fill('');
 await page.getByRole('button',{name:'Pause',exact:true}).click();const pausedReads=await page.evaluate(()=>window.mockRequests.length);await query.fill(' group ');await sort.selectOption('address');await resort.click();await filter.selectOption('pre:unknown');await expect(rows).toHaveCount(44);expect(await page.evaluate(()=>window.mockRequests.length)).toBe(pausedReads);await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible();
 testInfo.annotations.push({type:'foundation-verified',description:'AC-26'});
});

 test('foundations AC-6 complete committee keeps received delegates searchable with exact phase evidence',async({page})=>{
 const d1=`tz1BakerAddress${String(0).padStart(25,'0')}`,d2=`tz1BakerAddress${String(1).padStart(25,'0')}`;
 await prepare(page,false,head(),100,false,false,{total:5,quorum:4,powers:[3,2]},[{address:d1,alias:'Baker Alpha'},{address:d2,alias:'Baker Beta'}]);
 const noVotes={...head(101),hash:'BCommitteeNoVotes',payload_hash:'vhPayload101'};headers.get(page)?.set(noVotes.hash,noVotes);await send(page,'mainnet-proposals',{chain_id:'NetFixture',hash:noVotes.hash,header:noVotes});const panel=page.locator('.mainnet');await panel.getByRole('button',{name:'Inspect candidate BCommitteeNoVotes',exact:true}).click();const knownCommittee=panel.locator('.committee-evidence');await knownCommittee.locator('summary').click();await expect(knownCommittee.locator('tbody tr').first()).toContainText('60.00%');await panel.getByText('Sources & observation evidence',{exact:true}).click();await panel.getByRole('button',{name:'Pin selected instance',exact:true}).click();await expect(panel.locator('.session-controls')).toContainText('Pinned retained session instance');await expect(knownCommittee.locator('tbody tr').first()).toContainText('60.00%');await expect(panel.locator('.pre .gauge-counts')).toContainText('Voting power unavailable');await expect(panel.locator('.att .gauge-counts')).toContainText('Voting power unavailable');await panel.getByRole('button',{name:'Follow live',exact:true}).click();
 await send(page,'mainnet-operations',[vote(0),vote(999)]);await expect(page.locator('.mainnet .pre .gauge-counts')).toContainText('3 / 5 power');
 // Existing production table boundary: received D1 must remain in the committee,
 // even without complete source coverage. This is not a missing-module red.
 await expect(page.locator('.mainnet .delegate-table tbody tr')).toHaveCount(2);
 const committee=page.locator('.mainnet .committee-evidence');
 const query=committee.getByRole('searchbox',{name:'Search committee alias or address'});await query.fill('  aLpHa  ');
 const row=committee.locator('tbody tr');await expect(row).toHaveCount(1);await expect(row).toContainText('Baker Alpha');await expect(row).toContainText('60.00%');await expect(row).toContainText('Received');await expect(row).toContainText('Partial / unavailable');await expect(row.locator('td').nth(4)).toHaveText('Unknown');await expect(row.locator('td').nth(4)).toHaveAttribute('title','Eligibility evidence unavailable');await expect(row).toContainText('NetFixture');
 await query.fill(d1.slice(3));await expect(row).toHaveCount(1);await expect(row).toContainText('Baker Alpha');await query.fill('');await expect(row).toHaveCount(2);
 await expect(committee.locator('.committee-unknown')).toContainText('999');await expect(committee.locator('tbody')).not.toContainText('999');
 test.info().annotations.push({type:'foundation-verified',description:'AC-6'});
 });


test('foundations AC-7 explicit comparison reads B independently and leaves LIVE power unchanged',async({page},testInfo)=>{
 await prepare(page,false);
 const pinned=headers.get(page)!.get('BBlock100')!;
 const reads:string[]=[];
 await page.route('https://tezos-mainnet.octez.io/**',async route=>{
  const url=new URL(route.request().url());
  if(!['/chains/main/chain_id','/chains/main/blocks/head/header','/chains/main/mempool/pending_operations'].includes(url.pathname)){await route.fallback();return;}
  reads.push(url.pathname);
  if(url.pathname.endsWith('/chain_id'))await route.fulfill({json:'NetFixture'});
  else if(url.pathname.endsWith('/head/header'))await route.fulfill({json:{...pinned,chain_id:'NetFixture',protocol:'UnknownExecutionProtocol'}});
  else if(url.pathname.includes('pending_operations'))await route.fulfill({json:{validated:[vote(1,100)],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}});
  else await route.abort();
 });
 const panel=page.locator('.network-panel.mainnet');
 const evidence=panel.locator('details').filter({has:page.locator('summary', {hasText:'Sources & observation evidence'})});
 await evidence.locator('summary').click();
 const before=await panel.locator('.pre .gauge-counts').textContent();
 await expect(panel.getByLabel('Comparison provider')).toBeVisible();
 await panel.getByLabel('Comparison provider').selectOption('https://tezos-mainnet.octez.io');
 await panel.getByRole('button',{name:'Compare selected observation',exact:true}).click();
 await expect(panel.locator('.comparison-result')).toContainText('head-agreement');
 await expect(panel.locator('.comparison-result')).toContainText('BBlock100');
 expect(reads).toEqual(['/chains/main/chain_id','/chains/main/blocks/head/header','/chains/main/mempool/pending_operations']);
 await expect(panel.locator('.pre .gauge-counts')).toHaveText(before??'');
 await expect(panel.locator('.comparison-result')).toContainText('not vote agreement or finality');
 await expect(panel.locator('.comparison-result')).toContainText('chain NetFixture');await expect(panel.locator('.comparison-result')).toContainText('level 100');await expect(panel.locator('.comparison-result')).toContainText(`time ${pinned.timestamp}`);await expect(panel.locator('.comparison-result')).toContainText('Power unknown');await expect(panel.locator('.comparison-result')).toContainText('source https://tezos-mainnet.octez.io');await expect(panel.locator('.comparison-result')).toContainText('requested head unknown');
 testInfo.annotations.push({type:'foundation-verified',description:'AC-7'});
});

test('foundations AC-28 head equality divergence and historical uncertainty remain limited claims',async({page},testInfo)=>{
 await prepare(page,false);const initial=headers.get(page)!.get('BBlock100')!;let observed={...initial,chain_id:'NetFixture',protocol:'PFixture'};const reads:string[]=[];
 await page.route('https://tezos-mainnet.octez.io/**',async route=>{const path=new URL(route.request().url()).pathname;if(!['/chains/main/chain_id','/chains/main/blocks/head/header','/chains/main/mempool/pending_operations'].includes(path)){await route.fallback();return;}reads.push(path);await route.fulfill({json:path.endsWith('/chain_id')?'NetFixture':path.endsWith('/header')?observed:{validated:[],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}});});
 const panel=page.locator('.network-panel.mainnet');await panel.getByText('Sources & observation evidence',{exact:true}).click();await panel.getByLabel('Comparison provider').selectOption('https://tezos-mainnet.octez.io');const compare=panel.getByRole('button',{name:'Compare selected observation',exact:true}),result=panel.locator('.comparison-result');
 await compare.click();await expect(result).toContainText('head-agreement');await expect(result).toContainText('not vote agreement or finality');expect(reads).toHaveLength(3);
 observed={...observed,hash:'SamePayloadDifferentHash'};await compare.click();await expect(result).toContainText('divergence');await expect(result).toContainText('head hash');await expect(result).toContainText('SamePayloadDifferentHash');expect(observed.payload_hash).toBe(initial.payload_hash);expect(reads).toHaveLength(6);
 await send(page,'mainnet-operations',[vote(0)]);await panel.getByRole('button',{name:'Inspect payload vhPayload101',exact:true}).click();await panel.getByRole('button',{name:'Pin selected instance',exact:true}).click();
 observed={...head(130),chain_id:'NetFixture',protocol:'PFixture'};await compare.click();await expect(result).toContainText('Selected historical A');await expect(result).toContainText('fetched current B');await expect(result).toContainText('BBlock130');await expect(result).toContainText(/partial|unavailable/);await expect(result).not.toContainText('head-agreement');await expect(result).toContainText('not vote agreement or finality');expect(reads).toHaveLength(9);
 testInfo.annotations.push({type:'foundation-verified',description:'AC-28'});
});

test('foundations AC-38 exact cached A committee supports separate B power without a fourth read',async({page},testInfo)=>{
 await prepare(page,false);const initial=headers.get(page)!.get('BBlock100')!;let chain='NetFixture',observed={...initial,chain_id:'NetFixture',protocol:'PFixture'},comparedOperations=[vote(1)];const reads:string[]=[];
 await send(page,'mainnet-operations',[vote(0)]);const panel=page.locator('.network-panel.mainnet');await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');await panel.getByRole('button',{name:'Inspect payload vhPayload101',exact:true}).click();await panel.getByText('Sources & observation evidence',{exact:true}).click();
 await page.route('https://tezos-mainnet.octez.io/**',async route=>{const path=new URL(route.request().url()).pathname;if(!['/chains/main/chain_id','/chains/main/blocks/head/header','/chains/main/mempool/pending_operations'].includes(path)){await route.fallback();return;}reads.push(path);await route.fulfill({json:path.endsWith('/chain_id')?chain:path.endsWith('/header')?observed:{validated:comparedOperations,refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}});});
 await panel.getByLabel('Comparison provider').selectOption('https://tezos-mainnet.octez.io');const compare=panel.getByRole('button',{name:'Compare selected observation',exact:true}),result=panel.locator('.comparison-result');const events=await panel.locator('.event-history').textContent();
 await compare.click();await expect(result).toContainText('Pre 600/30000');await expect(result).toContainText('rights original responder https://mainnet.smartpy.io');await expect(result).toContainText('rights requested anchor BBlock100');await expect(result).toContainText('rights target 101');await expect(result).toContainText('rights received');await expect(result).toContainText('source https://tezos-mainnet.octez.io');await expect(result).toContainText('producing protocol PFixture');expect(reads).toEqual(['/chains/main/chain_id','/chains/main/blocks/head/header','/chains/main/mempool/pending_operations']);await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');expect(await panel.locator('.event-history').textContent()).toBe(events);
 observed={...observed,hash:'WrongBContext'};await compare.click();await expect(result).toContainText('Power unknown');await expect(result).toContainText('raw 1');await expect(result).toContainText('rights original responder unknown');expect(reads).toHaveLength(6);
 observed={...initial,chain_id:'NetFixture',protocol:'WrongProducingProtocol'};await compare.click();await expect(result).toContainText('producing protocol WrongProducingProtocol');await expect(result).toContainText('Power unknown');expect(reads).toHaveLength(9);
 chain='OtherChain';await compare.click();await expect(result).toContainText('chain OtherChain');await expect(result).toContainText('Power unknown');await expect(result).toContainText('divergence');expect(reads.length).toBeLessThanOrEqual(12);await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');
 chain='NetFixture';observed={...initial,chain_id:'NetFixture',protocol:'PFixture'};comparedOperations=[];const beforeEmpty=reads.length;await compare.click();await expect.poll(()=>reads.length).toBe(beforeEmpty+3);await expect(result).toContainText('raw 0');await expect(result).toContainText('rights original responder https://mainnet.smartpy.io');await expect(result).toContainText(/phase.*unknown|power unknown|power unavailable/i);await expect(result).not.toContainText('Pre 0/');await expect(result).not.toContainText('Att 0/');
 testInfo.annotations.push({type:'foundation-verified',description:'AC-38'});
});

test('foundations AC-30 comparison receipt ages monotonically and context invalidation stays sticky',async({page},testInfo)=>{
 await page.clock.install();await prepare(page,false);const initial=headers.get(page)!.get('BBlock100')!,reads:string[]=[];
 await page.route('https://tezos-mainnet.octez.io/**',async route=>{const path=new URL(route.request().url()).pathname;if(!['/chains/main/chain_id','/chains/main/blocks/head/header','/chains/main/mempool/pending_operations'].includes(path)){await route.fallback();return;}reads.push(path);await route.fulfill({json:path.endsWith('/chain_id')?'NetFixture':path.endsWith('/header')?{...initial,chain_id:'NetFixture',protocol:'PFixture'}:{validated:[],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}});});
 const panel=page.locator('.network-panel.mainnet');await panel.getByText('Sources & observation evidence',{exact:true}).click();await panel.getByLabel('Comparison provider').selectOption('https://tezos-mainnet.octez.io');const compare=panel.getByRole('button',{name:'Compare selected observation',exact:true}),result=panel.locator('.comparison-result');
 await compare.click();await expect(result).toContainText('head-agreement');await expect(result).not.toContainText('stale');const receipt=(await result.textContent())!.match(/received ([^ ]+)/)![1]!;
 await page.clock.runFor(59999);await expect(result).not.toContainText('stale');await page.clock.setSystemTime(new Date('2030-01-01T00:00:00Z'));await page.clock.runFor(1);await expect(result).toContainText('stale');await expect(result).toContainText(`received ${receipt}`);expect(reads).toHaveLength(3);
 await compare.click();await expect(result).not.toContainText('stale');expect(reads).toHaveLength(6);const refreshed=(await result.textContent())!.match(/received ([^ ]+)/)![1]!;
 await page.getByRole('button',{name:'Pause',exact:true}).click();await expect(result).toContainText('context-invalid');await expect(result).toContainText('stale');const pausedReads=await page.evaluate(()=>window.mockRequests.length);await panel.getByRole('button',{name:'Latest',exact:true}).click();await panel.getByRole('button',{name:'Follow live',exact:true}).click();expect(await page.evaluate(()=>window.mockRequests.length)).toBe(pausedReads);await page.getByRole('button',{name:'Resume',exact:true}).click();await expect(result).toContainText('context-invalid');await expect(result).toContainText(`received ${refreshed}`);expect(reads).toHaveLength(6);
 testInfo.annotations.push({type:'foundation-verified',description:'AC-30'});
});

test('foundations AC-29 comparison counts complete reads and rejects slow bodies redirects and extra clicks',async({page},testInfo)=>{
 await page.clock.install();
 await page.addInitScript(()=>{const original=window.fetch.bind(window);const gate={path:'',waiting:false,released:false,started:0,aborted:0,release:()=>{}};Object.assign(window,{comparisonReadGate:gate});window.fetch=async(input,options)=>{const response=await original(input,options),url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);if(url.hostname==='tezos-mainnet.octez.io'&&(url.pathname===gate.path||gate.path==='*')){gate.started=performance.now();gate.aborted=0;options?.signal?.addEventListener('abort',()=>{gate.aborted=performance.now();},{once:true});const body=await response.json();response.json=()=>new Promise(resolve=>{gate.waiting=true;gate.release=()=>{gate.released=true;gate.waiting=false;resolve(body);};});}return response;};});
 await prepare(page,false);const initial=headers.get(page)!.get('BBlock100')!,reads:string[]=[],redirects:string[]=[];let redirect=false,broken=false;
 await page.route('https://tezos-mainnet.octez.io/**',async route=>{const url=new URL(route.request().url()),path=url.pathname;if(path==='/forbidden-follow'){redirects.push(path);await route.abort();return;}if(!['/chains/main/chain_id','/chains/main/blocks/head/header','/chains/main/mempool/pending_operations'].includes(path)){await route.fallback();return;}reads.push(path);if(redirect){await route.fulfill({status:302,headers:{location:'https://tezos-mainnet.octez.io/forbidden-follow'}});return;}if(broken&&path.includes('pending_operations')){await route.fulfill({body:'{"validated":[',contentType:'application/json'});return;}await route.fulfill({json:path.endsWith('/chain_id')?'NetFixture':path.endsWith('/header')?{...initial,chain_id:'NetFixture',protocol:'PFixture'}:{validated:[],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}});});
 const panel=page.locator('.network-panel.mainnet');await panel.getByText('Sources & observation evidence',{exact:true}).click();await panel.getByLabel('Comparison provider').selectOption('https://tezos-mainnet.octez.io');const compare=panel.getByRole('button',{name:'Compare selected observation',exact:true}),result=panel.locator('.comparison-result');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 const paths=['/chains/main/chain_id','/chains/main/blocks/head/header','/chains/main/mempool/pending_operations'];
 for(let index=0;index<paths.length;index++){
  await page.evaluate(path=>{const gate=(window as unknown as {comparisonReadGate:{path:string;waiting:boolean}}).comparisonReadGate;gate.path=path;gate.waiting=false;},paths[index]!);const before=reads.length;
  await compare.click();await expect.poll(()=>page.evaluate(()=>(window as unknown as {comparisonReadGate:{waiting:boolean}}).comparisonReadGate.waiting)).toBe(true);await page.clock.runFor(16);await expect(compare).toBeDisabled();expect(reads.length-before).toBe(index+1);
  await compare.dispatchEvent('click');expect(reads.length-before).toBe(index+1);await page.clock.runFor(7983);await expect(compare).toBeDisabled();await page.clock.runFor(17);await expect(compare).toBeEnabled();await expect(result).toContainText('eight seconds');expect(await page.evaluate(()=>{const gate=(window as unknown as {comparisonReadGate:{started:number;aborted:number}}).comparisonReadGate;return gate.aborted-gate.started;})).toBe(8000);expect(reads.length-before).toBe(index+1);
  const timedOut=await result.textContent();await page.evaluate(()=>(window as unknown as {comparisonReadGate:{release:()=>void}}).comparisonReadGate.release());await page.clock.runFor(20);expect(await result.textContent()).toBe(timedOut);await page.clock.runFor(24000);expect(reads.length-before).toBe(index+1);
 }
 await page.evaluate(()=>{const gate=(window as unknown as {comparisonReadGate:{path:string;waiting:boolean}}).comparisonReadGate;gate.path='*';gate.waiting=false;});const slowStart=await page.evaluate(()=>performance.now()),slowBefore=reads.length;await compare.click();
 for(let read=0;read<3;read++){await expect.poll(()=>page.evaluate(()=>(window as unknown as {comparisonReadGate:{waiting:boolean}}).comparisonReadGate.waiting)).toBe(true);expect(reads.length-slowBefore).toBe(read+1);await page.clock.runFor(7900);await page.evaluate(()=>(window as unknown as {comparisonReadGate:{release:()=>void}}).comparisonReadGate.release());}
 await expect.poll(async()=>{await page.clock.runFor(16);return compare.isEnabled();}).toBe(true);await expect(result).toContainText('head-agreement');expect(await page.evaluate(()=>performance.now())-slowStart).toBeLessThanOrEqual(24000);expect(reads.length-slowBefore).toBe(3);
 await page.evaluate(()=>(window as unknown as {comparisonReadGate:{path:string}}).comparisonReadGate.path='');redirect=true;let before=reads.length;await compare.click();await expect.poll(async()=>{await page.clock.runFor(16);return compare.isEnabled();}).toBe(true);await expect(result).toContainText(/unavailable|partial/);expect(reads.length-before).toBe(1);expect(redirects).toEqual([]);
 redirect=false;broken=true;before=reads.length;await compare.click();await expect.poll(async()=>{await page.clock.runFor(16);return reads.length-before;}).toBe(3);await expect.poll(async()=>{await page.clock.runFor(16);return compare.isEnabled();}).toBe(true);await expect(result).toContainText('partial');expect(reads.length-before).toBe(3);await page.clock.runFor(24000);expect(reads.length-before).toBe(3);
 testInfo.annotations.push({type:'foundation-verified',description:'AC-29'});
});

test('foundations AC-36 selected-source phase and comparison labels disclose unavailable global evidence',async({page},testInfo)=>{
 await page.clock.install();await prepare(page,false);const initial=headers.get(page)!.get('BBlock100')!;await page.route('https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header',route=>route.fulfill({json:{...initial,chain_id:'NetFixture'}}));
 await send(page,'mainnet-operations',[vote(0)]);const panel=page.locator('.network-panel.mainnet');await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');await expect(panel.locator('.att .gauge-counts')).toContainText('Voting power unavailable');await expect(panel).toContainText('partial positive observations');await expect(panel).toContainText(/coverage partial/i);
 await page.route('https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*',route=>route.fulfill({json:{validated:[vote(0)],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}}));await page.clock.runFor(15000);const candidate={...head(101),hash:'BScopedCoverage',payload_hash:'vhPayload101'};headers.get(page)!.set(candidate.hash,candidate);await send(page,'mainnet-proposals',{chain_id:'NetFixture',hash:candidate.hash,header:candidate});await panel.getByRole('button',{name:'Inspect candidate BScopedCoverage',exact:true}).click();await expect(panel.locator('.att .gauge-counts')).toContainText('0 / 30,000 power');await expect(panel).toContainText('Source-snapshot measured zero');await expect(panel).toContainText('no global completeness');
 const committee=panel.locator('.committee-evidence');await committee.locator('summary').click();await committee.getByRole('combobox',{name:'Committee phase receipt filter'}).selectOption('att:absent');await expect(committee.locator('tbody tr')).toHaveCount(50);await expect(committee).toContainText('no network-wide inactivity or global completeness claim');await expect(committee.locator('tbody tr').first()).toContainText('Absent in selected source snapshot');
 await panel.getByText('Sources & observation evidence',{exact:true}).click();await page.route('https://tezos-mainnet.octez.io/**',async route=>{const path=new URL(route.request().url()).pathname;if(path.endsWith('/chain_id'))await route.fulfill({json:'NetFixture'});else if(path.endsWith('/head/header'))await route.fulfill({json:{...initial,chain_id:'NetFixture',protocol:'UnknownProtocol'}});else if(path.includes('pending_operations'))await route.fulfill({json:{validated:[vote(1)],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}});else await route.fallback();});await panel.getByLabel('Comparison provider').selectOption('https://tezos-mainnet.octez.io');await panel.getByRole('button',{name:'Compare selected observation',exact:true}).click();const result=panel.locator('.comparison-result');await expect(result).toContainText('Power unknown');await expect(result).toContainText('Separate B source-limited observations');await expect(result).toContainText('not vote agreement or finality');await expect(result).toContainText('fetched current B https://tezos-mainnet.octez.io');await expect(panel).toContainText(/finality.*unavailable|unavailable.*finality/i);
 testInfo.annotations.push({type:'foundation-verified',description:'AC-36'});
});

test('foundations AC-37 browser session reset discloses nonarchival history and one-provider comparison scope',async({page},testInfo)=>{
 await prepare(page,false);await send(page,'mainnet-operations',[vote(0)]);const panel=page.locator('.network-panel.mainnet');await expect(panel.locator('.session-controls')).toContainText('1 / 150 session instances');await expect(panel.locator('.session-controls')).toContainText('Browser-session history is nonarchival and resets on reload');await panel.getByRole('button',{name:'Inspect payload vhPayload101',exact:true}).click();await panel.getByText('Sources & observation evidence',{exact:true}).click();await panel.getByRole('button',{name:'Pin selected instance',exact:true}).click();await expect(panel.locator('.session-controls')).toContainText('Pinned retained session instance');
 const selected=headers.get(page)!.get('BBlock100')!,reads:string[]=[];await page.route('https://tezos-mainnet.octez.io/**',async route=>{const path=new URL(route.request().url()).pathname;if(!['/chains/main/chain_id','/chains/main/blocks/head/header','/chains/main/mempool/pending_operations'].includes(path)){await route.fallback();return;}reads.push(route.request().url());await route.fulfill({json:path.endsWith('/chain_id')?'NetFixture':path.endsWith('/header')?{...selected,chain_id:'NetFixture',protocol:'PFixture'}:{validated:[],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}});});await panel.getByLabel('Comparison provider').selectOption('https://tezos-mainnet.octez.io');await panel.getByRole('button',{name:'Compare selected observation',exact:true}).click();await expect(panel.locator('.comparison-result')).toContainText('fetched current B https://tezos-mainnet.octez.io');expect(reads).toHaveLength(3);expect(reads.every(url=>url.startsWith('https://tezos-mainnet.octez.io/'))).toBe(true);await expect(panel.locator('.comparison-result')).toContainText('not vote agreement or finality');
 await page.reload();await expect(panel.locator('.headline')).toContainText('100');await expect(panel.locator('.session-controls')).toContainText('0 / 150 session instances');await expect(panel.locator('.session-controls')).toContainText('Follow live');await expect(panel.locator('.session-controls')).toContainText('nonarchival and resets on reload');await expect(panel.getByRole('button',{name:'Inspect payload vhPayload101',exact:true})).toHaveCount(0);await panel.getByText('Sources & observation evidence',{exact:true}).click();await expect(panel.locator('.comparison-result')).toContainText('Explicit one-shot comparison');expect(reads).toHaveLength(3);
 testInfo.annotations.push({type:'foundation-verified',description:'AC-37'});
});

test('foundations AC-35 primary fallback keeps actual responder while failed comparison never cascades',async({page},testInfo)=>{
 await prepare(page,false,head(),100,false,true);await expect.poll(()=>page.evaluate(()=>Boolean(window.mockStreams['mainnet-operations']))).toBe(true);const respondingHead=headers.get(page)!.get('BBlock100')!;await page.route('https://mainnet.smartpy.io/chains/main/blocks/head/header',route=>route.fulfill({json:{...respondingHead,chain_id:'NetFixture'}}));await send(page,'mainnet-operations',[vote(0)]);const panel=page.locator('.network-panel.mainnet');await panel.getByRole('button',{name:'Inspect payload vhPayload101',exact:true}).click();await expect(panel.locator('.candidate-evidence')).toContainText('Source https://mainnet.smartpy.io');await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');await panel.getByText('Sources & observation evidence',{exact:true}).click();const before=await panel.locator('.candidate-evidence').textContent(),power=await panel.locator('.pre .gauge-counts').textContent(),reads:string[]=[];
 await page.route('https://tezos-mainnet.octez.io/**',async route=>{const path=new URL(route.request().url()).pathname;if(!path.endsWith('/chain_id')){await route.fallback();return;}reads.push(route.request().url());await route.fulfill({status:503,body:'Explicit comparison provider unavailable'});});await panel.getByLabel('Comparison provider').selectOption('https://tezos-mainnet.octez.io');await panel.getByRole('button',{name:'Compare selected observation',exact:true}).click();await expect(panel.locator('.comparison-result')).toContainText('unavailable');await expect(panel.locator('.comparison-result')).toContainText('503');expect(reads).toEqual(['https://tezos-mainnet.octez.io/chains/main/chain_id']);await expect(panel.locator('.candidate-evidence')).toHaveText(before??'');await expect(panel.locator('.pre .gauge-counts')).toHaveText(power??'');await expect(panel.locator('.comparison-result')).toContainText('Selected observed A https://mainnet.smartpy.io');await expect(panel.locator('.comparison-result')).toContainText('fetched current B https://tezos-mainnet.octez.io');
 await page.clock.install();let reconciliations=0;await page.route('https://mainnet.smartpy.io/chains/main/blocks/head/header',async route=>{reconciliations++;await route.fulfill({status:503,json:{error:'Same observer reconciliation unavailable'}});});const beforeReconcile=await page.evaluate(()=>window.mockRequests.length);
 await send(page,'mainnet-operations',[vote(0,124)]);await panel.getByRole('button',{name:'Inspect payload vhPayload124',exact:true}).click();await page.clock.runFor(15000);await expect.poll(()=>reconciliations).toBe(1);await expect(panel.locator('.candidate-evidence')).toContainText('Unresolved');await expect(panel.locator('.candidate-evidence')).toContainText('https://mainnet.smartpy.io');
 await page.clock.runFor(20000);expect(reconciliations).toBe(1);await send(page,'mainnet-operations',[vote(0,124)]);expect(reconciliations).toBe(1);const retry=panel.getByRole('button',{name:'Retry selected observer context',exact:true});await retry.click();await expect.poll(()=>reconciliations).toBe(2);
 const contextReads=await page.evaluate(start=>window.mockRequests.slice(start).filter(request=>new URL(request.url).pathname.endsWith('/blocks/head/header')).map(request=>request.url),beforeReconcile);expect(contextReads).toEqual(['https://mainnet.smartpy.io/chains/main/blocks/head/header','https://mainnet.smartpy.io/chains/main/blocks/head/header']);
 await page.getByRole('button',{name:'Pause',exact:true}).click();const paused=await page.evaluate(()=>window.mockRequests.length);await panel.getByRole('button',{name:'Latest',exact:true}).click();expect(await page.evaluate(()=>window.mockRequests.length)).toBe(paused);expect(reads).toHaveLength(1);
 testInfo.annotations.push({type:'foundation-verified',description:'AC-35'});
});

test('foundations AC-21 paused cached inspection rejects late alias rights and comparison bodies after resume',async({page},testInfo)=>{
 await page.addInitScript(()=>{
  const original=window.fetch.bind(window),state={armRights:false,seen:new Set<string>(),gates:[] as {kind:string;signal:AbortSignal|null|undefined;release:()=>void}[]};Object.assign(window,{cancelledBodyFixture:state});
  window.fetch=async(input,options)=>{const response=await original(input,options),url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);const kind=url.hostname==='api.tzkt.io'&&url.pathname.includes('/v1/delegates')?'aliases':state.armRights&&url.hostname==='mainnet.smartpy.io'&&url.pathname.includes('attestation_rights')&&url.searchParams.get('level')==='101'?'rights':url.hostname==='tezos-mainnet.octez.io'&&url.pathname.includes('pending_operations')?'comparison':undefined;if(kind&&!state.seen.has(kind)){state.seen.add(kind);let body=await response.json();if(kind==='aliases')body=body.map((entry:{address:string;alias:string})=>({...entry,alias:'Cancelled Poison Alias'}));if(kind==='rights'){const entries=body[0]?.delegates;if(entries?.length>=2){entries[0].attesting_power=601;entries[1].attesting_power=599;}}response.json=()=>new Promise(resolve=>state.gates.push({kind,signal:options?.signal,release:()=>resolve(body)}));}return response;};
 });
 await prepare(page,false);await send(page,'mainnet-operations',[vote(0)]);const panel=page.locator('.network-panel.mainnet');await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');await panel.getByRole('button',{name:'Inspect payload vhPayload101',exact:true}).click();await panel.getByText('Sources & observation evidence',{exact:true}).click();await panel.getByRole('button',{name:'Pin selected instance',exact:true}).click();
 await page.evaluate(()=>(window as unknown as {cancelledBodyFixture:{armRights:boolean}}).cancelledBodyFixture.armRights=true);await send(page,'mainnet-head',head(101));await expect.poll(()=>page.evaluate(()=>(window as unknown as {cancelledBodyFixture:{gates:{kind:string}[]}}).cancelledBodyFixture.gates.some(gate=>gate.kind==='rights'))).toBe(true);
 const initial=headers.get(page)!.get('BBlock100')!;await page.route('https://tezos-mainnet.octez.io/**',async route=>{const path=new URL(route.request().url()).pathname;if(path.endsWith('/chain_id'))await route.fulfill({json:'NetFixture'});else if(path.endsWith('/head/header'))await route.fulfill({json:{...initial,chain_id:'NetFixture',protocol:'PFixture'}});else if(path.includes('pending_operations'))await route.fulfill({json:{validated:[{...vote(1),hash:'CancelledComparisonPoison'}],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}});else await route.fallback();});await panel.getByLabel('Comparison provider').selectOption('https://tezos-mainnet.octez.io');await panel.getByRole('button',{name:'Compare selected observation',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as unknown as {cancelledBodyFixture:{gates:{kind:string}[]}}).cancelledBodyFixture.gates.map(gate=>gate.kind).sort())).toEqual(['aliases','comparison','rights']);
 await page.getByRole('button',{name:'Pause',exact:true}).click();expect(await page.evaluate(()=>(window as unknown as {cancelledBodyFixture:{gates:{signal:AbortSignal}[]}}).cancelledBodyFixture.gates.every(gate=>gate.signal.aborted))).toBe(true);const reads=await page.evaluate(()=>window.mockRequests.length);const committee=panel.locator('.committee-evidence');await committee.locator('summary').click();await committee.getByRole('searchbox',{name:'Search committee alias or address'}).fill('tz1');await committee.getByRole('combobox',{name:'Committee sort'}).selectOption('address');await expect(committee.locator('tbody tr')).toHaveCount(50);await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');expect(await page.evaluate(()=>window.mockRequests.length)).toBe(reads);
 await page.getByRole('button',{name:'Resume',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.mockRequests.filter(request=>request.url.includes('/monitor/heads/')&&!request.aborted).length)).toBe(2);await send(page,'mainnet-head',headers.get(page)!.get('BBlock101')!);await page.evaluate(()=>(window as unknown as {cancelledBodyFixture:{gates:{release:()=>void}[]}}).cancelledBodyFixture.gates.forEach(gate=>gate.release()));await panel.getByRole('button',{name:'Follow live',exact:true}).click();const resumedHead=headers.get(page)!.get('BBlock101')!;await page.route('https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header',route=>route.fulfill({json:{...resumedHead,chain_id:'NetFixture'}}));await page.route('https://mainnet.smartpy.io/chains/main/blocks/head/header',route=>route.fulfill({json:{...resumedHead,chain_id:'NetFixture'}}));await page.clock.install();await send(page,'mainnet-operations',[{...vote(0,101),hash:'fresh-target101-after-cancel'}]);await page.clock.runFor(15000);await panel.getByRole('button',{name:'Inspect payload vhPayload101',exact:true}).last().click();await expect(panel.locator('.candidate-evidence')).toContainText('observed head BBlock101');const retry=panel.getByRole('button',{name:'Retry selected observer context',exact:true});if(await retry.isVisible())await retry.click();await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');await expect(panel).not.toContainText('Cancelled Poison Alias');await expect(panel.locator('.comparison-result')).not.toContainText('CancelledComparisonPoison');
 testInfo.annotations.push({type:'foundation-verified',description:'AC-21'});
});

test('foundations AC-19 comparison and LIVE share one raw budget and growth preserves only captured positive scalars',async({page},testInfo)=>{
 await prepare(page,false);const panel=page.locator('.network-panel.mainnet');await send(page,'mainnet-operations',Array.from({length:9999},(_,index)=>({...vote(0),hash:`live-capacity-${index}`})));await expect(panel.locator('.session-controls')).toContainText('9999 / 10000 raw operations');await panel.getByRole('button',{name:'Inspect payload vhPayload101',exact:true}).click();await panel.getByText('Sources & observation evidence',{exact:true}).click();const initial=headers.get(page)!.get('BBlock100')!,reads:string[]=[];
 await page.route('https://tezos-mainnet.octez.io/**',async route=>{const path=new URL(route.request().url()).pathname;if(!['/chains/main/chain_id','/chains/main/blocks/head/header','/chains/main/mempool/pending_operations'].includes(path)){await route.fallback();return;}reads.push(path);await route.fulfill({json:path.endsWith('/chain_id')?'NetFixture':path.endsWith('/header')?{...initial,chain_id:'NetFixture',protocol:'PFixture'}:{validated:[{...vote(1),hash:'compare-capacity-1'},{...vote(2),hash:'compare-capacity-2'}],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}});});await panel.getByLabel('Comparison provider').selectOption('https://tezos-mainnet.octez.io');await panel.getByRole('button',{name:'Compare selected observation',exact:true}).click();const result=panel.locator('.comparison-result');await expect(result).toContainText('raw 1');await expect(result).toContainText('Local shared raw retention limit');await expect(result).toContainText('Pre 1200/30000');const received=(await result.textContent())!.match(/received ([^ ]+)/)![1]!;
 await send(page,'mainnet-operations',[{...vote(0),hash:'live-capacity-last'}]);await expect(panel.locator('.session-controls')).toContainText('10000 / 10000 raw operations');await expect(result).toContainText('raw 0');await expect(result).toContainText('captured positive facts remain as-of');await expect(result).toContainText('Pre 1200/30000');await expect(result).toContainText(`received ${received}`);await expect(result).toContainText('rights original responder https://mainnet.smartpy.io');await expect(result).not.toContainText('Pre 0/');await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');expect(reads).toHaveLength(3);
 await panel.getByRole('button',{name:'Compare selected observation',exact:true}).click();await expect.poll(()=>reads.length).toBe(6);await expect(result).toContainText('raw 0');await expect(result).toContainText('Local shared raw retention limit');await expect(result).not.toContainText('Pre 0/');await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');
 testInfo.annotations.push({type:'foundation-verified',description:'AC-19'});
});
