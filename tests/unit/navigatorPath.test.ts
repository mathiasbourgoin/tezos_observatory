import {expect,it} from 'vitest';
import {NavigatorPath,historyLength,historyLengths} from '../../src/navigatorPath';
import type {ObservedNavigatorView} from '../../src/dashboardView';

const anchor=(level=100,round=0,receipt=level*100+round):ObservedNavigatorView=>({identity:`I${level}r${round}`,source:'https://rpc',chain:'NetFixture',protocol:'PFixture',contextHead:`H${level-1}`,contextParent:`B${level-1}`,level,round,hash:`B${level}r${round}`,payload:`P${level}r${round}`,coherent:true,receivedAt:receipt,receivedMonotonic:receipt,predecessor:{hash:`B${level-1}r0`,level:level-1,round:0,relation:'ancestry',parentHash:`B${level-2}`}});

it('retains actual up/right coordinates and marks a static gap without invented intermediate observations',()=>{
 const path=new NavigatorPath(),first=path.observe({anchor:anchor()},'static')!;
 expect(first).toMatchObject({x:0,y:0,gapBefore:false});
 const up=path.observe({anchor:anchor(100,1)},'up')!;expect(up).toMatchObject({x:0,y:-1,gapBefore:false});
 const right=path.observe({anchor:{...anchor(101),predecessor:{...anchor(101).predecessor!,hash:'B100r1',round:1}}},'right')!;
 expect(right).toMatchObject({x:1,y:-1,gapBefore:false});
 const gap=path.observe({anchor:anchor(105)},'static')!;expect(gap).toMatchObject({x:2,y:-1,gapBefore:true});
 expect(path.records.map(record=>record.anchor.level)).toEqual([100,100,101,105]);
 expect(path.current).toBe(gap);
});

it('does not accept a requested direction without actual eligible progression',()=>{
 const path=new NavigatorPath();path.observe({anchor:anchor()},'static');
 expect(path.observe({anchor:anchor(103)},'right')).toMatchObject({x:1,y:0,gapBefore:true});
 expect(path.observe({anchor:anchor(103,4)},'up')).toMatchObject({x:2,y:0,gapBefore:true});
});

it('keeps measured zero, missing phases and exact-key phase peaks distinct in immutable snapshots',()=>{
 const path=new NavigatorPath(),original=anchor(),pre={power:0,total:5,threshold:4};
 const zero=path.observe({anchor:original,pre},'static')!;
 expect(zero.pre?.power).toBe(0);expect(zero.att).toBeUndefined();
 const high=path.observe({anchor:{...original,receivedMonotonic:10001},pre:{power:4,total:5,threshold:4}},'static')!;
 const lower=path.observe({anchor:{...original,receivedMonotonic:10002},pre:{power:1,total:5,threshold:4},att:{power:0,total:5}},'static')!;
 expect(lower.pre?.power).toBe(4);expect(lower.att?.power).toBe(0);expect(zero.pre?.power).toBe(0);expect(high.att).toBeUndefined();
 expect(path.records).toHaveLength(1);expect(lower).toMatchObject({x:0,y:0});
 pre.power=5;expect(zero.pre?.power).toBe(0);
 expect(Object.isFrozen(lower)).toBe(true);expect(Object.isFrozen(lower.anchor.predecessor)).toBe(true);expect(Object.isFrozen(path.records)).toBe(true);
 expect(JSON.parse(JSON.stringify(path.records))).toHaveLength(1);
});

it.each(['identity','contextHead','contextParent','payload','hash'] as const)('retains distinct observations in one world slot without borrowing phases across %s',field=>{
 const path=new NavigatorPath(),first=anchor();path.observe({anchor:first,pre:{power:4,total:5}},'static');
 const replaced=path.observe({anchor:{...first,[field]:'Different',receivedMonotonic:10001},att:{power:0,total:5}},'static')!;
 expect(replaced).toMatchObject({x:0,y:0,gapBefore:false});expect(replaced.pre).toBeUndefined();expect(replaced.att?.power).toBe(0);expect(path.records).toHaveLength(field==='identity'?1:2);expect(path.positions).toHaveLength(1);
});

it.each(['source','chain','protocol'] as const)('resets the path when the actual %s scope changes',field=>{
 const path=new NavigatorPath();path.observe({anchor:anchor()},'static');path.observe({anchor:anchor(100,1)},'up');
 const reset=path.observe({anchor:{...anchor(101),[field]:'Other'}},'right')!;
 expect(reset).toMatchObject({x:0,y:0,gapBefore:false});expect(path.records).toHaveLength(1);expect(path.truncated).toEqual({records:0});
});

it('ignores unqualified, invalid and obsolete observations and supports an explicit discontinuity reset',()=>{
 const path=new NavigatorPath(),first=path.observe({anchor:anchor()},'static');
 for(const invalid of [{...anchor(101),coherent:false},{...anchor(101),chain:undefined},{...anchor(101),round:-1},{...anchor(101),receivedMonotonic:1}])expect(path.observe({anchor:invalid as ObservedNavigatorView},'right')).toBeUndefined();
 expect(path.current).toBe(first);expect(path.records).toHaveLength(1);
 expect(path.observe({anchor:anchor(99)},'static',true)).toMatchObject({x:0,y:0,gapBefore:false});
 expect(path.records).toHaveLength(1);
 expect(path.observe({anchor:{...anchor(),coherent:false}},'static',true)).toBeUndefined();expect(path.current).toBeUndefined();expect(path.records).toEqual([]);
});

