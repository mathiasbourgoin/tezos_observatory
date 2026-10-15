import {expect,it} from 'vitest';
import {burstSettlement} from '../e2e/burstTiming';
it('counts admission-to-first-frame latency in the 800ms settlement bound',()=>{
 const measurement=burstSettlement([{at:0,hash:'final',coherent:true}],[{at:80,animations:1},{at:840,animations:0}],'final');
 expect(measurement.elapsed).toBe(840);expect(measurement.elapsed).toBeGreaterThan(800);
 expect(burstSettlement([{at:0,hash:'final',coherent:false},{at:100,hash:'final',coherent:true}],[{at:110,animations:1},{at:760,animations:0}],'final').elapsed).toBe(660);
});
it('missing coherent acceptance or settlement is execution incomplete',()=>{
 for(const admissions of [[],[{at:0,hash:'other',coherent:true}],[{at:0,hash:'final',coherent:false}]])expect(()=>burstSettlement(admissions,[{at:180,animations:0}],'final')).toThrow('Incomplete');
 expect(()=>burstSettlement([{at:0,hash:'final',coherent:true}],[{at:10,animations:1}],'final')).toThrow('Incomplete');
});
