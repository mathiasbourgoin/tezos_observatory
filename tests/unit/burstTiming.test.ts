import {expect,it} from 'vitest';
import {burstSettlement} from '../e2e/burstTiming';
it('reports receipt delay separately from the visible 1200ms journey',()=>{
 const measurement=burstSettlement([{at:0,hash:'final',coherent:true}],[{at:80,animations:1},{at:1280,animations:0}],'final');
 expect(measurement.elapsed).toBe(1280);expect(measurement.visibleElapsed).toBe(1200);expect(measurement.visibleStartedAt).toBe(80);
 expect(burstSettlement([{at:0,hash:'final',coherent:false},{at:100,hash:'final',coherent:true}],[{at:110,animations:1},{at:1310,animations:0}],'final').elapsed).toBe(1210);
});
it('missing coherent acceptance or settlement is execution incomplete',()=>{
 for(const admissions of [[],[{at:0,hash:'other',coherent:true}],[{at:0,hash:'final',coherent:false}]])expect(()=>burstSettlement(admissions,[{at:100,animations:1},{at:180,animations:0}],'final')).toThrow('Incomplete');
 expect(()=>burstSettlement([{at:0,hash:'final',coherent:true}],[{at:10,animations:1}],'final')).toThrow('Incomplete');
});
