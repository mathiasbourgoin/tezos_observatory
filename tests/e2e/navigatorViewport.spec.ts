import {test,expect} from '@playwright/test';
import {prepare,send,vote} from './productionFixture';

test('mobile path clips its world inside the viewport and keeps branch evidence reachable',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await prepare(page,false);await send(page,'mainnet-operations',[vote(0)]);
 const panel=page.locator('.network-panel.mainnet');await expect(panel.locator('.pre .gauge-exact')).toHaveText('600 / 30,000');
 const measurement=await panel.evaluate(panel=>{
  const frame=panel.querySelector('.navigator-junction')!,branch=panel.querySelector('[data-branch=next-level]')!,current=panel.querySelector('.navigator-current')!;
  return {viewport:innerWidth,document:document.documentElement.scrollWidth,frame:{left:frame.getBoundingClientRect().left,right:frame.getBoundingClientRect().right,overflow:getComputedStyle(frame).overflowX},branch:{right:branch.getBoundingClientRect().right},current:{left:current.getBoundingClientRect().left,right:current.getBoundingClientRect().right}};
 });
 await info.attach('viewport-geometry',{body:JSON.stringify(measurement),contentType:'application/json'});
 expect(measurement.document).toBe(390);expect(measurement.frame.left).toBeGreaterThanOrEqual(0);expect(measurement.frame.right).toBeLessThanOrEqual(390);expect(measurement.frame.overflow).toBe('hidden');
 expect(measurement.branch.right).toBeGreaterThan(measurement.frame.right);
 const requestCount=await page.evaluate(()=>window.mockRequests.length);
 await panel.getByRole('button',{name:'Pan path right',exact:true}).click();
 const branch=panel.locator('[data-branch=next-level]'),proof=branch.locator('summary');await proof.focus();await expect(proof).toBeFocused();
 const reached=await branch.boundingBox();expect(reached!.x).toBeGreaterThanOrEqual(measurement.frame.left);expect(reached!.x+reached!.width).toBeLessThanOrEqual(measurement.frame.right);
 await panel.getByRole('button',{name:'Return to live',exact:true}).click();await expect(panel.locator('.navigator-junction')).toHaveAttribute('data-camera-following','true');
 const returned=await panel.locator('.navigator-current').boundingBox();expect(returned!.x).toBeGreaterThanOrEqual(measurement.frame.left);expect(returned!.x+returned!.width).toBeLessThanOrEqual(measurement.frame.right);
 expect(await page.evaluate(()=>window.mockRequests.length)).toBe(requestCount);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});
