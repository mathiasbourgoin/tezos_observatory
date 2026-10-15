/** UI delivery timing only; never a chain, candidate or vote receipt. */
export interface CameraReceipt {readonly identity:string;readonly emittedMonotonic:number}
export function cameraReceipt(previous:CameraReceipt|undefined,identity:string|undefined,emittedMonotonic:number):CameraReceipt|undefined {
 if(!identity||!Number.isFinite(emittedMonotonic))return undefined;
 return previous?.identity===identity?previous:Object.freeze({identity,emittedMonotonic});
}
/** Readable adjacent-slot travel; late rendering consumes this bounded UI budget. */
export const CAMERA_DURATION_MS=600;
export function cameraElapsed(emittedMonotonic:number|undefined,now:number):number|undefined {
 if(emittedMonotonic===undefined||!Number.isFinite(emittedMonotonic)||!Number.isFinite(now))return undefined;
 const elapsed=now-emittedMonotonic;
 return elapsed>=0&&elapsed<CAMERA_DURATION_MS?elapsed:undefined;
}
