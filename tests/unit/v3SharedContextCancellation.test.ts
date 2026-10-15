import {afterEach,expect,it,vi} from 'vitest';
import {NetworkData} from '../../src/rpc/networkData';
import type {BlockHeader} from '../../src/rpc/models';
afterEach(()=>vi.unstubAllGlobals());
const header=(level:number):BlockHeader=>({chainId:'NetFixture',level,hash:`B${level}`,predecessor:`B${level-1}`,timestamp:'2026-01-01T00:00:00Z',fitness:['02',level.toString(16).padStart(8,'0'),'','ffffffff','00000000']});
it('a new applied-head derivation survives cancellation of an overlapping selected-opportunity context owner',async()=>{
 const calls:string[]=[];let hold=true;
 vi.stubGlobal('fetch',async(input:unknown,options?:RequestInit)=>{
  const url=String(input);calls.push(url);
  if(url.endsWith('/B101/header')&&hold){hold=false;return await new Promise<Response>((_resolve,reject)=>{const signal=options?.signal;if(!signal)throw new Error('Request signal missing');signal.addEventListener('abort',()=>reject(new DOMException('Old opportunity cancelled','AbortError')),{once:true});});}
  if(url.endsWith('/header')){const hash=url.split('/blocks/')[1]?.split('/')[0]??'';return Response.json({...header(Number(hash.slice(1))),chain_id:'NetFixture'});}
  if(url.endsWith('/protocols'))return Response.json({protocol:'PFixture',next_protocol:'PFixture'});
  if(url.includes('attestation_rights'))return Response.json([{level:Number(new URL(url).searchParams.get('level')),delegates:[{delegate:'D1',first_slot:0,attesting_power:5}]}]);
  return Response.json({minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5});
 });
 const data=new NetworkData('mainnet'),old=new AbortController(),current=new AbortController();
 const opportunity=data.opportunityConstants(header(101),102,old.signal).catch(error=>error);
 await vi.waitFor(()=>expect(calls.some(url=>url.endsWith('/B101/header'))).toBe(true));
 const derivation=data.derive(header(101),current.signal);old.abort();await opportunity;
 const proof=await derivation;expect(current.signal.aborted).toBe(false);expect(proof.errors).toEqual([]);expect(proof.rights.get(102)?.[0]?.power).toBe(5);expect(proof.contexts.get(102)?.observer.header.hash).toBe('B101');
});


