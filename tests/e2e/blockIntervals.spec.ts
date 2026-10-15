import {metricFixture,metricObservation,captureMetricSurface,type MetricMode} from './metricFixture';
import {choose} from './productionFixture';
import {test,expect,type Page} from '@playwright/test';
import {prepare,send,vote,head} from './productionFixture';
import {captureMatrix} from './v3Evidence';
import {mkdir,writeFile,readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';

const pageErrors=new WeakMap<Page,string[]>();
test.beforeEach(({page})=>{const errors:string[]=[];pageErrors.set(page,errors);page.on('pageerror',error=>errors.push(error.message));});
test.afterEach(({page})=>{const errors=pageErrors.get(page);if(errors?.length)throw new Error(`Metric production runtime: ${errors.join('; ')}`);});

const means=(page:Page)=>page.locator('.mainnet .block-intervals .interval-mean');
const calls=(page:Page,network='mainnet')=>page.evaluate(network=>window.metricFixture.calls.filter(call=>new URL(call.url).hostname===(network==='mainnet'?'api.tzkt.io':'api.shadownet.tzkt.io')).length,network);
async function settleReader(page:Page):Promise<void>{await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}

test('block intervals ordinary bounded endpoints render three real timestamp means',async({page},info)=>{
 await page.clock.install({time:new Date('2026-10-15T12:00:30Z')});
 await page.addInitScript(()=>{
  const original=window.fetch.bind(window);
  window.fetch=async(input,options)=>{
   const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
   if(!url.hostname.startsWith('api.')||url.pathname!=='/v1/blocks')return original(input,options);
   const end={level:104,hash:'IndexedEnd104',timestamp:'2026-10-15T12:00:28Z'};
   const cutoff=url.searchParams.get('timestamp.le');
   const row=url.searchParams.has('level')||!url.searchParams.has('level.le')?end
    :cutoff?.startsWith('2026-10-08T')?{level:20,hash:'Week20',timestamp:'2026-10-08T12:00:04Z'}
    :cutoff?.startsWith('2026-10-14T')?{level:80,hash:'Day80',timestamp:'2026-10-14T12:00:04Z'}
    :{level:100,hash:'Hour100',timestamp:'2026-10-15T11:00:04Z'};
   return Response.json([row],{headers:{'Tzkt-Level':'250','Tzkt-Known-Level':'255','Tzkt-Synced-At':'2026-10-15T12:00:29Z'}});
  };
 });
 await prepare(page,false);
 const region=page.locator('.mainnet .block-intervals');
 await expect(region).toBeVisible();
 await expect(region.locator('.interval-mean')).toHaveText(['7200.29 s','3601.00 s','906.00 s']);
 await expect(region).toContainText('TzKT-reported indexed spans');
 await expect(region).toContainText('4 intervals');
 await expect(region.getByRole('button',{name:'Refresh block intervals for Mainnet',exact:true})).toBeDisabled();
 info.annotations.push({type:'block-interval-verified',description:'ordinary'});
});

test('block intervals evidence keeps readable metadata at the actual product root font',async({page},info)=>{
 await page.setViewportSize({width:360,height:800});await metricFixture(page);await prepare(page,false);const region=page.locator('.mainnet .block-intervals');await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);await region.locator('summary').click();
 const fonts=await region.evaluate(node=>({evidence:parseFloat(getComputedStyle(node.querySelector('.interval-evidence') as Element).fontSize),status:parseFloat(getComputedStyle(node.querySelector('.interval-status') as Element).fontSize),mean:parseFloat(getComputedStyle(node.querySelector('.interval-mean') as Element).fontSize)}));
 expect(fonts.evidence).toBeGreaterThanOrEqual(12);expect(fonts.status).toBeGreaterThanOrEqual(14);expect(fonts.mean).toBeGreaterThanOrEqual(14);
 info.annotations.push({type:'block-interval-verified',description:'minimum-type'});
});

