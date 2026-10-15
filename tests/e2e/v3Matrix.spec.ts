import {test,expect} from '@playwright/test';
import {head,vote,prepare,send,headers} from './productionFixture';
import {captureMatrix} from './v3Evidence';

const errors=new WeakMap<object,string[]>();
test.beforeEach(async({page})=>{const found:string[]=[];errors.set(page,found);page.on('pageerror',error=>found.push(error.message));page.on('response',response=>{const url=new URL(response.url());if(url.hostname==='127.0.0.1'&&response.status()>=400&&/\.(ts|js|css)(?:$|\?)/.test(url.pathname))found.push(`${response.status()} ${url.pathname}`);});});
test.afterEach(async({page})=>{if(errors.get(page)?.length)throw new Error(`Production runtime: ${errors.get(page)?.join('; ')}`);});

test('V3 AC-06 production empty partial and quorum states cover every required base theme and engine',async({page},info)=>{
 test.setTimeout(240000);await prepare(page,false,head(100),100,true);
 await captureMatrix(page,info,'initially-hidden');
 await page.evaluate(()=>{window.mockHidden=false;document.dispatchEvent(new Event('visibilitychange'));});const panel=page.locator('.network-panel.mainnet');await expect(panel.locator('.headline')).toContainText('100');
 await captureMatrix(page,info,'empty-observed');
 await send(page,'mainnet-operations',[vote(0)]);await expect(panel.locator('.pre .gauge-exact')).toHaveText('600 / 30,000');await expect(panel.locator('.att .gauge-exact')).toHaveText('Unavailable');
 await captureMatrix(page,info,'partial-positive-phase-unavailable');
 await panel.getByRole('button',{name:'Pin selected instance',exact:true}).click();await expect(panel.locator('.session-mode')).toContainText('Pinned');await captureMatrix(page,info,'pinned-votes-missing-historical-branches');
 await panel.getByRole('button',{name:'Follow live',exact:true}).click();await send(page,'mainnet-operations',Array.from({length:34},(_,slot)=>vote(slot)));await expect(panel.locator('.pre .gauge-exact')).toHaveText('20,400 / 30,000');await captureMatrix(page,info,'observed-quorum-partial');
 await send(page,'mainnet-operations',Array.from({length:50},(_,slot)=>vote(slot)));await expect(panel.locator('.pre .gauge-exact')).toHaveText('30,000 / 30,000');await captureMatrix(page,info,'full-observed-power-partial-coverage');
 const candidate={...head(101),hash:'BKnownExactCandidateLongHash123456789012345678901234567890',payload_hash:'vhPayload101'};headers.get(page)?.set(candidate.hash,candidate);await send(page,'mainnet-proposals',{chain_id:'NetFixture',hash:candidate.hash,header:candidate});await expect(panel.locator('.navigator-current')).toContainText('101 · r0');await panel.getByRole('button',{name:`Inspect candidate ${candidate.hash}`,exact:true}).click();await expect(panel.locator('.candidate-evidence')).toContainText(candidate.hash);await captureMatrix(page,info,'known-block-unknown-producer-pinned');
 info.annotations.push({type:'v3-verified',description:'AC-06'});
});


