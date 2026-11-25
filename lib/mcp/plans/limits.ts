import { canonicalize } from "./canonical.ts";
import { PlanError } from "./types.ts";
const unsafeKeys=new Set(["__proto__","prototype","constructor"]);
/** JSON syntax is validated first; this bounded walk rejects ambiguous keys/depth. */
export function parseBoundedJson(raw:string,maxBytes=64*1024):unknown{
 if(new TextEncoder().encode(raw).byteLength>maxBytes)throw new PlanError("input_limit","La solicitud excede el límite permitido.",413);
 let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new PlanError("invalid_json","JSON inválido.",400);}
 let index=0,nodes=0;
 const whitespace=()=>{while(/\s/.test(raw[index]||"x"))index++;};
 const string=()=>{const start=index++;while(index<raw.length){if(raw[index]==="\\"){index+=2;continue;}if(raw[index++]==='"')break;}return JSON.parse(raw.slice(start,index)) as string;};
 const visit=(depth:number)=>{
  if(depth>32||++nodes>10000)throw new PlanError("input_limit","La estructura excede el límite permitido.",413);
  whitespace();const token=raw[index];
  if(token==="{"){index++;whitespace();const keys=new Set<string>();if(raw[index]==="}"){index++;return;}while(index<raw.length){whitespace();const key=string();if(keys.has(key)||unsafeKeys.has(key))throw new PlanError("invalid_json","JSON contiene claves duplicadas o no permitidas.",400);keys.add(key);whitespace();index++;visit(depth+1);whitespace();if(raw[index++]==="}")return;}}
  else if(token==="["){index++;whitespace();if(raw[index]==="]"){index++;return;}while(index<raw.length){visit(depth+1);whitespace();if(raw[index++]==="]")return;}}
  else if(token==='"')string();else while(index<raw.length&&!/[\s,\]}]/.test(raw[index]))index++;
 };
 visit(0);try{canonicalize(parsed);}catch{throw new PlanError("invalid_json","JSON contiene valores no representables.",400);}return parsed;
}
export async function readBoundedJson(request:Request,maxBytes=64*1024):Promise<unknown>{
 if(Number(request.headers.get("content-length")||0)>maxBytes)throw new PlanError("input_limit","La solicitud excede el límite permitido.",413);
 const reader=request.body?.getReader();if(!reader)throw new PlanError("invalid_json","Falta JSON.",400);
 const chunks:Uint8Array[]= [];let length=0;
 try{while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>maxBytes){await reader.cancel();throw new PlanError("input_limit","La solicitud excede el límite permitido.",413);}chunks.push(part.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 let raw:string;try{raw=new TextDecoder("utf-8",{fatal:true}).decode(bytes);}catch{throw new PlanError("invalid_json","La solicitud requiere UTF-8 válido.",400);}
 return parseBoundedJson(raw,maxBytes);
}
/** Drain a small denied body before responding; bound both bytes and waiting time. */
export async function finishDeniedRequest(request:Request){
 if(!request.body||request.bodyUsed)return;
 const reader=request.body.getReader();let bytes=0,timer:ReturnType<typeof setTimeout>|undefined;
 const deadline=new Promise<{kind:"timeout"}>(resolve=>{timer=setTimeout(()=>resolve({kind:"timeout"}),1000);});
 try{while(true){const part=await Promise.race([reader.read().then(result=>({kind:"chunk" as const,result})),deadline]);if(part.kind==="timeout"){await reader.cancel();break;}if(part.result.done)break;bytes+=part.result.value.byteLength;if(bytes>64*1024){await reader.cancel();break;}}}catch{/* A disconnected/oversized client cannot change the denial. */}finally{if(timer)clearTimeout(timer);reader.releaseLock();}
}
