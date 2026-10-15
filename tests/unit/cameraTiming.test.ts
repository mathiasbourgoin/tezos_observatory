import {expect,it} from 'vitest';
import {cameraReceipt,cameraElapsed,CAMERA_DURATION_MS} from '../../src/cameraTiming';
it('one UI timing owner retains its first coherent emission across duplicates and changes on A to B to A',()=>{
 const a=cameraReceipt(undefined,'A',10);expect(cameraReceipt(a,'A',90)).toBe(a);
 const b=cameraReceipt(a,'B',100),returned=cameraReceipt(b,'A',150);expect(returned?.emittedMonotonic).toBe(150);expect(returned).not.toBe(a);
 expect(cameraReceipt(a,undefined,200)).toBeUndefined();expect(cameraReceipt(a,'B',NaN)).toBeUndefined();
});
it('render delay retains fresh destinations without shortening the visible journey; stale receipts snap',()=>{
 expect(CAMERA_DURATION_MS).toBe(1200);
 expect(cameraElapsed(100,100)).toBe(0);expect(cameraElapsed(100,170)).toBe(70);expect(cameraElapsed(100,2099)).toBe(1999);
 for(const now of [99,2100,3000,NaN,Infinity])expect(cameraElapsed(100,now)).toBeUndefined();expect(cameraElapsed(undefined,100)).toBeUndefined();
});
