import {expect,test,type Page} from '@playwright/test';
import {head,openDetails,prepare,send,vote} from './productionFixture';

async function startMainnet(page:Page){
 const initial=head(100);await prepare(page,false,initial,100,false,false,undefined,undefined,'PFixture',true);
 await send(page,'mainnet-head',initial);await expect(page.locator('.mainnet .headline')).toContainText('100');
}

test('only the selected network collects and switching retains pinned session evidence',async({page})=>{
 await startMainnet(page);
 const shadReads=()=>page.evaluate(()=>window.mockRequests.filter(({url})=>url.includes('shadownet')).length);
 expect(await shadReads()).toBe(0);await expect(page.locator('.network-tab.shadownet .tab-status')).toHaveText('Paused');
 await page.locator('.network-tab.shadownet').click();await send(page,'shadownet-head',head(101));
 const panel=page.locator('.network-panel.shadownet');await expect(panel.locator('.headline')).toContainText('101');
 await send(page,'shadownet-operations',[vote(0,102)]);await expect(panel.locator('.observed-proposals summary')).toHaveText('Proposals with observed votes (1)');
 await panel.getByRole('button',{name:'Pin selected instance',exact:true}).click();await expect(panel.locator('.session-controls')).toContainText('Pinned retained session instance');
 const original=await panel.locator('.candidate-evidence').textContent();
 await page.locator('.network-tab.mainnet').click();const retained=await shadReads();
 await expect(page.locator('.network-tab.shadownet .tab-status')).toHaveText('Paused');await expect(panel.locator('.connection-line')).toContainText('Paused · select network to resume');
 await send(page,'mainnet-head',head(101));await expect(page.locator('.mainnet .headline')).toContainText('101');expect(await shadReads()).toBe(retained);
 expect(await page.evaluate(()=>window.mockRequests.filter(({url})=>url.includes('shadownet')&&url.includes('/monitor')).every(request=>request.aborted))).toBe(true);
 await page.locator('.network-tab.shadownet').click();await send(page,'shadownet-head',head(102));
 await expect(panel.locator('.session-controls')).toContainText('Pinned retained session instance');await expect(panel.locator('.candidate-evidence')).toHaveText(original!);
});

test('eligibility is one explicit current-head batch and never refreshes automatically',async({page})=>{
 await startMainnet(page);const count=()=>page.evaluate(()=>window.mockRequests.filter(({url})=>url.includes('/is_forbidden')).length);
 expect(await count()).toBe(0);await page.locator('.network-tab.shadownet').click();await send(page,'shadownet-head',head(101));
 const panel=page.locator('.network-panel.shadownet');await expect(panel.locator('.headline')).toContainText('101');
 await openDetails(panel.locator('.committee-evidence'));const read=panel.getByRole('button',{name:'Read committee eligibility',exact:true});
 await expect(read).toBeEnabled();expect(await count()).toBe(0);await read.click();await expect.poll(count).toBe(50);
 await expect(read).toBeEnabled();await read.click();expect(await count()).toBe(50);
 await send(page,'shadownet-head',head(102));await expect(panel.locator('.headline')).toContainText('102');expect(await count()).toBe(50);
 await page.locator('.network-tab.mainnet').click();expect(await count()).toBe(50);
});
