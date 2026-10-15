import {expect,it} from 'vitest';
import {NavigatorPath} from '../../src/navigatorPath';
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

it.each(['identity','contextHead','contextParent','payload','hash'] as const)('replaces the same tuple world slot without borrowing phases across %s',field=>{
 const path=new NavigatorPath(),first=anchor();path.observe({anchor:first,pre:{power:4,total:5}},'static');
 const replaced=path.observe({anchor:{...first,[field]:'Different',receivedMonotonic:10001},att:{power:0,total:5}},'static')!;
 expect(replaced).toMatchObject({x:0,y:0,gapBefore:false});expect(replaced.pre).toBeUndefined();expect(replaced.att?.power).toBe(0);expect(path.records).toHaveLength(1);
});

it.each(['source','chain','protocol'] as const)('resets the path when the actual %s scope changes',field=>{
 const path=new NavigatorPath();path.observe({anchor:anchor()},'static');path.observe({anchor:anchor(100,1)},'up');
 const reset=path.observe({anchor:{...anchor(101),[field]:'Other'}},'right')!;
 expect(reset).toMatchObject({x:0,y:0,gapBefore:false});expect(path.records).toHaveLength(1);expect(path.truncated).toEqual({levels:0,rounds:0});
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

it('bounds retained data at 100 observed levels and 32 actual rounds per level by receipt',()=>{
 const path=new NavigatorPath();
 for(let level=100;level<201;level++)for(let round=0;round<33;round++)path.observe({anchor:anchor(level,round)},round===0?'static':'up');
 expect(new Set(path.records.map(record=>record.anchor.level)).size).toBe(100);
 expect(path.records).toHaveLength(3200);expect(path.records.every(record=>record.anchor.level>=101&&record.anchor.round>=1)).toBe(true);
 expect(path.truncated).toEqual({levels:1,rounds:101});expect(path.current?.anchor).toMatchObject({level:200,round:32});
});
