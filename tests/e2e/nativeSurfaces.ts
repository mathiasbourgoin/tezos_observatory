import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {prepare,send,vote} from './productionFixture';
import {bases} from './v3Evidence';

// A separate headed run is required: browser-content screenshots omit OS popups.
test('V3 AC-36 real native popup and tooltip surfaces are captured in both themes at every base',async({page},info)=>{
 test.setTimeout(180000);if(!process.env['DISPLAY']||!process.env['V3_EVIDENCE_DIR'])throw new Error('Native capture requires isolated DISPLAY and V3_EVIDENCE_DIR');
 const directory=process.env['V3_EVIDENCE_DIR'];await mkdir(directory,{recursive:true});const failures:string[]=[];page.on('pageerror',error=>failures.push(error.message));
 await prepare(page,false);await send(page,'mainnet-operations',[vote(0)]);await expect(page.locator('.mainnet .pre .gauge-exact')).toHaveText('600 / 30,000');
 const records:unknown[]=[];
 const windowGeometry=()=>page.evaluate(()=>({screenX,screenY,outerWidth,outerHeight,innerWidth,innerHeight,devicePixelRatio,screen:{width:screen.width,height:screen.height},assets:[...document.scripts].map(script=>script.src).filter(Boolean)}));
 for(const viewport of bases.filter(base=>!process.env['V3_NATIVE_BASE']||`${base.width}x${base.height}`===process.env['V3_NATIVE_BASE']))for(const theme of ['light','dark']){
  await page.setViewportSize(viewport);const appearance=page.getByRole('combobox',{name:'Appearance'});await appearance.selectOption(theme);
  for(const [label,control] of [['appearance',appearance],['phase-filter',page.getByRole('combobox',{name:'Committee phase receipt filter'}).first()]] as const){
   await control.scrollIntoViewIfNeeded();await control.focus();
   if(info.project.name==='firefox'&&process.env['V3_XDOTOOL']){const box=await control.boundingBox(),geometry=await windowGeometry();if(!box)throw new Error('Native control has no bounds');execFileSync(process.env['V3_XDOTOOL'],['mousemove','--sync',String(Math.round(geometry.screenX+box.x+box.width/2)),String(Math.round(geometry.screenY+geometry.outerHeight-geometry.innerHeight+box.y+box.height/2)),'click','1'],{timeout:15000});}else await page.keyboard.press('Space');await page.waitForTimeout(600);const name=`native-${info.project.name}-${viewport.width}x${viewport.height}-${theme}-${label}.png`;
   execFileSync('import',['-display',process.env['DISPLAY'],'-window','root',join(directory,name)],{timeout:15000});
   records.push({engine:info.project.name,viewport,theme,surface:label,screenshot:name,window:await windowGeometry(),bounds:await control.boundingBox(),measurement:'Actual X11 root screenshot; independent pixel/visual judgment required. Closed-select colors do not certify popup.'});await page.keyboard.press('Escape');
  }
  const target=page.locator('.mainnet .committee-evidence td[title]').first();await target.scrollIntoViewIfNeeded();await target.hover();await page.waitForTimeout(1100);const name=`native-${info.project.name}-${viewport.width}x${viewport.height}-${theme}-tooltip.png`;execFileSync('import',['-display',process.env['DISPLAY'],'-window','root',join(directory,name)],{timeout:15000});records.push({engine:info.project.name,viewport,theme,surface:'native-title-tooltip',screenshot:name,window:await windowGeometry(),title:await target.getAttribute('title'),measurement:'Actual headed surface; inspect tooltip pixels separately.'});await page.mouse.move(0,0);
 }
 await writeFile(join(directory,`native-${info.project.name}.json`),JSON.stringify(records,null,2));if(failures.length)throw new Error(failures.join('\n'));if(!process.env['V3_NATIVE_BASE'])info.annotations.push({type:'v3-verified',description:'AC-36'});
});