test('block intervals production reader contract preserves bounded independent refresh lifecycle and inspection',async({page},info)=>{
 await metricFixture(page);await prepare(page,false);const panel=page.locator('.mainnet'),region=panel.locator('.block-intervals'),refresh=region.getByRole('button',{name:'Refresh block intervals for Mainnet',exact:true});
 await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);expect(await calls(page)).toBe(5);expect(await calls(page,'shadownet')).toBe(0);
 await expect(region).toContainText('Indexer lag 5 levels');await expect(region.locator('.interval-note')).toContainText('intermediate ancestry and completeness are not independently verified');
 expect(await page.evaluate(()=>window.metricFixture.calls.every(call=>call.credentials==='omit'&&call.cache==='no-store'&&call.redirect==='error'))).toBe(true);
 await choose(page.getByLabel('Appearance'),'dark');await choose(page.getByLabel('Appearance'),'light');expect(await calls(page)).toBe(5);
 await send(page,'mainnet-operations',[vote(0)]);await panel.getByRole('button',{name:'Pin selected instance',exact:true}).click();await expect(panel.locator('.session-mode')).toContainText('Pinned');
 await region.locator('summary').click();await expect(region.locator('details')).toHaveAttribute('open','');const query=panel.getByRole('searchbox',{name:'Search committee alias or address'});await query.fill('Baker');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+50));
 await info.attach('metric-cooldown-before-advance',{body:JSON.stringify(await page.evaluate(()=>({now:performance.now(),first:window.metricFixture.calls.find(call=>new URL(call.url).hostname==='api.tzkt.io')?.monotonic,status:document.querySelector('.mainnet .interval-status')?.textContent}))),contentType:'application/json'});const until59=await page.evaluate(()=>{const first=window.metricFixture.calls.find(call=>new URL(call.url).hostname==='api.tzkt.io');if(!first)throw new Error('Missing actual first metric request');return first.monotonic+59000-performance.now();});expect(until59).toBeGreaterThan(0);await page.clock.runFor(until59);await info.attach('metric-cooldown-after-advance',{body:JSON.stringify(await page.evaluate(()=>({now:performance.now(),first:window.metricFixture.calls.find(call=>new URL(call.url).hostname==='api.tzkt.io')?.monotonic,status:document.querySelector('.mainnet .interval-status')?.textContent}))),contentType:'application/json'});await expect(refresh).toBeDisabled();expect(await calls(page)).toBe(5);await page.clock.runFor(1000);await page.clock.resume();await expect(refresh).toBeEnabled();expect(await calls(page)).toBe(5);
 await page.evaluate(()=>{window.metricFixture.mode='hold';});await refresh.click();await expect(region).toContainText('Refreshing block intervals');await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);
 await query.evaluate(node=>(node as HTMLElement).focus({preventScroll:true}));await settleReader(page);const scroll=await page.evaluate(()=>scrollY),before=await calls(page);
 await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Resume',exact:true}).click();await expect(region).toContainText('Stale retained evidence');expect(await calls(page)).toBe(before);
 await query.evaluate(node=>(node as HTMLElement).focus({preventScroll:true}));await settleReader(page);const retainedScroll=await page.evaluate(()=>scrollY);await page.evaluate(()=>{window.metricFixture.mode='valid';window.metricFixture.release?.();});await settleReader(page);
 expect(await calls(page)).toBe(before);await expect(query).toBeFocused();await expect(query).toHaveValue('Baker');await expect(region.locator('details')).toHaveAttribute('open','');await expect(panel.locator('.session-mode')).toContainText('Pinned');expect(Math.abs(await page.evaluate(()=>scrollY)-retainedScroll)).toBeLessThanOrEqual(1);expect(Number.isFinite(scroll)).toBe(true);
 await page.clock.runFor(60000);await refresh.click();await expect(region).toContainText('As-of evidence');await expect(region).not.toContainText('Stale retained evidence');
 const after=await calls(page),asof=await region.locator('.interval-note').textContent();await page.clock.runFor(119999);await expect(region).not.toContainText('Stale retained evidence');await page.clock.runFor(1);await expect(region).toContainText('Stale retained evidence');expect(await calls(page)).toBe(after);
 await page.clock.setFixedTime(new Date('2026-01-01T00:00:00Z'));await page.clock.runFor(1000);await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);expect(await region.locator('.interval-note').textContent()).toBe(asof);await expect(region).toContainText('selected indexed-endpoint age');
 await page.clock.setFixedTime(new Date('2026-10-15T12:10:00Z'));const priorShad=await calls(page,'shadownet');await page.locator('.network-tab.shadownet').click();await expect.poll(()=>calls(page,'shadownet')).toBe(priorShad+5);await expect(page.locator('.shadownet .block-intervals').getByRole('button',{name:'Refresh block intervals for Shadownet',exact:true})).toBeDisabled();expect(await calls(page)).toBe(after);
 info.annotations.push({type:'block-interval-verified',description:'reader-contract'});
});

