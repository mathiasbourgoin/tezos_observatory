import {expect,test} from '@playwright/test';
import {head,openDetails,prepare,send} from './productionFixture';

test('hidden-network auxiliary reads wait for its tab and eligibility requires each explicit batch',async({page})=>{
 await prepare(page,false,head(100));
 const count=async(kind:'eligibility'|'shadAux')=>page.evaluate(kind=>window.mockRequests.filter(({url})=>kind==='eligibility'?url.includes('/is_forbidden'):url.includes('shadownet')&&(url.includes('baking_rights')||url.includes('/v1/delegates')||url.includes('/v1/blocks'))).length,kind);
 await expect.poll(()=>page.evaluate(()=>window.mockRequests.some(({url})=>url.includes('shadownet')&&url.includes('attestation_rights')))).toBe(true);
 expect(await count('eligibility')).toBe(0);expect(await count('shadAux')).toBe(0);
 await send(page,'shadownet-head',head(101));await expect(page.locator('.shadownet .headline')).toContainText('101');
 expect(await count('eligibility')).toBe(0);expect(await count('shadAux')).toBe(0);
 await page.locator('.network-tab.shadownet').click();
 await expect.poll(()=>count('shadAux')).toBeGreaterThan(0);expect(await count('eligibility')).toBe(0);
 const panel=page.locator('.network-panel.shadownet');await openDetails(panel.locator('.committee-evidence'));
 await panel.getByRole('button',{name:'Read committee eligibility',exact:true}).click();
 await expect.poll(()=>count('eligibility')).toBe(50);
 await expect(panel.getByRole('button',{name:'Read committee eligibility',exact:true})).toBeEnabled();
 await panel.getByRole('button',{name:'Read committee eligibility',exact:true}).click();expect(await count('eligibility')).toBe(50);
 await send(page,'shadownet-head',head(102));await expect(panel.locator('.headline')).toContainText('102');
 expect(await count('eligibility')).toBe(50);
 await page.locator('.network-tab.mainnet').click();const before=await count('shadAux');
 await send(page,'shadownet-head',head(103));await expect(panel.locator('.headline')).toContainText('103');
 expect(await count('eligibility')).toBe(50);expect(await count('shadAux')).toBe(before);
});
