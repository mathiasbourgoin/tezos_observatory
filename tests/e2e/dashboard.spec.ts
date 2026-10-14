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

async function prepare(page: Page, initialOperations = true, initialHead=head(),expectedLevel=initialHead.level,initiallyHidden=false,sourceB=false): Promise<void> {
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
    if (url.pathname.includes('attestation_rights')) result = [{level, delegates: Array.from({length: 50}, (_, slot) => ({
      delegate: `tz1BakerAddress${String(slot).padStart(25, '0')}`, first_slot: slot, attesting_power: 600,
    }))}];
    else if (url.pathname.endsWith('/context/constants')) result = {
      minimal_block_delay: '6', delay_increment_per_round: '3', consensus_threshold_size: 20000, consensus_committee_size: 30000,
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
    else if (url.pathname.includes('/v1/delegates')) result = Array.from({length: 50}, (_, slot) => ({address: `tz1BakerAddress${String(slot).padStart(25, '0')}`, alias: `Baker ${slot}`}));
    else if (url.pathname.includes('pending_operations')) result = {validated: []};
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
  await prepare(page);
  await send(page, 'mainnet-operations', [vote(0)]);
  const panel = page.locator('.mainnet');
  await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');
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
  await expect(page.locator('.mainnet .status-chip')).toHaveText('Progressing');
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
  await page.getByRole('button', {name: 'Shadownet Connecting'}).or(page.getByRole('button', {name: 'Shadownet Progressing'})).click();
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
  await expect(panel.locator('.network-notice')).toContainText('Observed votes · level 101 · round 0 · validated mempool observations');
  await expect(panel.locator('.network-notice')).not.toContainText('Current round');
});


test('observed votes and scheduled proposals name their own levels and rounds', async ({page}) => {
  await page.clock.install({time: new Date('2026-10-14T18:54:31Z')});
  const applied = {...head(5489251, 114), timestamp: '2026-10-14T18:47:21Z'};
  await prepare(page, false, applied, 5489251);
  await send(page, 'shadownet-operations', [vote(0, 5489252, 0)]);
  const panel = page.locator('.network-panel.shadownet');
  await expect(panel.locator('.headline')).toHaveText('Applied block level5,489,251Applied block round114');
  await expect(panel.locator('.network-notice')).toContainText('Observed votes · level 5,489,252 · round 0 · validated mempool observations');
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
 test("foundations AC-21 paused local candidate inspection starts no external reads",async({page},testInfo)=>{
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
