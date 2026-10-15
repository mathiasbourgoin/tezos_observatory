import {expect,test} from '@playwright/test';
import {prepare,choose} from './productionFixture';

test('palette defaults to pollen, persists, and preserves the explicit appearance preference',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('observatory:theme','light'));
 await prepare(page,false);
 await expect(page.locator('html')).toHaveAttribute('data-palette','pollen');
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.getByLabel('Appearance',{exact:true}).click();
 const palette=page.getByLabel('Colour palette',{exact:true});
 await expect(palette).toHaveValue('pollen');
 await palette.selectOption('cinabre');
 await expect(page.locator('html')).toHaveAttribute('data-palette','cinabre');
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-palette','cinabre');
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await choose(page.getByLabel('Appearance',{exact:true}),'dark');
 await expect(page.locator('html')).toHaveAttribute('data-palette','cinabre');
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('observatory:palette'))).toBe('cinabre');
});

for(const storage of ['unknown','denied'] as const)test(`palette fallback remains usable with ${storage} storage`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(mode=>{localStorage.setItem('observatory:palette','unknown-palette');if(mode==='denied'){Storage.prototype.getItem=()=>{throw new DOMException('Storage denied','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('Storage denied','SecurityError');};}},storage);
 await prepare(page,false);
 await expect(page.locator('html')).toHaveAttribute('data-palette','pollen');
 await page.getByLabel('Appearance',{exact:true}).click();
 await page.getByLabel('Colour palette',{exact:true}).selectOption('braise');
 await expect(page.locator('html')).toHaveAttribute('data-palette','braise');
 if(storage==='denied')await expect(page.locator('.palette-notice')).toBeVisible();
 expect(errors).toEqual([]);
});

test('palette roles retain readable contrast and stable responsive layout in both appearances',async({page},info)=>{
 await prepare(page,false);
 const luminance=(hex:string)=>{const c=hex.match(/[\da-f]{2}/gi)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]!*.2126+c[1]!*.7152+c[2]!*.0722;};
 const contrast=(a:string,b:string)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 for(const width of [390,1440,3440])for(const mode of ['light','dark']){
  await page.setViewportSize({width,height:1000});await choose(page.getByLabel('Appearance',{exact:true}),mode);
  for(const id of ['pollen','braise','cinabre','ocre','reference']){
   const appearance=page.getByLabel('Appearance',{exact:true});
   if(!await appearance.locator('..').evaluate(node=>(node as HTMLDetailsElement).open))await appearance.click();
   await page.getByLabel('Colour palette',{exact:true}).selectOption(id);
   const values=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return {overflow:document.documentElement.scrollWidth>innerWidth,tokens:Object.fromEntries(['paper','surface','ink','muted','selected','forest','copper','pre','att','bad','focus','line'].map(k=>[k,s.getPropertyValue('--'+k).trim()]))};});
   expect(values.overflow,`${id}/${mode}/${width}`).toBe(false);
   for(const bg of ['paper','surface','selected'])for(const fg of ['ink','muted'])expect(contrast(values.tokens[fg]!,values.tokens[bg]!),`${id}/${mode}/${fg}/${bg}`).toBeGreaterThanOrEqual(4.5);
   for(const fg of ['forest','copper','pre','att','bad','focus','line'])expect(contrast(values.tokens[fg]!,values.tokens.surface!),`${id}/${mode}/${fg}`).toBeGreaterThanOrEqual(fg==='line'?3:4.5);
  }
  if(width!==3440){await page.getByLabel('Colour palette',{exact:true}).selectOption('pollen');await page.getByLabel('Appearance',{exact:true}).click();await page.screenshot({path:info.outputPath(`pollen-${width}-${mode}.png`),fullPage:true});}
 }
});
