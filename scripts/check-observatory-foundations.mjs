import assert, {AssertionError} from 'node:assert/strict';
import {createServer} from 'vite';

// Semantic checks reuse Vite's existing TypeScript consumer, not a duplicate model.
const implemented = new Set(['AC-1','AC-9','AC-10','AC-11','AC-12']);
let server;
let monitor;
let assertions = 0;
const check = (actual,expected,message) => {assert.deepEqual(actual,expected,message);assertions++;};
try {
  const [criterion,...options] = process.argv.slice(2);
  if (!implemented.has(criterion) || options.length) throw new Error(`Incomplete or invalid check invocation: ${criterion}. Implemented interim checks: ${[...implemented].join(', ')}`);
  server = await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
  const {asOperationBatch,asBlockHeader} = await server.ssrLoadModule('/rpc/guards.ts');
  const {groupsFor,committeeAuthority,signerPower} = await server.ssrLoadModule('/consensus/phaseEvidence.ts');
  const {NetworkMonitor} = await server.ssrLoadModule('/monitor/networkMonitor.ts');
  const source = {network:'mainnet',name:'Observer A',baseUrl:'https://observer-a.invalid'};
  const rights = [{address:'D1',slot:0,power:3},{address:'D2',slot:1,power:2}];
  const context = {source,chainId:'NetFixture',requestedHeadHash:'Parent',observedHeadHash:'Parent',predecessor:'Grandparent',protocol:4,receivedAt:Date.now(),receivedMonotonic:performance.now()};
  const individual = (payload,slot) => ({hash:`individual-${payload}-${slot}`,contents:[{kind:'preattestation',level:120,round:2,slot,block_payload_hash:payload}]});
  const aggregate = (committee) => ({hash:`aggregate-${JSON.stringify(committee)}`,contents:[{kind:'preattestations_aggregate',consensus_content:{level:120,round:2,block_payload_hash:'P'},committee}]});
  const admit = raw => asOperationBatch(raw).map(operation => ({...operation,evidence:context}));
  const header = {level:119,hash:'Parent',predecessor:'Grandparent',timestamp:'2026-10-14T12:00:00+02:00',fitness:['02','00000077','','ffffffff','00000000'],proto:4};
  if (criterion === 'AC-1' || criterion === 'AC-9') {
    globalThis.window = globalThis;
    const transports = [];
    let view;
    monitor = new NetworkMonitor({network:'mainnet',headSources:[source],operationSources:[source],proposalSources:[source],derive:async()=>({refreshedAt:Date.now()}),fallbackOperations:async()=>[],onUpdate:next=>{view=next;},streamFactory:settings=>{
      const transport = {settings,start(){settings.onStatus(source,null,{connects:1,messages:0,reconnects:0,bytes:0,lastLatencyMs:null});},stop(){settings.onStatus(null,null,{connects:1,messages:0,reconnects:0,bytes:0,lastLatencyMs:null});}};
      transports.push(transport);return transport;
    }});
    monitor.start();transports[0].settings.onValue(header,source,0);
    const proposal = hash => ({...header,level:120,hash,chainId:'NetFixture',payload_hash:'P',fitness:['02','00000078','','ffffffff','00000002']});
    for (const hash of ['H1','H2','H1']) transports[2].settings.onValue(proposal(hash),source,0);
    check(view.latestProposal.hash,'H2','Same-round second candidate is admitted');
    check(view.candidates.map(candidate=>candidate.header.hash),['H1','H2'],'Distinct same-round block identities and replay dedup');
    check(view.candidates.map(candidate=>candidate.header.payload_hash),['P','P'],'Shared payload retains candidate identities');
    check(view.candidates.map(candidate=>candidate.header.producer),[undefined,undefined],'No inferred producer');
    const groups=groupsFor(admit([individual('P',0),aggregate([0,0]),aggregate([0]),individual('Q',1)]),rights,120);
    const p=groups.find(group=>group.payload==='P'),q=groups.find(group=>group.payload==='Q');
    check(signerPower(p.pre,rights),3,'Individual/aggregate replay unique power');check(signerPower(q.pre,rights),2,'Competing payload separate power');
    const authority=committeeAuthority(rights,5,4);assert.equal(authority.usable,true);assertions++;
    check([authority.threshold-signerPower(p.pre,rights),authority.threshold-signerPower(q.pre,rights)],[1,2],'Exact deficits');
    check(p.pre.size,1,'Shared payload counts one signer, not each candidate');
    check(view.candidates[0].evidence.source.baseUrl,source.baseUrl,'Immutable source attribution');
  } else if (criterion === 'AC-10') {
    const groups=groupsFor(admit([individual('P',0),aggregate([0]),individual('Q',0),individual('Q',0)]),rights,120);
    check(groups.map(group=>signerPower(group.pre,rights)),[3,3],'Conflict delegate counts once independently');
    check(groups.map(group=>group.conflicts),[['D1'],['D1']],'Expose conflicting payload signer');
    const other = {...individual('P',1),evidence:{...context,source:{...source,baseUrl:'https://observer-b.invalid'}}};
    check(groupsFor([...admit([individual('P',0)]),other],rights,120).map(group=>signerPower(group.pre,rights)),[3,2],'Different sources never combine');
  } else if (criterion === 'AC-11') {
    check(asOperationBatch([aggregate([0,-1,1])])[0].contents,[],'Whole malformed aggregate uncounted');
    check(asOperationBatch([{hash:'mixed',contents:[...individual('P',0).contents,{kind:'attestation',level:120,round:-1,slot:1}]}])[0].contents,[],'Whole mixed malformed operation uncounted');
    for (const invalid of [[...rights,{address:'D1',slot:2,power:4}],[...rights,{address:'D3',slot:0,power:4}], [{address:'D1',slot:0,power:1.5}]]) check(committeeAuthority(invalid).usable,false,'Contradictory committee authority withdrawn');
    check(committeeAuthority(rights,6,4).usable,false,'Incomplete total rejected');check(committeeAuthority(rights,5,6).usable,false,'Invalid threshold rejected');
    const raw=groupsFor(admit([individual('P',0)]),[],120);
    check(raw[0].pre.size,0,'Unknown rights never count power');check(raw[0].unknownSlots,[0],'Valid raw signer retained inspectably');
  } else if (criterion === 'AC-12') {
    const safe=[{address:'D1',slot:0,power:Number.MAX_SAFE_INTEGER-1},{address:'D2',slot:1,power:1}];
    check(committeeAuthority(safe,Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER).usable,true,'Exact safe total boundary');
    check(signerPower(new Set(['D1','D2']),safe),Number.MAX_SAFE_INTEGER,'Exact cumulative safe power');
    check(committeeAuthority([{...safe[0],power:Number.MAX_SAFE_INTEGER},safe[1]]).usable,false,'Unsafe cumulative arithmetic rejected');
    for (const [total,threshold] of [[0,0],[5,0],[5,6],[5,0.5]]) check(committeeAuthority(rights,total,threshold).usable,false,'Invalid total or threshold');
    for (const threshold of [3,4,5]) {
      const authority=committeeAuthority(rights,5,threshold);check(authority.usable,true,'Threshold boundary valid');check(Math.max(0,authority.threshold-signerPower(new Set(['D1']),rights)),Math.max(0,threshold-3),'Exact threshold minus observed power');
    }
    check(asBlockHeader(header).timestamp,header.timestamp,'Legitimate timezone offset accepted');
    for (const timestamp of ['2026-02-30T12:00:00Z','2026-10-14T12:00:00','2026-13-01T12:00:00Z']) {assert.throws(()=>asBlockHeader({...header,timestamp}));assertions++;}
    for (const level of [-1,0.5,Infinity,Number.MAX_SAFE_INTEGER+1]) {assert.throws(()=>asBlockHeader({...header,level}));assertions++;}
  }
  if (!assertions) throw new Error('Incomplete execution: no assertions ran');
  console.log(`${criterion}: ${assertions} behavioral assertions passed`);
} catch (error) {
  console.error(error);
  process.exitCode = error instanceof AssertionError ? 1 : 2;
} finally {
  try {monitor?.stop();await server?.close();} catch(error) {console.error(error);process.exitCode=2;}
}
