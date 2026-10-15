import {expect,test} from '@playwright/test';
import {choose,head,prepare,send,vote} from './productionFixture';
import {captureMatrix} from './v3Evidence';
import {installRenderedColors,type RenderedColor} from './renderedColors';

const hex=(value:string):number[]=>{expect(value).toMatch(/^#[0-9a-f]{6}$/i);return [1,3,5].map(index=>parseInt(value.slice(index,index+2),16));};
const blend=(front:readonly number[],back:readonly number[],alpha:number)=>back.map((value,index)=>front[index]!*alpha+value*(1-alpha));
const contrast=(a:readonly number[],b:readonly number[])=>{const light=(color:readonly number[])=>color.reduce((sum,channel,index)=>{const v=channel/255;return sum+[.2126,.7152,.0722][index]!*(v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));},0);return (Math.max(light(a),light(b))+.05)/(Math.min(light(a),light(b))+.05);};
const closeColor=(actual:RenderedColor,expected:readonly number[])=>{for(let index=0;index<3;index++)expect(actual[index]).toBeCloseTo(expected[index]!,2);expect(actual[3]).toBe(1);};

test('rendered contrast measures both production phase bands at zero half and full in every palette and theme',async({page})=>{
 await prepare(page,false);await page.getByRole('button',{name:'Pause',exact:true}).click();await page.evaluate(installRenderedColors);
 const rows=await page.evaluate(()=>{
  const tools=window.v3RenderedColors!,root=document.documentElement,parent=document.createElement('div'),card=document.createElement('div'),text=document.createElement('span');
  parent.style.cssText='position:fixed;left:20px;top:20px;width:240px;height:220px;background:rgb(20,40,60);z-index:10000';
  card.className='navigator-current';card.style.cssText='position:relative;display:block;width:200px;height:200px;border:0;padding:0;margin:0;';text.textContent='Measured phase text';card.append(text);parent.append(card);document.body.append(parent);
  const measured=[];
  for(const palette of ['pollen','braise','cinabre','ocre','reference'])for(const theme of ['light','dark'])for(const fill of [0,50,100]){
   root.dataset.palette=palette;root.dataset.theme=theme;card.style.setProperty('--path-pre',`${fill}%`);card.style.setProperty('--path-att',`${fill}%`);tools.begin();
   const style=getComputedStyle(card),box=card.getBoundingClientRect(),point=(x:number,y:number)=>new DOMRect(box.left+x,box.top+y,1,1),wide=(y:number)=>new DOMRect(box.left+10,box.top+y,180,10);
   measured.push({palette,theme,fill,base:style.getPropertyValue('--surface').trim(),pre:style.getPropertyValue('--pre').trim(),att:style.getPropertyValue('--att').trim(),ink:style.getPropertyValue('--ink').trim(),preLeft:tools.backgrounds(text,[point(10,25)])[0]!,preRight:tools.backgrounds(text,[point(190,25)])[0]!,attLeft:tools.backgrounds(text,[point(10,125)])[0]!,attRight:tools.backgrounds(text,[point(190,125)])[0]!,preWide:tools.backgrounds(text,[wide(25)]),attWide:tools.backgrounds(text,[wide(125)]),cross:tools.backgrounds(text,[new DOMRect(box.left+10,box.top+90,180,20)]),ratios:tools.backgrounds(text,[wide(25),wide(125)]).map(bg=>tools.ratio(tools.over(tools.parse(style.color),bg),bg))});
  }
  card.className='navigator-path-card';card.style.backgroundColor='rgba(80,100,120,.5)';card.style.color='rgba(200,210,220,.4)';card.style.setProperty('--path-pre','100%');card.style.setProperty('--path-att','100%');tools.begin();
  const box=card.getBoundingClientRect(),alphaBg=tools.backgrounds(text,[new DOMRect(box.left+10,box.top+20,1,1)])[0]!,alphaFg=tools.over(tools.parse(getComputedStyle(card).color),alphaBg),alpha={bg:alphaBg,fg:alphaFg,ratio:tools.ratio(alphaFg,alphaBg),pre:getComputedStyle(card).getPropertyValue('--pre').trim(),mixed:tools.parse('color-mix(in srgb,rgba(120,60,30,.4) 50%,transparent)')};
  const rejected=[];for(const background of ['linear-gradient(90deg,red,blue)','linear-gradient(0deg,red 0 50%,transparent 50% 100%)']){card.style.backgroundImage=background;tools.begin();try{tools.backgrounds(text);rejected.push(false);}catch(error){rejected.push(String(error).includes('Unmeasured background image'));}}
  card.style.removeProperty('background-image');card.className='unsupported-gradient';card.style.backgroundImage='linear-gradient(90deg,red,blue)';tools.begin();try{tools.backgrounds(text);rejected.push(false);}catch(error){rejected.push(String(error).includes('Unmeasured background image'));}
  parent.remove();return {measured,alpha,rejected};
 });
 expect(rows.measured).toHaveLength(30);
 for(const row of rows.measured){
  const base=hex(row.base),pre=blend(hex(row.pre),base,.26),att=blend(hex(row.att),base,.18);
  closeColor(row.preLeft,row.fill>0?pre:base);closeColor(row.preRight,row.fill===100?pre:base);closeColor(row.attLeft,row.fill>0?att:base);closeColor(row.attRight,row.fill===100?att:base);
  expect(row.preWide).toHaveLength(row.fill===50?2:1);expect(row.attWide).toHaveLength(row.fill===50?2:1);expect(row.cross).toHaveLength(row.fill===0?1:row.fill===50?3:2);
  const expected=[...(row.fill<100?[base]:[]),...(row.fill>0?[pre,att]:[])].map(bg=>contrast(hex(row.ink),bg));
  expect(Math.min(...row.ratios)).toBeCloseTo(Math.min(...expected),3);expect(Math.min(...row.ratios)).toBeGreaterThanOrEqual(4.5);
 }
 const alphaBg=blend(hex(rows.alpha.pre),[50,70,90],.26),alphaFg=blend([200,210,220],alphaBg,.4);closeColor(rows.alpha.bg,alphaBg);closeColor(rows.alpha.fg,alphaFg);expect(rows.alpha.ratio).toBeCloseTo(contrast(alphaFg,alphaBg),3);
 for(const [index,value] of [120,60,30].entries())expect(rows.alpha.mixed[index]).toBeCloseTo(value,3);expect(rows.alpha.mixed[3]).toBeCloseTo(.2,5);expect(rows.rejected).toEqual([true,true,true]);
});

test('production contrast matrix retains every surface with qualified phase backgrounds in light and dark',async({page},info)=>{
 await page.setViewportSize({width:1440,height:900});await prepare(page,false,head(100));await send(page,'mainnet-operations',[vote(0)]);await expect(page.locator('.network-panel.mainnet .pre .gauge-exact')).toHaveText('600 / 30,000');
 for(const theme of ['light','dark']){await choose(page.getByLabel('Appearance'),theme);await captureMatrix(page,info,'phase-band-composed-contrast',undefined,{theme,preserveViewport:true});}
});
