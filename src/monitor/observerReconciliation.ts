import type {BlockHeader,CandidateObservation,RpcSource} from "../rpc/models";

export interface ReconciliationTarget {
  readonly source:RpcSource;
  readonly level:number;
  readonly round:number;
  readonly payload?:string;
  readonly candidate?:CandidateObservation;
  readonly observerHead?:BlockHeader;
  readonly protocolHash?:string;
  readonly observerGeneration?:number;
  readonly collectionGeneration?:number;
}

export function reconciliationKey(target:ReconciliationTarget):string {
  const head=target.observerHead??target.candidate?.header;
  return JSON.stringify([target.source.network,target.source.baseUrl,head?.chainId??null,head?.hash??null,head?.predecessor??null,target.protocolHash??null,target.level,target.round,target.payload,target.candidate?.identity??null,target.observerGeneration??null]);
}

interface QueuedTarget {key:string;target:ReconciliationTarget}
interface ActiveTarget extends QueuedTarget {readonly controller:AbortController;readonly generation:number}

/** One source-local on-demand workflow; a timer exists only for a newer queued context. */
export class ObserverReconciliation<T> {
  private enabled=false;
  private generation=0;
  private active:ActiveTarget|undefined;
  private queued:QueuedTarget|undefined;
  private timer:ReturnType<typeof setTimeout>|undefined;
  private lastStartedAt=-Infinity;
  private latestKey:string|undefined;
  private failedKey:string|undefined;
  private readonly failedKeys=new Set<string>();
  private successfulKey:string|undefined;
  private readonly now:()=>number;

  constructor(readonly source:RpcSource,private readonly options:{
    readonly run:(target:ReconciliationTarget,signal:AbortSignal)=>Promise<T>;
    readonly onResult:(target:ReconciliationTarget,value:T)=>void;
    readonly onError?:(target:ReconciliationTarget,error:unknown)=>void;
    readonly now?:()=>number;
    readonly retainedKeys?:()=>ReadonlySet<string>;
  }) {this.now=options.now??(()=>performance.now());}

  start():void {this.enabled=true;}
  stop():void {
    this.enabled=false;this.generation++;
    this.active?.controller.abort();this.active=undefined;this.queued=undefined;
    if(this.timer!==undefined)clearTimeout(this.timer);this.timer=undefined;
  }

  request(target:ReconciliationTarget,manual=false):boolean {
    if(!this.enabled)return false;
    if(target.source.baseUrl!==this.source.baseUrl || target.source.network!==this.source.network)throw new Error("Reconciliation target belongs to another observer");
    const retained=this.options.retainedKeys?.();if(retained)for(const failed of this.failedKeys)if(!retained.has(failed))this.failedKeys.delete(failed);
    const key=reconciliationKey(target);
    if(this.active?.key===key || this.queued?.key===key)return false;
    if(!manual && (this.failedKeys.has(key) || key===this.successfulKey))return false;
    // An early click is not a future automatic retry of a failed context.
    if(manual && this.failedKeys.has(key) && this.now()-this.lastStartedAt<15000)return false;
    this.latestKey=key;this.queued={key,target};this.drain();return true;
  }

  state():{readonly inFlight?:string;readonly queued?:string;readonly failed?:string;readonly lastStartedAt:number} {
    return {...(this.active?{inFlight:this.active.key}:{}),...(this.queued?{queued:this.queued.key}:{}),...(this.failedKey?{failed:this.failedKey}:{}),lastStartedAt:this.lastStartedAt};
  }

  observeOwnedContext(head:BlockHeader,observerGeneration:number,collectionGeneration:number):void {
    const active=this.active;if(!active || !this.current(active))throw new Error("Obsolete reconciliation context");
    const wasLatest=this.latestKey===active.key;
    active.target={...active.target,observerHead:head,observerGeneration,collectionGeneration};active.key=reconciliationKey(active.target);
    if(this.queued){this.queued.target={...this.queued.target,observerHead:head,observerGeneration,collectionGeneration};this.queued.key=reconciliationKey(this.queued.target);}
    if(this.queued?.key===active.key)this.queued=undefined;
    if(this.queued)this.latestKey=this.queued.key;else if(wasLatest)this.latestKey=active.key;
  }

  private drain():void {
    if(!this.enabled || this.active || !this.queued)return;
    const remaining=15000-(this.now()-this.lastStartedAt);
    if(remaining>0){
      if(this.timer===undefined)this.timer=setTimeout(()=>{this.timer=undefined;this.drain();},remaining);
      return;
    }
    const queued=this.queued;this.queued=undefined;
    const active:ActiveTarget={...queued,controller:new AbortController(),generation:this.generation};
    this.active=active;this.lastStartedAt=this.now();
    void this.options.run(active.target,active.controller.signal).then(value=>{
      if(this.current(active) && this.latestKey===active.key){this.successfulKey=active.key;this.options.onResult(active.target,value);}
    }).catch(error=>{
      if(this.current(active)){this.failedKey=active.key;this.failedKeys.add(active.key);while(this.failedKeys.size>100){const oldest=this.failedKeys.values().next().value;if(oldest===undefined)break;this.failedKeys.delete(oldest);}this.options.onError?.(active.target,error);}
    }).finally(()=>{
      if(this.active===active){this.active=undefined;this.drain();}
    });
  }

  private current(active:ActiveTarget):boolean {
    return this.enabled && this.active===active && active.generation===this.generation && !active.controller.signal.aborted;
  }
}
