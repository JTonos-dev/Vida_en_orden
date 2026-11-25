import { finishDeniedRequest } from "@/lib/mcp/plans/limits";
import { env } from "cloudflare:workers";
import { handleApprovalRequest, approvalError } from "@/lib/mcp/plans/approval-http";
import { approvalConfiguration, runtimeProposalEngine, type ProposalEnvironment } from "@/lib/mcp/plans/runtime";
export const runtime="edge";
type Environment=ProposalEnvironment & {DB?:D1Database;MCP_OWNER_USER_ID?:string;MCP_OWNER_EMAIL?:string};
async function handle(request:Request,{params}:{params:Promise<{proposalId:string}>}){
 try{const e=env as unknown as Environment;if(!e.DB)throw Error("Database unavailable");const config=approvalConfiguration(e);const {proposalId}=await params;
 return handleApprovalRequest(request,proposalId,{ownerPolicy:{ownerUserId:e.MCP_OWNER_USER_ID,ownerEmail:e.MCP_OWNER_EMAIL},...config,createEngine:(actor)=>runtimeProposalEngine(e.DB!,actor,e)});
 }catch(error){await finishDeniedRequest(request);return approvalError(error);}
}
export {handle as GET,handle as POST};
