import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { handleMcpRequest } from "../lib/mcp/server.ts";
import { MCP_CLIENT_CAPABILITIES_META, MCP_CLIENT_INFO_META, MCP_HEADER_METHOD, MCP_HEADER_NAME, MCP_HEADER_PROTOCOL_VERSION, MCP_PROTOCOL_VERSION, MCP_PROTOCOL_VERSION_META } from "../lib/mcp/protocol.ts";
import type { McpReadService } from "../lib/mcp/read-service.ts";

// These are the relevant 2026-07-28 wire shapes from the official bundled SDK:
// wireResult, the cacheable list/discover results, and CallToolResultSchema.
const complete = z.object({ resultType: z.literal("complete") }).passthrough();
const cacheable = complete.extend({ ttlMs: z.number().int().min(0), cacheScope: z.enum(["public", "private"]) }).passthrough();
const textContent = z.object({ type: z.literal("text"), text: z.string() }).passthrough();
const toolCallResult = complete.extend({ content: z.array(textContent), structuredContent: z.unknown().optional(), isError: z.boolean().optional() }).passthrough();

const service: McpReadService = {
  searchTasks: async () => ({ items: [] }),
  getTask: async () => ({ id: "task-1" }),
  listAccounts: async () => ({ items: [] }),
  getBudget: async () => ({ items: [] }),
  listObligations: async () => ({ items: [] }),
  listGoals: async () => ({ items: [] }),
  searchAll: async () => ({ shared: {}, private: {} }),
} as unknown as McpReadService;

const request = (method: string, id: number, params: Record<string, unknown> = {}) => {
  const meta = {
    [MCP_PROTOCOL_VERSION_META]: MCP_PROTOCOL_VERSION,
    [MCP_CLIENT_INFO_META]: { name: "official-shape-test-client", version: "1.0.0" },
    [MCP_CLIENT_CAPABILITIES_META]: {},
  };
  const bodyParams = { ...params, _meta: meta };
  return new Request("https://vida.test/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [MCP_HEADER_PROTOCOL_VERSION]: MCP_PROTOCOL_VERSION,
      [MCP_HEADER_METHOD]: method,
      ...(method === "tools/call" ? { [MCP_HEADER_NAME]: String(params.name || "") } : {}),
      "oai-authenticated-user-id": "owner-id",
      "oai-authenticated-user-email": "owner@example.com",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params: bodyParams }),
  });
};

const call = async (method: string, id: number, params: Record<string, unknown> = {}) => {
  const response = await handleMcpRequest(request(method, id, params), {
    database: { prepare() { throw new Error("No debe consultarse"); } },
    ownerPolicy: { ownerUserId: "owner-id", ownerEmail: "owner@example.com" },
    createService: () => service,
  });
  return { response, body: await response.json() as { result?: unknown; error?: { code: number } } };
};

test("las respuestas del servidor cumplen las formas wire modernas", async () => {
  const discover = await call("server/discover", 1);
  assert.equal(discover.response.status, 200);
  cacheable.parse(discover.body.result);

  const list = await call("tools/list", 2);
  assert.equal(list.response.status, 200);
  cacheable.parse(list.body.result);

  const tool = await call("tools/call", 3, { name: "get_capabilities", arguments: {} });
  assert.equal(tool.response.status, 200);
  toolCallResult.parse(tool.body.result);
});

test("los resultados malformados son rechazados por el contrato de conformidad", () => {
  assert.throws(() => cacheable.parse({ supportedVersions: [MCP_PROTOCOL_VERSION], capabilities: { tools: {} } }), /resultType/);
  assert.throws(() => cacheable.parse({ resultType: "complete", ttlMs: -1, cacheScope: "private", tools: [] }), error => error instanceof z.ZodError && error.issues.some(issue => issue.code === "too_small" && issue.path.join(".") === "ttlMs" && issue.minimum === 0));
  assert.throws(() => toolCallResult.parse({ content: [{ type: "text", text: "ok" }] }), /resultType/);
  assert.throws(() => toolCallResult.parse({ resultType: "partial", content: [] }), error => error instanceof z.ZodError && error.issues.some(issue => issue.code === "invalid_value" && issue.path.join(".") === "resultType"));
});

test("un error de ejecución de herramienta permanece en result.isError y no se convierte en error de transporte", async () => {
  const failingService = { ...service, searchTasks: async () => { throw new Error("lectura fallida"); } } as McpReadService;
  const response = await handleMcpRequest(request("tools/call", 4, { name: "search_tasks", arguments: {} }), {
    database: { prepare() { throw new Error("No debe consultarse"); } },
    ownerPolicy: { ownerUserId: "owner-id", ownerEmail: "owner@example.com" },
    createService: () => failingService,
  });
  const body = await response.json() as { result?: { resultType: string; isError?: boolean }; error?: unknown };
  assert.equal(response.status, 200);
  assert.equal(body.error, undefined);
  assert.equal(body.result?.resultType, "complete");
  assert.equal(body.result?.isError, true);
});

