import {expect,test} from '@playwright/test';
import {head,prepare,selectNetwork,send,vote} from './productionFixture';

for(const width of [1440,390])test(`committee head transition stays anchored and restores current table at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});
 await prepare(page,false,head(100),100,false,false,{total:7000,quorum:4667,powers:Array.from({length:25},()=>280)});
 await selectNetwork(page,'shadownet');
 const panel=page.locator('.network-panel.shadownet'),committee=panel.locator('.committee-evidence'),viewport=committee.locator('.delegate-scroll');
 const packets=Array.from({length:256},(_,index)=>({...vote(index%25),hash:`transition-receipt-${index}`}));
 await send(page,'shadownet-operations',packets);
 await expect(panel.locator('.pre .gauge-exact')).toHaveText('7,000 / 7,000');
 await expect(committee.locator('tbody tr')).toHaveCount(25);
 await viewport.evaluate(element=>{element.scrollTop=200;});
 const before=await viewport.evaluate(element=>({top:element.scrollTop,width:element.getBoundingClientRect().width,height:element.getBoundingClientRect().height,committeeHeight:element.closest('.committee-evidence')!.getBoundingClientRect().height,sourceY:element.closest('.network-panel')!.querySelector('.source-pane')!.getBoundingClientRect().top+scrollY,regions:[...element.closest('.network-panel')!.querySelectorAll('.observer-summary,.session-controls,.opportunities,.selected-inspector,.selected-relationship,.selected-kind,.selected-payload,.proposal-context,.network-notice,.missing-section,.missing-section>details,.consensus-section,.session-rail,.retained-history,.recent-consensus,.block-intervals,.gauges>*,.observer-summary>*,.consensus-section>*')].map(node=>({name:node.className,height:node.getBoundingClientRect().height,text:node.textContent?.slice(0,120)}))}));
 let release:()=>void=()=>undefined,waiting=0;const held=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/helpers/attestation_rights?*',async route=>{
  if(new URL(route.request().url()).pathname.includes('/BBlock101/')){waiting++;await held;}
  await route.fallback();
 });
 await send(page,'shadownet-head',head(101));
 await expect.poll(()=>waiting).toBeGreaterThan(0);
 await expect(committee.locator(':scope > summary')).toContainText('unavailable');
 const frames=await committee.evaluate(async element=>{
  const frames:{unknownTag:string|undefined;unknownCharacters:number;unknownHeight:number;tableHidden:boolean;height:number;viewportHeight:number;sourceY:number;regions:{name:string;height:number}[]}[]=[];
  for(let frame=0;frame<5;frame++){
   await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
   const unknown=element.querySelector('.committee-unknown'),table=element.querySelector<HTMLElement>('.delegate-scroll');
   frames.push({unknownTag:unknown?.tagName,unknownCharacters:unknown?.textContent?.length??0,unknownHeight:unknown?.getBoundingClientRect().height??0,tableHidden:table?.hidden??false,height:element.getBoundingClientRect().height,viewportHeight:table?.getBoundingClientRect().height??0,sourceY:element.closest('.network-panel')!.querySelector('.source-pane')!.getBoundingClientRect().top+scrollY,regions:[...element.closest('.network-panel')!.querySelectorAll('.observer-summary,.session-controls,.opportunities,.selected-inspector,.selected-relationship,.selected-kind,.selected-payload,.proposal-context,.network-notice,.missing-section,.missing-section>details,.consensus-section,.session-rail,.retained-history,.recent-consensus,.block-intervals,.gauges>*,.observer-summary>*,.consensus-section>*')].map(node=>({name:node.className,height:node.getBoundingClientRect().height,text:node.textContent?.slice(0,120)}))});
  }
  return frames;
 });
 await info.attach('actual-unproven-committee-transition',{body:JSON.stringify({before,frames}),contentType:'application/json'});
 const unknown=committee.locator('.committee-unknown');
 await expect(unknown).toHaveJSProperty('tagName','DETAILS');
 await expect(unknown).not.toHaveAttribute('open','');
 expect(Math.max(...frames.map(frame=>frame.unknownHeight))).toBeLessThanOrEqual(56);
 await expect(unknown.locator('summary')).toContainText('Unknown-rights observations · 256');
 expect(frames.every(frame=>!frame.tableHidden&&frame.viewportHeight===before.height)).toBe(true);
 expect(frames.every(frame=>Math.abs(frame.sourceY-before.sourceY)<1&&Math.abs(frame.height-before.committeeHeight)<1)).toBe(true);
 await expect(committee.locator('tbody tr')).toHaveCount(0);
 await expect(viewport).toContainText('Rights or observations unavailable.');
 await expect(unknown.locator('li')).toHaveCount(0);
 const requests=await page.evaluate(()=>window.mockRequests.length);
 await unknown.locator('summary').click();
 await expect(unknown.locator('li')).toHaveCount(100);
 await expect(unknown).toContainText('Showing 100 of 256');
 await expect(unknown).toContainText('transition-receipt-0');
 await expect(unknown).toContainText('https://rpc.shadownet.teztnets.com');
 expect(await unknown.locator('.unknown-observations-scroll').evaluate(element=>element.getBoundingClientRect().height)).toBeLessThanOrEqual(240);
 expect(await page.evaluate(()=>window.mockRequests.length)).toBe(requests);
 const search=committee.getByRole('searchbox',{name:'Search committee alias or address'});await search.fill('Baker');await search.focus();
 const openSourceY=await committee.evaluate(element=>element.closest('.network-panel')!.querySelector('.source-pane')!.getBoundingClientRect().top+scrollY);
 release();
 await expect(committee.locator('tbody tr')).toHaveCount(25);
 await expect(search).toBeFocused();await expect(search).toHaveValue('Baker');
 const after=await viewport.evaluate(element=>({top:element.scrollTop,width:element.getBoundingClientRect().width,height:element.getBoundingClientRect().height}));
 expect(Math.abs(after.top-before.top)).toBeLessThan(1);expect(after.width).toBe(before.width);expect(after.height).toBe(before.height);
 await expect(unknown.locator('li')).toHaveCount(0);
 expect(await committee.evaluate(element=>element.closest('.network-panel')!.querySelector('.source-pane')!.getBoundingClientRect().top+scrollY)).toBe(openSourceY);
 await expect(committee.locator('tbody')).not.toContainText('unknown power');
});
