import type {NetworkViewModel,ObservedNavigatorView} from './dashboardView';

/** Presentation continuity only: this never admits votes or establishes ancestry. */
export function navigatorDirection(before:ObservedNavigatorView,after:ObservedNavigatorView):'static'|'up'|'right' {
 if(!before.coherent||!after.coherent||!before.chain||!before.protocol||before.source!==after.source||before.chain!==after.chain||before.protocol!==after.protocol||after.receivedMonotonic<before.receivedMonotonic)return 'static';
 if(after.level===before.level&&after.round===before.round+1&&before.contextParent&&after.contextParent===before.contextParent)return 'up';
 const parent=after.predecessor;
 if(after.level!==before.level+1||!parent||parent.level!==before.level)return 'static';
 // A votes-only tuple has no block hash to prove ancestry against the applied parent.
 // Its next observed level can still move one camera slot, keeping the dotted relation.
 if(!before.hash&&parent.relation==='context'&&after.contextParent===parent.hash)return 'right';
 return before.hash?parent.hash===before.hash?'right':'static':before.payload&&parent.payload===before.payload&&parent.round===before.round&&parent.parentHash===before.contextParent?'right':'static';
}

export function retainNavigator(anchor:ObservedNavigatorView|undefined,previous:NetworkViewModel|undefined,next:NetworkViewModel):boolean {
 if(!anchor?.coherent||!anchor.chain||!anchor.protocol||next.observation?.coherent||previous?.session?.mode!=='follow'||next.session?.mode!=='follow'||next.status==='paused'||next.status==='loading'||!next.sources?.find(source=>source.name==='Heads')?.url||previous.sources?.find(source=>source.name==='Heads')?.url!==next.sources.find(source=>source.name==='Heads')?.url)return false;
 const pending=next.observation;
 if(pending&&(pending.source!==anchor.source||pending.chain&&pending.chain!==anchor.chain||pending.protocol&&pending.protocol!==anchor.protocol))return false;
 if(previous.appliedLevel===undefined||next.appliedLevel===undefined||!previous.hash||!next.hash)return false;
 if(next.appliedLevel===previous.appliedLevel)return next.hash===previous.hash;
 return next.appliedLevel===previous.appliedLevel+1&&next.appliedLevel<=anchor.level;
}
