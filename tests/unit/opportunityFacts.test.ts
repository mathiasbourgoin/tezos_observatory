import {afterEach,expect,it,vi} from 'vitest';
import {captureOpportunityFacts} from '../../src/consensus/opportunityFacts';
import {NetworkData,sources,type TargetContext} from '../../src/rpc/networkData';
import type {BlockHeader} from '../../src/rpc/models';
import type {OpportunityFact} from '../../src/consensus/roundSchedule';

afterEach(()=>vi.unstubAllGlobals());
async function fixture(){
 const at=Date.now(),source=sources.mainnet[0]!;
 const selectedHeader:BlockHeader={chainId:'NetFixture',level:120,hash:'H120',predecessor:'H119',timestamp:new Date(at).toISOString(),fitness:['02','00000078','','ffffffff','00000002'],payload_hash:'P'};
 const candidateHeader:BlockHeader={...selectedHeader,level:121,hash:'H121',predecessor:'H120',timestamp:new Date(at+12000).toISOString(),fitness:['02','00000079','','fffffffd','00000000'],payload_hash:'NextP'};
 const competingHeader:BlockHeader={...selectedHeader,hash:'Competing120',payload_hash:'OtherP'};
 vi.stubGlobal('fetch',async(input:string|URL|Request)=>{
  const url=new URL(String(input)),hash=url.pathname.split('/blocks/')[1]?.split('/')[0],level=Number(url.searchParams.get('level'));
  if(url.pathname.endsWith('/header'))return Response.json(hash==='Competing120'?{...competingHeader,chain_id:'NetFixture'}:hash==='H121'?{...candidateHeader,chain_id:'NetFixture'}:hash==='H120'?{...selectedHeader,chain_id:'NetFixture'}:{...selectedHeader,chain_id:'NetFixture',hash:'H119',level:119,predecessor:'H118',fitness:['02','00000077','','ffffffff','00000000']});
  if(url.pathname.endsWith('/protocols'))return Response.json({protocol:'PFixture',next_protocol:'PFixture'});
  if(url.pathname.includes('attestation_rights'))return Response.json([{level,delegates:[{delegate:'D1',first_slot:0,attesting_power:5}]}]);
  if(url.pathname.includes('baking_rights'))return Response.json([{level,round:Number(url.searchParams.get('max_round')),delegate:'Baker'}]);
  if(url.pathname.endsWith('/context/constants'))return Response.json({minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5});
  throw new Error(`Unexpected fixture endpoint ${url}`);
 });
 const data=new NetworkData('mainnet'),signal=new AbortController().signal,derived=await data.derive({...selectedHeader,evidence:{source,receivedAt:1,receivedMonotonic:1}},signal),selected=derived.contexts.get(120);
 expect(selected).toBeDefined();const rights=await Promise.all([data.bakers(selectedHeader,120,3,signal),data.bakers(selectedHeader,121,0,signal)]);
 const facts=rights.map((values,index):OpportunityFact=>{
  const right=values[0],parameters=derived.constantsByLevel.get(120+index);if(!right?.context||!right.evidence||!parameters?.context||!parameters.evidence)throw new Error('Actual fixture proof unavailable');
  return {branch:index===0?'same-level':'next-level',level:120+index,round:index===0?3:0,condition:index===0?'Continued same-level production':'Hypothetical next-level production',capturedAt:at+1000,capturedMonotonic:performance.now()+1000,proposer:{state:'known',right:{...right,context:right.context,evidence:right.evidence}},timing:{state:'known',basis:'observed-selected',parameters:{...parameters,context:parameters.context,evidence:parameters.evidence},reference:selectedHeader,referenceTimestamp:at,referenceRound:2,deadline:at+12000,remainingAtCapture:11000}};
 }) as [OpportunityFact,OpportunityFact];
 return {data,candidateHeader,competingHeader,selectedHeader,facts,selected:selected!,allowed:(value:{baseUrl:string;network:string})=>value.network==='mainnet'&&sources.mainnet.some(configured=>configured.baseUrl===value.baseUrl)};
}

