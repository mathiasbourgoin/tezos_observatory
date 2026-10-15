import {expect,test} from '@playwright/test';
import {head,prepare,send,vote} from './productionFixture';

test('one source-local fallback snapshot admits its votes without another head bracket or snapshot',async({page})=>{
 const initial=head(100),operation=vote(0);
 await page.addInitScript(({initial,operation})=>{
  const original=window.fetch.bind(window);
  window.fetch=async(input,options)=>{
   const url=String(input);
   if(url==='https://mainnet.smartpy.io/chains/main/blocks/head/header')return Response.json({...initial,chain_id:'NetFixture'});
   if(url.startsWith('https://mainnet.smartpy.io/chains/main/mempool/pending_operations?'))return Response.json({validated:[operation]});
   return original(input,options);
  };
 },{initial,operation});
 await prepare(page,false,initial,100,false,false,undefined,undefined,'PFixture',true);await send(page,'mainnet-head',initial);
 const panel=page.locator('.network-panel.mainnet');await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');
 await expect(panel.locator('.authority-evidence')).toContainText('https://mainnet.smartpy.io');
 const reads=await page.evaluate(()=>window.mockRequests.map(request=>request.url));
 expect(reads.filter(url=>url.includes('pending_operations'))).toHaveLength(1);
 expect(reads.filter(url=>url==='https://mainnet.smartpy.io/chains/main/blocks/head/header')).toHaveLength(3); // One bootstrap plus one before/after bracket.
 expect(reads.filter(url=>url==='https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header')).toHaveLength(0);
});
