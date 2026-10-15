/** UI delivery timing only; never a chain, candidate or vote receipt. */
export interface CameraReceipt {readonly identity:string;readonly emittedMonotonic:number}
export function cameraReceipt(previous:CameraReceipt|undefined,identity:string|undefined,emittedMonotonic:number):CameraReceipt|undefined {
 if(!identity||!Number.isFinite(emittedMonotonic))return undefined;
 return previous?.identity===identity?previous:Object.freeze({identity,emittedMonotonic});
}
/** Keep the 160ms timeline; late rendering consumes it rather than restarting it. */
export function cameraElapsed(emittedMonotonic:number|undefined,now:number):number|undefined {
 if(emittedMonotonic===undefined||!Number.isFinite(emittedMonotonic)||!Number.isFinite(now))return undefined;
 const elapsed=now-emittedMonotonic;
 return elapsed>=0&&elapsed<160?elapsed:undefined;
}