test('V3 AC-06 production source zero stale and failed comparison remain distinct across the full matrix',async({page},info)=>{
 test.setTimeout(180000);const current=head(100);await prepare(page,false,current);const panel=page.locator('.network-panel.mainnet');
 await page.route('https://rpc.tzkt.io/mainnet/chains/main/blocks/head/header',route=>route.fulfill({json:{...current,chain_id:'NetFixture'}}));
 await page.route('https://rpc.tzkt.io/mainnet/chains/main/mempool/pending_operations?*',route=>route.fulfill({json:{validated:[],refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]}}));
 const candidate={...head(101),hash:'MatrixMeasuredZero',payload_hash:'MatrixZeroPayload'};headers.get(page)?.set(candidate.hash,candidate);await send(page,'mainnet-proposals',{chain_id:'NetFixture',hash:candidate.hash,header:candidate});await expect(panel.locator('.pre .gauge-exact')).toHaveText('0 / 30,000');await expect(panel.locator('.att .gauge-exact')).toHaveText('0 / 30,000');await captureMatrix(page,info,'measured-zero-both-phases');
 await page.route('https://tezos-mainnet.octez.io/**',route=>route.fulfill({status:503,body:'Provider unavailable'}));await panel.getByLabel('Comparison provider').selectOption('https://tezos-mainnet.octez.io');await panel.getByRole('button',{name:'Compare selected observation',exact:true}).click();await expect(panel.locator('.comparison-result')).toContainText('unavailable');await captureMatrix(page,info,'failed-independent-comparison');
 await page.evaluate(()=>window.mockStreams['mainnet-operations']?.error(new Error('Source coverage interrupted')));await expect(panel.locator('.pre .gauge-exact')).toHaveText('Unavailable');await expect(panel).toContainText('Retained source snapshot stale');await captureMatrix(page,info,'source-stale-zero-withdrawn');
 await page.getByRole('button',{name:'Pause',exact:true}).click();await captureMatrix(page,info,'manually-paused-stale');
 info.annotations.push({type:'v3-verified',description:'AC-06'});
});

test('V3 AC-06 dense retained history long aliases and frozen inspection remain usable in the full matrix',async({page},info)=>{
 test.setTimeout(240000);const current=head(100),powers=Array.from({length:300},()=>100),aliases=powers.map((_,index)=>({address:`tz1BakerAddress${String(index).padStart(25,'0')}`,alias:`Delegate ${index} · cooperative with a deliberately long operational alias and source qualification`}));
 await prepare(page,false,current,100,false,false,{total:30000,quorum:20000,powers},aliases);const panel=page.locator('.network-panel.mainnet');
 const first={...head(101),hash:'BDensePinnedExactHash123456789012345678901234567890123',payload_hash:'vhPayload101'};headers.get(page)?.set(first.hash,first);await send(page,'mainnet-proposals',{chain_id:'NetFixture',hash:first.hash,header:first});await send(page,'mainnet-operations',[vote(0)]);await expect(panel.locator('.pre .gauge-exact')).toHaveText('100 / 30,000');await panel.getByRole('button',{name:`Inspect candidate ${first.hash}`,exact:true}).click();
 const candidates=Array.from({length:100},(_,index)=>({...head(101),hash:`BDenseSibling${index}ExactHash123456789012345678901234567890`,payload_hash:'vhPayload101'}));for(const candidate of candidates)headers.get(page)?.set(candidate.hash,candidate);await page.evaluate(values=>window.mockStreams['mainnet-proposals']?.enqueue(new TextEncoder().encode(values.map(header=>JSON.stringify({chain_id:'NetFixture',hash:header.hash,header})).join('\n')+'\n')),candidates);
 await expect(panel.locator('.candidate-controls button')).toHaveCount(100);await expect(panel).toContainText('Historical inspection facts partially retained');await captureMatrix(page,info,'active-evicted-retained-pin-100-candidate-facts');
 const histories=Array.from({length:151},(_,index)=>({...head(101),hash:`BDenseHistory${index}ExactHash123456789012345678901234567890`,payload_hash:`vhDenseHistoryPayload${index}0123456789012345678901234567890`}));for(const candidate of histories)headers.get(page)?.set(candidate.hash,candidate);await page.evaluate(values=>window.mockStreams['mainnet-proposals']?.enqueue(new TextEncoder().encode(values.map(header=>JSON.stringify({chain_id:'NetFixture',hash:header.hash,header})).join('\n')+'\n')),histories);
 await expect(panel.locator('.session-mode')).toContainText('frozen');await expect(panel.getByRole('combobox',{name:'Retained session instance'}).locator('option')).toHaveCount(150);await captureMatrix(page,info,'frozen-pin-150-history-many-delegates-long-values');
 await panel.getByRole('button',{name:'Latest',exact:true}).click();await expect(panel.locator('.session-mode')).toContainText('Pinned');await expect(panel.locator('.session-mode')).not.toContainText('frozen');await captureMatrix(page,info,'latest-once-dense-history');
 info.annotations.push({type:'v3-verified',description:'AC-06'});
});


