/** UI delivery timing only; never a chain, candidate or vote receipt. */
export interface CameraReceipt {readonly identity:string;readonly emittedMonotonic:number}
export function cameraReceipt(previous:CameraReceipt|undefined,identity:string|undefined,emittedMonotonic:number):CameraReceipt|undefined {
 if(!identity||!Number.isFinite(emittedMonotonic))return undefined;
 return previous?.identity===identity?previous:Object.freeze({identity,emittedMonotonic});
}
/** Full visible travel starts at rendering; receipt age only fences stale destinations. */
export const CAMERA_DURATION_MS=1800;
export function cameraElapsed(emittedMonotonic:number|undefined,now:number):number|undefined {
 if(emittedMonotonic===undefined||!Number.isFinite(emittedMonotonic)||!Number.isFinite(now))return undefined;
 const elapsed=now-emittedMonotonic;
 return elapsed>=0&&elapsed<2000?elapsed:undefined;
}
