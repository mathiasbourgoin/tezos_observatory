import {expect,test} from '@playwright/test';
import {attachFailureTrace,choose,head,headers,openDetails,prepare,send,vote} from './productionFixture';
test.afterEach(async({page},info)=>attachFailureTrace(page,info));

test('supported alternatives stay closed, rank within the current tuple and preserve an inspected pin',async({page})=>{
 const initial=head(100);await prepare(page,false,initial,100,false,false,undefined,undefined,'PFixture',true);await send(page,'mainnet-head',initial);
 await page.route('https://rpc.shadownet.teztnets.com/chains/main/blocks/head/header',route=>route.fulfill({json:{...initial,chain_id:'NetFixture'}}));
 await page.locator('.network-tab.shadownet').click();await send(page,'shadownet-head',initial);
 const panel=page.locator('.network-panel.shadownet'),choices=panel.locator('.observed-proposals');
 await expect(choices).not.toHaveAttribute('open','');await expect(panel.locator('.consensus-section .observed-proposals')).toHaveCount(0);
 const packet=(slot:number,payload:string,kind='preattestation')=>({...vote(slot),hash:`${payload}-${kind}-${slot}`,contents:[{...vote(slot).contents[0]!,kind,block_payload_hash:payload}]});
 const delivered:ReturnType<typeof packet>[]=[];
 const emit=async(...packets:ReturnType<typeof packet>[])=>{delivered.push(...packets);await send(page,'shadownet-operations',packets);};
 await emit(packet(1,'Weak'));await expect(choices.locator('summary')).toHaveText('Other observed proposals (1)');
 await choices.locator('summary').click();await expect(choices.getByRole('button',{name:'Inspect payload Weak',exact:true})).toContainText('pre 600 · att —');await choices.locator('summary').click();
 await emit(packet(0,'Strong'),packet(2,'Strong'));
 const zero={...head(101),hash:'ZeroUnvotedBlock',payload_hash:'Zero'},strong={...head(101),hash:'SupportedBlockWithAFullIdentifier123456789',payload_hash:'Strong'};
 for(const candidate of [zero,strong]){headers.get(page)!.set(candidate.hash,candidate);await send(page,'shadownet-proposals',{chain_id:'NetFixture',hash:candidate.hash,header:candidate});}
 await emit(packet(999,'UnknownSlot'));
 await expect(panel.locator('.pre .gauge-counts')).toContainText('1,200 / 30,000 power');
 await expect(choices.locator('summary')).toHaveText('Other observed proposals (2)');await expect(choices).not.toHaveAttribute('open','');
 await choices.locator('summary').click();const buttons=choices.getByRole('button');await expect(buttons).toHaveCount(2);
 await expect(buttons.first()).toHaveAttribute('aria-label',`Inspect candidate ${strong.hash}`);await expect(buttons.first()).toContainText('Level 101 / r0');await expect(buttons.first()).toContainText('pre 1,200 · att —');await expect(buttons.first()).toContainText('payload-shared');await expect(buttons.first()).toHaveAttribute('title',new RegExp(strong.hash));
 await expect(choices.getByRole('button',{name:`Inspect candidate ${zero.hash}`,exact:true})).toHaveCount(0);
 await choices.getByRole('button',{name:'Inspect payload Weak',exact:true}).click();await expect(panel.locator('.session-controls')).toContainText('Pinned retained session instance');
 await emit(packet(0,'Strong','attestation'));await expect(panel.locator('.selected-payload')).toContainText('Weak');await expect(panel.locator('.pre .gauge-counts')).toContainText('600 / 30,000 power');
 await expect(choices.getByRole('button',{name:`Inspect candidate ${strong.hash}`,exact:true})).toHaveCount(0);
 const history=panel.getByLabel('Retained session instance'),zeroOption=history.locator('..').locator('.choice-option').filter({hasText:'Zero'});
 await expect(zeroOption).toHaveCount(1);await choose(history,(await zeroOption.getAttribute('data-value'))!);
 await panel.getByText('Selected identity & phase provenance',{exact:true}).click();await openDetails(panel.locator('.captured-candidates'));
 await panel.locator('.captured-candidates').getByRole('button',{name:`Inspect candidate ${zero.hash}`,exact:true}).click();
 await expect(panel.locator('.selected-payload')).toContainText('Zero');await expect(choices.getByRole('button',{name:`Inspect candidate ${zero.hash}`,exact:true})).toHaveCount(0);
});