test('V3 AC-07 production focus hover search sorting and open evidence remain usable throughout the matrix',async({page},info)=>{
 test.setTimeout(240000);const address=(slot:number)=>`tz1BakerAddress${String(slot).padStart(25,'0')}`;
 await prepare(page,false,head(),100,false,false,{total:5,quorum:4,powers:[3,2]},[{address:address(0),alias:'Baker Alpha'},{address:address(1),alias:'Baker Beta'}]);await send(page,'mainnet-operations',[vote(0)]);const panel=page.locator('.network-panel.mainnet'),query=panel.getByRole('searchbox',{name:'Search committee alias or address'}),rows=panel.locator('.committee-evidence tbody tr');await expect(rows).toHaveCount(2);
 await captureMatrix(page,info,'keyboard-search-focus',async()=>{await query.focus();await expect(query).toBeFocused();});
 await captureMatrix(page,info,'hover-primary-control',async()=>{await page.getByRole('button',{name:'Pause',exact:true}).hover();});
 await query.fill('  alpha  ');await expect(rows).toHaveCount(1);await captureMatrix(page,info,'search-matching-alias');await query.fill('no-matching-delegate');await expect(rows).toHaveCount(0);await captureMatrix(page,info,'search-no-match');
 await query.fill('');await panel.getByRole('combobox',{name:'Committee sort'}).selectOption('alias');await expect(rows).toHaveCount(2);await captureMatrix(page,info,'explicit-alias-sort');
 const details=rows.first().locator('details');await details.locator('summary').click();await panel.locator('.selected-inspector > .consensus-section > details').evaluateAll(nodes=>nodes.forEach(node=>(node as HTMLDetailsElement).open=true));await captureMatrix(page,info,'expanded-full-address-phase-source-context');
 await query.fill('alpha');const copy=rows.first().getByRole('button',{name:'Copy full address for Baker Alpha · TzKT'});await copy.focus();
 await page.evaluate(async changed=>{const path='/rpc/networkData.ts',module=await import(path),original=module.NetworkData.prototype.alias;module.NetworkData.prototype.alias=function(address:string){return this.network==='mainnet'&&address===changed?'Gamma':original.call(this,address);};},address(0));await send(page,'mainnet-operations',[vote(1)]);await expect(rows).toHaveCount(1);await expect(rows.first()).toHaveAttribute('data-pending-exclusion','true');await captureMatrix(page,info,'focused-corrected-alias-pending-exclusion',async()=>{await expect(rows.first()).toHaveAttribute('data-pending-exclusion','true');await expect(rows.first().locator('button')).toBeFocused();});
 await query.focus();await expect(rows).toHaveCount(0);await query.fill('');await expect(rows).toHaveCount(2);
 info.annotations.push({type:'v3-verified',description:'AC-07'});
});


test('V3 AC-06 loading unresolved gaps reorg reduced motion and visibility states render across every base',async({page},info)=>{
 test.setTimeout(240000);const initial=head();await prepare(page,false,initial,100,false,false,undefined,undefined,'PFixture',true);const panel=page.locator('.network-panel.mainnet');await expect(panel.locator('.selected-title')).toHaveText('Observation unavailable');await captureMatrix(page,info,'loading-no-head-received');
 await send(page,'mainnet-head',initial);await send(page,'shadownet-head',initial);await expect(panel.locator('.headline')).toContainText('100');await send(page,'mainnet-operations',[vote(0,123,0)]);await panel.getByRole('button',{name:'Inspect payload vhPayload123',exact:true}).click();await expect(panel.locator('.candidate-evidence')).toContainText('Unresolved');await captureMatrix(page,info,'unresolved-ahead-context');
 await panel.getByRole('button',{name:'Follow live',exact:true}).click();await send(page,'mainnet-operations',[vote(0,101,0)]);await expect(panel.locator('.navigator-current')).toContainText('101 · r0');await send(page,'mainnet-operations',[vote(1,101,9)]);await expect(panel.locator('.navigator-current')).toContainText('101 · r9');await expect(panel.locator('.navigator-status')).toContainText('Observation gap');await captureMatrix(page,info,'actual-round-gap-static');
 await page.emulateMedia({reducedMotion:'reduce'});await send(page,'mainnet-operations',[vote(2,101,10)]);await expect(panel.locator('.navigator-current')).toContainText('101 · r10');expect(await panel.locator('.navigator-junction').evaluate(node=>node.getAnimations().length)).toBe(0);await captureMatrix(page,info,'reduced-motion-observed-adjacent-destination');
 await send(page,'mainnet-head',{...initial,hash:'MatrixReorgHead100'});await expect(panel).toContainText('Observed same-height reorg');await captureMatrix(page,info,'actual-same-height-reorg-invalidated-context');
 await page.evaluate(()=>{window.mockHidden=true;document.dispatchEvent(new Event('visibilitychange'));});const paused=await page.evaluate(()=>window.mockRequests.length);await captureMatrix(page,info,'hidden-collection-suspended');expect(await page.evaluate(()=>window.mockRequests.length)).toBe(paused);
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await captureMatrix(page,info,'pagehide-bfcache-suspended');expect(await page.evaluate(()=>window.mockRequests.length)).toBe(paused);
 await page.evaluate(()=>{window.mockHidden=false;window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});await expect.poll(()=>page.evaluate(()=>window.mockRequests.length)).toBeGreaterThan(paused);await captureMatrix(page,info,'bfcache-resumed-attributed-state');
 info.annotations.push({type:'v3-verified',description:'AC-06'});
});


