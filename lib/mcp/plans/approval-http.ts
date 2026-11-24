import { readBoundedJson, finishDeniedRequest } from "./limits.ts";
import { z } from "zod";
import { authenticateMcpRequest, McpAuthenticationError, type McpIdentity, type McpOwnerPolicy } from "../auth.ts";
import { randomChallenge } from "./canonical.ts";
import type { ProposalEngine } from "./engine.ts";
import { PlanError } from "./types.ts";

const cookieName="__Host-veo-approval-csrf";
const headers={"cache-control":"no-store","x-content-type-options":"nosniff","x-frame-options":"DENY"};
const csrfSchema=z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const bodySchema=z.discriminatedUnion("action",[z.object({action:z.literal("challenge"),digest:z.string().regex(/^[a-f0-9]{64}$/),revision:z.number().int().positive()}).strict(),z.object({action:z.literal("approve"),digest:z.string().regex(/^[a-f0-9]{64}$/),revision:z.number().int().positive(),challenge:csrfSchema,proof:z.record(z.unknown())}).strict()]);
export type ApprovalHttpDependencies={ownerPolicy:McpOwnerPolicy;origin:string;credentials:readonly {ownerId:string;id:string}[];createEngine:(actor:McpIdentity)=>ProposalEngine};
export function approvalSession(request:Request,policy:McpOwnerPolicy,origin:string){
 const actor=authenticateMcpRequest(request,policy);
 const url=new URL(origin);if(url.protocol!=="https:"||url.origin!==origin||new URL(request.url).origin!==origin)throw new PlanError("origin_mismatch","Origen de aprobación no autorizado.",403);
 const values=(request.headers.get("cookie")||"").split(";").map(v=>v.trim()).filter(v=>v.startsWith(cookieName+"="));
 const token=values.length===1&&csrfSchema.safeParse(values[0].slice(cookieName.length+1)).success?values[0].slice(cookieName.length+1):"";
 if(request.method==="POST"&&(request.headers.get("origin")!==origin||!token||request.headers.get("x-veo-csrf")!==token||request.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json"))throw new PlanError("csrf_failed","La sesión de aprobación debe iniciarse en este Site.",403);
 return {actor,token:token||randomChallenge()};
}
export function approvalJson(value:unknown,status=200,token?:string){return Response.json(value,{status,headers:{...headers,...(token?{"set-cookie":`${cookieName}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=600`}:{})}});}
export function approvalError(error:unknown){
 if(error instanceof McpAuthenticationError)return approvalJson({error:error.code,message:error.message},error.status);
 if(error instanceof PlanError)return approvalJson({error:error.code,message:error.message},error.status);
 return approvalJson({error:"approval_failed",message:"No se confirmó la aprobación. Actualiza el estado antes de reintentar."},409);
}
export const approvalBody = readBoundedJson;
export async function handleApprovalRequest(request:Request,proposalId:string,dependencies:ApprovalHttpDependencies){
 try{
  if(!["GET","POST"].includes(request.method))return approvalJson({error:"method_not_allowed"},405);
  const {actor,token}=approvalSession(request,dependencies.ownerPolicy,dependencies.origin);
  if(!z.string().uuid().safeParse(proposalId).success)throw new PlanError("invalid_input","Propuesta inválida.",400);
  const engine=dependencies.createEngine(actor),credentials=dependencies.credentials.filter(c=>c.ownerId===actor.userId);
  if(request.method==="GET")return approvalJson({owner:actor.email,proposal:await engine.get(proposalId),csrfToken:token,credentialConfigured:credentials.length>0,businessWritesEnabled:false},200,token);
  const parsed=bodySchema.safeParse(await approvalBody(request));if(!parsed.success)throw new PlanError("invalid_input","Acción de aprobación inválida.",400);
  const shown=await engine.get(proposalId);
  if(shown.digest!==parsed.data.digest||shown.revision!==parsed.data.revision)throw new PlanError("stale_proposal","La propuesta cambió. Recarga y revisa el nuevo resumen.");
  if(!credentials.length)throw new PlanError("credential_required","El administrador debe fijar una credencial del propietario.",503);
  if(parsed.data.action==="challenge"){
   const challenge=await engine.requestApproval(proposalId);
   return approvalJson({publicKey:{challenge:challenge.challenge,rpId:new URL(dependencies.origin).hostname,allowCredentials:credentials.map(c=>({id:c.id,type:"public-key"})),userVerification:"required",timeout:60000},digest:challenge.digest,revision:challenge.revision});
  }
  const proposal=await engine.approve(proposalId,parsed.data.challenge,parsed.data.proof);
  return approvalJson({proposal,businessWritesEnabled:false});
 }catch(error){await finishDeniedRequest(request);return approvalError(error);}
}
