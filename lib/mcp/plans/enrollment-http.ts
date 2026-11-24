import { finishDeniedRequest } from "./limits.ts";
import { z } from "zod";
import type { DomainDatabase } from "../../domain/context.ts";
import type { McpOwnerPolicy } from "../auth.ts";
import { approvalSession, approvalJson, approvalError, approvalBody } from "./approval-http.ts";
import { credentialEnrollment } from "./enrollment.ts";
import { PlanError } from "./types.ts";
const schema=z.discriminatedUnion("action",[z.object({action:z.literal("options")}).strict(),z.object({action:z.literal("candidate"),challenge:z.string().regex(/^[A-Za-z0-9_-]{43}$/),proof:z.record(z.unknown())}).strict()]);
export async function handleEnrollmentRequest(request:Request,dependencies:{database:DomainDatabase;ownerPolicy:McpOwnerPolicy;origin:string}){
 try{
  if(!["GET","POST"].includes(request.method))return approvalJson({error:"method_not_allowed"},405);
  const {actor,token}=approvalSession(request,dependencies.ownerPolicy,dependencies.origin);
  if(request.method==="GET")return approvalJson({csrfToken:token,owner:actor.email,trusted:false,businessWritesEnabled:false},200,token);
  const parsed=schema.safeParse(await approvalBody(request));if(!parsed.success)throw new PlanError("invalid_input","Solicitud de credencial inválida.",400);
  const enrollment=credentialEnrollment(dependencies.database,actor,dependencies.origin);
  return approvalJson(parsed.data.action==="options"?{publicKey:await enrollment.options()}:await enrollment.candidate(parsed.data.challenge,parsed.data.proof));
 }catch(error){await finishDeniedRequest(request);return approvalError(error);}
}
