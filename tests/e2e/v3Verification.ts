import {readFileSync} from 'node:fs';
import type {TestInfo} from '@playwright/test';
const manifest:unknown=JSON.parse(readFileSync(new URL('../../roster/observatory-v3/check-scenarios.json',import.meta.url),'utf8'));
/** A scenario receipt is emitted only after that actual production test completed. */
export function annotateV3(info:TestInfo):void {
 if(info.status!=='passed')return;
 if(typeof manifest!=='object'||manifest===null)throw new Error('Invalid V3 scenario manifest');
 for(const [criterion,titles] of Object.entries(manifest)){
  if(!Array.isArray(titles)||!titles.every(value=>typeof value==='string'))throw new Error(`Invalid V3 scenarios ${criterion}`);
  if(titles.includes(info.title)&&!info.annotations.some(value=>value.type==='v3-verified'&&value.description===criterion))info.annotations.push({type:'v3-verified',description:criterion});
 }
}
