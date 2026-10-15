import {test,expect} from '@playwright/test';
import {prepare,inspectionModule} from './productionFixture';
async function actualProduct(page:import('@playwright/test').Page){await prepare(page,false);await expect(page.getByRole('heading',{name:'Tezos Observatory',exact:true})).toBeVisible();await expect(page.locator('.mainnet .navigator-junction')).toBeVisible();}
test('V3 production inspection exports share actual classes and import without external work',async({page,context})=>{
 await actualProduct(page);const path=inspectionModule();const blank=await context.newPage(),requests:string[]=[];
 await blank.route('**/inspection-probe.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Module import observation</title>'}));
 await blank.goto('/inspection-probe.html');blank.on('request',request=>requests.push(request.url()));
 const result=await blank.evaluate(async modulePath=>{const module=await import(modulePath);return {names:Object.keys(module).sort(),nodes:document.body.children.length};},path);
 expect(result).toEqual({names:['NetworkData','NetworkMonitor','ObservationStore'],nodes:0});expect(requests.length).toBeGreaterThan(0);expect(requests.every(url=>new URL(url).hostname==='127.0.0.1'&&new URL(url).pathname.startsWith('/assets/')&&new URL(url).pathname.endsWith('.js'))).toBe(true);await blank.close();
});