it.each(['ahead','same-height'] as const)('accepts independent branch contexts proved against the exact observed %s candidate while retaining its admission',async kind=>{
 const input=await fixture(),{data,facts,allowed}=input,candidateHeader=kind==='ahead'?input.candidateHeader:input.competingHeader,parentContext=facts[kind==='ahead'?1:0]!.timing;if(parentContext.state!=='known')throw new Error('Missing parent admission context');
 const candidateLevel=candidateHeader.level,candidateRound=kind==='ahead'?0:2;
 const signal=new AbortController().signal,at=Date.parse(candidateHeader.timestamp),pair:OpportunityFact[]=[];
 for(let index=0;index<2;index++){
  const level=candidateLevel+index,round=index===0?candidateRound+1:0,right=(await data.bakers(candidateHeader,level,round,signal))[0]!,parameters=await data.opportunityConstants(candidateHeader,level,signal);
  if(!right.context||!right.evidence||!parameters.context||!parameters.evidence)throw new Error('Missing actual candidate context');
  const duration=candidateRound===0?6000:12000;
  pair.push({...facts[index]!,level,round,capturedAt:at+1000,proposer:{state:'known',right:{...right,context:right.context,evidence:right.evidence}},timing:{state:'known',basis:'observed-selected',parameters:{...parameters,context:parameters.context,evidence:parameters.evidence},reference:candidateHeader,referenceTimestamp:at,referenceRound:candidateRound,deadline:at+duration,remainingAtCapture:duration-1000}});
 }
 expect(captureOpportunityFacts(pair as [OpportunityFact,OpportunityFact],parentContext.parameters.context,candidateLevel,candidateRound,allowed,candidateHeader)).toEqual(pair);
});

it.each(['known-chain','raw-unknown-chain'] as const)('captures a same-protocol hypothetical selected round from its %s parent without fabricating a selected header',async kind=>{
 const {data,selectedHeader,facts,allowed}=await fixture(),parameters=facts[1].timing;
 if(parameters.state!=='known')throw new Error('Missing actual successor parameters');
 const right=(await data.bakers(selectedHeader,121,3,new AbortController().signal))[0]!;
 if(!right.context||!right.evidence)throw new Error('Missing actual branch right');
 const {chainId:_chainId,...rawParent}=selectedHeader;
 const at=Date.parse(selectedHeader.timestamp),fact:OpportunityFact={...facts[0],level:121,round:3,proposer:{state:'known',right:{...right,context:right.context,evidence:right.evidence}},timing:{...parameters,basis:'hypothetical-selected',reference:kind==='known-chain'?selectedHeader:rawParent,referenceTimestamp:at,referenceRound:2,deadline:at+39000,remainingAtCapture:38000}};
 const absent:OpportunityFact={...facts[1],level:122,proposer:{state:'unavailable',reason:'Future execution context unavailable'},timing:{state:'unavailable',reason:'Future execution context unavailable'}};
 expect(captureOpportunityFacts([fact,absent],parameters.parameters.context,121,2,allowed)).toEqual([fact,absent]);
});

it('captures independently proven current and successor contexts without requiring their anchors to be identical',async()=>{
 const {facts,selected,allowed}=await fixture();const captured=captureOpportunityFacts(facts,selected,120,2,allowed);
 expect(captured).toEqual(facts);expect(captured?.map(fact=>fact.timing.state==='known'?fact.timing.parameters.context.anchor.header.hash:undefined)).toEqual(['H119','H120']);
});