for(const mode of ['partial','insufficient','window-failure','failure'] as const)test(`block intervals production states ${mode}`,async({page},info)=>{
 await metricFixture(page,mode);await prepare(page,false);const region=page.locator('.mainnet .block-intervals');
 if(mode==='partial'){await expect(region).toContainText('Partial available history');expect(await calls(page)).toBe(6);await expect(region.locator('.interval-mean')).toHaveText(['1807.00 s','1807.00 s','906.00 s']);await expect(region).toContainText('7,228 s actual coverage');}
 else if(mode==='insufficient'){await expect(region.locator('.interval-mean')).toHaveText(['Insufficient data','Insufficient data','Insufficient data']);await expect(region).toContainText('at or before this cutoff');await expect(region).toContainText('selected indexed-endpoint age');await expect(region).toContainText('fetch age 0s');}
 else if(mode==='window-failure'){await expect(region.locator('.interval-mean')).toHaveText(['Unavailable','3601.00 s','906.00 s']);expect(await calls(page)).toBe(5);}
 else {await expect(region).toContainText('Unavailable · TzKT history HTTP 503');await expect(region.locator('.interval-mean')).toHaveText(['—','—','—']);expect(await calls(page)).toBe(1);}
 await region.locator('summary').click();await expect(region.locator('details')).toHaveAttribute('open','');if(mode!=='failure')await expect(region.locator('.interval-evidence')).toContainText('IndexedEnd104');
 info.annotations.push({type:'block-interval-verified',description:`state-${mode}`});
});

test('block intervals production shared failure retains attributed stale values without changing chain health',async({page},info)=>{
 await metricFixture(page);await prepare(page,false);const panel=page.locator('.network-panel.mainnet'),region=panel.locator('.block-intervals');await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);
 const original=await region.locator('.interval-note').textContent();await page.clock.runFor(60000);const health=await panel.getAttribute('data-status');await page.evaluate(()=>{window.metricFixture.mode='failure';});await region.getByRole('button',{name:'Refresh block intervals for Mainnet',exact:true}).click();await expect(region).toContainText('Stale retained evidence');await expect(region).toContainText('TzKT history HTTP 503');await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);expect(await region.locator('.interval-note').textContent()).toBe(original);expect(await panel.getAttribute('data-status')).toBe(health);
 info.annotations.push({type:'block-interval-verified',description:'retained-failure'});
});

test('block intervals production initially hidden and manual pause survive BFCache without incidental reads',async({page},info)=>{
 await metricFixture(page);await prepare(page,false,undefined,100,true);const region=page.locator('.mainnet .block-intervals');expect(await calls(page)).toBe(0);await expect(region).toContainText('Not yet collected');await page.getByRole('button',{name:'Pause',exact:true}).click();await page.evaluate(()=>{window.mockHidden=false;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});expect(await calls(page)).toBe(0);await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Resume',exact:true}).click();await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);const before=await calls(page);await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await expect(region).toContainText('Stale retained evidence');await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));expect(await calls(page)).toBe(before);await page.clock.runFor(60000);expect(await calls(page)).toBe(before);
 info.annotations.push({type:'block-interval-verified',description:'hidden-bfcache'});
});

