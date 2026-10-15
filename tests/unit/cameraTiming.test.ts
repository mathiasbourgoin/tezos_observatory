import {expect,it} from 'vitest';
import {cameraReceipt,cameraElapsed} from '../../src/cameraTiming';
it('one UI timing owner retains its first coherent emission across duplicates and changes on A to B to A',()=>{
 const a=cameraReceipt(undefined,'A',10);expect(cameraReceipt(a,'A',90)).toBe(a);
 const b=cameraReceipt(a,'B',100),returned=cameraReceipt(b,'A',150);expect(returned?.emittedMonotonic).toBe(150);expect(returned).not.toBe(a);
 expect(cameraReceipt(a,undefined,200)).toBeUndefined();expect(cameraReceipt(a,'B',NaN)).toBeUndefined();
});
it('actual rendering delay consumes the 600ms default and expired or invalid budgets snap',()=>{
 expect(cameraElapsed(100,100)).toBe(0);expect(cameraElapsed(100,170)).toBe(70);expect(cameraElapsed(100,699)).toBe(599);
 for(const now of [99,700,900,NaN,Infinity])expect(cameraElapsed(100,now)).toBeUndefined();expect(cameraElapsed(undefined,100)).toBeUndefined();
});
