import { env } from "cloudflare:workers";
import { handleMcpRequest } from "@/lib/mcp/server";
import { runtimeProposalEngine, type ProposalEnvironment } from "@/lib/mcp/plans/runtime";

export const runtime = "edge";

type McpRuntimeEnvironment = ProposalEnvironment & {
  DB?: D1Database;
  MCP_OWNER_USER_ID?: string;
  MCP_OWNER_EMAIL?: string;
};

export async function POST(request: Request) {
  const runtimeEnv = env as unknown as McpRuntimeEnvironment;
  return handleMcpRequest(request, {
    database: runtimeEnv.DB,
    extendedReadsEnabled: runtimeEnv.MCP_EXTENDED_READS_ENABLED === "true",
    ...(runtimeEnv.MCP_PROPOSALS_ENABLED === "true" && runtimeEnv.DB ? {
      createProposalEngine: (actor) => runtimeProposalEngine(runtimeEnv.DB!, actor, runtimeEnv),
      approvalOrigin: runtimeEnv.MCP_APPROVAL_ORIGIN,
    } : {}),
    ownerPolicy: {
      ownerUserId: runtimeEnv.MCP_OWNER_USER_ID,
      ownerEmail: runtimeEnv.MCP_OWNER_EMAIL,
    },
  });
}

export function GET() {
  return Response.json({ error: "MCP requiere POST JSON-RPC." }, { status: 405, headers: { allow: "POST", "cache-control": "no-store" } });
}