function controlled(path:string,ignoreAbort=false,holdCount=1){
 const calls:string[]=[];const releases:Array<()=>void>=[];let held=0;
 vi.stubGlobal('fetch',async(input:unknown,options?:RequestInit)=>{
  const url=String(input);calls.push(url);
  const response=()=>{
   if(url.endsWith('/header')){const hash=url.split('/blocks/')[1]?.split('/')[0]??'';return Response.json({...header(Number(hash.slice(1))),chain_id:'NetFixture'});}
   if(url.endsWith('/protocols'))return Response.json({protocol:'PFixture',next_protocol:'PFixture'});
   if(url.includes('attestation_rights'))return Response.json([{level:Number(new URL(url).searchParams.get('level')),delegates:[{delegate:'D1',first_slot:0,attesting_power:5}]}]);
   return Response.json({minimal_block_delay:'6',delay_increment_per_round:'3',consensus_threshold_size:4,consensus_committee_size:5});
  };
  if(url.includes(path)&&held<holdCount){held++;return new Promise<Response>((resolve,reject)=>{releases.push(()=>resolve(response()));if(!ignoreAbort)options?.signal?.addEventListener('abort',()=>reject(new DOMException('Cancelled owner','AbortError')),{once:true});});}
  return response();
 });
 return {calls,release:(index=0)=>{const release=releases[index];if(!release)throw new Error('No held request');release();},ready:(count=1)=>vi.waitFor(()=>expect(held).toBe(count))};
}
it('a new opportunity survives cancellation of a derive context owner',async()=>{
 const rpc=controlled('/B101/header'),data=new NetworkData('mainnet'),old=new AbortController(),current=new AbortController();
 const first=data.derive(header(101),old.signal);await rpc.ready();
 const second=data.opportunityConstants(header(101),102,current.signal);old.abort();
 expect((await second).minimum).toBe(6);expect((await first).rights.size).toBe(0);
 expect(rpc.calls.filter(url=>url.endsWith('/B101/header'))).toHaveLength(2);
});
it('a cancelled context waiter cannot inherit a healthy owner result',async()=>{
 const rpc=controlled('/B101/header'),data=new NetworkData('mainnet'),owner=new AbortController(),waiter=new AbortController();
 const first=data.opportunityConstants(header(101),102,owner.signal);await rpc.ready();
 const second=data.derive(header(101),waiter.signal);waiter.abort();rpc.release();
 expect((await first).minimum).toBe(6);const aborted=await second;
 expect(aborted.contexts.size).toBe(0);expect(aborted.rights.size).toBe(0);
});
it('committee requests have independent cancellation ownership',async()=>{
 const rpc=controlled('attestation_rights?level=102'),data=new NetworkData('mainnet'),old=new AbortController(),current=new AbortController();
 const first=data.derive(header(101),old.signal);await rpc.ready();
 const second=data.derive(header(101),current.signal);old.abort();
 expect((await second).errors).toEqual([]);await first;
 expect(rpc.calls.filter(url=>url.includes('attestation_rights?level=102'))).toHaveLength(2);
});
it('same-signal context and committee readers coalesce live requests',async()=>{
 const rpc=controlled('/B101/header'),data=new NetworkData('mainnet'),owner=new AbortController();
 const first=data.derive(header(101),owner.signal);await rpc.ready();const second=data.derive(header(101),owner.signal);rpc.release();
 expect((await first).errors).toEqual([]);expect((await second).errors).toEqual([]);
 expect(rpc.calls.filter(url=>url.endsWith('/B101/header'))).toHaveLength(1);
 expect(rpc.calls.filter(url=>url.includes('attestation_rights?level=102'))).toHaveLength(1);
});
it('ignored-abort completion cannot cross pause/resume or delete a replacement owner',async()=>{
 const rpc=controlled('/B101/header',true),data=new NetworkData('mainnet'),old=new AbortController(),current=new AbortController();
 const first=data.derive(header(101),old.signal);await rpc.ready();data.pause();data.resume();
 const second=data.derive(header(101),current.signal);rpc.release();
 expect((await first).contexts.size).toBe(0);expect((await second).errors).toEqual([]);
 const before=rpc.calls.length;expect((await data.derive(header(101),current.signal)).errors).toEqual([]);expect(rpc.calls.length).toBe(before);
});
it('completed context reuse still rejects a mismatching expected header and cancelled readers',async()=>{
 const rpc=controlled('never'),data=new NetworkData('mainnet'),owner=new AbortController();
 expect((await data.derive(header(101),owner.signal)).errors).toEqual([]);
 const before=rpc.calls.length;
 expect((await data.derive({...header(101),timestamp:'2026-01-02T00:00:00Z'},owner.signal)).contexts.size).toBe(0);
 owner.abort();expect((await data.derive(header(101),owner.signal)).contexts.size).toBe(0);expect(rpc.calls.length).toBe(before);
});

it('a cancelled committee waiter cannot receive a healthy committee completion',async()=>{
 const rpc=controlled('attestation_rights?level=102',true),data=new NetworkData('mainnet'),owner=new AbortController(),waiter=new AbortController();
 const first=data.derive(header(101),owner.signal);await rpc.ready();
 const second=data.derive(header(101),waiter.signal);waiter.abort();rpc.release();
 expect((await first).errors).toEqual([]);expect((await second).rights.has(102)).toBe(false);
});
it('a cancelled owner settling cannot remove a still-live replacement pending context',async()=>{
 const rpc=controlled('/B101/header',true,2),data=new NetworkData('mainnet'),old=new AbortController(),current=new AbortController();
 const first=data.opportunityConstants(header(101),102,old.signal).catch(error=>error);await rpc.ready();
 const second=data.opportunityConstants(header(101),102,current.signal);await rpc.ready(2);old.abort();rpc.release();
 await first;const third=data.opportunityConstants(header(101),102,current.signal);await Promise.resolve();rpc.release(1);
 expect((await second).minimum).toBe(6);expect((await third).minimum).toBe(6);
 expect((await data.derive(header(101),current.signal)).errors).toEqual([]);
 expect(rpc.calls.filter(url=>url.endsWith('/B101/header'))).toHaveLength(2);
});
