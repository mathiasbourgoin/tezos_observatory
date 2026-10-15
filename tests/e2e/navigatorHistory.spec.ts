import {expect,test} from '@playwright/test';
import {head,prepare,selectNetwork,send,vote,headers,attachFailureTrace,inspectionModule} from './productionFixture';
test.use({video:{mode:'on',size:{width:960,height:720}}});
test.afterEach(async({page},info)=>attachFailureTrace(page,info));

for(const width of [1440,390])test(`Observed path retains colored cards and supports mixed two-dimensional camera navigation at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value:string)=>Object.assign(window,{copiedPathHash:value})}}));
 await prepare(page,false,head(),100,false,false,{total:5,quorum:4,powers:[1,1,1,1,1]});await selectNetwork(page,'shadownet');
 const panel=page.locator('.network-panel.shadownet'),scene=panel.locator('.navigator-junction'),current=panel.locator('.navigator-current'),past=panel.locator('.navigator-path-card');
 const first={...head(101),hash:'Path101R0'},round={...head(101,1),hash:'Path101R1'},next={...head(102),hash:'Path102',predecessor:round.hash},later={...head(103),hash:'Path103',predecessor:next.hash};
 next.fitness[3]='fffffffe'; // Immutable candidate fitness already records its actual round-1 parent.
 for(const header of [first,round,next,later])headers.get(page)!.set(header.hash,header);
 await send(page,'shadownet-proposals',{chain_id:'NetFixture',hash:first.hash,header:first});
 const pre=Array.from({length:5},(_,slot)=>vote(slot)),att=pre.map((operation,slot)=>({...operation,hash:`path-att-${slot}`,contents:operation.contents.map(content=>({...content,kind:'attestation'}))}));
 await send(page,'shadownet-operations',[...pre,...att]);
 await expect(current.locator('.path-phase-summary')).toContainText('pre 5/5 · att 5/5');
 const original={hash:await current.locator('.address-text').getAttribute('title'),phases:await current.locator('.path-phase-summary').textContent(),fill:await current.evaluate(node=>[(node as HTMLElement).style.getPropertyValue('--path-pre'),(node as HTMLElement).style.getPropertyValue('--path-att')])};
 expect(original.hash).toBe(first.hash);expect(original.fill).toEqual(['100%','100%']);
 await send(page,'shadownet-proposals',{chain_id:'NetFixture',hash:round.hash,header:round});await expect(scene).toHaveAttribute('data-direction','up');
 await expect.poll(()=>scene.evaluate(node=>node.getAnimations({subtree:true}).length)).toBe(0);
 const old=past.filter({has:page.locator('.branch-target',{hasText:'101 · r0'})});await expect(old).toHaveCount(1);
 const below=await old.boundingBox(),center=await current.boundingBox();expect(below&&center).toBeTruthy();if(!below||!center)throw new Error('Historical round geometry missing');expect(Math.abs(below.x-center.x)).toBeLessThan(1);expect(below.y).toBeGreaterThan(center.y+center.height);
 expect(await old.locator('.address-text').getAttribute('title')).toBe(original.hash);expect(await old.locator('.path-phase-summary').textContent()).toBe(original.phases);
 expect(await old.evaluate(node=>[(node as HTMLElement).style.getPropertyValue('--path-pre'),(node as HTMLElement).style.getPropertyValue('--path-att')])).toEqual(original.fill);
 await old.getByRole('button',{name:'Copy block hash',exact:true}).click();expect(await page.evaluate(()=>(window as unknown as {copiedPathHash:string}).copiedPathHash)).toBe(first.hash);
 await send(page,'shadownet-head',round);await send(page,'shadownet-proposals',{chain_id:'NetFixture',hash:next.hash,header:next});await expect(current).toContainText('102 · r0');
 await expect.poll(()=>scene.evaluate(node=>node.getAnimations({subtree:true}).length)).toBe(0);
 const roundCard=past.filter({has:page.locator('.branch-target',{hasText:'101 · r1'})}),left=await roundCard.boundingBox(),right=await current.boundingBox();expect(left&&right).toBeTruthy();if(!left||!right)throw new Error('Historical level geometry missing');expect(left.x+left.width).toBeLessThan(right.x);expect(Math.abs(left.y-right.y)).toBeLessThan(1);
 const requests=await page.evaluate(()=>window.mockRequests.length);
 await panel.getByRole('button',{name:'Pan path left',exact:true}).click();await panel.getByRole('button',{name:'Pan path down',exact:true}).click();
 expect(await page.evaluate(()=>window.mockRequests.length)).toBe(requests);await expect(scene).toHaveAttribute('data-camera-following','false');await expect(scene).toHaveAttribute('data-view-x','0');await expect(scene).toHaveAttribute('data-view-y','0');
 await expect(panel.locator('.session-mode')).toContainText('Following live');
 const reader=await old.boundingBox(),frame=await scene.boundingBox(),scroll=await page.evaluate(()=>scrollY),height=await page.evaluate(()=>document.documentElement.scrollHeight);
 await send(page,'shadownet-head',next);await send(page,'shadownet-proposals',{chain_id:'NetFixture',hash:later.hash,header:later});await expect(current).toContainText('103 · r0');
 await expect(scene).toHaveAttribute('data-view-x','0');await expect(scene).toHaveAttribute('data-view-y','0');const held=await old.boundingBox();expect(held&&reader).toBeTruthy();if(!held||!reader)throw new Error('Retained camera geometry missing');for(const key of ['x','y','width','height'] as const)expect(held[key]).toBeCloseTo(reader[key],3);expect(await scene.boundingBox()).toEqual(frame);expect(await page.evaluate(()=>scrollY)).toBe(scroll);expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBe(height);
 expect(await old.locator('.path-phase-summary').textContent()).toBe(original.phases);expect(await past.count()).toBeLessThanOrEqual(9);
 await scene.screenshot({path:info.outputPath('retained-colored-history.png')});
 const live=panel.getByRole('button',{name:'Return to live',exact:true});await live.click();await expect(live).toBeFocused();await expect(scene).toHaveAttribute('data-camera-following','true');await expect(scene).toHaveAttribute('data-view-x','2');await expect(scene).toHaveAttribute('data-view-y','-1');await expect(current).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 const futureBackgrounds=await panel.locator('.baker-opportunity').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).backgroundColor));expect(futureBackgrounds).toEqual(['rgba(0, 0, 0, 0)','rgba(0, 0, 0, 0)']);
 await info.attach('observed-path-camera',{body:JSON.stringify({original,below,center,left,right,reader,frame,scroll,height,futureBackgrounds}),contentType:'application/json'});
 await scene.screenshot({path:info.outputPath('retained-path.png')});
});

test('UI boundary: older same-position context refresh preserves the manual camera and uses only incoming phase facts',async({page},info)=>{
 await page.setViewportSize({width:1440,height:900});await prepare(page,false);await page.getByRole('button',{name:'Pause',exact:true}).click();await expect(page.getByRole('button',{name:'Resume',exact:true})).toBeVisible();
 const requests=await page.evaluate(()=>window.mockRequests.length);
 await page.evaluate(async path=>{
  const {createDashboard}=await import(path);document.querySelector<HTMLElement>('.consensus-app')!.hidden=true;
  const root=document.createElement('div');root.id='renderer-boundary';document.body.append(root);const callbacks:string[]=[],called=(name:string)=>()=>{callbacks.push(name);};
  const view=createDashboard(root,{onSelect:called('select'),onPin:called('pin'),onFollow:called('follow'),onLatest:called('latest'),onCompare:called('compare'),onRetry:called('retry'),onNetworkChange:called('network'),onPauseChange:called('pause'),onReconnect:called('reconnect'),onRefreshIntervals:called('intervals'),onReadEligibility:called('eligibility')});
  const session={mode:'follow' as const,frozen:false,newer:0,newerPartial:false,canPin:true,accepted:3,unresolved:0,raw:0,instances:[]};
  const base:import('../../src/dashboardView').NetworkViewModel={status:'healthy',source:'Observer',sources:[{name:'Heads',url:'https://observer',status:'stream'}],session,appliedLevel:100,hash:'B100',preattestations:{power:4,total:5,count:4,expected:5,threshold:4}};
  const anchor:import('../../src/dashboardView').ObservedNavigatorView={identity:'first101',source:'https://observer',chain:'Net',protocol:'P',level:101,round:0,hash:'Known101',payload:'P101',contextHead:'B100',contextParent:'B100',coherent:true,receivedAt:Date.now(),receivedMonotonic:100};
  const round={...anchor,identity:'round101',round:1,hash:'Round101',receivedMonotonic:200};
  const next={...anchor,identity:'block102',level:102,hash:'Known102',payload:'P102',contextHead:'Round101',contextParent:'Round101',receivedMonotonic:300,predecessor:{hash:'Round101',level:101,round:1,parentHash:'B100',relation:'ancestry' as const}};
  Object.assign(window,{rendererBoundary:{view,base,anchor,round,next,callbacks}});view.update('mainnet',{...base,observation:anchor});
 },inspectionModule());
 const root=page.locator('#renderer-boundary'),panel=root.locator('.network-panel.mainnet'),scene=panel.locator('.navigator-junction'),current=panel.locator('.navigator-current');
 for(const key of ['round','next']){
  await page.evaluate(key=>{const data=(window as unknown as {rendererBoundary:{view:{update:(network:'mainnet',model:import('../../src/dashboardView').NetworkViewModel)=>void};base:import('../../src/dashboardView').NetworkViewModel;round:import('../../src/dashboardView').ObservedNavigatorView;next:import('../../src/dashboardView').ObservedNavigatorView}}).rendererBoundary;data.view.update('mainnet',{...data.base,observation:data[key as 'round'|'next']});},key);
  await expect.poll(()=>scene.evaluate(node=>node.getAnimations({subtree:true}).length)).toBe(0);
 }
 await panel.getByRole('button',{name:'Pan path left',exact:true}).click();await panel.getByRole('button',{name:'Pan path down',exact:true}).click();
 const before=await scene.evaluate(node=>({x:(node as HTMLElement).dataset.viewX,y:(node as HTMLElement).dataset.viewY,following:(node as HTMLElement).dataset.cameraFollowing,box:node.getBoundingClientRect().toJSON(),scrollLeft:node.scrollLeft,scrollTop:node.scrollTop}));
 await page.evaluate(()=>{const data=(window as unknown as {rendererBoundary:{view:{update:(network:'mainnet',model:import('../../src/dashboardView').NetworkViewModel)=>void};base:import('../../src/dashboardView').NetworkViewModel;next:import('../../src/dashboardView').ObservedNavigatorView}}).rendererBoundary;const {hash:oldHash,...votes}=data.next;if(!oldHash)throw new Error('Known initial identity missing');data.view.update('mainnet',{...data.base,observation:{...votes,identity:'older-context-votes102',payload:'OtherPayload',contextHead:'Other102',contextParent:'Other101',receivedMonotonic:250},preattestations:{power:1,total:5,count:1,expected:5},attestations:{power:2,total:5,count:2,expected:5}});});
 await expect(current).toContainText('Proposal hash unavailable');await expect(current.locator('.path-phase-summary')).toHaveText('pre 1/5 · att 2/5');
 expect(await current.evaluate(node=>[(node as HTMLElement).style.getPropertyValue('--path-pre'),(node as HTMLElement).style.getPropertyValue('--path-att')])).toEqual(['20%','40%']);
 const after=await scene.evaluate(node=>({x:(node as HTMLElement).dataset.viewX,y:(node as HTMLElement).dataset.viewY,following:(node as HTMLElement).dataset.cameraFollowing,box:node.getBoundingClientRect().toJSON(),scrollLeft:node.scrollLeft,scrollTop:node.scrollTop}));expect(after).toEqual(before);
 const old=panel.locator('.navigator-path-card').filter({has:page.locator('.branch-target',{hasText:'101 · r0'})});await expect(old.locator('.path-phase-summary')).toHaveText('pre 4/5 · att unknown');
 await scene.evaluate(node=>(node as HTMLElement).focus({preventScroll:true}));
 for(const key of ['ArrowLeft','ArrowDown'])await page.keyboard.press(key);await expect(scene).toHaveAttribute('data-view-x','-1');await expect(scene).toHaveAttribute('data-view-y','1');
 for(const key of ['ArrowRight','ArrowUp'])await page.keyboard.press(key);await expect(scene).toHaveAttribute('data-view-x','0');await expect(scene).toHaveAttribute('data-view-y','0');
 await scene.scrollIntoViewIfNeeded();const dragFrame=await scene.boundingBox(),dragScroll=await page.evaluate(()=>scrollY);if(!dragFrame)throw new Error('Draggable frame missing');
 await page.mouse.move(dragFrame.x+10,dragFrame.y+10);await page.mouse.down();await page.mouse.move(dragFrame.x+80,dragFrame.y+50,{steps:4});await page.mouse.up();
 const dragged=await scene.evaluate(node=>({x:Number((node as HTMLElement).dataset.viewX),y:Number((node as HTMLElement).dataset.viewY)}));expect(dragged.x).toBeLessThan(0);expect(dragged.y).toBeLessThan(0);await expect(scene).toBeFocused();expect(await scene.boundingBox()).toEqual(dragFrame);expect(await page.evaluate(()=>scrollY)).toBe(dragScroll);
 await page.keyboard.press('Home');await expect(scene).toHaveAttribute('data-camera-following','true');
 for(let tab=0;tab<12;tab++)await page.keyboard.press('Tab');expect(await scene.evaluate(node=>[node.scrollLeft,node.scrollTop])).toEqual([0,0]);
 const retained=await panel.locator('.path-camera-status').textContent();
 for(const mode of ['pin','follow'] as const){
  await page.evaluate(mode=>{const data=(window as unknown as {rendererBoundary:{view:{update:(network:'mainnet',model:import('../../src/dashboardView').NetworkViewModel)=>void};base:import('../../src/dashboardView').NetworkViewModel;next:import('../../src/dashboardView').ObservedNavigatorView}}).rendererBoundary;data.view.update('mainnet',{...data.base,session:{...data.base.session!,mode},observation:data.next});},mode);
  if(mode==='pin'){
   await expect(pastIn(panel)).toHaveCount(0);await panel.getByRole('button',{name:'Pan path right',exact:true}).click();await panel.getByRole('button',{name:'Return to anchor',exact:true}).click();
   await expect(scene).toHaveAttribute('data-view-x','0');await expect(scene).toHaveAttribute('data-view-y','0');
   const copy=current.getByRole('button',{name:'Copy block hash',exact:true});await expect(copy).toBeEnabled();await copy.evaluate(node=>(node as HTMLElement).focus({preventScroll:true}));await expect(copy).toBeFocused();expect(await current.evaluate(node=>(node as HTMLElement).inert)).toBe(false);
  }else{expect(await panel.locator('.path-camera-status').textContent()).toBe(retained);await expect(pastIn(panel).filter({has:page.locator('.branch-target',{hasText:'101 · r0'})}).locator('.path-phase-summary')).toHaveText('pre 4/5 · att unknown');}
 }
 expect(await page.evaluate(()=>(window as unknown as {rendererBoundary:{callbacks:string[]}}).rendererBoundary.callbacks)).toEqual([]);
 expect(await page.evaluate(()=>window.mockRequests.length)).toBe(requests);
 await info.attach('renderer-boundary-camera',{body:JSON.stringify({before,after}),contentType:'application/json'});
});

const pastIn=(panel:import('@playwright/test').Locator)=>panel.locator('.navigator-path-card');