it.each(['anchor-hash','anchor-level','anchor-source','anchor-producing-protocol','observer-header-chain','execution-protocol','target'] as const)('rejects concrete %s contradiction despite unchanged context key and adjusted matching receipt',async kind=>{
 const {facts,selected,allowed}=await fixture(),first=facts[0];if(first.timing.state!=='known')throw new Error('Fixture timing missing');
 const original=first.timing.parameters.context;
 const changed:TargetContext=kind==='anchor-hash'?{...original,anchor:{...original.anchor,header:{...original.anchor.header,hash:'Unrelated119'}}}:kind==='anchor-level'?{...original,anchor:{...original.anchor,header:{...original.anchor.header,level:118}}}:kind==='anchor-source'?{...original,anchor:{...original.anchor,source:sources.mainnet[1]!}}:kind==='anchor-producing-protocol'?{...original,anchor:{...original.anchor,protocolHash:'ContradictoryProducingProtocol'}}:kind==='observer-header-chain'?{...original,observer:{...original.observer,header:{...original.observer.header,chainId:'OtherChain'}}}:kind==='execution-protocol'?{...original,protocolHash:'OtherExecution',anchor:{...original.anchor,nextProtocolHash:'OtherExecution'}}:{...original,level:121};
 const receipt={...first.timing.parameters.evidence,requestedHeadHash:changed.anchor.header.hash,protocolHash:changed.protocolHash,targetLevel:changed.level};
 const bad:OpportunityFact={...first,timing:{...first.timing,parameters:{...first.timing.parameters,context:changed,evidence:receipt}}};
 expect(changed.key).toBe(original.key);expect(captureOpportunityFacts([bad,facts[1]],selected,120,2,allowed)===undefined).toBe(true);
});

it.each(['hash','parent','fitness-round','chain','payload'] as const)('rejects observed-selected reference %s contradiction instead of authorizing its unchanged timestamp',async kind=>{
 const {facts,selected,allowed}=await fixture(),first=facts[0];if(first.timing.state!=='known')throw new Error('Fixture timing missing');
 const reference={...first.timing.reference,...(kind==='hash'?{hash:'Unobserved120'}:kind==='parent'?{predecessor:'Unrelated119'}:kind==='fitness-round'?{fitness:['02','00000078','','ffffffff','00000005']}:kind==='chain'?{chainId:'OtherChain'}:{payload_hash:'OtherPayload'})};
 expect(captureOpportunityFacts([{...first,timing:{...first.timing,reference}},facts[1]],selected,120,2,allowed)===undefined).toBe(true);
});

it('captures nested immutable rights timing references and provenance without retaining mutable caller objects',async()=>{
 const input=await fixture(),mutable=structuredClone({facts:input.facts,selected:input.selected}),first=mutable.facts[0];if(first.timing.state!=='known'||first.proposer.state!=='known')throw new Error('Fixture fact unavailable');
 Reflect.set(first.timing.reference,'evidence',{...first.proposer.right.evidence,source:{...first.proposer.right.evidence.source}});
 const captured=captureOpportunityFacts(mutable.facts,mutable.selected,120,2,input.allowed);expect(captured).toBeDefined();const before=JSON.stringify(captured);
 Reflect.set(first.timing.reference.evidence!,'receivedAt',999999);Reflect.set(first.timing.reference.evidence!.source,'baseUrl','https://mutated-reference.invalid');
 Reflect.set(first.timing.reference,'hash','MutatedReference');Reflect.set(first.timing.reference.fitness,'4','00000009');Reflect.set(first.timing.parameters.context.anchor.header,'hash','MutatedAnchor');Reflect.set(first.timing.parameters.evidence.source,'baseUrl','https://mutated.invalid');Reflect.set(first.proposer.right,'delegate','MutatedBaker');Reflect.set(first.proposer.right.evidence,'receivedAt',999999);
 expect(JSON.stringify(captured)).toBe(before);expect(Object.isFrozen(captured)).toBe(true);expect(Object.isFrozen(captured![0].timing)).toBe(true);if(captured![0].timing.state==='known'){expect(Object.isFrozen(captured![0].timing.reference.fitness)).toBe(true);expect(Object.isFrozen(captured![0].timing.parameters.context.anchor.header)).toBe(true);}
});
