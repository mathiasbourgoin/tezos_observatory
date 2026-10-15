import {expect,it} from 'vitest';
import {burstSettlement} from '../e2e/burstTiming';
it('reports receipt delay separately from the visible 850ms journey',()=>{
 const measurement=burstSettlement([{at:0,hash:'final',coherent:true}],[{at:80,animations:1},{at:840,animations:0}],'final');
 expect(measurement.elapsed).toBe(840);expect(measurement.visibleElapsed).toBe(760);expect(measurement.visibleStartedAt).toBe(80);
 expect(burstSettlement([{at:0,hash:'final',coherent:false},{at:100,hash:'final',coherent:true}],[{at:110,animations:1},{at:760,animations:0}],'final').elapsed).toBe(660);
});
it('missing coherent acceptance or settlement is execution incomplete',()=>{
 for(const admissions of [[],[{at:0,hash:'other',coherent:true}],[{at:0,hash:'final',coherent:false}]])expect(()=>burstSettlement(admissions,[{at:100,animations:1},{at:180,animations:0}],'final')).toThrow('Incomplete');
 expect(()=>burstSettlement([{at:0,hash:'final',coherent:true}],[{at:10,animations:1}],'final')).toThrow('Incomplete');
});
