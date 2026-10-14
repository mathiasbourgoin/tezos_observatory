import {expect, test, type Page} from '@playwright/test';

type Channel = 'mainnet-head' | 'mainnet-operations' | 'shadownet-head' | 'shadownet-operations' | 'mainnet-proposals' | 'shadownet-proposals';
declare global {
  interface Window {
    mockStreams: Record<string, ReadableStreamDefaultController<Uint8Array>>;
    mockInitialOperations: boolean;
  }
}

const head = (level = 100, round = 0) => ({
  level, hash: `BBlock${level}`, predecessor: `BBlock${level - 1}`,
  timestamp: new Date().toISOString(), fitness: ['02', '00000064', '', 'ffffffff', round.toString(16).padStart(8, '0')],
  payload_hash: `vhPayload${level}`,
});
const vote = (slot: number, level = 101, round = 0) => ({
  hash: `operation-${slot}-${level}-${round}`,
  contents: [{kind: 'preattestation', slot, level, round, block_payload_hash: `vhPayload${level}`}],
});

async function send(page: Page, channel: Channel, value: unknown): Promise<void> {
  await page.evaluate(({channel, value}) => {
    const stream = window.mockStreams[channel];
    if (!stream) throw new Error(`Missing stream ${channel}`);
    stream.enqueue(new TextEncoder().encode(`${JSON.stringify(value)}\n`));
  }, {channel, value});
}

async function prepare(page: Page, initialOperations = true, initialHead=head(),expectedLevel=initialHead.level): Promise<void> {
  await page.addInitScript(({initialOperations, initialHead}) => {
    window.mockStreams = {};
    window.mockInitialOperations = initialOperations;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, options) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      const monitoring = url.pathname.includes('/monitor/heads/') || url.pathname.endsWith('/monitor_operations') || url.pathname.includes('/monitor/validated_blocks');
      if (!monitoring) return originalFetch(input, options);
      const network = url.hostname.includes('shadownet') ? 'shadownet' : 'mainnet';
      const kind = url.pathname.includes('/monitor/heads/') ? 'head' : url.pathname.includes('/monitor/validated_blocks') ? 'proposals' : 'operations';
      const body = new ReadableStream<Uint8Array>({start(controller) {
        window.mockStreams[`${network}-${kind}`] = controller;
        options?.signal?.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), {once: true});
        if (kind === 'head') controller.enqueue(new TextEncoder().encode(`${JSON.stringify(initialHead)}\n`));
        else if (kind === 'operations' && initialOperations) controller.enqueue(new TextEncoder().encode('[]\n'));
      }});
      return new Response(body, {headers: {'Content-Type': 'application/json'}});
    };
  }, {initialOperations, initialHead});

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
    else if (url.pathname.endsWith('/header')) result = head(99);
    else if (url.pathname.includes('/v1/delegates')) result = Array.from({length: 50}, (_, slot) => ({address: `tz1BakerAddress${String(slot).padStart(25, '0')}`, alias: `Baker ${slot}`}));
    else if (url.pathname.includes('pending_operations')) result = {validated: []};
    else {await route.abort(); return;}
    await route.fulfill({json: result, headers: {'Access-Control-Allow-Origin': '*'}});
  });
  await page.goto('/');
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
  await expect(panel.locator('.att .gauge-percent')).toHaveText('0.0%');
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
