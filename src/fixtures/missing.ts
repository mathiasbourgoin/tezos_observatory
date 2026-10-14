import {renderMissingPhase,type MissingDelegate} from "../view/missingDelegates";
const delegates:readonly MissingDelegate[]=[
  {address:"tz1forbidden",alias:"Blocked baker",power:300,protocolStatus:{delegate:"tz1forbidden",eligibility:"forbidden"}},
  {address:"tz1eligible",alias:"Late baker",power:200,protocolStatus:{delegate:"tz1eligible",eligibility:"eligible"}},
  {address:"tz1unknown",alias:null,power:100,protocolStatus:{delegate:"tz1unknown",eligibility:"unavailable",reason:"HTTP 503"}},
];
const target=document.querySelector<HTMLElement>("#fixture");if(target===null)throw new Error("fixture target missing");renderMissingPhase(target,{phase:"attestation",delegates,committeePower:7000});
