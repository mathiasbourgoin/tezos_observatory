import {expect,it} from 'vitest';
import {navigatorDirection,retainNavigator,sameCameraPosition} from '../../src/navigatorMotion';
import type {NetworkViewModel,ObservedNavigatorView} from '../../src/dashboardView';
const before:ObservedNavigatorView={identity:'votes101',source:'https://observer',chain:'Net',protocol:'P',level:101,round:0,payload:'vote-payload',coherent:true,contextParent:'B100',receivedAt:0,receivedMonotonic:1};
const after:ObservedNavigatorView={...before,identity:'votes102',level:102,payload:'next-vote-payload',contextParent:'B101',receivedMonotonic:2,predecessor:{hash:'B101',parentHash:'B100',payload:'different-applied-payload',level:101,round:0,relation:'context'}};
const live:NetworkViewModel={status:'healthy',appliedLevel:100,hash:'B100',sources:[{name:'Heads',url:'https://heads',status:'stream'}],session:{mode:'follow',frozen:false,newer:0,newerPartial:false,canPin:true,accepted:1,unresolved:0,raw:1,instances:[]}};
it('keeps camera position through evidence identity, payload, hash and parent refreshes without associating those facts',()=>{
 const refresh={...before,identity:'other',payload:'other',hash:'Block101',contextHead:'OtherHead',contextParent:'OtherParent'};
 expect(sameCameraPosition(before,refresh)).toBe(true);expect(refresh.payload).not.toBe(before.payload);
 for(const changed of [{source:'other'},{chain:'other'},{protocol:'other'},{level:102},{round:1},{coherent:false}])expect(sameCameraPosition(before,{...refresh,...changed})).toBe(false);
 expect(sameCameraPosition(undefined,refresh)).toBe(false);
});
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
 expect(retainNavigator(before,live,{...live,observation:before},true)).toBe(true);
});

it('retains an already-applied coherent vote anchor across exactly one newer applied-head proof gap',()=>{
 const applied={...live,appliedLevel:101,hash:'B101'},pending={...applied,status:'unknown' as const,appliedLevel:102,hash:'B102'};
 expect(retainNavigator(before,applied,pending)).toBe(true);
 expect(retainNavigator(before,pending,pending)).toBe(true);
 expect(retainNavigator(before,pending,{...pending,appliedLevel:103,hash:'B103'})).toBe(false);
 expect(retainNavigator(before,pending,{...pending,hash:'Fork102'})).toBe(false);
 for(const change of [{source:'Other'},{chain:'Other'},{protocol:'Other'}])expect(retainNavigator(before,applied,{...pending,observation:{...before,coherent:false,...change}})).toBe(false);
});

it('does not mistake an unscoped raw witness for a proven observer switch during pending head proof',()=>{
 const applied={...live,appliedLevel:101,hash:'B101'},raw:ObservedNavigatorView={identity:'raw-TzKT',level:102,round:0,source:'https://rpc.tzkt.io/mainnet',coherent:false,receivedAt:2,receivedMonotonic:2};
 const pending={...applied,status:'unknown' as const,appliedLevel:102,hash:'B102',observation:raw};
 expect(retainNavigator(before,applied,pending)).toBe(true);
 for(const scope of [{chain:'Net'},{protocol:'P'},{chain:'Other'},{protocol:'Other'}])expect(retainNavigator(before,applied,{...pending,observation:{...raw,...scope}})).toBe(false);
 expect(retainNavigator(before,applied,{...pending,sources:[{name:'Heads',url:'https://other-heads',status:'stream'}]})).toBe(false);
});
