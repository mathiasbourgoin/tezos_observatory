export interface AdmissionSample {at:number;hash:string;coherent:boolean}
export interface CameraSample {at:number;animations:number}
/** Test-only causal measurement; absence of either receipt is execution incomplete. */
export function burstSettlement(admissions:readonly AdmissionSample[],frames:readonly CameraSample[],hash:string){
 const accepted=admissions.find(sample=>sample.hash===hash&&sample.coherent),moving=frames.find(frame=>frame.animations>0),settled=frames.find(frame=>frame.animations===0);
 if(!accepted||!moving||!settled||frames.length<2||!Number.isFinite(accepted.at)||!Number.isFinite(settled.at)||settled.at<accepted.at||settled.at<moving.at)throw new Error('Incomplete accepted observation / camera frame evidence');
 return {acceptedAt:accepted.at,visibleStartedAt:moving.at,settledAt:settled.at,elapsed:settled.at-accepted.at,visibleElapsed:settled.at-moving.at};
}
