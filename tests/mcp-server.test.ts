import assert from "node:assert/strict";
import test from "node:test";
import type { McpReadService } from "../lib/mcp/read-service.ts";
import { handleMcpRequest, MCP_TOOL_DEFINITIONS } from "../lib/mcp/server.ts";
import { MCP_CLIENT_CAPABILITIES_META, MCP_CLIENT_INFO_META, MCP_HEADER_METHOD, MCP_HEADER_NAME, MCP_HEADER_PROTOCOL_VERSION, MCP_PROTOCOL_VERSION, MCP_PROTOCOL_VERSION_META } from "../lib/mcp/protocol.ts";

const database = { prepare() { throw new Error("La base no debe consultarse en esta prueba"); } };
const service: McpReadService = {
  searchTasks: async () => ({ items: [] }),
  getTask: async () => ({ id: "task-1" }),
  listAccounts: async () => ({ items: [] }),
  getBudget: async () => ({ items: [] }),
  listObligations: async () => ({ items: [] }),
  listGoals: async () => ({ items: [] }),
  searchAll: async () => ({ shared: {}, private: {} }),
} as unknown as McpReadService;

const rpc = (body: Record<string, unknown>, identity = true, options: { protocolVersion?: string; headerVersion?: string; methodHeader?: string; nameHeader?: string; includeHeaders?: boolean } = {}) => {
  const protocolVersion = options.protocolVersion || MCP_PROTOCOL_VERSION;
  const params = { ...((body.params && typeof body.params === "object" && !Array.isArray(body.params)) ? body.params : {}), _meta: {
    [MCP_PROTOCOL_VERSION_META]: protocolVersion,
    [MCP_CLIENT_INFO_META]: { name: "test-client", version: "1.0.0" },
    [MCP_CLIENT_CAPABILITIES_META]: {},
    ...(((body.params as Record<string, unknown> | undefined)?._meta as Record<string, unknown> | undefined) || {}),
  } };
  const requestBody = { ...body, params };
  const headers = {
    "content-type": "application/json",
    ...(options.includeHeaders === false ? {} : {
      [MCP_HEADER_PROTOCOL_VERSION]: options.headerVersion || protocolVersion,
      [MCP_HEADER_METHOD]: options.methodHeader || String(body.method || ""),
      ...(body.method === "tools/call" ? { [MCP_HEADER_NAME]: options.nameHeader || String((body.params as Record<string, unknown> | undefined)?.name || "") } : {}),
    }),
    ...(identity ? { "oai-authenticated-user-id": "owner-id", "oai-authenticated-user-email": "owner@example.com" } : {}),
  };
  return new Request("https://vida.test/mcp", {
  method: "POST",
  headers,
  body: JSON.stringify(requestBody),
});
};
const call = async (body: Record<string, unknown>, identity = true, options: Parameters<typeof rpc>[2] = {}) => {
  const response = await handleMcpRequest(rpc(body, identity, options), {
    database,
    ownerPolicy: { ownerUserId: "owner-id", ownerEmail: "owner@example.com" },
    createService: () => service,
  });
  return { response, body: response.status === 204 ? {} : await response.json() as Record<string, unknown> };
};

test("descubre MCP 2026-07-28", async () => {
  const result = await call({ jsonrpc: "2.0", id: 1, method: "server/discover" });
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.body.result, { resultType: "complete", ttlMs: 0, cacheScope: "private", supportedVersions: ["2026-07-28"], capabilities: { tools: {} } });
});

test("publica únicamente herramientas de lectura", async () => {
  const result = await call({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  const listResult = result.body.result as { resultType: string; ttlMs: number; cacheScope: string; tools: typeof MCP_TOOL_DEFINITIONS };
  assert.deepEqual({ resultType: listResult.resultType, ttlMs: listResult.ttlMs, cacheScope: listResult.cacheScope }, { resultType: "complete", ttlMs: 0, cacheScope: "private" });
  const tools = listResult.tools;
  assert.equal(tools.length, 31);
  assert.ok(tools.every((tool) => tool.annotations.readOnlyHint && !tool.annotations.destructiveHint));
  assert.ok(tools.every((tool) => !/prepare|approve|commit|create|update|delete|void/i.test(tool.name)));
});

test("deniega antes de listar herramientas cuando falta identidad", async () => {
  const result = await call({ jsonrpc: "2.0", id: 3, method: "tools/list" }, false);
  assert.equal(result.response.status, 401);
  assert.equal((result.body.error as { data: { reason: string } }).data.reason, "missing_identity");
});

test("ignora identidades de argumentos rechazándolas por esquema", async () => {
  const result = await call({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get_my_profile", arguments: { user_id: "viewer-id" } } });
  assert.equal(result.response.status, 200);
  assert.equal((result.body.error as { code: number }).code, -32602);
});

test("get_my_profile usa exclusivamente headers autenticados", async () => {
  const result = await call({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "get_my_profile", arguments: {} } });
  const tool = result.body.result as { structuredContent: { userId: string; email: string; role: string } };
  assert.deepEqual(tool.structuredContent, { userId: "owner-id", email: "owner@example.com", fullName: null, role: "owner", scopes: ["shared_household:read", "owner_private:read"], client: { info: { name: "test-client", version: "1.0.0" }, capabilities: {} } });
  assert.equal((result.body.result as { resultType: string }).resultType, "complete");
});

test("get_capabilities declara escrituras deshabilitadas", async () => {
  const result = await call({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "get_capabilities", arguments: {} } });
  const capabilities = (result.body.result as { structuredContent: { readOnly: boolean; businessWritesEnabled: boolean } }).structuredContent;
  assert.equal(capabilities.readOnly, true);
  assert.equal(capabilities.businessWritesEnabled, false);
});

test("rechaza headers MCP ausentes", async () => {
  const result = await call({ jsonrpc: "2.0", id: 7, method: "tools/list" }, true, { includeHeaders: false });
  assert.equal(result.response.status, 400);
  assert.equal((result.body.error as { code: number }).code, -32020);
});

test("rechaza discrepancias entre versión del header y el sobre", async () => {
  const result = await call({ jsonrpc: "2.0", id: 8, method: "tools/list" }, true, { protocolVersion: "2026-07-28", headerVersion: "2025-03-26" });
  assert.equal(result.response.status, 400);
  assert.equal((result.body.error as { code: number }).code, -32020);
});

test("rechaza una versión MCP no soportada", async () => {
  const result = await call({ jsonrpc: "2.0", id: 9, method: "tools/list" }, true, { protocolVersion: "2025-03-26" });
  assert.equal(result.response.status, 400);
  assert.equal((result.body.error as { code: number }).code, -32022);
});

test("cruza Mcp-Method y Mcp-Name con JSON-RPC", async () => {
  const wrongMethod = await call({ jsonrpc: "2.0", id: 10, method: "tools/list" }, true, { methodHeader: "tools/call" });
  assert.equal((wrongMethod.body.error as { code: number }).code, -32020);
  const wrongName = await call({ jsonrpc: "2.0", id: 11, method: "tools/call", params: { name: "get_my_profile", arguments: {} } }, true, { nameHeader: "get_capabilities" });
  assert.equal((wrongName.body.error as { code: number }).code, -32020);
});

test("acepta una notificación moderna sin respuesta JSON-RPC", async () => {
  const result = await call({ jsonrpc: "2.0", method: "tools/list" }, true, { includeHeaders: false });
  assert.equal(result.response.status, 204);
});
