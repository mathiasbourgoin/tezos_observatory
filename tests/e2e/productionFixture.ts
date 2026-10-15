import {expect,type Page,type Locator} from '@playwright/test';
type Channel = 'mainnet-head' | 'mainnet-operations' | 'shadownet-head' | 'shadownet-operations' | 'mainnet-proposals' | 'shadownet-proposals';
declare global {
  interface Window {
    mockStreams: Record<string, ReadableStreamDefaultController<Uint8Array>>;
    mockInitialOperations: boolean;
    mockHidden: boolean;
    mockRequests: {url:string;aborted:boolean}[];
  }
}

export const head = (level = 100, round = 0) => ({
  level, hash: `BBlock${level}`, predecessor: `BBlock${level - 1}`,
  timestamp: new Date().toISOString(), fitness: ['02', level.toString(16).padStart(8,'0'), '', 'ffffffff', round.toString(16).padStart(8, '0')],
  payload_hash: `vhPayload${level}`,
});
export const vote = (slot: number, level = 101, round = 0) => ({
  hash: `operation-${slot}-${level}-${round}`,
  contents: [{kind: 'preattestation', slot, level, round, block_payload_hash: `vhPayload${level}`}],
});

export async function openDetails(details:Locator):Promise<void>{if(await details.getAttribute('open')===null)await details.locator(':scope > summary').click();}

export const headers=new WeakMap<Page,Map<string,ReturnType<typeof head>>>();
export async function send(page: Page, channel: Channel, value: unknown): Promise<void> {
  if(channel.endsWith("-head")){
    let observed=value as ReturnType<typeof head>;const records=headers.get(page),parent=records?.get(observed.predecessor);
    if(parent){const parentRound=Number.parseInt(parent.fitness[4]??"0",16);observed={...observed,fitness:[...observed.fitness.slice(0,3),(0xffffffff-parentRound).toString(16).padStart(8,"0"),observed.fitness[4]??"00000000"]};value=observed;}
    records?.set(observed.hash,observed);
    if(!records?.has(observed.predecessor))records?.set(observed.predecessor,{...head(observed.level-1),hash:observed.predecessor});
  }
  await page.evaluate(({channel, value}) => {
    const stream = window.mockStreams[channel];
    if (!stream) throw new Error(`Missing stream ${channel}`);
    stream.enqueue(new TextEncoder().encode(`${JSON.stringify(value)}\n`));
  }, {channel, value});
}

export async function prepare(page: Page, initialOperations = true, initialHead=head(),expectedLevel=initialHead.level,initiallyHidden=false,sourceB=false,rpcCommittee?:{total:number;quorum:number;powers:readonly number[]},aliases?:readonly {address:string;alias:string}[],protocol='PFixture'): Promise<void> {
  headers.set(page,new Map([[initialHead.hash,initialHead],[initialHead.predecessor,{...head(initialHead.level-1),hash:initialHead.predecessor}]]));
  await page.addInitScript(({initialOperations, initialHead, initiallyHidden,sourceB}) => {
    window.mockHidden=initiallyHidden;window.mockRequests=[];
    Object.defineProperty(document,"hidden",{configurable:true,get:()=>window.mockHidden});
    window.mockStreams = {};
    window.mockInitialOperations = initialOperations;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, options) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      const entry={url:url.href,aborted:options?.signal?.aborted??false};window.mockRequests.push(entry);
      options?.signal?.addEventListener('abort',()=>{entry.aborted=true;},{once:true});
      const monitoring = url.pathname.includes('/monitor/heads/') || url.pathname.endsWith('/monitor_operations') || url.pathname.includes('/monitor/validated_blocks');
      if (!monitoring) return originalFetch(input, options);
      const network = url.hostname.includes('shadownet') ? 'shadownet' : 'mainnet';
      const kind = url.pathname.includes('/monitor/heads/') ? 'head' : url.pathname.includes('/monitor/validated_blocks') ? 'proposals' : 'operations';
      if(sourceB && network==="mainnet" && kind==="operations" && url.hostname==="rpc.tzkt.io")return new Response("Unavailable A operations",{status:503});
      const body = new ReadableStream<Uint8Array>({start(controller) {
        window.mockStreams[`${network}-${kind}`] = controller;
        options?.signal?.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), {once: true});
        if (kind === 'head') controller.enqueue(new TextEncoder().encode(`${JSON.stringify(initialHead)}\n`));
        else if (kind === 'operations' && initialOperations) controller.enqueue(new TextEncoder().encode('[]\n'));
      }});
      return new Response(body, {headers: {'Content-Type': 'application/json'}});
    };
  }, {initialOperations, initialHead,initiallyHidden,sourceB});

  await page.route('https://**/*', async route => {
    const url = new URL(route.request().url());
    const level = Number(url.searchParams.get('level') ?? 100);
    let result: unknown;
    if (url.pathname.includes('attestation_rights')) result = [{level, delegates: Array.from({length: rpcCommittee?.powers.length??50}, (_, slot) => ({
      delegate: `tz1BakerAddress${String(slot).padStart(25, '0')}`, first_slot: slot, attesting_power: rpcCommittee?.powers[slot]??600,
    }))}];
    else if (url.pathname.endsWith('/context/constants')) result = {
      minimal_block_delay: '6', delay_increment_per_round: '3', consensus_threshold_size: rpcCommittee?.quorum??20000, consensus_committee_size: rpcCommittee?.total??30000,
    };
    else if (url.pathname.includes('baking_rights')) result = [{level, round: Number(url.searchParams.get('max_round') ?? 0), delegate: 'tz1BakerAddress0000000000000000000000000'}];
    else if (url.pathname.endsWith('/is_forbidden')) result = false;
    else if (url.pathname.endsWith('/protocols')) result={protocol,next_protocol:protocol};
    else if (url.pathname.endsWith('/header')) {
      const hash=url.pathname.split('/blocks/')[1]?.split('/')[0]??'';
      const observed=headers.get(page)?.get(hash);
      if(!observed){await route.fulfill({status:404,json:{error:'Unobserved fixture header'}});return;}
      result={...observed,chain_id:'NetFixture'};
    }
    else if (url.pathname.includes('/v1/delegates')) result = aliases??Array.from({length: 50}, (_, slot) => ({address: `tz1BakerAddress${String(slot).padStart(25, '0')}`, alias: `Baker ${slot}`}));
    else if (url.pathname.includes('pending_operations')) result = {}; // No full snapshot is claimed by ordinary stream fixtures.
    else {await route.abort(); return;}
    await route.fulfill({json: result, headers: {'Access-Control-Allow-Origin': '*'}});
  });
  await page.goto('/');
  if(initiallyHidden)return;
  await expect(page.locator('.mainnet .headline')).toContainText(initialHead.level.toLocaleString('en-US'));
  await expect(page.locator('.shadownet .headline')).toContainText(initialHead.level.toLocaleString('en-US'));
}
