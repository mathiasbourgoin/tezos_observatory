import assert, {AssertionError} from 'node:assert/strict';
import {createServer} from 'vite';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

// Semantic checks reuse Vite's existing TypeScript consumer, not a duplicate model.
const browserChecks=new Set(['AC-4','AC-20']);
const implemented = new Set(['AC-1','AC-3','AC-9','AC-10','AC-11','AC-12','AC-18',...browserChecks]);
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
  const {NetworkData,sources,streamSources}=await server.ssrLoadModule('/rpc/networkData.ts');
  const {HeadGeneration,commitIfCurrent}=await server.ssrLoadModule('/monitor/headGeneration.ts');
  const source = {network:'mainnet',name:'Observer A',baseUrl:'https://observer-a.invalid'};
  let rights;
  const context = {source,chainId:'NetFixture',requestedHeadHash:'Parent',observedHeadHash:'Parent',predecessor:'Grandparent',protocolLevel:4,receivedAt:Date.now(),receivedMonotonic:performance.now()};
  const individual = (payload,slot) => ({hash:`individual-${payload}-${slot}`,contents:[{kind:'preattestation',level:120,round:2,slot,block_payload_hash:payload}]});
  const aggregate = (committee) => ({hash:`aggregate-${JSON.stringify(committee)}`,contents:[{kind:'preattestations_aggregate',consensus_content:{level:120,round:2,block_payload_hash:'P'},committee}]});
  const admit = raw => asOperationBatch(raw).map(operation => ({...operation,evidence:context}));
  const header = {level:119,hash:'Parent',predecessor:'Grandparent',timestamp:'2026-10-14T12:00:00+02:00',fitness:['02','00000077','','ffffffff','00000000'],proto:4};
  const authorityContextFor=observerSource=>{
    const observer={header:{...header,chainId:'NetFixture'},source:observerSource,chainId:'NetFixture',protocolHash:'PFixture',nextProtocolHash:'PFixture',evidence:context};
    return {observer,anchor:observer,level:120,protocolHash:'PFixture',key:JSON.stringify([observerSource.baseUrl,'NetFixture','Parent','Grandparent','PFixture',120])};
  };
  rights=[{address:'D1',slot:0,power:3,context:authorityContextFor(source)},{address:'D2',slot:1,power:2,context:authorityContextFor(source)}];
  if(criterion==='AC-3') {
    const originalFetch=globalThis.fetch,originalWindow=globalThis.window;
    const a=streamSources.mainnet[0],b=sources.mainnet[0];
    const seen=[];
    const rawHead=level=>({level,hash:`H${level}`,predecessor:`H${level-1}`,timestamp:'2026-10-14T00:00:00Z',fitness:['02',level.toString(16).padStart(8,'0'),'','ffffffff','00000000']});
    try {
      globalThis.window=globalThis;
      for(const observerLevel of [122,123]) {
        const reads=[];let view;const transports=[];
        globalThis.fetch=async input=>{
          const url=String(input);reads.push(url);const targetLevel=Number(new URL(url).searchParams.get('level'));
          if(url.endsWith('/header')){const hash=url.split('/blocks/')[1]?.split('/')[0];return Response.json({...rawHead(hash==='head'?observerLevel:Number(hash.slice(1))),chain_id:'NetFixture'});}
          if(url.endsWith('/protocols'))return Response.json({protocol:'PFixture',next_protocol:'PFixture'});
          return Response.json(url.includes('attestation_rights')?[{level:targetLevel,delegates:[{delegate:'D1',first_slot:0,attesting_power:3},{delegate:'D2',first_slot:1,attesting_power:2}]}]:{minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5});
        };
        const data=new NetworkData('mainnet');
        monitor=new NetworkMonitor({network:'mainnet',headSources:[a],operationSources:[a,b],derive:async()=>({refreshedAt:1}),reconcile:(target,signal,onObservedHead)=>data.reconcile(target,signal,onObservedHead),fallbackOperations:async()=>[],onUpdate:next=>{view=next;},streamFactory:settings=>{const transport={settings,start(){},stop(){}};transports.push(transport);return transport;}});
        monitor.start();transports[0].settings.onValue(rawHead(120),a,0);
        const vote={hash:'B-vote',contents:[{kind:'preattestation',level:123,round:9,slot:0,block_payload_hash:'P'}]};
        transports[1].settings.onValue([vote],b,0);
        check(view.unresolvedTargets.length,1,'B123 initially retained without A authority');
        const identity=view.unresolvedTargets[0].identity,receipt=view.rawOperations[0].evidence;
        for(let turn=0;turn<100 && view.unresolvedTargets.length;turn++)await new Promise(resolve=>setImmediate(resolve));
        if(view.unresolvedTargets.length)throw new Error('Incomplete B admission workflow');
        const retained=view.observationTargets.find(target=>target.identity===identity),proof=retained?.admission;
        if(!proof)throw new Error('Missing actual retained admission');
        check(proof.head.hash,`H${observerLevel}`,'Originating observer current/current+1 proof');
        check(view.snapshot.head.hash,'H120','A applied head remains independent');
        check([view.rawOperations.length,view.rawOperations[0].evidence===receipt],[1,true],'Promotion keeps one raw record and original receipt');
        check([receipt.source.baseUrl,receipt.requestedHeadHash,receipt.observedHeadHash],[b.baseUrl,undefined,undefined],'Original unpinned B provenance remains unknown where unobserved');
        check([proof.context.observer.source.baseUrl,proof.context.observer.chainId,proof.context.level,proof.context.protocolHash],[b.baseUrl,'NetFixture',123,'PFixture'],'Exact source chain target execution context');
        const group=groupsFor(view.rawOperations,proof.rights,123)[0];
        check([...group.pre],['D1'],'Actual retained delegate membership');
        check(group.round,9,'Applied round zero and wall-clock schedule cannot reject observed round nine');
        check([signerPower(group.pre,proof.rights),proof.constants.quorum-signerPower(group.pre,proof.rights)],[3,1],'Exact B power and deficit');
        check(reads.length>0 && reads.every(url=>url.startsWith(b.baseUrl)),true,'No A/C fallback reads');
        transports[1].settings.onValue([vote],b,0);
        check([view.rawOperations.length,view.observationTargets.length,view.rawOperations[0].evidence===receipt],[1,1,true],'Replay after proven B head does not duplicate or renew receipt');
        seen.push(observerLevel);monitor.stop();monitor=undefined;
      }
      check(seen,[122,123],'Both current and successor scenarios completed');
    } finally {monitor?.stop();monitor=undefined;globalThis.fetch=originalFetch;if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;}
  } else if(criterion==='AC-18') {
    const original={fetch:globalThis.fetch,window:globalThis.window,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
    const b=sources.mainnet[0],a=streamSources.mainnet[0],timers=new Map(),starts=[],reads=[],completed=[];
    let time=0,timerId=0,view,heldFirst,heldLate;
    const rawHead=level=>({level,hash:`H${level}`,predecessor:`H${level-1}`,timestamp:'2026-10-14T00:00:00Z',fitness:['02',level.toString(16).padStart(8,'0'),'','ffffffff','00000000']});
    const flush=async()=>{for(let turn=0;turn<30;turn++)await new Promise(resolve=>setImmediate(resolve));};
    const finishScenario=(id,before)=>{if(assertions<=before)throw new Error(`No assertions executed for ${id}`);completed.push(id);};
    try {
      globalThis.setTimeout=(callback,delay=0)=>{const id=++timerId;timers.set(id,{callback,due:time+delay});return id;};
      globalThis.clearTimeout=id=>{timers.delete(id);};globalThis.window=globalThis;
      globalThis.fetch=async input=>{
        const url=String(input);reads.push(url);
        if(url.endsWith('/blocks/head/header')){
          starts.push(time);
          if(starts.length===1)await new Promise(resolve=>{heldFirst=resolve;});
          if(starts.length===2)return Response.json({error:'Unavailable unchanged B context'},{status:503});
          if(starts.length===4)await new Promise(resolve=>{heldLate=resolve;});
          return Response.json({...rawHead(122),chain_id:'NetFixture'});
        }
        if(url.endsWith('/header')){const hash=url.split('/blocks/')[1]?.split('/')[0];return Response.json({...rawHead(Number(hash.slice(1))),chain_id:'NetFixture'});}
        if(url.endsWith('/protocols'))return Response.json({protocol:'PFixture',next_protocol:'PFixture'});
        const level=Number(new URL(url).searchParams.get('level'));
        return Response.json(url.includes('attestation_rights')?[{level,delegates:[{delegate:'D1',first_slot:0,attesting_power:3},{delegate:'D2',first_slot:1,attesting_power:2}]}]:{minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5});
      };
      const data=new NetworkData('mainnet'),transports=[];
      monitor=new NetworkMonitor({network:'mainnet',headSources:[a],operationSources:[a,b],reconciliationClock:()=>time,derive:async()=>({refreshedAt:1}),reconcile:(target,signal,onObservedHead)=>data.reconcile(target,signal,onObservedHead),fallbackOperations:async()=>[],onUpdate:next=>{view=next;},streamFactory:settings=>{const transport={settings,start(){},stop(){}};transports.push(transport);return transport;}});
      monitor.start();transports[0].settings.onValue(rawHead(120),a,0);
      const vote=(payload,level=123)=>({hash:`vote-${payload}`,contents:[{kind:'preattestation',level,round:0,slot:0,block_payload_hash:payload}]});
      const deliver=payload=>transports[1].settings.onValue([vote(payload)],b,0);
      let before=assertions;deliver('K1');deliver('K2');deliver('K3');
      check(starts,[0],'One source workflow in flight while newer targets coalesce');
      check(view.unresolvedTargets.length,3,'All immutable targets retained independently of queued work');
      if(!heldFirst)throw new Error('Missing initial deferred source read');heldFirst();await flush();
      check(view.observationTargets.length,0,'Obsolete K1 workflow cannot commit while newer K3 is queued');
      time=14999;
      for(const [id,timer] of [...timers])if(timer.due<=time){timers.delete(id);timer.callback();}await flush();
      check(starts,[0],'14999ms cannot start queued source workflow');
      time=15000;
      for(const [id,timer] of [...timers])if(timer.due<=time){timers.delete(id);timer.callback();}await flush();
      check(starts,[0,15000],'Newest queued workflow starts exactly at 15000ms boundary');
      const failed=view.unresolvedTargets.find(target=>target.target.payload==='K3');
      if(!failed)throw new Error('Missing retained failed target');
      check([Boolean(failed.error),view.observationTargets.length],[true,0],'Failed unchanged context remains unresolved without authority');
      check(view.unresolvedTargets.filter(target=>target.error).map(target=>target.target.payload),['K3'],'Only newest K3 workflow executes; intermediate K2 remains unattempted');
      finishScenario('coalescing-and-spacing',before);
      before=assertions;const receipt=view.rawOperations.find(operation=>operation.hash==='vote-K3').evidence;
      deliver('K3');check(starts.length,2,'Replay cannot reset failed context');
      time=29999;check(monitor.reconcileObservation(failed.identity),false,'Early manual retry neither starts nor queues');
      time=30000;check(monitor.reconcileObservation(failed.identity),true,'Fresh manual action after cooldown permits one workflow');await flush();
      check(starts,[0,15000,30000],'All actual originating-source workflow starts honor cooldown');
      check([view.rawOperations.length,view.rawOperations.find(operation=>operation.hash==='vote-K3').evidence===receipt],[3,true],'Promotion does not reinsert operations or renew receipt');
      deliver('K3');check([view.rawOperations.length,starts.length],[3,3],'Replay after admission stays one raw record and starts no workflow');
      check(reads.every(url=>url.startsWith(b.baseUrl)),true,'Actual reconciliation ledger never cascades to A/C');
      check(timers.size,0,'No permanent source reconciliation polling timer');
      finishScenario('failure-and-explicit-retry',before);
      before=assertions;time=50000;transports[1].settings.onValue([vote('Late',124)],b,0);
      check(starts.length,4,'New material target starts a distinct bounded workflow');
      if(!heldLate)throw new Error('Missing deferred late read');monitor.stop();data.pause();data.resume();monitor.start();heldLate();await flush();
      check(view.unresolvedTargets.some(target=>target.target.payload==='Late'),true,'Cancelled late target remains readable as unresolved');
      check(view.observationTargets.some(target=>target.target.payload==='Late'),false,'Late body ignoring abort cannot authorize after resume');
      check(starts.length,4,'Resume itself does not retry cancelled source context');
      check(view.snapshot.head.hash,'H120','Source-local lifecycle never replaces primary applied head');
      finishScenario('cancelled-late-body',before);
      check(completed,['coalescing-and-spacing','failure-and-explicit-retry','cancelled-late-body'],'All mandatory source-reconciliation scenarios completed');
    } finally {monitor?.stop();monitor=undefined;globalThis.fetch=original.fetch;globalThis.setTimeout=original.setTimeout;globalThis.clearTimeout=original.clearTimeout;if(original.window===undefined)delete globalThis.window;else globalThis.window=original.window;}
  } else if(criterion==='AC-4' || criterion==='AC-21') {
    const originalFetch=globalThis.fetch;
    try {
      const data=new NetworkData('shadownet');let finish;let capturedSignal;let reads=0;
      globalThis.fetch=(_input,options)=>{reads++;capturedSignal=options?.signal;return new Promise(resolve=>{finish=resolve;});};
      const aliases=data.loadAliases();data.pause();check(capturedSignal.aborted,true,'Alias request joins collection cancellation');
      data.resume();finish(Response.json([{address:'D1',alias:'Cancelled alias'}]));await aliases;check(data.alias('D1'),undefined,'Cancelled alias cannot commit after same-context resume');
      let started;const eligibilityStarted=new Promise(resolve=>{started=resolve;});
      globalThis.fetch=(input,options)=>{
        reads++;const url=String(input);
        if(url.endsWith('/header'))return Promise.resolve(Response.json({...header,chain_id:'NetFixture'}));
        if(url.endsWith('/protocols'))return Promise.resolve(Response.json({protocol:'PFixture',next_protocol:'PFixture'}));
        capturedSignal=options?.signal;return new Promise(resolve=>{finish=resolve;started();});
      };
      const eligibility=data.loadEligibility(header,[{address:'D1',slot:0,power:3}],new AbortController().signal);await eligibilityStarted;data.pause();check(capturedSignal.aborted,true,'Eligibility request joins collection cancellation');data.resume();finish(Response.json(true));await eligibility;check(data.forbidden('D1'),undefined,'Cancelled eligibility cannot commit after resume');
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
    check(view.latestProposal.hash,'H2','Same-round second raw candidate is retained');
    const retainedCandidates=[...view.candidates,...view.unresolvedCandidates];
    check(retainedCandidates.map(candidate=>candidate.header.hash),['H1','H2'],'Distinct same-round block identities and replay dedup');
    check(retainedCandidates.map(candidate=>candidate.header.payload_hash),['P','P'],'Shared payload retains candidate identities');
    check(retainedCandidates.map(candidate=>candidate.header.producer),[undefined,undefined],'No inferred producer');
    const groups=groupsFor(admit([individual('P',0),aggregate([0,0]),aggregate([0]),individual('Q',1)]),rights,120);
    const p=groups.find(group=>group.payload==='P'),q=groups.find(group=>group.payload==='Q');
    check(signerPower(p.pre,rights),3,'Individual/aggregate replay unique power');check(signerPower(q.pre,rights),2,'Competing payload separate power');
    const authority=committeeAuthority(rights,5,4);assert.equal(authority.usable,true);assertions++;
    check([authority.threshold-signerPower(p.pre,rights),authority.threshold-signerPower(q.pre,rights)],[1,2],'Exact deficits');
    check(p.pre.size,1,'Shared payload counts one signer, not each candidate');
    check(retainedCandidates[0].evidence.source.baseUrl,source.baseUrl,'Immutable source attribution');
    check(retainedCandidates[0].evidence.requestedHeadHash,undefined,'Unpinned stream has no requested-head hash');
    check(retainedCandidates[0].evidence.observedHeadHash,'Parent','Only same-observer observed head context is captured');
  // Scoped context assertions below remain partial until slice 6 uses the retained application store.
  } else if(criterion==='AC-17') {
    const originalFetch=globalThis.fetch;
    try {
      const fixture=(hash,level,parent)=>({...header,hash,level,predecessor:parent,chainId:'NetFixture',fitness:['02',level.toString(16).padStart(8,'0'),'','ffffffff','00000000']});
      const h1=fixture('H1',120,'P1'),h2=fixture('H2',120,'P2');
      const headers=new Map([['H1',h1],['H2',h2],['P1',fixture('P1',119,'G1')],['P2',fixture('P2',119,'G2')]]);
      let delayed=false,started;const starts=new Promise(resolve=>{started=resolve;});const finishes=[];
      globalThis.fetch=async input=>{
        const url=new URL(String(input)),hash=url.pathname.split('/blocks/')[1]?.split('/')[0];
        if(url.pathname.endsWith('/header'))return Response.json({...headers.get(hash),chain_id:'NetFixture'});
        if(url.pathname.endsWith('/protocols'))return Response.json({protocol:'PFixture',next_protocol:'PFixture'});
        const level=Number(url.searchParams.get('level'));
        if(url.pathname.includes('attestation_rights')){
          const body=[{level,delegates:[{delegate:hash==='H1'||hash==='P1'?'Old':'New',first_slot:0,attesting_power:5}]}];
          if(delayed&&(hash==='H1'||hash==='P1'))return new Promise(resolve=>{finishes.push(()=>resolve(Response.json(body)));if(finishes.length===2)started();});
          return Response.json(body);
        }
        return Response.json({minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5});
      };
      const historicalData=new NetworkData('mainnet'),historical=await historicalData.derive(h1,new AbortController().signal);
      check(historical.rights.get(120)[0].evidence.requestedHeadHash,'P1','Current rights anchored to exact predecessor');
      check(historical.rights.get(121)[0].evidence.requestedHeadHash,'H1','Successor rights anchored to observed head');
      const oldEvidence=historical.rights.get(120)[0].evidence;
      const data=new NetworkData('mainnet'),state=new HeadGeneration();
      const first=state.transition(h1);delayed=true;
      const oldWork=commitIfCurrent(state,first,signal=>data.derive(h1,signal));await starts;
      const second=state.transition(h2);check(state.snapshot().derived,null,'H1 authority withdrawn immediately on same-height H2');
      const newWork=await commitIfCurrent(state,second,signal=>data.derive(h2,signal));check(newWork,true,'H2 commits its own coherent context');
      for(const finish of finishes)finish();check(await oldWork,false,'Late H1 responses cannot authorize H2');
      check(state.snapshot().derived.rights.get(120)[0].address,'New','H2 never receives old fork committee');
      check(oldEvidence.requestedHeadHash,'P1','Historical requested context remains immutable');
      check(oldEvidence.contextHeadHash,'H1','Historical observed context remains immutable');
      check(historical.rights.get(120)[0].context.observer.header.predecessor,'P1','Historical raw predecessor remains attributable');
      const observerSource=state.snapshot().derived.contexts.get(120).observer.source;
      const staleOperation={...individual('OldPayload',0),contents:[{kind:'preattestation',level:120,round:0,slot:0,block_payload_hash:'OldPayload'}],evidence:{source:observerSource,observedHeadHash:'H1',receivedAt:1,receivedMonotonic:1}};
      const uncounted=groupsFor([staleOperation],state.snapshot().derived.rights.get(120),120)[0];
      check(uncounted.pre.size,0,'Old-head raw evidence cannot authorize current numerical power');check(uncounted.unknownSlots,[0],'Old context raw signer remains inspectable');
      globalThis.fetch=async input=>String(input).endsWith('/protocols')?Response.json({proto:4}):Response.json({...h2,chain_id:'NetFixture'});
      const unknown=await new NetworkData('mainnet').derive(h2,new AbortController().signal);
      check(unknown.rights.size,0,'Shell protocol counter cannot replace proven protocol identity');check(unknown.constants,null,'Unknown context has no protocol authority');
      check(unknown.predecessor,null,'No inferred predecessor from level arithmetic');
      check(unknown.errors.some(error=>error.includes('context')),true,'Unknown context is explicit');
    }finally{globalThis.fetch=originalFetch;}
  } else if (criterion === 'AC-10') {
    const groups=groupsFor(admit([individual('P',0),aggregate([0]),individual('Q',0),individual('Q',0)]),rights,120);
    check(groups.map(group=>signerPower(group.pre,rights)),[3,3],'Conflict delegate counts once independently');
    check(groups.map(group=>group.conflicts),[['D1'],['D1']],'Expose conflicting payload signer');
    const other = {...individual('P',1),evidence:{...context,source:{...source,baseUrl:'https://observer-b.invalid'}}};
    check(groupsFor([...admit([individual('P',0)]),other],rights,120).map(group=>signerPower(group.pre,rights)),[3,0],'Other source cannot consume A authority');
    const otherRights=rights.map(right=>({...right,context:authorityContextFor(other.evidence.source)}));
    check(groupsFor([...admit([individual('P',0)]),other],otherRights,120).map(group=>signerPower(group.pre,otherRights)),[0,2],'Each observer requires its own proven authority');
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
