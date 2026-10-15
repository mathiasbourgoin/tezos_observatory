import {expect,type Page,type TestInfo} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {captureMatrix,binding} from './v3Evidence';
export type MetricMode='valid'|'partial'|'insufficient'|'window-failure'|'failure'|'hold';
declare global {interface Window {metricFixture:{mode:MetricMode;calls:{url:string;aborted:boolean;credentials:string;cache:string;redirect:string;monotonic:number}[];release:(()=>void)|undefined}}}
export async function metricFixture(page:Page,mode:MetricMode='valid'):Promise<void>{
 await page.clock.install({time:new Date('2026-10-15T12:00:30Z')});
 await page.addInitScript(initialMode=>{
  const original=window.fetch.bind(window),state={mode:initialMode,calls:[] as Window['metricFixture']['calls'],release:undefined as (()=>void)|undefined};
  window.metricFixture=state;
  window.fetch=async(input,options)=>{
   const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
   if(!url.hostname.startsWith('api.')||url.pathname!=='/v1/blocks')return original(input,options);
   const entry={monotonic:performance.now(),url:url.href,aborted:options?.signal?.aborted??false,credentials:options?.credentials??'',cache:options?.cache??'',redirect:options?.redirect??''};state.calls.push(entry);options?.signal?.addEventListener('abort',()=>{entry.aborted=true;},{once:true});
   const end={level:104,hash:'IndexedEnd104',timestamp:state.mode==='insufficient'?'2026-10-01T12:00:28Z':'2026-10-15T12:00:28Z'},cutoff=url.searchParams.get('timestamp.le');
   const initial=!url.searchParams.has('level.le')&&!url.searchParams.has('level');
   if(state.mode==='failure'&&initial)return new Response('TzKT history unavailable',{status:503});
   if(state.mode==='hold'&&initial&&url.hostname==='api.tzkt.io')return new Promise<Response>(resolve=>{state.release=()=>resolve(Response.json([end]));});
   const week=cutoff?.startsWith('2026-10-08T'),day=cutoff?.startsWith('2026-10-14T');
   if(state.mode==='partial'&&(week||day))return Response.json([]);
   if(state.mode==='window-failure'&&week)return Response.json([{level:'bad'}]);
   const row=url.searchParams.has('level')||initial?end:state.mode==='insufficient'?end:url.searchParams.get('sort.asc')==='level'?{level:100,hash:'Young100',timestamp:'2026-10-15T10:00:00Z'}:week?{level:20,hash:'Week20',timestamp:'2026-10-08T12:00:04Z'}:day?{level:80,hash:'Day80',timestamp:'2026-10-14T12:00:04Z'}:{level:100,hash:'Hour100',timestamp:'2026-10-15T11:00:04Z'};
   return Response.json([row],{headers:initial?{'Tzkt-Level':'250','Tzkt-Known-Level':'255','Tzkt-Synced-At':'2026-10-15T12:00:29Z'}:{'Tzkt-Level':'0','Tzkt-Known-Level':'999'}});
  };
 },mode);
}

export async function metricObservation(page:Page){
 return await page.locator('.mainnet .block-intervals').evaluate(node=>{
   const box=(element:Element)=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   const anchor=node.querySelector('a'),button=node.querySelector('button'),details=node.querySelector('details');if(!(anchor instanceof HTMLAnchorElement)||!(button instanceof HTMLButtonElement)||!(details instanceof HTMLDetailsElement))throw new Error('Missing native metric source/controls');
   const rows=[...node.querySelectorAll('.interval-window')].map(row=>({bounds:box(row),label:row.querySelector('h4')?.textContent,mean:row.querySelector('.interval-mean')?.textContent,coverage:row.querySelector('.interval-coverage')?.textContent,endpoints:row.querySelector('.interval-endpoints')?.textContent}));
   const typography=[...node.querySelectorAll('.interval-mean,.interval-coverage,.interval-endpoints,.interval-note,.interval-status,.interval-evidence')].filter(element=>element.getClientRects().length>0).map(element=>({selector:element.className,size:parseFloat(getComputedStyle(element).fontSize)}));
   return {bounds:box(node),rows,sourceHref:anchor.href,sourceText:anchor.textContent,status:node.querySelector('.interval-status')?.textContent,note:node.querySelector('.interval-note')?.textContent,refresh:{tag:button.tagName,disabled:button.disabled,focused:document.activeElement===button,bounds:box(button)},details:{tag:details.tagName,open:details.open,summary:details.querySelector('summary')?.textContent,summaryBounds:details.querySelector('summary')?box(details.querySelector('summary') as Element):null},evidenceText:node.querySelector('.interval-evidence')?.textContent,requestCount:window.metricFixture.calls.filter(call=>new URL(call.url).hostname==='api.tzkt.io').length,typography};
  });
}

export async function captureMetricSurface(page:Page,info:TestInfo,surface:string,native:Record<string,unknown>={},preserveViewport=false){
 const theme=await page.locator('html').getAttribute('data-theme');if(theme!=='light'&&theme!=='dark')throw new Error('Missing actual theme');
 const viewport=preserveViewport?await page.evaluate(()=>({width:innerWidth,height:innerHeight})):page.viewportSize();if(!viewport)throw new Error('Missing viewport');
 const directory=process.env['V3_EVIDENCE_DIR']??info.outputPath('matrix');await mkdir(directory,{recursive:true});
 const observed=await metricObservation(page),metric={...observed,refresh:{...observed.refresh,keyboardOperated:surface==='metric-refresh-focus'&&native['keyboardActivationRequests']===5}};await captureMatrix(page,info,metric.details.open?'metric-long-details':'metric-values',undefined,{theme,preserveViewport,name:surface});
 const stem=`${info.project.name}-${viewport.width}x${viewport.height}-${theme}-${surface}`,parent=JSON.parse(await readFile(join(directory,`${stem}.json`),'utf8'));
 const record={namespace:'observatory-block-intervals',state:metric.details.open?'metric-long-details':'metric-values',surface,engine:info.project.name,viewport,theme,metric,native,parentMeasurement:`${stem}.json`,screenshot:parent.screenshot,screenshotSha256:parent.screenshotSha256,sourceCombined:parent.sourceCombined,contractCombined:parent.contractCombined,productionCombined:parent.productionCombined};
 await writeFile(join(directory,`${stem}.metric.json`),JSON.stringify(record,null,2));
 const consumer:unknown=await import(new URL('../../scripts/check-observatory-block-intervals.mjs',import.meta.url).href);if(!consumer||typeof consumer!=='object'||!('validateMetricObservation' in consumer)||typeof consumer.validateMetricObservation!=='function')throw new Error('Metric observable consumer unavailable');expect(consumer.validateMetricObservation(record,parent,binding).code).toBe(0);
 expect(metric.rows).toHaveLength(3);
}
