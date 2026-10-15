import {expect,it} from 'vitest';
import {observationMeaning} from '../../src/observationMeaning';
import type {RpcContext} from '../../src/rpc/networkData';
import type {BlockHeader,RpcSource} from '../../src/rpc/models';
import type {ObservedNavigatorView} from '../../src/dashboardView';
const source:RpcSource={network:'mainnet',name:'Observer',baseUrl:'https://observer.invalid'};
const evidence={source,receivedAt:1000,receivedMonotonic:0,chainId:'ChainA',observedHeadHash:'Applied'};
const head:BlockHeader={level:100,hash:'Applied',predecessor:'Parent',timestamp:'2026-01-01T00:00:00Z',fitness:['02','00000064','','ffffffff','000000d1'],payload_hash:'Payload',chainId:'ChainA',evidence};
const context:RpcContext={header:head,source,chainId:'ChainA',protocolHash:'Protocol',nextProtocolHash:'Protocol',evidence};
const view={snapshot:{generation:1,head,derived:null,operations:[]},appliedProof:{context,evidence},networkIdentity:context,observationTargets:[]};
const selected:ObservedNavigatorView={identity:'vote',level:100,round:209,payload:'Payload',source:source.baseUrl,chain:'ChainA',coherent:true,receivedAt:1000,receivedMonotonic:0};
it('retains authentic zero monotonic origin and labels applied tuple without inventing a block hash',()=>{
 expect(observationMeaning(view,selected)).toEqual({appliedSinceMonotonic:0,selectedRelationship:'applied-tuple',nextProposalObservation:{observed:false,source:'Observer'}});
 expect(observationMeaning(view,{...selected,hash:'Applied'}).selectedRelationship).toBe('applied-block');
 expect(observationMeaning(view,{...selected,hash:'Sibling'}).selectedRelationship).toBe('different-block');
});
it('rejects mismatched or missing source chain head and material receipts rather than inventing session age',()=>{
 for(const proof of [null,{context:{...context,source:{...source,baseUrl:'https://other.invalid'}},evidence},{context:{...context,chainId:'Other'},evidence},{context:{...context,header:{...head,chainId:'Other'}},evidence},{context:{...context,header:{...head,hash:'Old'}},evidence},{context,evidence:{...evidence,observedHeadHash:'Old'}},{context,evidence:{...evidence,chainId:'Other'}},{context,evidence:{...evidence,receivedMonotonic:NaN}}])expect(observationMeaning({...view,appliedProof:proof},selected)).toEqual({});
 for(const observation of [{...selected,source:'https://other.invalid'},{...selected,chain:'Other'},{...selected,coherent:false}])expect(observationMeaning(view,observation).selectedRelationship).toBeUndefined();
});
it('a later level requires the proven applied hash as parent and never follows a computed round',()=>{
 expect(observationMeaning(view,{...selected,level:101,round:0,payload:'Next',contextParent:'Applied'}).selectedRelationship).toBe('next-level');
 expect(observationMeaning(view,{...selected,level:101,round:0,contextParent:'Other'}).selectedRelationship).toBe('other');
 expect(observationMeaning(view,{...selected,round:210}).selectedRelationship).toBe('other');
});
