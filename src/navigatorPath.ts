import type {ObservedNavigatorView} from './dashboardView';
import {navigatorDirection} from './navigatorMotion';

export interface NavigatorPathPhase {
 readonly power:number;
 readonly total:number;
 readonly threshold?:number;
}
export interface NavigatorPathInput {
 readonly anchor:ObservedNavigatorView;
 readonly pre?:NavigatorPathPhase;
 readonly att?:NavigatorPathPhase;
}
export interface NavigatorPathRecord extends NavigatorPathInput {
 readonly key:string;
 readonly x:number;
 readonly y:number;
 readonly gapBefore:boolean;
}

const keyOf=(anchor:ObservedNavigatorView):string=>JSON.stringify([anchor.identity,anchor.source,anchor.chain,anchor.protocol,anchor.contextHead,anchor.contextParent,anchor.level,anchor.round,anchor.hash,anchor.payload]);
const phase=(value:NavigatorPathPhase|undefined):NavigatorPathPhase|undefined=>value&&Number.isSafeInteger(value.power)&&value.power>=0&&Number.isSafeInteger(value.total)&&value.total>0&&value.power<=value.total&&(value.threshold===undefined||Number.isSafeInteger(value.threshold)&&value.threshold>0&&value.threshold<=value.total)?Object.freeze({power:value.power,total:value.total,...(value.threshold===undefined?{}:{threshold:value.threshold})}):undefined;
const peak=(before:NavigatorPathPhase|undefined,after:NavigatorPathPhase|undefined):NavigatorPathPhase|undefined=>!after?before:before&&before.total===after.total&&before.threshold===after.threshold&&before.power>after.power?before:after;

/** Bounded presentation history. It neither fetches data nor creates consensus proof. */
export class NavigatorPath {
 private retained:readonly NavigatorPathRecord[]=Object.freeze([]);
 private selected:NavigatorPathRecord|undefined;
 private scope:string|undefined;
 private loss:Readonly<{levels:number;rounds:number}>=Object.freeze({levels:0,rounds:0});
 get current():NavigatorPathRecord|undefined {return this.selected;}
 get records():readonly NavigatorPathRecord[] {return this.retained;}
 get truncated():Readonly<{levels:number;rounds:number}> {return this.loss;}

 observe(input:NavigatorPathInput,direction:'static'|'up'|'right',reset=false):NavigatorPathRecord|undefined {
  if(reset)this.clear();
  const anchor=input.anchor;
  if(!anchor.coherent||!anchor.source||!anchor.chain||!anchor.protocol||!Number.isSafeInteger(anchor.level)||anchor.level<0||!Number.isSafeInteger(anchor.round)||anchor.round<0||!Number.isFinite(anchor.receivedMonotonic)||anchor.receivedMonotonic<0)return undefined;
  const scope=JSON.stringify([anchor.source,anchor.chain,anchor.protocol]);
  if(this.scope!==scope)this.clear();
  this.scope=scope;
  const current=this.selected;
  if(current&&anchor.receivedMonotonic<current.anchor.receivedMonotonic)return undefined;
  const key=keyOf(anchor),existing=this.retained.find(record=>record.anchor.level===anchor.level&&record.anchor.round===anchor.round);
  const movement=current&&navigatorDirection(current.anchor,anchor)===direction?direction:'static';
  const x=existing?.x??(current?current.x+(movement==='up'?0:1):0);
  const y=existing?.y??(current?current.y-(movement==='up'?1:0):0);
  const gapBefore=existing?.gapBefore??(current!==undefined&&movement==='static');
  const same=existing?.key===key?existing:undefined;
  const pre=peak(same?.pre,phase(input.pre)),att=peak(same?.att,phase(input.att));
  const captured=Object.freeze({...anchor,...(anchor.predecessor?{predecessor:Object.freeze({...anchor.predecessor})}:{})});
  const record:NavigatorPathRecord=Object.freeze({key,anchor:captured,x,y,gapBefore,...(pre?{pre}:{}),...(att?{att}:{})});
  const retained=[...this.retained.filter(value=>value!==existing),record];
  const rounds=retained.filter(value=>value.anchor.level===anchor.level);
  const droppedRounds=new Set(rounds.slice(0,Math.max(0,rounds.length-32)));
  const levels=[...new Set(retained.filter(value=>!droppedRounds.has(value)).map(value=>value.anchor.level).reverse())];
  const droppedLevels=new Set(levels.slice(100));
  this.retained=Object.freeze(retained.filter(value=>!droppedRounds.has(value)&&!droppedLevels.has(value.anchor.level)));
  this.loss=Object.freeze({levels:this.loss.levels+droppedLevels.size,rounds:this.loss.rounds+droppedRounds.size});
  this.selected=record;
  return record;
 }
 private clear():void {
  this.retained=Object.freeze([]);this.selected=undefined;this.scope=undefined;this.loss=Object.freeze({levels:0,rounds:0});
 }
}
