import assert, {AssertionError} from 'node:assert/strict';
import {createServer} from 'vite';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

// Semantic checks reuse Vite's existing TypeScript consumer, not a duplicate model.
const browserChecks=new Set(['AC-4','AC-5','AC-8','AC-13','AC-16','AC-17','AC-20','AC-22','AC-23','AC-24','AC-25','AC-31','AC-32']);
// Preserve the contractual native command spelling while requiring production evidence too.
const implicitBrowserChecks=new Set(['AC-16','AC-17','AC-23']);
const implemented = new Set(['AC-1','AC-2','AC-3','AC-9','AC-10','AC-11','AC-12','AC-14','AC-18','AC-19',...browserChecks]);
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
    if(!(implicitBrowserChecks.has(criterion)&&options.length===0) && (options.length!==2 || options[0]!=='--browsers' || options[1]!=='chromium,firefox'))throw new Error('Both required browsers must be explicitly requested: --browsers chromium,firefox');
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
  if(['AC-2','AC-14','AC-16','AC-19','AC-22','AC-23','AC-24','AC-25','AC-31','AC-32'].includes(criterion)) {
    const {ObservationStore}=await server.ssrLoadModule('/monitor/observationStore.ts');
    const originalFetch=globalThis.fetch,completed=[],reads=[],signal=new AbortController().signal;
    const observer=sources.mainnet[0];let body={validated:[]},headReads=0,changeContext=false;
    const rawHead=(level=120,fork=false)=>({level,hash:`H${level}${fork?'fork':''}`,predecessor:`H${level-1}`,chain_id:'NetFixture',timestamp:'2026-10-14T00:00:00Z',fitness:['02',level.toString(16).padStart(8,'0'),'','ffffffff','00000000']});
    const full=validated=>({validated,refused:[],outdated:[],branch_refused:[],branch_delayed:[],unprocessed:[]});
    const unrelated={hash:'transaction',branch:'H119',contents:[{kind:'transaction',source:'D1',destination:'D2',fee:'1',counter:'1',gas_limit:'100',storage_limit:'0',amount:'1'}]};
    const packet=(hash,payload='P')=>({hash,branch:'H119',contents:[{kind:'preattestation',level:121,round:0,slot:0,block_payload_hash:payload}]});
    const receipt=(source=observer)=>({source,receivedAt:Date.now(),receivedMonotonic:performance.now()});
    const finish=(id,before)=>{if(assertions<=before)throw new Error(`Incomplete execution: ${id} ran no assertions`);completed.push(id);};
    const flush=async predicate=>{for(let turn=0;turn<100&&!predicate();turn++)await new Promise(resolve=>setImmediate(resolve));if(!predicate())throw new Error('Fixture workflow did not reach required consumer boundary');};
    const rpc=async input=>{
      const url=String(input);reads.push(url);
      if(url.includes('pending_operations'))return body==='truncated'?new Response('{"validated":['):Response.json(body);
      if(url.endsWith('/header')){const block=url.split('/blocks/')[1]?.split('/')[0];if(block==='head'){headReads++;return Response.json(rawHead(120,changeContext&&headReads>1));}return Response.json({...rawHead(Number(block.match(/\d+/)?.[0])),hash:block});}
      if(url.endsWith('/protocols'))return Response.json({protocol:'PFixture',next_protocol:'PFixture'});
      const level=Number(new URL(url).searchParams.get('level'));
      if(url.includes('attestation_rights'))return Response.json([{level,delegates:criterion==='AC-31'?[{delegate:'D1',first_slot:0,attesting_power:3},{delegate:'D2',first_slot:1,attesting_power:1},{delegate:'D3',first_slot:2,attesting_power:1}]:[{delegate:'D1',first_slot:0,attesting_power:3},{delegate:'D2',first_slot:1,attesting_power:2}]}]);
      if(url.endsWith('/context/constants'))return Response.json({minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5});
      throw new Error(`Unexpected fixture endpoint: ${url}`);
    };
    try {
      globalThis.fetch=rpc;
      const data=new NetworkData('mainnet'),head={...asBlockHeader(rawHead()),evidence:receipt()};
      const derived=await data.derive(head,signal),targetContext=derived.contexts.get(121);
      if(!targetContext || !derived.constantsByLevel.get(121) || !derived.rights.get(121))throw new Error('Missing real RPC-derived fixture authority');
      const proof={head,derived,context:targetContext,rights:derived.rights.get(121),constants:derived.constantsByLevel.get(121)};
      const makeStore=()=>{
        const store=new ObservationStore('mainnet',sources.mainnet);
        const evidence=receipt(),candidate={identity:`candidate-${evidence.receivedMonotonic}`,header:{...asBlockHeader(rawHead(121)),payload_hash:'P',evidence},evidence};
        const record=store.addCandidate(candidate);if(!record)throw new Error('Missing actual retained candidate');return {store,record};
      };
      const pending=async()=>{headReads=0;return data.pending(signal,head,targetContext);};
      if(criterion==='AC-2') {
        let before=assertions;const zero=makeStore();body=full([]);const snapshot=await pending();zero.store.accept({...proof,...zero.store.generation(observer),snapshot});
        const retained=zero.store.target(zero.record.identity);
        check([retained?.coverage?.complete,retained?.phases?.pre?.power,retained?.phases?.att?.power],[true,0,0],'Only a coherent post-established full source snapshot measures both empty phases');
        check([retained.coverage.evidence.source.baseUrl,retained.coverage.evidence.receivedAt],[observer.baseUrl,snapshot.evidence.receivedAt],'Zero retains actual source and original snapshot receipt');finish('source-scoped-zero',before);
        before=assertions;const missing=makeStore();check([missing.store.target(missing.record.identity)?.coverage,missing.store.target(missing.record.identity)?.phases],[undefined,undefined],'Unproved identity and missing observations cannot supply zero');
        assert.throws(()=>missing.store.accept({...proof,...missing.store.generation(observer),rights:[],snapshot}),/admission|context|committee/i);assertions++;
        check([missing.store.acceptedTargets().length,missing.store.target(missing.record.identity)?.coverage],[0,undefined],'Unavailable coherent rights cannot publish zero or missing-delegate authority');finish('missing-authority',before);
        before=assertions;const partial=makeStore();partial.store.addOperations([{...packet('positive'),evidence:receipt()}]);partial.store.accept({...proof,...partial.store.generation(observer)});
        const positive=partial.store.acceptedTargets().find(record=>!record.target.candidate);
        check([positive?.phases?.pre?.power,positive?.phases?.att,positive?.coverage],[3,undefined,undefined],'Received preattestation is positive partial evidence and cannot establish opposite-phase zero');finish('positive-partial',before);
        before=assertions;const originalWindow=globalThis.window,transports=[];let latest;
        globalThis.window={setTimeout:()=>1,clearTimeout:()=>{}};
        try {
          monitor=new NetworkMonitor({network:'mainnet',headSources:[observer],operationSources:[],derive:(head,signal)=>data.derive(head,signal),fallbackOperations:async()=>[],onUpdate:view=>{latest=view;},streamFactory:options=>{const transport={options,start(){},stop(){}};transports.push(transport);return transport;}});
          monitor.start();const transport=transports.find(transport=>transport.options.path.includes('/monitor/heads/'));if(!transport)throw new Error('Actual primary head consumer missing');
          transport.options.onValue(asBlockHeader(rawHead()),observer);await flush(()=>latest?.snapshot?.derived!==null&&latest?.snapshot?.derived!==undefined);
          check(latest.progression,null,'Connected initial head is not invented progression');
          transport.options.onValue(asBlockHeader(rawHead(121)),observer);await flush(()=>latest?.progression?.to.header.hash==='H121');
          const progress=latest.progression;check([progress.kind,progress.from.header.hash,progress.to.header.hash],['next-level','H120','H121'],'Observed source-compatible head transition proves advancement');
          transport.options.onStatus(observer,'Transport reconnecting',{connects:1,messages:2,reconnects:1,bytes:1,lastLatencyMs:null});
          check([latest.headStream.error,latest.progression],['Transport reconnecting',progress],'Reconnecting transport preserves independent attributed advancement');
          check(progress.evidence.source.baseUrl,observer.baseUrl,'Progress never borrows another observer identity');finish('independent-health',before);
        } finally {monitor?.stop();monitor=undefined;globalThis.window=originalWindow;}
        check(completed,['source-scoped-zero','missing-authority','positive-partial','independent-health'],'All complete AC2 clauses reached actual consumers');
      } else if(['AC-16','AC-22','AC-23','AC-24','AC-25','AC-32'].includes(criterion)) {
        let sequence=0;
        const fact=(hash,payload='P',at=++sequence,slot=0,from=observer)=>({...packet(hash,payload),contents:[{kind:'preattestation',level:121,round:0,slot,block_payload_hash:payload}],evidence:{...receipt(from),receivedAt:at,receivedMonotonic:at}});
        const candidate=(index,payload='P',at=index+2,from=observer)=>({identity:`history-${String(index).padStart(3,'0')}`,header:{...asBlockHeader(rawHead(121)),hash:`Candidate${index}`,payload_hash:payload},evidence:{...receipt(from),receivedAt:at,receivedMonotonic:at}});
        const seeded=()=>{const store=new ObservationStore('mainnet',sources.mainnet),record=store.addOperations([fact('seed','P',1)])[0];if(!record)throw new Error('Missing actual retained history seed');store.accept({...proof,...store.generation(observer)});return {store,record};};
        if(criterion==='AC-16') {
          let before=assertions;const {store,record}=seeded();body=full([]);const snapshot=await pending();store.accept({...proof,...store.generation(observer),snapshot});check(store.pin(record.identity),true,'Actual source A history is locally inspectable');const original=store.inspection().snapshot;
          check([original?.record.target.source.baseUrl,original?.record.admission.context.protocolHash,original?.record.admission.context.observer.header.hash,original?.record.admission.context.observer.header.predecessor],[observer.baseUrl,'PFixture','H120','H119'],'Retained history captures original source protocol head and parent');check(original?.record.coverage.evidence,snapshot.evidence,'Historical source snapshot retains original body receipt');finish('original-history-facts',before);
          before=assertions;const b=sources.mainnet.find(value=>value.baseUrl!==observer.baseUrl);if(!b)throw new Error('Second configured historical observer missing');const other=store.addOperations([fact('new-provider','OtherPayload',2,0,b)])[0];if(!other)throw new Error('Provider-switch fixture target missing');
          store.accept(await new NetworkData('mainnet').reconcile(other.target,signal));store.interrupt(observer);
          check(store.target(record.identity)?.coverageStale,true,'Interrupted original source has stale live coverage');const retained=store.inspection().snapshot;
          check([retained?.record.target.source.baseUrl,retained?.evidence.receivedAt,retained?.evidence.receivedMonotonic],[observer.baseUrl,1,1],'Provider switch cannot relabel or renew pinned historical observation');check(retained?.record.coverage.evidence,snapshot.evidence,'As-of historical source snapshot receipt stays immutable after interruption');
          check(retained?.record.admission.rights[0].evidence.source.baseUrl,observer.baseUrl,'Historical helper responder is not rewritten to new provider');finish('provider-switch-and-stale',before);
          before=assertions;const order=store.history().map(value=>value.identity),readsBefore=reads.length,realNow=Date.now;
          try{Date.now=()=>Date.parse('2030-01-01T00:00:00Z');store.pin(record.identity);const readback=store.inspection().snapshot;check([readback?.evidence.receivedAt,readback?.evidence.receivedMonotonic,readback?.record.coverage.evidence.receivedAt,readback?.record.coverage.evidence.receivedMonotonic],[1,1,snapshot.evidence.receivedAt,snapshot.evidence.receivedMonotonic],'Wall-clock jump preserves original wall and monotonic historical receipts');check(store.history().map(value=>value.identity),order,'Wall-clock change cannot reorder first-receipt history');check(reads.length,readsBefore,'Actual local historical retrieval starts no source requests');}finally{Date.now=realNow;}finish('clock-and-local-readback',before);
          check(completed,['original-history-facts','provider-switch-and-stale','clock-and-local-readback'],'All native AC16 provenance/age-order clauses completed with required browser age evidence');
        } else if(criterion==='AC-22') {
          let before=assertions;const {store,record}=seeded(),first=store.addCandidate(candidate(0));if(!first)throw new Error('Missing pin candidate');
          check(store.pin(first.identity),true,'Actual history candidate can be pinned');const original=store.inspection().snapshot;
          for(let index=1;index<101;index++)store.addCandidate(candidate(index));
          check([store.acceptedTargets().some(value=>value.identity===first.identity),store.inspection().frozen],[false,false],'Active-index eviction neither loses historical candidate nor freezes pin');
          check(store.inspection().snapshot?.candidates.some(value=>value.identity===first.identity),true,'Per-instance trimming protects selected candidate fact');
          store.addOperations([fact('late-signer','P',200,1)]);const enriched=store.inspection();
          check([enriched.selectedIdentity,enriched.snapshot?.record.phases?.pre?.maximumPower],[first.identity,5],'Later same-identity accepted evidence enriches retained pin');check(enriched.snapshot?.pre,['D1','D2'],'Historical reader retains actual signer facts');check(original?.record.phases?.pre?.maximumPower,3,'Earlier immutable snapshot is unchanged by enrichment');finish('retained-pin-enrichment',before);
          before=assertions;for(let index=101;index<252;index++)store.addCandidate(candidate(index,`P${index}`));const frozen=store.inspection();
          check([frozen.frozen,frozen.selectedIdentity,frozen.snapshot?.record.phases?.pre?.maximumPower],[true,first.identity,5],'History eviction freezes one separately retained enriched selection');
          store.addOperations([fact('frozen-return','P',1000)]);check(store.inspection().snapshot,frozen.snapshot,'Later replay cannot mutate frozen history');check(store.inspection().snapshot===frozen.snapshot,true,'Frozen snapshot object stays static');
          check(store.pin('history-251'),true,'New retained pin replaces frozen selection');check([store.inspection().frozen,store.inspection().snapshot===frozen.snapshot],[false,false],'Only the replacement pin remains selected');finish('history-eviction-freezes',before);
          check(completed,['retained-pin-enrichment','history-eviction-freezes'],'All native AC22 clauses completed with required browser controls');
        } else if(criterion==='AC-23') {
          let before=assertions;const {store,record}=seeded();check(record.target.candidate,undefined,'Candidate-free raw identity has no invented hash');check(store.unresolvedTargets().length,0,'Successful admission removes quarantine duplicate');
          store.addCandidate(candidate(1));store.addCandidate(candidate(2));const same=store.history().find(snapshot=>snapshot.candidates.length===2);check(same?.candidates.map(value=>value.target.candidate?.header.hash),['Candidate1','Candidate2'],'Shared payload retains distinct observed block hashes within one full instance');
          const b=sources.mainnet.find(value=>value.baseUrl!==observer.baseUrl);if(!b)throw new Error('Second configured observer missing');
          const separate=store.addOperations([fact('B-unresolved','P',10,0,b)])[0];check([store.unresolvedTargets().length,separate.target.candidate],[1,undefined],'Another observer stays separate and unresolved without a fabricated block');
          const bProof=await new NetworkData('mainnet').reconcile(separate.target,signal);store.accept(bProof);
          check([store.unresolvedTargets().length,store.history().length],[0,2],'Second observer promotion preserves separate full source-context instance and removes quarantine duplicate');
          check(new Set(store.history().map(snapshot=>snapshot.record.target.source.baseUrl)).size,2,'Same coordinates and payload never merge across observers');finish('source-instance-candidate-identities',before);
          check(completed,['source-instance-candidate-identities'],'All native AC23 identity/promotion clauses completed');
        } else if(criterion==='AC-24') {
          let before=assertions;const {store}=seeded();for(let index=0;index<151;index++)store.addCandidate(candidate(index,`P${index}`,2));
          check([store.history().length,store.acceptedTargets().filter(value=>value.target.candidate).length],[150,100],'Full candidate-only history and active candidate products enforce independent bounds');
          check([store.target('history-000'),store.target('history-001')?.target.candidate.header.hash],[undefined,'Candidate1'],'Equal monotonic first receipts use stable lexical identity ties');
          const firstReceipt=store.target('history-001').evidence;store.addCandidate(candidate(1,'P1',999));check(store.target('history-001').evidence,firstReceipt,'Replay cannot refresh original receipt or retention order');
          for(let index=0;index<101;index++){const value=candidate(1000+index,`Unknown${index}`,1000+index);store.addCandidate({...value,header:{...value.header,level:2147483647,fitness:['02','7fffffff','','ffffffff','00000000']}});}
          check([store.history().length,store.acceptedTargets().filter(value=>value.target.candidate).length,store.unresolvedTargets().length],[150,100,100],'Unresolved enormous-level flood cannot evict accepted histories/candidates');finish('independent-bounds-and-ties',before);
          before=assertions;const protectedHistory=seeded(),pinned=protectedHistory.store.addCandidate(candidate(0));protectedHistory.store.pin(pinned.identity);for(let index=1;index<101;index++)protectedHistory.store.addCandidate(candidate(index));
          body=full([]);const snapshot=await pending();protectedHistory.store.accept({...proof,...protectedHistory.store.generation(observer),snapshot});const inspected=protectedHistory.store.inspection().snapshot;
          check([inspected.candidates.length,inspected.partial,inspected.candidates.some(value=>value.identity===pinned.identity)],[100,true,true],'Candidate-fact cap protects pin and discloses partial retention');
          check([inspected.record.coverage?.complete,inspected.candidates.some(value=>value.coverage?.complete===true)],[false,false],'Historical and candidate publication cannot bypass partial coverage');
          for(let batch=0;batch<2;batch++)protectedHistory.store.addOperations(Array.from({length:10000},(_,index)=>fact(`unknown-${batch}-${index}`,'P',2000+batch*10000+index,index+2+batch*10000)));
          const bounded=protectedHistory.store.inspection().snapshot;check([protectedHistory.store.rawOperations().length,bounded.unknownSlots.length<=10000,bounded.partial],[10000,true,true],'Actual raw turnover and unique historical facts stay bounded with partial disclosure');finish('candidate-and-unique-fact-bounds',before);
          check(completed,['independent-bounds-and-ties','candidate-and-unique-fact-bounds'],'All native AC24 bounded-retention clauses completed');
        } else if(criterion==='AC-25') {
          let before=assertions;const {store,record}=seeded();store.pin(record.identity);store.addOperations([fact('seed','P',1),fact('same-instance-enrichment','P',2,1)]);check(store.inspection().newer,0,'Replay and late same-identity enrichment are not newer selectable items');
          store.addOperations([fact('new-instance','Q',3)]);check(store.inspection().newer,1,'First accepted candidate-free instance counts once');
          store.addCandidate(candidate(1,'Q',4));check(store.inspection().newer,1,'Candidate representation does not double count its newly accepted instance');store.addCandidate(candidate(2,'Q',5));check(store.inspection().newer,2,'Distinct second candidate is one new selectable unit');
          store.addCandidate(candidate(2,'Q',999));check(store.inspection().newer,2,'Candidate replay cannot increase newer count');finish('newer-unit-accounting',before);
          before=assertions;check(store.latest(),true,'Latest selects coherent current evidence');check(store.inspection().selectedIdentity,'history-002','Latest uses original receipt, never replay receipt or claimed height');store.followLive();check([store.inspection().mode,store.inspection().selectedIdentity],['follow','history-002'],'Follow enables coherent live selection independently from pin');
          store.stop();store.pin(record.identity);check(store.inspection().mode,'pin','Paused local inspection does not resume collection');store.observeHead({...head,hash:'Fork120',evidence:receipt()});check(store.latest(),false,'Latest reports unavailable when no coherent live context exists');check([store.inspection().mode,store.inspection().snapshot],['follow',undefined],'Unavailable action never substitutes historical pin');finish('latest-follow-unavailable',before);
          before=assertions;const lower=seeded();lower.store.pin(lower.record.identity);for(let index=0;index<151;index++)lower.store.addCandidate(candidate(index,`Retired${index}`));const count=lower.store.inspection().newer;lower.store.addCandidate(candidate(0,'Retired0',9999));
          check([count>=150,lower.store.inspection().newer,lower.store.inspection().newerPartial],[true,count,true],'Bounded identity loss keeps an honest qualified newer lower bound without counting uncertain replay');finish('bounded-newer-uncertainty',before);
          check(completed,['newer-unit-accounting','latest-follow-unavailable','bounded-newer-uncertainty'],'All native AC25 selection/count clauses completed');
        } else {
          let before=assertions;const {store,record}=seeded();for(let index=0;index<14;index++){store.addOperations([fact(`event-${index}-below`,`Event${index}`,10+index*2)]);store.addOperations([fact(`event-${index}-above`,`Event${index}`,11+index*2,1)]);}const events=store.acceptedEvents();
          check([events.length,new Set(events.map(event=>event.identity)).size],[12,12],'Actual event owner retains at most twelve distinct attributed events');check(events.every(event=>event.evidence.source.baseUrl===observer.baseUrl&&event.chainId==='NetFixture'&&event.attribution==='payload-shared'),true,'Every retained event carries immutable precise source identity');finish('event-ownership',before);
          before=assertions;store.pin(record.identity);for(let index=0;index<151;index++)store.addCandidate(candidate(index,`Evict${index}`,100+index));check([store.history().length,store.inspection().frozen],[150,true],'Actual history eviction occurs independently from event retention');check(store.acceptedEvents(),events,'History eviction cannot discard or rewrite retained events');
          store.addOperations([fact('event-13-replay','Event13',999,1)]);store.stop();store.start();store.followLive();store.latest();store.inspection();check(store.acceptedEvents(),events,'Replay render-style reads resume and historical selection cannot duplicate crossings or invent progression');check(store.acceptedEvents().every((event,index)=>event===events[index]),true,'Original retained event facts and receipts remain the same immutable objects');finish('history-replay-event-independence',before);
          before=assertions;store.addCandidate(candidate(999,'Event13',999));check(store.acceptedEvents(),events,'Candidate identity joining shared payload cannot duplicate its event');
          const b=sources.mainnet.find(value=>value.baseUrl!==observer.baseUrl);if(!b)throw new Error('Second configured event observer missing');
          const bTarget=store.addOperations([{...fact('B-first-quorum','Event13',1000,0,b),contents:[...fact('B-pre','Event13',1000,0,b).contents,...fact('B-threshold','Event13',1000,1,b).contents]}])[0];if(!bTarget)throw new Error('Second-source event target missing');
          store.accept(await new NetworkData('mainnet').reconcile(bTarget.target,signal));check([store.acceptedEvents().at(-1)?.kind,store.acceptedEvents().at(-1)?.evidence.source.baseUrl],['observed-quorum',b.baseUrl],'Another source first at quorum cannot borrow a prior source below state into a crossing');
          const afterSource=store.acceptedEvents();store.observeHead({...head,hash:'Fork120',evidence:receipt()});store.addOperations([{...fact('obsolete-context','Event13',1001,1),evidence:{...receipt(),observedHeadHash:'H120',observedHeadLevel:120}}]);check(store.acceptedEvents(),afterSource,'Changed context cannot fabricate an event from obsolete raw membership');finish('candidate-source-context-separation',before);
          check(completed,['event-ownership','history-replay-event-independence','candidate-source-context-separation'],'All native AC32 event/history clauses completed');
        }
      } else if(criterion==='AC-31') {
        let sequence=0;
        const vote=(slot,kind='preattestation',payload='P',at=++sequence,extra={})=>({...packet(`phase-${++sequence}`,payload),contents:[{kind,level:121,round:0,slot,block_payload_hash:payload}],evidence:{...receipt(),receivedMonotonic:at,...extra}});
        const create=async votes=>{const store=new ObservationStore('mainnet',sources.mainnet),record=store.addOperations(votes)[0];if(!record)throw new Error('Missing actual phase target');const admission=await new NetworkData('mainnet').reconcile(record.target,signal);store.accept(admission);return {store,record,admission};};
        const crosses=store=>store.acceptedEvents().filter(event=>event.kind==='crossing');
        let before=assertions;const initial=await create([vote(0),vote(1)]);
        check([initial.store.target(initial.record.identity)?.phases?.pre?.power,initial.store.target(initial.record.identity)?.phases?.pre?.crossed],[4,false],'First authoritative quorum is observed, never a fabricated crossing');
        check(initial.store.acceptedEvents().map(event=>event.kind),['observed-quorum'],'First-at-quorum event is explicitly qualified');finish('first-quorum',before);
        before=assertions;const independent=await create([vote(0),vote(0,'attestation')]);
        check([independent.store.target(independent.record.identity)?.phases?.pre?.power,independent.store.target(independent.record.identity)?.phases?.att?.power],[3,3],'Both phases start with independently observed exact below power');
        independent.store.addOperations([vote(1)]);check(crosses(independent.store).map(event=>event.phase),['pre'],'New pre evidence cannot cross the attestation phase');
        independent.store.addOperations([vote(1,'attestation')]);const retainedEvents=independent.store.acceptedEvents();
        check(crosses(independent.store).map(event=>[event.phase,event.power,event.threshold]),[['pre',4,4],['att',4,4]],'Each phase crosses once with exact power and threshold');
        const maximum=independent.store.target(independent.record.identity)?.phases?.pre;
        check([maximum.maximumPower,maximum.maximumTotal,maximum.maximumThreshold],[4,5,4],'Retained maximum captures its original numerical basis');finish('independent-phases',before);
        before=assertions;
        const acceptCorrection=(store,admission,threshold,powers)=>store.accept({...admission,...store.generation(observer),rights:admission.rights.map((right,index)=>({...right,power:powers[index]})),constants:{...admission.constants,quorum:threshold}});
        acceptCorrection(independent.store,independent.admission,3,[1,1,3]);
        check([independent.store.target(independent.record.identity)?.phases?.pre?.power,independent.store.target(independent.record.identity)?.phases?.pre?.maximumPower],[2,4],'Numerical reduction preserves exact accepted maximum');
        acceptCorrection(independent.store,independent.admission,5,[3,1,1]);independent.store.accept({...independent.admission,...independent.store.generation(observer)});
        independent.store.addOperations([vote(1),vote(1,'attestation')]);independent.store.stop();independent.store.start();independent.store.accept({...independent.admission,...independent.store.generation(observer)});
        check(independent.store.acceptedEvents(),retainedEvents,'Corrections threshold down/up recovery replay and re-admission cannot duplicate events');
        check([independent.store.target(independent.record.identity)?.phases?.pre?.maximumBasis,independent.store.target(independent.record.identity)?.phases?.pre?.crossed],[maximum.maximumBasis,true],'Captured basis and sticky crossing survive corrections');
        const corrected=await create([vote(0)]);acceptCorrection(corrected.store,corrected.admission,4,[4,0,1]);corrected.store.addOperations([vote(0)]);
        check([corrected.store.target(corrected.record.identity)?.phases?.pre?.maximumPower,crosses(corrected.store).length],[4,0],'Correction reaching quorum then raw replay cannot invent a crossing');finish('corrections-and-replay',before);
        before=assertions;const priorEvents=independent.store.acceptedEvents();
        for(const hash of ['shared-one','shared-two']){const evidence=receipt();independent.store.addCandidate({identity:hash,header:{...asBlockHeader(rawHead(121)),payload_hash:'P',evidence},evidence});}
        check(independent.store.acceptedEvents(),priorEvents,'Shared candidate payload cannot duplicate a phase event');check(priorEvents.every(event=>event.attribution==='payload-shared'),true,'Events never claim candidate-specific signatures');
        const realNow=Date.now;try{Date.now=()=>realNow()+1000000000000;independent.store.rawOperations();check(independent.store.target(independent.record.identity)?.phases?.pre?.maximumPower,4,'Clock jump alone cannot retire phase authority');}finally{Date.now=realNow;}
        independent.store.addOperations([{...vote(0,'preattestation','Ahead'),contents:[{kind:'preattestation',level:1000000,round:0,slot:0,block_payload_hash:'Ahead'}]}]);check(crosses(independent.store).length,2,'Another claimed height cannot reset retained crossing state');finish('shared-attribution-no-clock-retirement',before);
        before=assertions;
        for(let index=0;index<14;index++){independent.store.addOperations([vote(0,'preattestation',`Event-${index}`)]);independent.store.addOperations([vote(1,'preattestation',`Event-${index}`)]);}
        const boundedEvents=independent.store.acceptedEvents();check(boundedEvents.length,12,'Event display ownership remains finite independently of retained phase history');
        independent.store.addOperations([vote(0),vote(1)]);check(independent.store.acceptedEvents(),boundedEvents,'Evicting an event cannot reset its retained crossing deduplication');check(independent.store.target(independent.record.identity)?.phases?.pre?.crossed,true,'Original crossing fact survives event eviction');finish('event-eviction-does-not-reset',before);
        for(const originallyCrossed of [false,true]){
          before=assertions;const lost=await create([vote(0)]);if(originallyCrossed)lost.store.addOperations([vote(1)]);const priorCrossings=crosses(lost.store).length;
          lost.store.addOperations(Array.from({length:600},(_,index)=>vote(0,'preattestation',`Retire-${index}`,1000+index)));
          check(lost.store.target(lost.record.identity),undefined,'Product overflow truly evicts original target from actual store');check([lost.store.crossingState().retained<=500,lost.store.crossingState().uncertain],[true,true],'Owned metadata stays bounded and forgotten history becomes uncertain');
          const fork={...asBlockHeader(rawHead()),hash:'H120fork',evidence:receipt()};lost.store.observeHead(fork);
          globalThis.fetch=async input=>String(input).endsWith('/blocks/head/header')||String(input).endsWith('/blocks/H120fork/header')?(reads.push(String(input)),Response.json({...fork,chain_id:'NetFixture'})):rpc(input);
          const forkRecord=lost.store.addOperations([vote(0,'preattestation','ForkPayload',2000,{observedHeadHash:fork.hash,observedHeadLevel:120})])[0];if(!forkRecord)throw new Error('Missing fork target');
          lost.store.accept(await new NetworkData('mainnet').reconcile(forkRecord.target,signal));check(lost.store.target(forkRecord.identity)?.admission?.head.hash,'H120fork','Genuine RPC context proves fork admission');
          globalThis.fetch=rpc;lost.store.observeHead({...head,evidence:receipt()});const returning=lost.store.addOperations([vote(0,'preattestation','P',3000,{observedHeadHash:'H120',observedHeadLevel:120})])[0];if(!returning)throw new Error('Missing return target');
          lost.store.accept(await new NetworkData('mainnet').reconcile(returning.target,signal));lost.store.addOperations([vote(1,'preattestation','P',3001,{observedHeadHash:'H120',observedHeadLevel:120})]);
          check(lost.store.target(returning.identity)?.admission?.head.hash,'H120','Genuine same-observer RPC proof establishes original context return');
          check([crosses(lost.store).length,lost.store.target(returning.identity)?.phases?.pre?.uncertain],[priorCrossings,true],'Forgotten prior crossing/below state cannot recreate a crossing after reorg return');finish(originallyCrossed?'forgotten-crossing-return':'forgotten-below-return',before);
        }
        before=assertions;const rawLoss=await create([vote(0)]);rawLoss.store.addOperations(Array.from({length:10001},(_,index)=>vote(0,'preattestation','P',4000+index)));
        check([rawLoss.store.rawOperations().length,rawLoss.store.crossingState().retained<=500,rawLoss.store.crossingState().uncertain],[10000,true,true],'Actual raw loss enforces finite ownership and sticky uncertainty');
        check(rawLoss.store.target(rawLoss.record.identity)?.phases?.pre?.maximumPower,3,'Retained exact known maximum survives raw loss');check(crosses(rawLoss.store).length,0,'Same-payload raw flood cannot invent a crossing');finish('raw-loss-bounds',before);
        check(completed,['first-quorum','independent-phases','corrections-and-replay','shared-attribution-no-clock-retirement','event-eviction-does-not-reset','forgotten-below-return','forgotten-crossing-return','raw-loss-bounds'],'Every native AC31 clause completed after both production engines');
      } else if(criterion==='AC-14') {
        let before=assertions;body=full([]);const early=await pending(),preidentity=makeStore();
        preidentity.store.accept({...proof,...preidentity.store.generation(observer),snapshot:early});
        check(preidentity.store.target(preidentity.record.identity)?.coverage,undefined,'A snapshot received before identity cannot establish coverage');
        check(preidentity.store.target(preidentity.record.identity)?.phases?.att,undefined,'Preidentity empty body cannot certify phase zero');finish('preidentity',before);
        const cases=[['missing-validated',{}],['applied-only',{applied:[]}],['malformed-relevant',full([{...packet('bad'),contents:[{kind:'attestation',level:121,round:0,slot:-1,block_payload_hash:'P'}]}])],['malformed-aggregate',full([{hash:'aggregate',contents:[{kind:'preattestations_aggregate',consensus_content:{level:121,round:0,block_payload_hash:'P'},committee:[0,-1]}]}])],['local-partial',full(Array.from({length:10001},(_,index)=>({...unrelated,hash:`unrelated-${index}`})))]];
        for(const [id,value] of cases){before=assertions;const {store,record}=makeStore();body=value;const snapshot=await pending();
          check(snapshot.complete,false,`${id} is classified incomplete`);check(snapshot.reasons.length>0,true,`${id} retains its incompleteness reason`);
          store.accept({...proof,...store.generation(observer),snapshot});const retained=store.target(record.identity);
          check(retained?.coverage?.complete,false,`${id} remains partial through actual store publication`);check(retained?.phases?.att,undefined,`${id} cannot certify absent attestation zero`);
          if(id==='malformed-aggregate')check(snapshot.operations[0]?.contents.length,0,'One malformed aggregate member rejects the whole aggregate');finish(id,before);
        }
        before=assertions;const truncated=makeStore();body='truncated';let rejected=false;
        try{await pending();}catch(error){if(!(error instanceof SyntaxError))throw error;rejected=true;}
        check(rejected,true,'Structurally truncated JSON rejects the pending workflow');check(truncated.store.target(truncated.record.identity)?.coverage,undefined,'Failed body supplies no store completeness');finish('truncated-body',before);
        before=assertions;const changed=makeStore();body=full([]);changeContext=true;const crossing=await pending();changeContext=false;
        check(crossing.complete,false,'Same-height context change across body is incomplete');let refused=false;
        try{changed.store.accept({...proof,...changed.store.generation(observer),snapshot:crossing});}catch(error){if(!String(error).includes('snapshot'))throw error;refused=true;}
        check(refused,true,'Actual store rejects a snapshot spanning incompatible context');check(changed.store.target(changed.record.identity)?.phases?.att,undefined,'Context-spanning snapshot cannot publish zero');finish('context-change',before);
        before=assertions;const later=makeStore();body=full([unrelated]);const complete=await pending();later.store.accept({...proof,...later.store.generation(observer),snapshot:complete});const retained=later.store.target(later.record.identity);
        check([complete.complete,complete.evidence.requestedHeadHash],[true,undefined],'Valid unrelated complete category retains honest unpinned receipt');
        check([retained?.coverage?.complete,retained?.phases?.pre?.power,retained?.phases?.att?.power],[true,0,0],'Later coherent source snapshot certifies actual retained phase zero');
        check(retained.coverage.evidence.source.baseUrl,observer.baseUrl,'Measured zero keeps actual source');finish('later-valid-unrelated',before);
        check(completed,['preidentity',...cases.map(([id])=>id),'truncated-body','context-change','later-valid-unrelated'],'Every required AC14 scenario completed');
      } else {
        let before=assertions;const store=new ObservationStore('mainnet',sources.mainnet),foreign={...observer,baseUrl:'https://unconfigured.invalid'};
        check(store.addOperations([{...packet('foreign'),evidence:receipt(foreign)}]).length,0,'Unconfigured provider cannot create retained work');check(store.rawOperations().length,0,'Unconfigured provider cannot consume raw capacity');
        const target={source:foreign,level:121,round:0,payload:'P'};const count=reads.length;let rejected=false;try{await data.reconcile(target,signal);}catch(error){if(!String(error).includes('Unconfigured'))throw error;rejected=true;}
        check([rejected,reads.length],[true,count],'Unconfigured reconciliation starts no endpoint request');finish('configured-only',before);
        before=assertions;store.addOperations(Array.from({length:10001},(_,index)=>({...packet(`raw-${index}`,`P${index%120}`),evidence:{...receipt(),receivedMonotonic:index}})));
        check(store.rawOperations().length,10000,'Canonical actual raw store enforces 10000 operations');check(store.unresolvedTargets().length,100,'Shared actual unresolved product enforces 100 identities');
        check(store.rawOperations().some(operation=>operation.hash==='raw-0'),false,'Oldest raw operation is evicted');store.addOperations([store.rawOperations()[0]]);check([store.rawOperations().length,store.unresolvedTargets().length],[10000,100],'Replay cannot grow bounded owned products');finish('raw-and-quarantine-bounds',before);
        before=assertions;
        for(let index=0;index<5;index++){const evidence={...receipt(),receivedMonotonic:20000+index};store.addCandidate({identity:`bounded-candidate-${index}`,header:{...asBlockHeader(rawHead(121)),hash:`candidate-${index}`,payload_hash:`candidate-P${index}`,evidence},evidence});}
        check([store.unresolvedTargets().length,store.unresolvedTargets().filter(record=>record.target.candidate).length],[100,5],'Candidate and candidate-free targets share one quarantine bound');check(store.rawOperations().length,10000,'Candidate quarantine pressure cannot grow raw storage');finish('shared-candidate-bound',before);
        before=assertions;const oversized=makeStore();body=full(Array.from({length:10001},(_,index)=>packet(`oversized-${index}`)));const snapshot=await pending();oversized.store.accept({...proof,...oversized.store.generation(observer),snapshot});
        check([snapshot.complete,snapshot.operations.length],[false,10000],'Oversized validated snapshot is bounded and explicitly partial');check(oversized.store.target(oversized.record.identity)?.coverage?.complete,false,'Actual retained coverage cannot certify truncated snapshot');check(oversized.store.target(oversized.record.identity)?.phases?.att,undefined,'Truncated snapshot cannot certify absent phase zero');finish('oversized-snapshot',before);
        before=assertions;const delegates=Array.from({length:6},(_,slot)=>({address:`D${slot}`,slot,power:1})),finishes=[];let active=0,maximum=0;
        globalThis.fetch=async input=>{const url=String(input);if(!url.endsWith('/is_forbidden'))return rpc(input);reads.push(url);active++;maximum=Math.max(maximum,active);return new Promise(resolve=>finishes.push(()=>{active--;resolve(Response.json(false));}));};
        const prior=reads.length;await new NetworkData('mainnet').loadEligibility(head,delegates,signal);check(reads.length,prior,'Mainnet eligibility starts no fanout');
        const shade=new NetworkData('shadownet'),work=shade.loadEligibility({...head,evidence:undefined},delegates,signal);await flush(()=>finishes.length===3);
        check([active,maximum],[3,3],'Actual Shadownet endpoint ledger stops at three concurrent workers');for(const finish of finishes.slice(0,3))finish();await flush(()=>finishes.length===6);check(maximum,3,'Second worker wave never exceeds three');for(const finish of finishes.slice(3))finish();await work;check([active,finishes.length],[0,6],'All bounded eligibility workers complete');finish('eligibility-workers',before);
        check(completed,['configured-only','raw-and-quarantine-bounds','shared-candidate-bound','oversized-snapshot','eligibility-workers'],'Every required AC19 scenario completed');
      }
    } finally {globalThis.fetch=originalFetch;}
  } else if(criterion==='AC-3') {
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
  } else if(criterion==='AC-17') {
    const originalFetch=globalThis.fetch;
    try {
      const {ObservationStore}=await server.ssrLoadModule('/monitor/observationStore.ts');
      const completed=[],finish=(id,before)=>{if(assertions<=before)throw new Error(`Incomplete execution: ${id} ran no assertions`);completed.push(id);};let before=assertions;
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
      const observerSource=historical.contexts.get(120).observer.source,historyStore=new ObservationStore('mainnet',sources.mainnet);
      const oldReceipt={source:observerSource,observedHeadHash:'H1',receivedAt:1,receivedMonotonic:1};
      historyStore.observeHead({...h1,evidence:oldReceipt});const oldRecord=historyStore.addOperations([{hash:'retained-H1',contents:[{kind:'preattestation',level:120,round:0,slot:0,block_payload_hash:'OldPayload'}],evidence:oldReceipt}])[0];if(!oldRecord)throw new Error('Actual historical H1 target missing');
      const historyProof={head:h1,derived:historical,context:historical.contexts.get(120),rights:historical.rights.get(120),constants:historical.constantsByLevel.get(120),...historyStore.generation(observerSource)};
      historyStore.accept(historyProof);check(historyStore.pin(oldRecord.identity),true,'Actual accepted H1 history can be selected before reorg');
      check([historyStore.inspection().snapshot.pre,historyStore.inspection().snapshot.record.phases.pre.maximumPower],[['Old'],5],'Historical reader owns original H1 delegate and exact power');finish('original-retained-context',before);before=assertions;
      const data=new NetworkData('mainnet'),state=new HeadGeneration();
      const first=state.transition(h1);delayed=true;
      const oldWork=commitIfCurrent(state,first,signal=>data.derive(h1,signal));await starts;
      const second=state.transition(h2);check(state.snapshot().derived,null,'H1 authority withdrawn immediately on same-height H2');
      historyStore.observeHead({...h2,evidence:{...oldReceipt,observedHeadHash:'H2',receivedAt:2,receivedMonotonic:2}});check(historyStore.target(oldRecord.identity).contextInvalid,true,'Actual store withdraws H1 live authority immediately at H2');
      const newWork=await commitIfCurrent(state,second,signal=>data.derive(h2,signal));check(newWork,true,'H2 commits its own coherent context');
      for(const finish of finishes)finish();check(await oldWork,false,'Late H1 responses cannot authorize H2');
      assert.throws(()=>historyStore.accept(historyProof),/obsolete/);assertions++;
      check(state.snapshot().derived.rights.get(120)[0].address,'New','H2 never receives old fork committee');
      check(oldEvidence.requestedHeadHash,'P1','Historical requested context remains immutable');
      check(oldEvidence.contextHeadHash,'H1','Historical observed context remains immutable');
      check(historical.rights.get(120)[0].context.observer.header.predecessor,'P1','Historical raw predecessor remains attributable');
      const staleOperation={...individual('OldPayload',0),contents:[{kind:'preattestation',level:120,round:0,slot:0,block_payload_hash:'OldPayload'}],evidence:{source:observerSource,observedHeadHash:'H1',receivedAt:1,receivedMonotonic:1}};
      const uncounted=groupsFor([staleOperation],state.snapshot().derived.rights.get(120),120)[0];
      check(uncounted.pre.size,0,'Old-head raw evidence cannot authorize current numerical power');check(uncounted.unknownSlots,[0],'Old context raw signer remains inspectable');
      const retained=historyStore.inspection().snapshot;
      check([retained.record.admission.context.observer.header.hash,retained.record.admission.context.observer.header.predecessor,retained.record.admission.context.protocolHash,retained.evidence.source.baseUrl,retained.evidence.receivedAt],['H1','P1','PFixture',observerSource.baseUrl,1],'Actual history inspection preserves exact H1 parent protocol source and original receipt after reorg');
      check(retained.record.admission.rights[0].evidence.requestedHeadHash,'P1','Historical helper requested anchor survives delayed obsolete response');check(retained.evidence.requestedHeadHash,undefined,'Unknown raw requested head remains explicit rather than inferred');finish('late-reorg-and-history',before);before=assertions;
      globalThis.fetch=async input=>String(input).endsWith('/protocols')?Response.json({proto:4}):Response.json({...h2,chain_id:'NetFixture'});
      const unknown=await new NetworkData('mainnet').derive(h2,new AbortController().signal);
      check(unknown.rights.size,0,'Shell protocol counter cannot replace proven protocol identity');check(unknown.constants,null,'Unknown context has no protocol authority');
      check(unknown.predecessor,null,'No inferred predecessor from level arithmetic');
      check(unknown.errors.some(error=>error.includes('context')),true,'Unknown context is explicit');
      finish('unknown-protocol-no-inferred-parent',before);check(completed,['original-retained-context','late-reorg-and-history','unknown-protocol-no-inferred-parent'],'Complete native AC17 clauses read back actual application-store history');
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
