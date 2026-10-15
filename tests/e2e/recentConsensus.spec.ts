import {expect,test} from '@playwright/test';
import {head,headers,prepare,selectNetwork,send,vote} from './productionFixture';

test('recent consensus retains measured rows across alternating same-level empty observations',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('consensus-v2:network','shadownet'));await prepare(page,false);await selectNetwork(page,'shadownet');const panel=page.locator('.network-panel.shadownet');
 for(let level=101;level<=105;level++){
  await send(page,'shadownet-operations',[vote(0,level),{...vote(1,level),hash:`att-${level}`,contents:[{...vote(1,level).contents[0],kind:'attestation'}]}]);
  await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');
  const applied=head(level);await send(page,'shadownet-head',applied);
  const empty={...applied,hash:`Empty${level}`,payload_hash:`EmptyPayload${level}`};headers.get(page)!.set(empty.hash,empty);
  await send(page,'shadownet-proposals',{chain_id:'NetFixture',hash:empty.hash,header:empty});
  await expect(panel.getByRole('button',{name:new RegExp(`^Inspect retained instance .*EmptyPayload${level}`)})).toHaveCount(1);
 }
 const rows=panel.locator('.recent-consensus-row:not(.recent-placeholder)');await expect(rows).toHaveCount(5);
 await expect(rows.locator('.recent-identity')).toHaveText([105,104,103,102,101].map(level=>`${level} · r0`));
 await expect(rows.locator('.recent-phase.pre')).toHaveText(Array(5).fill('Pre 2.0%'));
 await expect(rows.locator('.recent-phase.att')).toHaveText(Array(5).fill('Att 2.0%'));
 await expect(panel.locator('.recent-consensus')).not.toContainText('EmptyPayload');
});
