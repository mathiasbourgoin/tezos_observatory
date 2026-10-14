import {expect,it} from "vitest";
import {AssertionError} from "node:assert";
const loaded:unknown=await import(new URL("../../scripts/check-observatory-foundations.mjs",import.meta.url).href);
if(typeof loaded!=="object" || loaded===null || !("classifyBrowserReport" in loaded) || typeof loaded.classifyBrowserReport!=="function")throw new Error("Missing real semantic report classifier");
const classify=loaded.classifyBrowserReport as (report:unknown,status:number,criterion:string)=>number;
const test=(projectName:string,status="passed",errors:readonly {message:string}[]=[],verified=true)=>({projectName,annotations:verified?[{type:"foundation-verified",description:"AC-4"}]:[],results:[{status,errors}]});
const report=(tests:readonly unknown[],errors:readonly unknown[]=[])=>({suites:[{specs:[{tests}]}],errors});
const failure=(value:unknown,status=1):unknown=>{try{classify(value,status,"AC-4");return undefined;}catch(error){return error;}};
it.each([false,true])("prioritizes a real mixed-engine runtime error in either order: %s",reverse=>{
 const cases=[test("chromium","failed",[{message:"Error: expect(received).toBe(expected) failed"}]),test("firefox","failed",[{message:"Error: browser fixture threw before assertions"}])];
 if(reverse)cases.reverse();const error=failure(report(cases));expect(error).toBeInstanceOf(Error);expect(error).not.toBeInstanceOf(AssertionError);
});
it("rejects zero-assertion passed results",()=>{expect(failure(report([test("chromium","passed",[],false),test("firefox")]),0)).toBeInstanceOf(Error);});
it("requires both completed engines without skipped or retried cases",()=>{
 for(const cases of [[test("chromium")],[test("chromium"),test("chromium")],[test("chromium","skipped"),test("firefox")],[{...test("chromium"),results:[]},test("firefox")],[{...test("chromium"),results:[{status:"passed"},{status:"passed"}]},test("firefox")],[test("chromium","timedOut"),test("firefox")]])expect(failure(report(cases))).toBeInstanceOf(Error);
});
it("rejects malformed empty reports and unexplained runner errors",()=>{
 for(const value of [null,{},report([]),report([test("chromium"),test("firefox")],[{message:"setup failed"}])])expect(failure(value)).toBeInstanceOf(Error);
 expect(failure(report([test("chromium"),test("firefox")]),1)).toBeInstanceOf(Error);
});
it("rejects inconsistent passed error statuses and failed cases without assertions",()=>{
 for(const cases of [[test("chromium","passed",[{message:"runtime"}]),test("firefox")],[test("chromium","failed"),test("firefox")],[test("chromium","interrupted"),test("firefox")]])expect(failure(report(cases))).toBeInstanceOf(Error);
});
it("classifies only completed matcher failures as behavioral red",()=>{
 expect(failure(report([test("chromium","failed",[{message:"Error: \u001b[2mexpect(received).toBe(expected) failed"}]),test("firefox")]))).toBeInstanceOf(AssertionError);
 expect(classify(report([test("chromium"),test("firefox")]),0,"AC-4")).toBe(2);
});
