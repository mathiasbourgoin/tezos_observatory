import {expect,test,type Page} from '@playwright/test';
import {head,prepare,selectNetwork,send,vote,headers,attachFailureTrace} from './productionFixture';
test.use({video:{mode:'on',size:{width:960,height:720}}});
const errors=new WeakMap<Page,string[]>();
 test.beforeEach(async({page})=>{const found:string[]=[];errors.set(page,found);page.on('pageerror',error=>found.push(error.message));page.on('response',response=>{const url=new URL(response.url());if(url.hostname==='127.0.0.1'&&response.status()>=400&&/\.(?:ts|js|css)(?:$|\?)/.test(url.pathname))found.push(`${response.status()} ${url.pathname}`);});});
 test.afterEach(async({page},info)=>{await attachFailureTrace(page,info);expect(errors.get(page)??[]).toEqual([]);});

for(const width of [1440,390])for(const direction of ['up','right'] as const)for(const votesOnly of width===1440&&direction==='right'?[false,true]:[false])test(`Postdeploy actual ${direction} node travel stays inside a stationary frame and survives enrichment${width===390?' at 390px':''}${votesOnly?' from votes-only proof gaps':''}`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});await prepare(page,false);await selectNetwork(page,'shadownet');
 const panel=page.locator('.network-panel.shadownet'),scene=panel.locator('.navigator-junction');
 const first={...head(101,0),hash:'MotionFirst101',...(votesOnly?{payload_hash:'DifferentAppliedPayload101'}:{})},next=direction==='up'?{...head(101,1),hash:'MotionRound101'}:{...head(102,0),hash:'MotionNext102',predecessor:first.hash};
 for(const header of [first,next])headers.get(page)!.set(header.hash,header);
 if(votesOnly)await send(page,'shadownet-operations',[vote(0,101,0)]);else await send(page,'shadownet-proposals',{chain_id:'NetFixture',hash:first.hash,header:first});await expect(panel.locator('.navigator-current')).toContainText('101 · r0');
 const oldContent=await panel.locator('.navigator-current').textContent()??'';expect(oldContent).toContain('101 · r0');
 if(direction==='right'){
  if(votesOnly)await expect(panel.locator('.baker-opportunity').first().locator('.branch-critical')).toContainText('Conditional timer');
  const branchFacts=(text:string|null)=>text?.replace(/As of \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,'As of <clock>');
  const branches=branchFacts(await panel.locator('.baker-rows').textContent());await send(page,'shadownet-head',first);
  if(votesOnly){
   await expect(panel.locator('.candidate-evidence')).toContainText('Numerical authority unavailable');
   await expect(panel.locator('.pre .gauge-counts')).toContainText('Voting power unavailable');
   await expect(panel.locator('.navigator-status')).toContainText('awaiting current proof');
   expect(await panel.locator('.navigator-current').textContent()).toBe(oldContent);
   expect(branchFacts(await panel.locator('.baker-rows').textContent())).toBe(branches);
  }
 }
 await scene.scrollIntoViewIfNeeded();const focusControl=page.getByRole('button',{name:'Reconnect',exact:true});await focusControl.evaluate(node=>(node as HTMLElement).focus({preventScroll:true}));await expect(focusControl).toBeFocused();
 await page.evaluate(()=>{
  const scene=document.querySelector<HTMLElement>('.shadownet .navigator-junction')!,current=scene.querySelector<HTMLElement>('.navigator-current')!,stage=scene.querySelector<HTMLElement>('.navigator-stage')!,status=document.querySelector('.shadownet .navigator-status')!;
  const frames:{at:number;x:number;y:number;frameX:number;frameY:number;frameHeight:number;statusY:number;outgoing:string;ghosts:string[];incoming:string;status:string|null;active:number;duration:number;nodes:{name:string;x:number;y:number;width:number;height:number;text:string}[]}[]=[];Object.assign(window,{nodeTravelFrames:frames});
  const start=performance.now(),sample=()=>{const box=scene.getBoundingClientRect(),transform=new DOMMatrix(getComputedStyle(stage).transform),animation=stage.getAnimations()[0];frames.push({at:performance.now(),x:transform.m41,y:transform.m42,frameX:box.x,frameY:box.y,frameHeight:box.height,statusY:status.getBoundingClientRect().y,outgoing:[...scene.querySelectorAll('.navigator-motion-card')].map(node=>node.textContent).join(' '),ghosts:[...scene.querySelectorAll('.navigator-motion-card')].map(node=>node.textContent??''),incoming:current.textContent??'',status:status.textContent,active:scene.getAnimations({subtree:true}).length,duration:Number(animation?.effect?.getTiming().duration??0),nodes:[...stage.querySelectorAll<HTMLElement>(':scope > .navigator-previous,:scope > .navigator-current,:scope > .navigator-edge,:scope > .baker-rows > .baker-opportunity')].map(node=>{const rect=node.getBoundingClientRect();return {name:node.dataset.branch?`branch:${node.dataset.branch}`:node.className,x:rect.x,y:rect.y,width:rect.width,height:rect.height,text:node.textContent??''};})});if(performance.now()-start<2500)requestAnimationFrame(sample);};requestAnimationFrame(sample);
 });
 if(votesOnly)await send(page,'shadownet-operations',[vote(1,102,0)]);else await send(page,'shadownet-proposals',{chain_id:'NetFixture',hash:next.hash,header:next});await expect(scene).toHaveAttribute('data-direction',direction);
 if(votesOnly){
  await expect.poll(()=>scene.evaluate(node=>node.getAnimations({subtree:true}).length)).toBe(1);
  await scene.evaluate(node=>Object.assign(window,{pendingMotionAnimation:node.querySelector('.navigator-stage')!.getAnimations()[0]}));
  await send(page,'shadownet-head',next);
  await expect(panel.locator('.navigator-status')).toContainText('awaiting current proof');
  expect(await scene.evaluate(node=>node.querySelector('.navigator-stage')!.getAnimations()[0]===(window as unknown as {pendingMotionAnimation:Animation}).pendingMotionAnimation)).toBe(true);
  expect(await scene.evaluate(node=>node.getAnimations({subtree:true}).length)).toBe(1);
 }
 // An additional vote and a replay enrich the current observation without cancelling its travel.
 await send(page,'shadownet-operations',[vote(2,next.level,direction==='up'?1:0)]);if(!votesOnly)await send(page,'shadownet-proposals',{chain_id:'NetFixture',hash:next.hash,header:next});
 await expect.poll(()=>scene.evaluate(node=>node.getAnimations({subtree:true}).length)).toBe(0);await page.waitForTimeout(40);
 const frames=await page.evaluate(()=>(window as unknown as {nodeTravelFrames:{at:number;x:number;y:number;frameX:number;frameY:number;frameHeight:number;statusY:number;outgoing:string;ghosts:string[];incoming:string;status:string|null;active:number;duration:number;nodes:{name:string;x:number;y:number;width:number;height:number;text:string}[]}[]}).nodeTravelFrames);await info.attach('node-slot-travel',{body:JSON.stringify(frames),contentType:'application/json'});
 const moving=frames.filter(frame=>frame.active>0);expect(moving.length).toBeGreaterThan(3);expect(moving.every(frame=>frame.duration===1800)).toBe(true);
 const settled=frames.find(frame=>frame.incoming.includes(direction==='up'?'101 · r1':'102 · r0')&&frame.active===0);expect(settled).toBeDefined();expect(settled!.at-moving[0]!.at).toBeGreaterThanOrEqual(1700);expect(settled!.at-moving[0]!.at).toBeLessThanOrEqual(2050);expect(settled!.x).toBe(0);expect(settled!.y).toBe(0);
 expect(moving.some(frame=>direction==='up'?frame.y < -100:frame.x > 100)).toBe(true);expect(moving.some(frame=>frame.outgoing.includes('101 · r0'))).toBe(true);expect(moving.every(frame=>frame.ghosts.includes(oldContent))).toBe(true);
 const reference=moving[0]!;expect(reference.nodes).toHaveLength(7);
 for(const frame of moving)for(const node of frame.nodes){const original=reference.nodes.find(value=>value.name===node.name)!;expect(Math.abs((node.x-original.x)-(frame.x-reference.x))).toBeLessThan(1);expect(Math.abs((node.y-original.y)-(frame.y-reference.y))).toBeLessThan(1);expect(node.width).toBeCloseTo(original.width,3);expect(node.height).toBeCloseTo(original.height,3);}
 for(const frame of frames){expect(frame.frameX).toBe(frames[0]!.frameX);expect(frame.frameY).toBe(frames[0]!.frameY);expect(frame.frameHeight).toBe(frames[0]!.frameHeight);expect(frame.statusY).toBe(frames[0]!.statusY);}
 if(votesOnly){await expect(scene).toHaveAttribute('data-relationship','context');await expect(panel.locator('.navigator-previous')).toContainText('Context only · not ancestry');await expect(panel.locator('.navigator-current')).toContainText('Proposal hash unavailable');}
 await expect(focusControl).toBeFocused();await expect(panel.locator('.navigator-current')).toContainText(direction==='up'?'101 · r1':'102 · r0');await expect(panel.locator('.navigator-motion-card')).toHaveCount(0);
 await send(page,'shadownet-operations',[vote(4,next.level,(direction==='up'?1:0)+3)]);await expect(panel.locator('.navigator-current')).toContainText(direction==='up'?'101 · r4':'102 · r3');await expect(scene).toHaveAttribute('data-direction','static');expect(await scene.evaluate(node=>node.getAnimations({subtree:true}).length)).toBe(0);
});
