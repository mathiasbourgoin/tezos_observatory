import assert, {AssertionError} from 'node:assert/strict';
import {createServer} from 'vite';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

// Semantic checks reuse Vite's existing TypeScript consumer, not a duplicate model.
const browserChecks=new Set(['AC-4','AC-20']);
const implemented = new Set(['AC-1','AC-9','AC-10','AC-11','AC-12',...browserChecks]);
export function classifyBrowserReport(report,runnerStatus,criterion) {
  let completed=0;
  const behavioralFailures=[];
    if(report.errors?.length)throw new Error(JSON.stringify(report.errors));
    const tests=[];
    const visit=suite=>{for(const spec of suite.specs??[])tests.push(...spec.tests);for(const nested of suite.suites??[])visit(nested);};
    for(const suite of report.suites??[])visit(suite);
    if(tests.length!==2 || new Set(tests.map(test=>test.projectName)).size!==2 || !['chromium','firefox'].every(browser=>tests.some(test=>test.projectName===browser)))throw new Error('Incomplete execution: required production-page scenario/browser missing');
    for(const test of tests){
      if(test.results?.length!==1)throw new Error('Incomplete execution: missing/retried browser result');
      const result=test.results[0];
      if(result.status==='passed'){
        if(result.errors?.length)throw new Error('Inconsistent execution: passed result contains errors');
        if(!test.annotations?.some(annotation=>annotation.type==='foundation-verified' && annotation.description===criterion))throw new Error('Incomplete execution: scenario did not finish its behavioral assertions');
        completed++;continue;
      }
      if(result.status!=='failed' || !result.errors?.length)throw new Error(`Execution failed without completed assertion: ${result.status}`);
      if(result.errors.some(error=>!/(?:^|\n)(?:Error: )?expect\(/.test((error.message??'').replace(/\u001b\[[0-9;]*m/g,''))))throw new Error(JSON.stringify(result.errors));
      behavioralFailures.push(...result.errors.map(error=>error.message));
    }
    if(behavioralFailures.length) {
      if(runnerStatus!==1)throw new Error(`Execution failed with inconsistent assertion runner status: ${runnerStatus}`);
      assert.fail(behavioralFailures.join('\n'));
    }
    if(runnerStatus!==0)throw new Error(`Runner exited ${runnerStatus} despite passing scenarios`);
    return completed;
}

if(process.argv[1] && pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
let server;
let monitor;
let assertions = 0;
const check = (actual,expected,message) => {assert.deepEqual(actual,expected,message);assertions++;};
try {
  const [criterion,...options] = process.argv.slice(2);
  if (!implemented.has(criterion)) throw new Error(`Incomplete or invalid check invocation: ${criterion}. Implemented interim checks: ${[...implemented].join(', ')}`);
  if (browserChecks.has(criterion)) {
    if(options.length!==2 || options[0]!=='--browsers' || options[1]!=='chromium,firefox')throw new Error('Both required browsers must be explicitly requested: --browsers chromium,firefox');
    const child=spawnSync('rtk',['proxy',process.execPath,'node_modules/@playwright/test/cli.js','test','tests/e2e/dashboard.spec.ts','--grep',`foundations ${criterion} `,'--project','chromium','--project','firefox','--reporter=json'],{encoding:'utf8',maxBuffer:10_000_000,timeout:90_000});
    if(child.error || child.signal)throw child.error??new Error(`Browser workflow terminated: ${child.signal}`);
    let report;
    try{report=JSON.parse(child.stdout);}catch{throw new Error(`Browser report missing/invalid: ${child.stderr}`);}
    assertions+=classifyBrowserReport(report,child.status,criterion);
  } else if(options.length)throw new Error('Unexpected check options');
  server = await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
  const {asOperationBatch,asBlockHeader} = await server.ssrLoadModule('/rpc/guards.ts');
  const {groupsFor,committeeAuthority,signerPower} = await server.ssrLoadModule('/consensus/phaseEvidence.ts');
  const {NetworkMonitor} = await server.ssrLoadModule('/monitor/networkMonitor.ts');
  const {NetworkData}=await server.ssrLoadModule('/rpc/networkData.ts');
  const source = {network:'mainnet',name:'Observer A',baseUrl:'https://observer-a.invalid'};
  const rights = [{address:'D1',slot:0,power:3},{address:'D2',slot:1,power:2}];
  const context = {source,chainId:'NetFixture',requestedHeadHash:'Parent',observedHeadHash:'Parent',predecessor:'Grandparent',protocolLevel:4,receivedAt:Date.now(),receivedMonotonic:performance.now()};
  const individual = (payload,slot) => ({hash:`individual-${payload}-${slot}`,contents:[{kind:'preattestation',level:120,round:2,slot,block_payload_hash:payload}]});
  const aggregate = (committee) => ({hash:`aggregate-${JSON.stringify(committee)}`,contents:[{kind:'preattestations_aggregate',consensus_content:{level:120,round:2,block_payload_hash:'P'},committee}]});
  const admit = raw => asOperationBatch(raw).map(operation => ({...operation,evidence:context}));
  const header = {level:119,hash:'Parent',predecessor:'Grandparent',timestamp:'2026-10-14T12:00:00+02:00',fitness:['02','00000077','','ffffffff','00000000'],proto:4};
  if(criterion==='AC-4' || criterion==='AC-21') {
    const originalFetch=globalThis.fetch;
    try {
      const data=new NetworkData('shadownet');let finish;let capturedSignal;let reads=0;
      globalThis.fetch=(_input,options)=>{reads++;capturedSignal=options?.signal;return new Promise(resolve=>{finish=resolve;});};
      const aliases=data.loadAliases();data.pause();check(capturedSignal.aborted,true,'Alias request joins collection cancellation');
      data.resume();finish(Response.json([{address:'D1',alias:'Cancelled alias'}]));await aliases;check(data.alias('D1'),undefined,'Cancelled alias cannot commit after same-context resume');
      const eligibility=data.loadEligibility(header,[{address:'D1',slot:0,power:3}],new AbortController().signal);data.pause();data.resume();finish(Response.json(true));await eligibility;check(data.forbidden('D1'),undefined,'Cancelled eligibility cannot commit after resume');
      data.pause();const before=reads;await data.loadAliases();check(reads,before,'Paused facade starts no auxiliary reads');
    }finally{globalThis.fetch=originalFetch;}
  } else if (criterion === 'AC-1' || criterion === 'AC-9') {
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
    check(view.candidates[0].evidence.requestedHeadHash,undefined,'Unpinned stream has no requested-head hash');
    check(view.candidates[0].evidence.observedHeadHash,'Parent','Only same-observer observed head context is captured');
  } else if (criterion === 'AC-10') {
    const groups=groupsFor(admit([individual('P',0),aggregate([0]),individual('Q',0),individual('Q',0)]),rights,120);
    check(groups.map(group=>signerPower(group.pre,rights)),[3,3],'Conflict delegate counts once independently');
    check(groups.map(group=>group.conflicts),[['D1'],['D1']],'Expose conflicting payload signer');
    const other = {...individual('P',1),evidence:{...context,source:{...source,baseUrl:'https://observer-b.invalid'}}};
    check(groupsFor([...admit([individual('P',0)]),other],rights,120).map(group=>signerPower(group.pre,rights)),[3,2],'Different sources never combine');
    const flood = Array.from({length:10000},(_,index)=>individual(`payload-${index}`,0));
    const floodGroups = groupsFor(admit(flood),rights,120);
    check(floodGroups.length,10000,'Permitted operation flood retains every distinct group');
    check(floodGroups.every(group=>group.pre.size===1 && group.pre.has('D1') && group.att.size===0 && group.conflicts.length===1 && group.conflicts[0]==='D1'),true,'Every flood payload keeps one exact conflicting signer');
    const phases=groupsFor(admit([individual('P',0),{hash:'other-phase',contents:[{kind:'attestation',level:120,round:2,slot:0,block_payload_hash:'Q'}]}]),rights,120);
    check(phases.every(group=>group.conflicts.length===0),true,'Different phases never fabricate a conflict');
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
    for(const fitness of [[],['00','00000077','','ffffffff','00000000'],['02','00000077','','ffffffff','ffffffff'],['02','00000077','','ffffffff','80000000'],['02','00000077','','00000000','00000000'],['02','00000078','','ffffffff','00000000']]) {assert.throws(()=>asBlockHeader({...header,fitness}));assertions++;}
    check(asBlockHeader({...header,fitness:['02','00000077','00000001','ffffffff','00000002']}).fitness[4],'00000002','Legitimate locked round and observed round accepted');
    check(asBlockHeader({...header,chain_id:'NetFixture'}).chainId,'NetFixture','Actual flattened RPC chain identity preserved');
    for (const timestamp of ['2026-02-30T12:00:00Z','2026-10-14T12:00:00','2026-13-01T12:00:00Z']) {assert.throws(()=>asBlockHeader({...header,timestamp}));assertions++;}
    for (const level of [-1,0.5,Infinity,Number.MAX_SAFE_INTEGER+1]) {assert.throws(()=>asBlockHeader({...header,level}));assertions++;}
  }
  if (!assertions) throw new Error('Incomplete execution: no assertions ran');
  console.log(`${criterion}: ${assertions} assertion groups passed${browserChecks.has(criterion) ? " including production / in chromium and firefox" : ""}`);
} catch (error) {
  console.error(error);
  process.exitCode = error instanceof AssertionError ? 1 : 2;
} finally {
  try {monitor?.stop();await server?.close();} catch(error) {console.error(error);process.exitCode=2;}
}

}
