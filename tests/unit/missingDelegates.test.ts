import {describe,expect,it} from "vitest";
import {summarizeMissing,type MissingDelegate} from "../../src/view/missingDelegates";
describe("summarizeMissing",()=>{it("keeps all status counts and power separate",()=>{const delegates:readonly MissingDelegate[]=[
  {address:"a",alias:null,power:30,protocolStatus:{delegate:"a",eligibility:"forbidden"}},
  {address:"b",alias:null,power:20,protocolStatus:{delegate:"b",eligibility:"eligible"}},
  {address:"c",alias:null,power:10,protocolStatus:{delegate:"c",eligibility:"unavailable"}},
];expect(summarizeMissing(delegates)).toEqual({forbidden:{count:1,power:30},eligible:{count:1,power:20},unavailable:{count:1,power:10}});});});
