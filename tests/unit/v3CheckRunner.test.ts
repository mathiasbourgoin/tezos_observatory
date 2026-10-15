import {expect,it} from 'vitest';
const loaded:unknown=await import(new URL('../../scripts/check-observatory-v3.mjs',import.meta.url).href);
if(typeof loaded!=='object'||loaded===null||!('classifyBrowserReport' in loaded)||typeof loaded.classifyBrowserReport!=='function')throw new Error('Missing V3 classifier');
const classify=loaded.classifyBrowserReport as (report:unknown,status:number,criterion:string,titles:string[])=>number;
const scenario=(projectName:string,status='passed',errors:unknown[]=[],verified=true)=>({projectName,expectedStatus:'passed',annotations:verified?[{type:'v3-verified',description:'AC-02'}]:[],results:[{status,errors}]});
const report=(tests:unknown[])=>({suites:[{specs:[{title:'Observed camera',tests}]}],errors:[]});
const run=(value:unknown,status=0)=>classify(value,status,'AC-02',['Observed camera']);
it('V3 requires complete exact engine and scenario manifests',()=>{
 expect(run(report([scenario('chromium'),scenario('firefox')]))).toBe(0);
 for(const value of [null,{},report([]),report([scenario('chromium')]),report([scenario('chromium'),scenario('chromium')]),report([scenario('chromium','skipped'),scenario('firefox')]),report([scenario('chromium','passed',[],false),scenario('firefox')])])expect(()=>run(value)).toThrow();
});
it.each([false,true])('V3 runtime errors take precedence over behavioral failures in either order %s',reverse=>{
 const cases=[scenario('chromium','failed',[{message:'Error: expect(received).toBe(expected) failed'}]),scenario('firefox','failed',[{message:'Fixture body failed'}])];if(reverse)cases.reverse();expect(()=>run(report(cases),1)).toThrow('runtime');
});
it('V3 returns assertion red only for completed matchers and rejects inconsistent processes',()=>{
 expect(run(report([scenario('chromium','failed',[{message:'Error: expect(received).toBe(expected) failed'}]),scenario('firefox')]),1)).toBe(1);
 expect(()=>run(report([scenario('chromium'),scenario('firefox')]),1)).toThrow();
 for(const status of ['timedOut','interrupted','skipped'])expect(()=>run(report([scenario('chromium',status),scenario('firefox')]),1)).toThrow();
});
