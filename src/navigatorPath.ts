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
export const historyLengths=[25,50,100,250,500,1000,'unlimited'] as const;
export type HistoryLength=typeof historyLengths[number];
export const historyLength=(value:unknown):HistoryLength=>historyLengths.find(option=>(typeof value==='string'||typeof value==='number')&&String(option)===String(value))??500;

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
 private retained=new Map<string,NavigatorPathRecord>();
 private slots=new Map<string,string>();
 private selected:NavigatorPathRecord|undefined;
 private scope:string|undefined;
 private lostRecords=0;
 private discardedBefore=-1;
 private length:HistoryLength;
 constructor(length:HistoryLength=500){this.length=length;}
 get current():NavigatorPathRecord|undefined {return this.selected;}
 get records():readonly NavigatorPathRecord[] {return Object.freeze([...this.retained.values()]);}
 /** One spatial representative per visited tuple; rivals are inspected without overlapping tiles. */
 get positions():readonly NavigatorPathRecord[] {return [...this.slots.values()].flatMap(key=>{const record=this.retained.get(key);return record?[record]:[];});}
 get limit():HistoryLength {return this.length;}
 get truncated():Readonly<{records:number}> {return {records:this.lostRecords};}
 setLimit(length:HistoryLength):void {this.length=length;this.trim();}
 private tuple(anchor:ObservedNavigatorView):string {return `${anchor.level}/${anchor.round}`;}
 private qualified(anchor:ObservedNavigatorView):boolean {return anchor.coherent&&!!anchor.source&&!!anchor.chain&&!!anchor.protocol&&Number.isSafeInteger(anchor.level)&&anchor.level>=0&&Number.isSafeInteger(anchor.round)&&anchor.round>=0&&Number.isFinite(anchor.receivedMonotonic)&&anchor.receivedMonotonic>=0;}
 private capture(input:NavigatorPathInput,position:{x:number;y:number;gapBefore:boolean}):NavigatorPathRecord|undefined {
  const anchor=input.anchor,key=keyOf(anchor),before=this.retained.get(key);
  if(before&&anchor.receivedMonotonic<before.anchor.receivedMonotonic)return undefined;
  // The same proven hash/context can receive a new admission identity. Replace its facts;
  // an identity upgrade never borrows phase peaks from the previous admission.
  const upgraded=!before&&anchor.hash?[...this.retained.values()].find(record=>record.key!==key&&record.anchor.hash===anchor.hash&&record.anchor.payload===anchor.payload&&record.anchor.level===anchor.level&&record.anchor.round===anchor.round&&record.anchor.source===anchor.source&&record.anchor.chain===anchor.chain&&record.anchor.protocol===anchor.protocol&&record.anchor.contextHead===anchor.contextHead&&record.anchor.contextParent===anchor.contextParent):undefined;
  if(upgraded&&anchor.receivedMonotonic<upgraded.anchor.receivedMonotonic||!before&&!upgraded&&anchor.receivedMonotonic<=this.discardedBefore)return undefined;
  const pre=peak(before?.pre,phase(input.pre)),att=peak(before?.att,phase(input.att));
  const captured=Object.freeze({...anchor,...(anchor.predecessor?{predecessor:Object.freeze({...anchor.predecessor})}:{})});
  const record:NavigatorPathRecord=Object.freeze({key,anchor:captured,...position,...(pre?{pre}:{}),...(att?{att}:{})});
  if(upgraded){this.retained.delete(upgraded.key);for(const [tuple,slotKey] of this.slots)if(slotKey===upgraded.key)this.slots.set(tuple,key);}
  this.retained.set(key,record);if(this.selected?.key===key||this.selected?.key===upgraded?.key)this.selected=record;return record;
 }
 observe(input:NavigatorPathInput,direction:'static'|'up'|'right',reset=false):NavigatorPathRecord|undefined {
  if(reset)this.clear();
  const anchor=input.anchor;if(!this.qualified(anchor))return undefined;
  const scope=JSON.stringify([anchor.source,anchor.chain,anchor.protocol]);
  if(this.scope!==scope)this.clear();this.scope=scope;
  const current=this.selected;if(current&&anchor.receivedMonotonic<current.anchor.receivedMonotonic)return undefined;
  const tuple=this.tuple(anchor),existingKey=this.slots.get(tuple),existing=existingKey?this.retained.get(existingKey):undefined;
  const movement=current&&navigatorDirection(current.anchor,anchor)===direction?direction:'static';
  const position={x:existing?.x??(current?current.x+(movement==='up'?0:1):0),y:existing?.y??(current?current.y-(movement==='up'?1:0):0),gapBefore:existing?.gapBefore??(current!==undefined&&movement==='static')};
  const record=this.capture(input,position);if(!record)return undefined;
  this.slots.set(tuple,record.key);this.selected=record;this.trim();return record;
 }
 /** Already admitted local alternatives do not select a destination or create a path segment. */
 retain(input:NavigatorPathInput):void {
  const anchor=input.anchor;
  if(!this.qualified(anchor)||JSON.stringify([anchor.source,anchor.chain,anchor.protocol])!==this.scope)return;
  const tupleKey=this.slots.get(this.tuple(anchor)),position=tupleKey?this.retained.get(tupleKey):this.positions.find(record=>record.anchor.level===anchor.level)??this.selected;
  if(position){this.capture(input,{x:position.x,y:position.y,gapBefore:position.gapBefore});this.trim();}
 }
 /** Distinct observed hashes or payload-only identities; upgrades never borrow another context's phases. */
 observations(level:number,round?:number):readonly NavigatorPathRecord[] {
  const proposals=new Map<string,NavigatorPathRecord>();
  for(const record of this.retained.values()){
   const anchor=record.anchor;if(anchor.level!==level||round!==undefined&&anchor.round!==round)continue;
   const key=JSON.stringify([anchor.round,anchor.hash?'block':'payload',anchor.hash??anchor.payload??anchor.identity]);
   const previous=proposals.get(key);if(!previous||anchor.receivedMonotonic>=previous.anchor.receivedMonotonic)proposals.set(key,record);
  }
  return [...proposals.values()].sort((a,b)=>b.anchor.receivedMonotonic-a.anchor.receivedMonotonic);
 }
 private trim():void {
  if(this.length==='unlimited'||this.retained.size<=this.length)return;
  const retired=[...this.retained.values()].filter(record=>record.key!==this.selected?.key).sort((a,b)=>a.anchor.receivedMonotonic-b.anchor.receivedMonotonic).slice(0,this.retained.size-this.length);
  for(const record of retired){this.retained.delete(record.key);this.discardedBefore=Math.max(this.discardedBefore,record.anchor.receivedMonotonic);this.lostRecords++;}
  const replacements=new Map<string,NavigatorPathRecord>();
  for(const record of this.retained.values()){const tuple=this.tuple(record.anchor),before=replacements.get(tuple);if(!before||record.anchor.receivedMonotonic>=before.anchor.receivedMonotonic)replacements.set(tuple,record);}
  for(const [tuple,key] of this.slots)if(!this.retained.has(key)){
   const replacement=replacements.get(tuple);if(replacement)this.slots.set(tuple,replacement.key);else this.slots.delete(tuple);
  }
 }
 private clear():void {this.retained.clear();this.slots.clear();this.selected=undefined;this.scope=undefined;this.lostRecords=0;this.discardedBefore=-1;}
}
