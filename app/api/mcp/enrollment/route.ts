import { env } from "cloudflare:workers";
import { handleEnrollmentRequest } from "@/lib/mcp/plans/enrollment-http";
import { approvalError } from "@/lib/mcp/plans/approval-http";
import { approvalConfiguration, type ProposalEnvironment } from "@/lib/mcp/plans/runtime";
export const runtime="edge";
async function handle(request:Request){try{const e=env as unknown as ProposalEnvironment & {DB?:D1Database;MCP_OWNER_USER_ID?:string;MCP_OWNER_EMAIL?:string};if(!e.DB)throw Error("Database unavailable");const config=approvalConfiguration(e);return handleEnrollmentRequest(request,{database:e.DB,origin:config.origin,ownerPolicy:{ownerUserId:e.MCP_OWNER_USER_ID,ownerEmail:e.MCP_OWNER_EMAIL}});}catch(error){return approvalError(error);}}
export {handle as GET,handle as POST};
