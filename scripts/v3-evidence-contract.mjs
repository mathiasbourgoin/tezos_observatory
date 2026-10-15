import {readFileSync,realpathSync,readdirSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const object=(value,label)=>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(`Invalid ${label}`);return value;};
const digest=(value,label)=>{if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))throw new Error(`Invalid ${label} SHA256`);return value;};
function boundFile(root,name,hash){
 if(typeof name!=='string'||!name||isAbsolute(name))throw new Error('Artifact path must be relative');
 const base=realpathSync(root),path=realpathSync(resolve(base,name)),rel=relative(base,path);
 if(rel==='..'||rel.startsWith('../')||isAbsolute(rel))throw new Error('Artifact escapes its evidence root');
 const bytes=readFileSync(path);if(sha256(bytes)!==digest(hash,name))throw new Error(`Artifact hash mismatch: ${name}`);return bytes;
}

export const combinedHashes=value=>sha256(JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)))));
export function sourceFiles(repository=process.cwd()){
 return execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{cwd:repository,encoding:'utf8'}).split('\n').filter(name=>/^(src\/|tests\/|scripts\/|package(?:-lock)?\.json$|(?:tsconfig\.json|README\.md)$|(?:playwright(?:\.(?:v3|native))?|vite)\.config\.ts$|roster\/observatory-v3\/(?:check-scenarios|render-variants)\.json$|roster\/observatory-block-intervals\/(?:check-coverage|render-variants)\.json$)/.test(name)).sort();
}
export function sourceBindings(repository=process.cwd()){
 const hashFiles=(root,names)=>Object.fromEntries(names.map(name=>[name,sha256(readFileSync(resolve(root,name)))]));
 const sources=hashFiles(repository,sourceFiles(repository));
 const contracts=hashFiles(repository,['specs/observatory-foundations.md','specs/observatory-v3.md','specs/observatory-block-intervals.md','specs/claims-authority.json']);
 const files=[];const visit=(prefix='')=>{for(const item of readdirSync(resolve(repository,'dist',prefix),{withFileTypes:true})){const name=prefix+item.name;if(item.isDirectory())visit(name+'/');else files.push(name);}};visit();
 const production=hashFiles(resolve(repository,'dist'),files.sort());
 return {revision:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),sources,contracts,production,sourceCombined:combinedHashes(sources),contractCombined:combinedHashes(contracts),productionCombined:combinedHashes(production)};
}
/** Surface records are observable captures, not substitutes for independent visual judgment. */
export function validPhysicalWindow(value){
 if(typeof value!=='string'||!value.trim())return false;
 const rows=value.trim().split('\n'),fields=new Map();
 for(const row of rows){const match=/^(WINDOW|SCREEN|X|Y|WIDTH|HEIGHT)=(-?\d+)$/.exec(row);if(!match||fields.has(match[1]))return false;fields.set(match[1],Number(match[2]));}
 return fields.size===6&&[...fields.values()].every(Number.isSafeInteger)&&fields.get('WINDOW')>0&&fields.get('SCREEN')>=0&&fields.get('WIDTH')>0&&fields.get('HEIGHT')>0;
}
export function validateSurfaceRecords(manifest, records, surface){
 const expected=surface==='native-title-tooltip'?36:4,seen=new Set();
 if(!Array.isArray(records)||records.length!==expected)throw new Error(`Incomplete ${surface} surface matrix`);
 const bases=new Set(['360x800','390x844','768x1024','1440x900','1920x1080','2560x1440','3440x1440','5120x1440','390x568']);
 for(const record of records){
  object(record,'surface record');const base=surface==='native-title-tooltip'?`${record.viewport?.width}x${record.viewport?.height}`:'zoom';
  const key=JSON.stringify([record.engine,record.theme,base]);
  if(seen.has(key)||!['chromium','firefox'].includes(record.engine)||!['light','dark'].includes(record.theme)||(surface==='native-title-tooltip'&&!bases.has(base)))throw new Error('Unexpected/duplicate surface cell');seen.add(key);
  if(record.surface!==surface||record.sourceCombined!==manifest.sourceCombined||record.contractCombined!==manifest.contractCombined||record.productionCombined!==manifest.productionCombined)throw new Error('Surface uses a different source/contract/build');
  if(typeof record.screenshot!=='string'||!record.screenshotSha256)throw new Error('Surface has no captured screenshot');
  if(surface==='native-title-tooltip'){
   if(record.status!=='CAPTURED'||!record.title||!record.histogram||!record.changed||!record.dimensions||!record.tooltipBounds||!(record.pixelContrast?.foreground?.contrast>=4.5))throw new Error('Native surface lacks actual observable pixels');
  }else if(record.status!=='PASS'||!(record.baseline?.width/record.measured?.width>=1.8)||!(record.measured?.documentWidth<=record.measured?.width)||!validPhysicalWindow(record.nativeBaseline)||!validPhysicalWindow(record.nativeMeasured)||record.nativeBaseline!==record.nativeMeasured||record.measured?.regions?.length!==3||record.measured.regions.some(region=>!(region.width>0&&region.x>=0&&region.right<=record.measured.width)))throw new Error('Browser zoom has no passing actual geometry');
 }
 return records;
}
/** A missing/incomplete/source-mismatched bundle is execution ERROR, never a pass. */
export function loadV3Evidence(root,repository=process.cwd()){
 if(!root)throw new Error('V3_RELEASE_EVIDENCE must identify the immutable complete release bundle');
 const manifest=object(JSON.parse(readFileSync(resolve(root,'manifest.json'),'utf8')),'V3 manifest');
 if(manifest.namespace!=='observatory-v3'||manifest.version!==1)throw new Error('Unsupported evidence manifest');
 const sources=object(manifest.sources,'source inventory'),contracts=object(manifest.contracts,'contract inventory'),artifacts=object(manifest.artifacts,'artifact inventory');
 const requiredSources=sourceFiles(repository);
 if(JSON.stringify(Object.keys(sources).sort())!==JSON.stringify(requiredSources))throw new Error('Source inventory is not exhaustive');
 for(const name of ['specs/observatory-foundations.md','specs/observatory-v3.md','specs/observatory-block-intervals.md','specs/claims-authority.json'])if(!(name in contracts))throw new Error(`Required contract absent: ${name}`);
 for(const [name,hash] of Object.entries({...sources,...contracts}))boundFile(repository,name,hash);
 if(typeof manifest.author!=='string'||!manifest.author.trim())throw new Error('Missing declared evidence author');
 if(!Object.keys(sources).length||!Object.keys(contracts).length||!Object.keys(artifacts).length)throw new Error('Empty source/contract/artifact inventory');
 const combined=combinedHashes;
 if(manifest.sourceCombined!==combined(sources)||manifest.contractCombined!==combined(contracts))throw new Error('Invalid combined source/contract binding');
 for(const [name,hash] of Object.entries(artifacts))boundFile(root,name,hash);
 const requiredVariants=JSON.parse(readFileSync(resolve(repository,'roster/observatory-v3/render-variants.json'),'utf8'));
 if(!Array.isArray(manifest.variants)||JSON.stringify([...manifest.variants].sort())!==JSON.stringify(requiredVariants.variants))throw new Error('Missing/duplicate applicable variants');
 if(!Array.isArray(manifest.additionalSurfaces)||JSON.stringify([...manifest.additionalSurfaces].sort())!==JSON.stringify([...requiredVariants.additionalSurfaces].sort()))throw new Error('Missing applicable additional surfaces');
 for(const surface of manifest.additionalSurfaces){const record=manifest.surfaceEvidence?.[surface];if(!Array.isArray(record)||!record.length||record.some(name=>!(name in artifacts)))throw new Error(`Missing surface evidence: ${surface}`);}
 if(!Array.isArray(manifest.renders)||manifest.renders.length!==manifest.variants.length*36)throw new Error('Incomplete required render matrix');
 const bases=new Set(['360x800','390x844','768x1024','1440x900','1920x1080','2560x1440','3440x1440','5120x1440','390x568']),seen=new Set();
 for(const entry of manifest.renders){object(entry,'render');const key=JSON.stringify([entry.variant,entry.engine,entry.theme,entry.base]);if(seen.has(key)||!manifest.variants.includes(entry.variant)||!['chromium','firefox'].includes(entry.engine)||!['light','dark'].includes(entry.theme)||!bases.has(entry.base))throw new Error('Unexpected/duplicate render cell');seen.add(key);
  for(const name of [entry.screenshot,entry.measurement])if(typeof name!=='string'||!(name in artifacts))throw new Error('Uninventoried render artifact');
  const result=object(JSON.parse(boundFile(root,entry.measurement,artifacts[entry.measurement])),'render measurement');if(result.status!=='PASS'||result.state!==entry.variant||result.engine!==entry.engine||result.theme!==entry.theme||`${result.viewport?.width}x${result.viewport?.height}`!==entry.base)throw new Error('Failed or mismatched render measurement');
  if(result.sourceCombined!==manifest.sourceCombined||result.contractCombined!==manifest.contractCombined||result.productionCombined!==manifest.productionCombined)throw new Error('Render uses a different source/contract/build');
  if(result.screenshotSha256!==artifacts[entry.screenshot])throw new Error('Screenshot/measurement hash mismatch');
 }
 for(const surface of ['native-title-tooltip','browser-zoom']){
  const records=[];
  for(const name of manifest.surfaceEvidence[surface]){
   if(!name.endsWith('.json'))continue;
   const data=JSON.parse(boundFile(root,name,artifacts[name]));
   for(const record of Array.isArray(data)?data:[data]){
    if(record.surface!==surface)continue;
    const screenshot=relative(root,resolve(root,name,'..',record.screenshot));
    if(artifacts[screenshot]!==record.screenshotSha256)throw new Error('Surface screenshot binding mismatch');records.push(record);
   }
  }
  validateSurfaceRecords(manifest,records,surface);
 }
 const production=object(manifest.production,'production assets');if(combined(production)!==manifest.productionCombined)throw new Error('Invalid production asset binding');if(!Object.keys(production).length)throw new Error('Missing production assets');for(const [name,hash] of Object.entries(production))boundFile(resolve(repository,'dist'),name,hash);
 return {root,manifest,artifacts};
}
export function requireIndependentReceipt(bundle,criterion,role,kind){
 const {root,manifest,artifacts}=bundle;if(!Array.isArray(manifest.receipts))throw new Error('Missing independent receipts');
 const candidates=manifest.receipts.filter(value=>value.role===role&&value.kind===kind&&Array.isArray(value.criteria)&&value.criteria.includes(criterion));
 if(candidates.length!==1)throw new Error(`Exactly one independent ${role}/${kind} receipt required for ${criterion}`);
 const receipt=object(candidates[0],'receipt');if(typeof receipt.actor!=='string'||!receipt.actor||receipt.actor===manifest.author||receipt.sourceCombined!==manifest.sourceCombined||receipt.contractCombined!==manifest.contractCombined||receipt.productionCombined!==manifest.productionCombined||receipt.verdict!=='PASS')throw new Error('Invalid independent receipt authority/source/result');
 if(typeof receipt.report!=='string'||!(receipt.report in artifacts))throw new Error('Missing independent report artifact');boundFile(root,receipt.report,artifacts[receipt.report]);
 if(!Array.isArray(receipt.evidence)||!receipt.evidence.length)throw new Error('Independent receipt cites no evidence');for(const name of receipt.evidence)if(!(name in artifacts))throw new Error('Independent receipt cites absent evidence');
 return receipt;
}
