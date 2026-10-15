import {expect,it} from 'vitest';
import {recentConsensus} from '../../src/consensus/recentConsensus';
import type {AcceptedPhase,SessionSnapshot} from '../../src/monitor/observationStore';
import type {RpcSource} from '../../src/rpc/models';

const source:RpcSource={network:'mainnet',name:'Observer A',baseUrl:'https://observer-a.invalid'};
function snapshot(identity:string,level:number,powers:{pre?:number;att?:number}={},observer=source):SessionSnapshot<unknown>{
 const evidence={source:observer,receivedAt:1,receivedMonotonic:1};
 const phase=(kind:'pre'|'att',power:number):AcceptedPhase=>({key:identity,phase:kind,maximumPower:power,maximumTotal:1000,maximumThreshold:667,maximumBasis:identity,maximumEvidence:evidence,currentEvidence:evidence,power,threshold:667,basis:identity,quorumObserved:false,crossed:false,uncertain:false,evidence});
 const phases={...(powers.pre===undefined?{}:{pre:phase('pre',powers.pre)}),...(powers.att===undefined?{}:{att:phase('att',powers.att)})};
 return {identity,record:{identity,target:{source:observer,level,round:0,payload:identity},evidence,contextInvalid:false,phases},evidence,candidates:[],committee:[],phaseCommittees:{},maximumCommittees:{},currentPre:[],currentAtt:[],pre:[],att:[],unknownSlots:[],conflicts:[],partial:false,acceptedSequence:1};
}
it('keeps five measured peaks when same-level empty observations alternate with them',()=>{
 const history=Array.from({length:6},(_,index)=>[snapshot(`empty-${index}`,105-index),snapshot(`known-${index}`,105-index,{pre:999,att:998})]).flat();
 const rows=recentConsensus(history);
 expect(rows.map(row=>row.identity)).toEqual(['known-0','known-1','known-2','known-3','known-4']);
 expect(rows.every(row=>row.prePower===999&&row.attPower===998)).toBe(true);
 expect(history).toHaveLength(12);
});
it('preserves measured zero, one-phase evidence and distinct qualified context identities',()=>{
 const other={...source,name:'Observer B',baseUrl:'https://observer-b.invalid'};
 const rows=recentConsensus([snapshot('unknown',101),snapshot('measured-zero',101,{pre:0}),snapshot('phase-only',101,{att:600}),snapshot('other-source-protocol-context',101,{pre:700},other)]);
 expect(rows.map(row=>row.identity)).toEqual(['measured-zero','phase-only','other-source-protocol-context']);
 expect(rows[0]).toMatchObject({prePower:0,preTotal:1000,source:source.baseUrl});expect(rows[0]?.attPower).toBeUndefined();
 expect(rows[1]?.prePower).toBeUndefined();expect(rows[1]?.attPower).toBe(600);
 expect(rows[2]).toMatchObject({prePower:700,source:other.baseUrl});
});
