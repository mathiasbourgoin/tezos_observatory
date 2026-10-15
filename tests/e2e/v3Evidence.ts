import {choose} from './productionFixture';
import {expect,type Page,type TestInfo} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

export const bases=[{width:360,height:800},{width:390,height:844},{width:768,height:1024},{width:1440,height:900},{width:1920,height:1080},{width:2560,height:1440},{width:3440,height:1440},{width:5120,height:1440},{width:390,height:568}] as const;
const evidenceModule:unknown=await import(new URL('../../scripts/v3-evidence-contract.mjs',import.meta.url).href);
if(typeof evidenceModule!=='object'||evidenceModule===null||!('sourceBindings' in evidenceModule)||typeof evidenceModule.sourceBindings!=='function')throw new Error('Missing production evidence binding');
export const binding=evidenceModule.sourceBindings();
const {revision,sourceCombined:diffHash}=binding;
/** Actual production DOM and composed colors; native popup/tooltips remain separately named surfaces. */
export async function captureMatrix(page:Page,info:TestInfo,state:string,interaction?:(page:Page)=>Promise<void>,surface?:{theme:string;preserveViewport?:boolean;name?:string}):Promise<void>{
 const directory=process.env['V3_EVIDENCE_DIR']??info.outputPath('matrix');await mkdir(directory,{recursive:true});await writeFile(join(directory,'source.json'),JSON.stringify(binding,null,2));
 const cells=surface?[{viewport:surface.preserveViewport?await page.evaluate(()=>({width:innerWidth,height:innerHeight})):page.viewportSize()??bases[3],theme:surface.theme}]:bases.flatMap(viewport=>['light','dark'].map(theme=>({viewport,theme})));
 for(const {viewport,theme} of cells){
  if(!surface){await page.setViewportSize(viewport);await choose(page.getByLabel('Appearance'),theme);}if(!surface)await page.evaluate(()=>scrollTo(0,0));if(interaction)await interaction(page);
  await expect.poll(()=>page.locator('.mainnet .navigator-junction').evaluate(node=>node.getAnimations().length)).toBe(0);
  const measurement=await page.evaluate(()=>{
   type Color=[number,number,number,number];
   const parse=(value:string):Color=>{const parts=value.match(/[\d.]+/g)?.map(Number);if(!parts||parts.length<3)throw new Error(`Unsupported rendered color ${value}`);return [parts[0]??0,parts[1]??0,parts[2]??0,parts[3]??1];};
   const over=(front:Color,back:Color):Color=>{const alpha=front[3]+back[3]*(1-front[3]);return [0,1,2].map(index=>((front[index]??0)*front[3]+(back[index]??0)*back[3]*(1-front[3]))/(alpha||1)).concat(alpha) as Color;};
   const luminance=(color:Color)=>[.2126,.7152,.0722].reduce((sum,weight,index)=>{const value=(color[index]??0)/255;return sum+weight*(value<=.04045?value/12.92:((value+.055)/1.055)**2.4);},0);
   const ratio=(a:Color,b:Color)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
   const background=(element:Element):Color=>{const ancestors:Element[]=[];for(let node:Element|null=element;node;node=node.parentElement)ancestors.unshift(node);let result:Color=[255,255,255,1];for(const node of ancestors){const style=getComputedStyle(node);if(style.backgroundImage!=='none')throw new Error(`Unmeasured background image on ${node.className}`);result=over(parse(style.backgroundColor),result);}return result;};
   const visible=(node:Element,rect:DOMRect)=>{if(rect.width<=0||rect.height<=0)return false;for(let parent:Element|null=node;parent;parent=parent.parentElement){const style=getComputedStyle(parent);if(style.visibility==='hidden'||style.display==='none')return false;if(Number(style.opacity)!==1)throw new Error(`Unmeasured group opacity on ${parent.className}`);if(/hidden|auto|scroll|clip/.test(style.overflow+style.overflowY)){const box=parent.getBoundingClientRect();if(rect.bottom<=box.top||rect.top>=box.bottom||rect.right<=box.left||rect.left>=box.right)return false;}}return true;};
   const texts:{selector:string;text:string;foreground:Color;background:Color;ratio:number;required:number;fontSize:number;minimum:number}[]=[];
   const walker=document.createTreeWalker(document.querySelector('.consensus-app')??document.body,NodeFilter.SHOW_TEXT);
   let node:Node|null;while((node=walker.nextNode())){const text=node.textContent?.trim(),element=node.parentElement;if(!text||!element||element.closest('.sr-only,option,svg,script,style'))continue;const range=document.createRange();range.selectNodeContents(node);const box=range.getBoundingClientRect();if(!visible(element,box))continue;const style=getComputedStyle(element),size=parseFloat(style.fontSize),weight=parseFloat(style.fontWeight),bg=background(element),fg=over(parse(style.color),bg);texts.push({selector:`${element.tagName.toLowerCase()}.${element.className}`,text:text.slice(0,100),foreground:fg,background:bg,ratio:ratio(fg,bg),required:size>=24||size>=18.6667&&weight>=700?3:4.5,fontSize:size,minimum:element.closest('.branch-target,.branch-critical,.baker-opportunity>strong,.gauge-exact,.gauge-counts,.quorum-caption')?14:12});}
   const regions=Object.fromEntries(['.consensus-app','.masthead','.network-tabs','.mainnet .observer-summary','.mainnet .navigator-junction','.mainnet .navigator-current','.mainnet .baker-opportunity[data-branch=same-level]','.mainnet .baker-opportunity[data-branch=next-level]','.mainnet .selected-inspector','.mainnet .committee-evidence','.mainnet .session-rail','.mainnet .source-pane'].map(selector=>{const element=document.querySelector(selector);if(!element)throw new Error(`Required region missing ${selector}`);const box=element.getBoundingClientRect();return [selector,{x:box.x,y:box.y,width:box.width,height:box.height,right:box.right,bottom:box.bottom}];}));
   const controls=[...document.querySelectorAll<HTMLElement>('button,select,input,summary')].filter(element=>visible(element,element.getBoundingClientRect())).map(element=>{const target=element instanceof HTMLInputElement&&element.type==='radio'?element.closest('label')??element:element;const box=target.getBoundingClientRect();const minimum=element.matches('.control-button,.network-tabs button,.candidate-controls button')||element.closest('.appearance')?44:24;return {tag:element.tagName,minimum,name:element.getAttribute('aria-label')??element.textContent?.trim().slice(0,80),width:box.width,height:box.height,disabled:element.hasAttribute('disabled')};});
   const graphics:{selector:string;surface:string;ratio:number;required:number}[]=[];
   for(const element of document.querySelectorAll<HTMLElement>('.mainnet .quorum-marker')){
    const track=element.parentElement,fill=track?.querySelector('.gauge-fill');if(!track||!fill||!visible(element,element.getBoundingClientRect()))continue;
    const style=getComputedStyle(element),body=parse(style.backgroundColor),border=parse(style.borderLeftColor);
    for(const [surface,bg] of [['empty',background(track)],['filled',background(fill)]] as const)graphics.push({selector:'.quorum-marker',surface,ratio:Math.max(ratio(over(body,bg),bg),ratio(over(border,bg),bg)),required:3});
   }
   for(const element of document.querySelectorAll<HTMLElement>('input,button,select,summary')){
    if(!visible(element,element.getBoundingClientRect()))continue;const style=getComputedStyle(element),bg=background(element);
    if(element instanceof HTMLInputElement&&element.placeholder){const placeholder=getComputedStyle(element,'::placeholder');texts.push({selector:'input::placeholder',text:element.placeholder,foreground:over(parse(placeholder.color),bg),background:bg,ratio:ratio(over(parse(placeholder.color),bg),bg),required:4.5,fontSize:parseFloat(style.fontSize),minimum:12});}
    if(!element.matches(':disabled,[aria-disabled=true]')&&style.borderTopStyle!=='none'&&parseFloat(style.borderTopWidth)>0){const outside=background(element.parentElement??element);graphics.push({selector:`${element.tagName}.${element.className}`,surface:'control-boundary',ratio:ratio(over(parse(style.borderTopColor),outside),outside),required:3});}
    if(element instanceof HTMLInputElement&&element.type==='radio'&&element.checked){const surface=background(element.closest('fieldset')??element);graphics.push({selector:'input[type=radio]:checked',surface:'selection-dot-against-inset',ratio:ratio(bg,surface),required:3});}
    if(style.outlineStyle!=='none'&&parseFloat(style.outlineWidth)>0){const outside=background(element.parentElement??element);graphics.push({selector:`${element.tagName}:focus`,surface:'outside',ratio:ratio(over(parse(style.outlineColor),outside),outside),required:3});}
   }
   const geometryFailures:string[]=[];
   for(const [name,box] of Object.entries(regions))if(box.width<=0||box.x< -1||box.right>innerWidth+1)geometryFailures.push(`${name}: clipped or absent`);
   const app=regions['.consensus-app'];if(app&&innerWidth>=1440&&app.width<innerWidth*.9)geometryFailures.push('Workspace capped below 90% of viewport');
   for(const names of [['.mainnet .selected-inspector','.mainnet .committee-evidence','.mainnet .session-rail','.mainnet .source-pane'],['.mainnet .navigator-current','.mainnet .baker-opportunity[data-branch=same-level]','.mainnet .baker-opportunity[data-branch=next-level]']])for(let a=0;a<names.length;a++)for(let b=a+1;b<names.length;b++){const left=regions[names[a]??''],right=regions[names[b]??''];if(left&&right&&Math.min(left.right,right.right)-Math.max(left.x,right.x)>1&&Math.min(left.bottom,right.bottom)-Math.max(left.y,right.y)>1)geometryFailures.push(`${names[a]} overlaps ${names[b]}`);}
   for(const control of controls)if(control.width<control.minimum-1||control.height<control.minimum-1)geometryFailures.push(`Target ${control.name}: ${control.width}x${control.height} below ${control.minimum}`);
   const graphicsFailures=graphics.filter(value=>value.ratio+.01<value.required);
   const failures=texts.filter(value=>value.ratio+.01<value.required||value.fontSize<value.minimum);
   return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,regions,texts,controls,graphics,graphicsFailures,geometryFailures,failures};
  });
  const stem=`${info.project.name}-${viewport.width}x${viewport.height}-${theme}-${surface?.name??state}`;
  await page.screenshot({path:join(directory,`${stem}.png`),fullPage:true});
  const screenshotSha256=createHash('sha256').update(readFileSync(join(directory,`${stem}.png`))).digest('hex');
  await writeFile(join(directory,`${stem}.json`),JSON.stringify({revision,diffHash,sourceCombined:binding.sourceCombined,contractCombined:binding.contractCombined,productionCombined:binding.productionCombined,state,engine:info.project.name,viewport,theme,screenshot:`${stem}.png`,screenshotSha256,measurement,status:measurement.failures.length||measurement.graphicsFailures.length||measurement.geometryFailures.length||(surface?measurement.documentWidth>viewport.width:measurement.documentWidth!==viewport.width)?'FAIL':'PASS'},null,2));
  if(surface)expect(measurement.documentWidth,`${stem}: document overflow`).toBeLessThanOrEqual(viewport.width);else expect(measurement.documentWidth,`${stem}: document overflow`).toBe(viewport.width);expect(measurement.failures,`${stem}: composed text contrast / minimum metadata size`).toEqual([]);expect(measurement.graphicsFailures,`${stem}: marker/focus contrast`).toEqual([]);
  expect(measurement.geometryFailures,`${stem}: region overlap, clipping, useful width and target bounds`).toEqual([]);
  for(const [name,box] of Object.entries(measurement.regions)){expect(box.width,`${stem} ${name} width`).toBeGreaterThan(0);expect(box.x,`${stem} ${name} left clipping`).toBeGreaterThanOrEqual(-1);expect(box.right,`${stem} ${name} right clipping`).toBeLessThanOrEqual(viewport.width+1);}
 }
}