test('block intervals accepted current applied forward proof triggers after cooldown and does not fence an active span',async({page},info)=>{
 await metricFixture(page);const initial={...head(100),timestamp:'2026-10-15T12:00:00Z'};await prepare(page,false,initial);const panel=page.locator('.network-panel.mainnet'),region=panel.locator('.block-intervals');await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);
 await page.clock.runFor(60000);const next={...head(101),timestamp:'2026-10-15T12:00:06Z',predecessor:initial.hash};await send(page,'mainnet-head',next);await expect.poll(()=>calls(page)).toBe(10);await expect(region).not.toContainText('Stale retained evidence');await send(page,'mainnet-head',next);await settleReader(page);expect(await calls(page)).toBe(10);
 await page.clock.runFor(60000);await page.evaluate(()=>{window.metricFixture.mode='hold';});await region.getByRole('button',{name:'Refresh block intervals for Mainnet',exact:true}).click();await expect(region).toContainText('Refreshing block intervals');
 const following={...head(102),timestamp:'2026-10-15T12:00:12Z',predecessor:next.hash};await send(page,'mainnet-head',following);await expect(panel.locator('.applied-context')).toContainText('level 102 · round 0');await expect(region).not.toContainText('Stale retained evidence');await expect(region).toContainText('Refreshing block intervals');expect(await calls(page)).toBe(11);
 await page.evaluate(()=>{window.metricFixture.mode='valid';window.metricFixture.release?.();});await expect(region).not.toContainText('Refreshing block intervals');await expect.poll(()=>calls(page)).toBe(15);await expect(region).not.toContainText('Stale retained evidence');
 info.annotations.push({type:'block-interval-verified',description:'applied-forward'});
});

test('block intervals unqualified raw applied replacement cannot fence a pending indexed span',async({page},info)=>{
 await metricFixture(page);const initial={...head(100),timestamp:'2026-10-15T12:00:00Z'};await prepare(page,false,initial);const panel=page.locator('.network-panel.mainnet'),region=panel.locator('.block-intervals');await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);
 await page.clock.runFor(60000);await page.evaluate(()=>{window.metricFixture.mode='hold';});await region.getByRole('button',{name:'Refresh block intervals for Mainnet',exact:true}).click();await expect(region).toContainText('Refreshing block intervals');
 const raw={...initial,hash:'UnqualifiedRawReplacement100',fitness:[...initial.fitness.slice(0,4),'00000001'],timestamp:'2026-10-15T12:00:06Z'};await page.route('**/blocks/UnqualifiedRawReplacement100/header',route=>route.fulfill({status:503,body:'Observer proof unavailable'}));
 const rejected=page.waitForResponse(response=>response.url().includes('/blocks/UnqualifiedRawReplacement100/header')&&response.status()===503);await send(page,'mainnet-head',raw);await rejected;await settleReader(page);await expect(panel.locator('.applied-context')).toContainText('level 100 · round 1');await expect(region).not.toContainText('Stale retained evidence');
 await page.evaluate(()=>{window.metricFixture.mode='valid';window.metricFixture.release?.();});await expect(region).not.toContainText('Refreshing block intervals');await expect(region).not.toContainText('Stale retained evidence');expect(await calls(page)).toBe(10);
 info.annotations.push({type:'block-interval-verified',description:'unqualified-applied'});
});