it('does not compare phase peaks across different denominators or thresholds',()=>{
 const path=new NavigatorPath(),first=anchor();path.observe({anchor:first,pre:{power:4,total:5,threshold:4}},'static');
 expect(path.observe({anchor:first,pre:{power:1,total:6,threshold:4}},'static')?.pre).toEqual({power:1,total:6,threshold:4});
 expect(path.observe({anchor:first,pre:{power:0,total:6,threshold:5}},'static')?.pre).toEqual({power:0,total:6,threshold:5});
 expect(path.observe({anchor:first,att:{power:9,total:5}},'static')?.att).toBeUndefined();
});

it.each(historyLengths)('bounds the complete observed proposal count at %s without a hidden round cap',limit=>{
 const path=new NavigatorPath(limit),count=limit==='unlimited'?1200:limit+1;
 for(let index=0;index<count;index++)path.observe({anchor:anchor(100,index,index+1)},index===0?'static':'up');
 expect(path.records).toHaveLength(limit==='unlimited'?count:limit);expect(path.current?.anchor.round).toBe(count-1);
 expect(path.truncated.records).toBe(limit==='unlimited'?0:1);
});

it('defaults to500 and safely validates persisted options',()=>{
 expect(new NavigatorPath().limit).toBe(500);
 for(const limit of historyLengths){expect(historyLength(String(limit))).toBe(limit);expect(historyLength(limit)).toBe(limit);}
 for(const invalid of ['',null,undefined,'0','24','Infinity','UNLIMITED',{}])expect(historyLength(invalid)).toBe(500);
});

it('retains two real same-round competitors and keeps their qualified phases separate',()=>{
 const path=new NavigatorPath(),first=anchor();path.observe({anchor:first,pre:{power:4,total:5}},'static');
 path.retain({anchor:{...first,identity:'rival',hash:'RivalHash',payload:'RivalPayload',receivedMonotonic:10001},att:{power:2,total:5}});
 expect(path.current?.anchor.hash).toBe(first.hash);expect(path.positions).toHaveLength(1);expect(path.records).toHaveLength(2);
 const rival=path.observations(100,0).find(record=>record.anchor.hash==='RivalHash');expect(rival?.pre).toBeUndefined();expect(rival?.att?.power).toBe(2);
 path.retain({anchor:{...first,identity:'rival',hash:'RivalHash',payload:'RivalPayload',receivedMonotonic:9999},pre:{power:5,total:5}});
 expect(path.observations(100,0).find(record=>record.anchor.hash==='RivalHash')?.pre).toBeUndefined();
});

it('counts all rivals toward the finite limit and never resurrects evicted old observations',()=>{
 const path=new NavigatorPath(25),first=anchor();path.observe({anchor:first},'static');
 for(let index=1;index<40;index++)path.retain({anchor:{...first,identity:`rival${index}`,hash:`Rival${index}`,receivedMonotonic:10000+index}});
 expect(path.records).toHaveLength(25);expect(path.records.some(record=>record.key===path.current?.key)).toBe(true);
 const before=path.records;path.retain({anchor:{...first,identity:'rival1',hash:'Rival1',receivedMonotonic:10001},pre:{power:5,total:5}});expect(path.records).toEqual(before);
 path.setLimit(1000);expect(path.records).toHaveLength(25);path.setLimit('unlimited');expect(path.records).toHaveLength(25);
});

it('deduplicates a proven same-hash identity upgrade only inside its exact context without phase borrowing',()=>{
 const path=new NavigatorPath(),first=anchor();path.observe({anchor:first,pre:{power:4,total:5}},'static');
 path.retain({anchor:{...first,identity:'readmitted',receivedMonotonic:10001},att:{power:0,total:5}});
 expect(path.records).toHaveLength(1);expect(path.current?.anchor.identity).toBe('readmitted');expect(path.current?.pre).toBeUndefined();expect(path.current?.att?.power).toBe(0);
 path.retain({anchor:{...first,identity:'other-context',contextHead:'Other',receivedMonotonic:10002},pre:{power:1,total:5}});expect(path.records).toHaveLength(2);
 const {hash:knownHash,...votes}=first;expect(knownHash).toBeTruthy();path.retain({anchor:{...votes,identity:'payload-only',receivedMonotonic:10003}});expect(path.records).toHaveLength(3);expect(path.observations(100,0)).toHaveLength(2);
});

it('captures only compact presentation facts at500 and1000 records (encoded JSON estimate, not heap usage)',()=>{
 for(const limit of [500,1000] as const){const path=new NavigatorPath(limit);for(let index=0;index<limit;index++)path.observe({anchor:anchor(100+index,0,index+1),pre:{power:4,total:5},att:{power:3,total:5}},'static');const bytes=Buffer.byteLength(JSON.stringify(path.records));expect(bytes).toBeLessThan(limit*1400);console.info(`NavigatorPath ${limit} compact observations: ${bytes} encoded JSON bytes (not heap usage)`);}
});

it('keeps a retained same-tuple rival visible when its former spatial representative is evicted',()=>{
 const path=new NavigatorPath(25),first=anchor(100,0,1);path.observe({anchor:first},'static');
 path.retain({anchor:{...first,identity:'retained-rival',hash:'RetainedRival',receivedMonotonic:2}});
 const next=anchor(101,0,3);path.observe({anchor:next},'right');
 for(let index=0;index<23;index++)path.retain({anchor:{...next,identity:`next-rival${index}`,hash:`NextRival${index}`,receivedMonotonic:4+index}});
 expect(path.records).toHaveLength(25);expect(path.positions.find(record=>record.anchor.level===100)?.anchor.hash).toBe('RetainedRival');expect(path.current?.anchor.hash).toBe(next.hash);
});
