import { env } from "cloudflare:workers";
import { handleMcpRequest } from "@/lib/mcp/server";
import type { McpReadDatabase } from "@/lib/mcp/read-service";

export const runtime = "edge";

type McpRuntimeEnvironment = {
  DB?: McpReadDatabase;
  MCP_OWNER_USER_ID?: string;
  MCP_OWNER_EMAIL?: string;
};

export async function POST(request: Request) {
  const runtimeEnv = env as unknown as McpRuntimeEnvironment;
  return handleMcpRequest(request, {
    database: runtimeEnv.DB,
    ownerPolicy: {
      ownerUserId: runtimeEnv.MCP_OWNER_USER_ID,
      ownerEmail: runtimeEnv.MCP_OWNER_EMAIL,
    },
  });
}

export function GET() {
  return Response.json({ error: "MCP requiere POST JSON-RPC." }, { status: 405, headers: { allow: "POST", "cache-control": "no-store" } });
}