test('independent production: accepted same-level applied replacement fences a matching-E refresh',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-10-15T12:00:30Z')});
 await page.addInitScript(()=>{
  const original=window.fetch.bind(window);const state={hold:false,calls:[] as string[],release:undefined as (()=>void)|undefined};
  (window as unknown as {reviewMetric:typeof state}).reviewMetric=state;
  window.fetch=async(input,options)=>{
   const u=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
   if(!u.hostname.startsWith('api.')||u.pathname!=='/v1/blocks')return original(input,options);
   state.calls.push(u.href);const E={level:104,hash:'E',timestamp:'2026-10-15T12:00:28Z'};
   if(state.hold&&u.hostname==='api.tzkt.io'&&u.searchParams.has('level'))return new Promise<Response>(resolve=>{state.release=()=>resolve(Response.json([E]));});
   const c=u.searchParams.get('timestamp.le');return Response.json([u.searchParams.has('level')||!u.searchParams.has('level.le')?E:c?.startsWith('2026-10-08')?{level:20,hash:'W',timestamp:'2026-10-08T12:00:04Z'}:c?.startsWith('2026-10-14')?{level:80,hash:'D',timestamp:'2026-10-14T12:00:04Z'}:{level:100,hash:'H',timestamp:'2026-10-15T11:00:04Z'}]);
  };
 });
 const initial={...head(100),timestamp:'2026-10-15T12:00:00Z'};await prepare(page,false,initial);
 const region=page.locator('.mainnet .block-intervals');await expect(region.locator('.interval-mean')).toHaveText(['7200.29 s','3601.00 s','906.00 s']);
 await page.clock.runFor(60000);await page.evaluate(()=>{(window as unknown as {reviewMetric:{hold:boolean}}).reviewMetric.hold=true;});
 await region.getByRole('button',{name:'Refresh block intervals for Mainnet',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>typeof (window as unknown as {reviewMetric:{release?:()=>void}}).reviewMetric.release)).toBe('function');
 const replacement={...initial,hash:'IndependentAppliedRoundReplacement',fitness:[...initial.fitness.slice(0,4),'00000001'],timestamp:'2026-10-15T12:00:06Z'};
 await send(page,'mainnet-head',replacement);
 await expect(page.locator('.network-panel.mainnet')).toContainText('Observed same-level round advance');
 await expect(page.locator('.mainnet .applied-context')).toContainText('level 100 · round 1');
 await info.attach('accepted-applied-and-metric-status',{body:JSON.stringify({applied:await page.locator('.mainnet .applied-context').textContent(),metric:await region.locator('.interval-status').textContent(),errors}),contentType:'application/json'});
 expect(errors).toEqual([]);
 await expect.soft(region).toContainText('Stale retained evidence');
 await page.evaluate(()=>{(window as unknown as {reviewMetric:{release?:()=>void}}).reviewMetric.release?.();});
 await expect(region).not.toContainText('Refreshing block intervals');
 await info.attach('after-matching-E-release',{body:JSON.stringify({metric:await region.locator('.interval-status').textContent(),errors}),contentType:'application/json'});
 await expect(region).toContainText('Stale retained evidence');
 info.annotations.push({type:'block-interval-verified',description:'applied-reorg'});
});

