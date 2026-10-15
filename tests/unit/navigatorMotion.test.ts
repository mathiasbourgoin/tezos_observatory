import {expect,it} from 'vitest';
import {navigatorDirection,retainNavigator} from '../../src/navigatorMotion';
import type {NetworkViewModel,ObservedNavigatorView} from '../../src/dashboardView';
const before:ObservedNavigatorView={identity:'votes101',source:'https://observer',chain:'Net',protocol:'P',level:101,round:0,payload:'vote-payload',coherent:true,contextParent:'B100',receivedAt:0,receivedMonotonic:1};
const after:ObservedNavigatorView={...before,identity:'votes102',level:102,payload:'next-vote-payload',contextParent:'B101',receivedMonotonic:2,predecessor:{hash:'B101',parentHash:'B100',payload:'different-applied-payload',level:101,round:0,relation:'context'}};
const live:NetworkViewModel={status:'healthy',appliedLevel:100,hash:'B100',sources:[{name:'Heads',url:'https://heads',status:'stream'}],session:{mode:'follow',frozen:false,newer:0,newerPartial:false,canPin:true,accepted:1,unresolved:0,raw:1,instances:[]}};
it('moves a votes-only next level using context without asserting a matching payload or block ancestry',()=>{
 expect(navigatorDirection(before,after)).toBe('right');expect(after.predecessor?.relation).toBe('context');
 expect(navigatorDirection({...before,hash:'DifferentBlock101'},after)).toBe('static');
 expect(navigatorDirection(before,{...after,predecessor:{...after.predecessor!,level:100}})).toBe('static');
});
it('rejects gaps, source/chain/protocol changes, unknown scope and old receipts',()=>{
 for(const changed of [{level:103},{source:'https://other'},{chain:'Other'},{protocol:'Other'},{receivedMonotonic:0}])expect(navigatorDirection(before,{...after,...changed})).toBe('static');
 const {chain:unknownChain,...unknownScope}=after;expect(unknownChain).toBe('Net');expect(navigatorDirection(before,unknownScope)).toBe('static');
 expect(navigatorDirection(before,{...before,identity:'round1',round:1,receivedMonotonic:2})).toBe('up');
});
it('retains only presentation through the ordinary applied-head proof gap',()=>{
 const pending={...live,status:'unknown' as const,appliedLevel:101,hash:'B101'};
 expect(retainNavigator(before,live,pending)).toBe(true);expect(retainNavigator(before,pending,pending)).toBe(true);
 for(const changed of [{appliedLevel:103},{appliedLevel:99},{hash:'Fork100'},{status:'paused' as const},{status:'loading' as const},{sources:[{name:'Heads',url:'https://other',status:'stream'}]},{observation:{...before,coherent:false,protocol:'Other'}},{session:{...live.session!,mode:'pin' as const}}])expect(retainNavigator(before,live,{...live,...changed})).toBe(false);
 expect(retainNavigator(before,pending,{...pending,hash:'Fork101'})).toBe(false);
 expect(retainNavigator(before,pending,{...pending,observation:after})).toBe(false);
});