test('V3 AC-09 matching block producers shared and separate payloads render without pooled power throughout the matrix',async({page},info)=>{
 test.setTimeout(240000);const protocol='PsUshuai9QapM5TGj1JpuVGkdxz5GykdnEvS6Rh8SUVrARvZLCY',baker='tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb',other='tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6';await prepare(page,false,head(),100,false,false,undefined,undefined,protocol);
 await page.route('**/blocks/*/metadata',route=>route.fulfill({json:{protocol,next_protocol:protocol,baker,proposer:other,level_info:{level:101,level_position:100,cycle:0,cycle_position:100,expected_commitment:false},balance_updates:[],consumed_milligas:'0',deactivated:[]}}));
 await send(page,'mainnet-operations',[{...vote(0),contents:[{...vote(0).contents[0],block_payload_hash:'P'}]}]);const panel=page.locator('.network-panel.mainnet');await expect(panel.locator('.pre .gauge-exact')).toHaveText('600 / 30,000');
 for(const [hash,payload,state] of [['MatrixProducerH1','P','producer-known-exact-block'],['MatrixProducerH2','P','same-round-shared-payload-distinct-blocks'],['MatrixProducerH3','Q','same-round-separate-payload-no-pooled-power']] as const){const candidate={...head(101),hash,payload_hash:payload};headers.get(page)?.set(hash,candidate);await send(page,'mainnet-proposals',{chain_id:'NetFixture',hash,header:candidate});await panel.getByRole('button',{name:`Inspect candidate ${hash}`,exact:true}).click();await expect(panel.locator('.candidate-evidence')).toContainText(`Block producer / baker ${baker}`);await expect(panel.locator('.pre .gauge-exact')).toHaveText(payload==='P'?'600 / 30,000':'Unavailable');await captureMatrix(page,info,state);}
 info.annotations.push({type:'v3-verified',description:'AC-09'});
});


test('V3 AC-10 both phases render exact below at and full thresholds independently across the matrix',async({page},info)=>{
 test.setTimeout(240000);await prepare(page,false,head(),100,false,false,{total:5,quorum:4,powers:[3,1,1]});const panel=page.locator('.network-panel.mainnet');
 const att=(slot:number)=>({hash:`matrix-att-${slot}`,contents:[{kind:'attestations_aggregate',consensus_content:{level:101,round:0,block_payload_hash:'vhPayload101'},committee:[{slot}]}]});
 for(const [slots,state,power] of [[[0],'both-phases-just-below-threshold',3],[[1],'both-phases-at-exact-threshold',4],[[2],'both-phases-full-observed-power',5]] as const){await send(page,'mainnet-operations',slots.flatMap(slot=>[vote(slot),att(slot)]));await expect(panel.locator('.pre .gauge-exact')).toHaveText(`${power} / 5`);await expect(panel.locator('.att .gauge-exact')).toHaveText(`${power} / 5`);await captureMatrix(page,info,state);}
 info.annotations.push({type:'v3-verified',description:'AC-10'});
});