const metricVisualStates=['metric-values','metric-partial','metric-insufficient','metric-window-unavailable','metric-no-prior-unavailable','metric-loading','metric-refreshing-retained','metric-stale-retained','metric-whole-failure-retained','metric-long-details','metric-prohibited-not-collected'] as const;
for(const state of metricVisualStates)test(`metric visual matrix ${state}`,async({page},info)=>{
 test.setTimeout(180000);
 const mode:MetricMode=state==='metric-partial'?'partial':state==='metric-insufficient'?'insufficient':state==='metric-window-unavailable'?'window-failure':state==='metric-no-prior-unavailable'?'failure':state==='metric-loading'?'hold':'valid';
 await metricFixture(page,mode);await prepare(page,false,undefined,100,state==='metric-prohibited-not-collected');
 const region=page.locator('.mainnet .block-intervals');await expect(region).toBeVisible();
 if(state==='metric-prohibited-not-collected'){expect(await calls(page)).toBe(0);await expect(region).toContainText('Not yet collected');}
 else if(state==='metric-loading')await expect(region).toContainText('Loading');
 else if(state==='metric-no-prior-unavailable')await expect(region).toContainText('HTTP 503');
 else if(state==='metric-partial')await expect(region).toContainText('Partial available history');
 else if(state==='metric-insufficient')await expect(region).toContainText('Insufficient data');
 else if(state==='metric-window-unavailable')await expect(means(page)).toHaveText(['Unavailable','3601.00 s','906.00 s']);
 else await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);
 if(state==='metric-refreshing-retained'||state==='metric-whole-failure-retained'){
  await page.clock.runFor(60000);const nextMode:MetricMode=state==='metric-refreshing-retained'?'hold':'failure';await page.evaluate((mode:MetricMode)=>{window.metricFixture.mode=mode;},nextMode);await region.getByRole('button',{name:'Refresh block intervals for Mainnet',exact:true}).click();await expect(region).toContainText(state==='metric-refreshing-retained'?'Refreshing block intervals':'HTTP 503');
 }
 if(state==='metric-stale-retained'){await page.getByRole('button',{name:'Pause',exact:true}).click();await expect(region).toContainText('Stale retained evidence');}
 if(state==='metric-long-details'){await region.locator('summary').click();await expect(region.locator('details')).toHaveAttribute('open','');await expect(region.locator('.interval-evidence')).toContainText('IndexedEnd104');}
 // Freeze elapsed acquisition time while measuring the same established state in every cell.
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+50));
 const directory=process.env['V3_EVIDENCE_DIR']??info.outputPath('matrix');await mkdir(directory,{recursive:true});
 await captureMatrix(page,info,state,async current=>{
  const metric=await metricObservation(current);
  expect(metric.rows).toHaveLength(3);expect(metric.sourceHref).toBe('https://api.tzkt.io/v1/blocks');expect(metric.sourceText).toBe('TzKT-reported indexed spans');expect(metric.bounds.width).toBeGreaterThan(0);expect(metric.bounds.x).toBeGreaterThanOrEqual(-1);expect(metric.bounds.right).toBeLessThanOrEqual((current.viewportSize()?.width??0)+1);
  for(const row of metric.rows){expect(row.label).toBeTruthy();expect(row.mean).toBeTruthy();expect(row.bounds.width).toBeGreaterThan(0);expect(row.bounds.right).toBeLessThanOrEqual(metric.bounds.right+1);}
  for(const text of metric.typography)expect(text.size,`${state} ${text.selector}`).toBeGreaterThanOrEqual(text.selector==='interval-evidence'?12:14);
  expect(metric.refresh.bounds.width).toBeGreaterThanOrEqual(44);expect(metric.refresh.bounds.height).toBeGreaterThanOrEqual(44);expect(metric.details.open).toBe(state==='metric-long-details');expect(metric.details.summaryBounds?.height).toBeGreaterThanOrEqual(24);
  const viewport=current.viewportSize(),theme=await current.locator('html').getAttribute('data-theme');
  await writeFile(join(directory,`${info.project.name}-${viewport?.width}x${viewport?.height}-${theme}-${state}.metric.json`),JSON.stringify({namespace:'observatory-block-intervals',state,engine:info.project.name,viewport,theme,metric},null,2));
 });
 // Reuse the actual parent measurement's names and shared fingerprints. Old49c captures
 // remain explicitly development preflight; never manufacture final binding metadata.
 for(const name of await readdir(directory)){
  if(!name.startsWith(`${info.project.name}-`)||!name.endsWith(`-${state}.json`))continue;
  const parent:Record<string,unknown>=JSON.parse(await readFile(join(directory,name),'utf8')),sidecar=name.replace(/\.json$/,'.metric.json');
  const record:Record<string,unknown>=JSON.parse(await readFile(join(directory,sidecar),'utf8'));
  Object.assign(record,{parentMeasurement:name,screenshot:parent['screenshot'],screenshotSha256:parent['screenshotSha256']??null,sourceCombined:parent['sourceCombined']??null,contractCombined:parent['contractCombined']??null,productionCombined:parent['productionCombined']??null,developmentPreflight:!parent['productionCombined']});
  await writeFile(join(directory,sidecar),JSON.stringify(record,null,2));
 }
});


for(const systemTheme of ['light','dark'] as const)test(`metric additional surface system ${systemTheme}`,async({page},info)=>{
 await page.emulateMedia({colorScheme:systemTheme});await metricFixture(page);await prepare(page,false);await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);await choose(page.getByLabel('Appearance'),'system');await expect(page.locator('html')).toHaveAttribute('data-theme',systemTheme);await captureMetricSurface(page,info,`metric-system-${systemTheme}`,{systemTheme});
});
for(const storageCase of ['missing','corrupt','denied'] as const)test(`metric additional surface storage ${storageCase}`,async({page},info)=>{
 await page.addInitScript(kind=>{if(kind==='denied'){Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}});}else{localStorage.clear();if(kind==='corrupt')localStorage.setItem('observatory:theme','invalid-theme');}},storageCase);
 await metricFixture(page);await prepare(page,false);await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);
 for(const theme of ['light','dark']){await choose(page.getByLabel('Appearance'),theme);await expect(page.locator('html')).toHaveAttribute('data-theme',theme);await captureMetricSurface(page,info,`metric-storage-${storageCase}`,{storageCase,appearanceUsable:true});}
});
test('metric additional native controls and reader preservation surfaces',async({page},info)=>{
 test.setTimeout(120000);await metricFixture(page);await prepare(page,false);await expect(means(page)).toHaveText(['7200.29 s','3601.00 s','906.00 s']);
 const region=page.locator('.mainnet .block-intervals'),refresh=region.getByRole('button',{name:'Refresh block intervals for Mainnet',exact:true}),query=page.getByRole('searchbox',{name:'Search committee alias or address'}).first();
 for(const theme of ['light','dark']){
  await choose(page.getByLabel('Appearance'),theme);await page.clock.runFor(60000);await expect(refresh).toBeEnabled();const before=await calls(page);await refresh.focus();await page.keyboard.press('Space');await expect.poll(()=>calls(page)).toBe(before+5);await expect(refresh).toBeDisabled();await captureMetricSurface(page,info,'metric-refresh-disabled');
  await page.clock.runFor(60000);await expect(refresh).toBeEnabled();await refresh.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await expect(refresh).toBeFocused();
  await captureMetricSurface(page,info,'metric-refresh-focus',{keyboardActivationRequests:5});
  await region.locator('summary').click();await expect(region.locator('details')).toHaveAttribute('open','');await captureMetricSurface(page,info,'metric-details-open');
  await send(page,'mainnet-operations',[vote(0)]);await page.locator('.mainnet').getByRole('button',{name:'Pin selected instance',exact:true}).click();await query.fill('Baker');await page.evaluate(()=>{window.metricFixture.mode='hold';});const explicitReads=await calls(page);await refresh.click();await expect(region).toContainText('Refreshing block intervals');await query.evaluate(node=>(node as HTMLElement).focus({preventScroll:true}));await settleReader(page);const scroll=await page.evaluate(()=>scrollY),requests=await calls(page),mode=await page.locator('.mainnet .session-mode').textContent(),beforeTransforms=await page.locator('.mainnet .navigator-junction').evaluate(node=>({transform:getComputedStyle(node).transform,animations:node.getAnimations().length}));
  await page.evaluate(()=>{window.metricFixture.mode='valid';window.metricFixture.release?.();});await expect.poll(()=>calls(page)).toBe(explicitReads+5);await expect(region).toContainText('As-of evidence');await page.clock.runFor(1000);await expect(query).toBeFocused();await expect(query).toHaveValue('Baker');await expect(region.locator('details')).toHaveAttribute('open','');expect(requests).toBe(explicitReads+1);expect(await calls(page)).toBe(explicitReads+5);expect(await page.locator('.mainnet .session-mode').textContent()).toBe(mode);expect(Math.abs(await page.evaluate(()=>scrollY)-scroll)).toBeLessThanOrEqual(1);expect(await page.locator('.mainnet .navigator-junction').evaluate(node=>({transform:getComputedStyle(node).transform,animations:node.getAnimations().length}))).toEqual(beforeTransforms);
  await captureMetricSurface(page,info,'metric-reader-preservation',{readerPreservation:{focus:true,pin:true,scroll:true,disclosure:true,search:true,noIncidentalReads:true,noMetricMotion:true}});await region.locator('summary').click();await query.fill('');
 }
});
