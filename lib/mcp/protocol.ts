import { z } from "zod";

export const MCP_PROTOCOL_VERSION = "2026-07-28";
export const MCP_PROTOCOL_VERSIONS = [MCP_PROTOCOL_VERSION] as const;
export const MCP_HEADER_PROTOCOL_VERSION = "MCP-Protocol-Version";
export const MCP_HEADER_METHOD = "Mcp-Method";
export const MCP_HEADER_NAME = "Mcp-Name";
export const MCP_PROTOCOL_VERSION_META = "io.modelcontextprotocol/protocolVersion";
export const MCP_CLIENT_INFO_META = "io.modelcontextprotocol/clientInfo";
export const MCP_CLIENT_CAPABILITIES_META = "io.modelcontextprotocol/clientCapabilities";
export const MCP_HEADER_MISMATCH_CODE = -32020;
export const MCP_UNSUPPORTED_VERSION_CODE = -32022;

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

export type McpClientInfo = { name: string; version: string; [key: string]: unknown };

export type McpRequestContext = {
  protocolVersion: string;
  clientInfo: McpClientInfo | null;
  clientCapabilities: Record<string, unknown>;
};

export class McpProtocolError extends Error {
  readonly code: number;
  readonly status: number;
  readonly data?: unknown;

  constructor(code: number, message: string, status = 400, data?: unknown) {
    super(message);
    this.name = "McpProtocolError";
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

const clientInfoSchema = z.object({ name: z.string().min(1), version: z.string().min(1) }).passthrough();
const clientCapabilitiesSchema = z.object({
  experimental: z.record(z.unknown()).optional(),
  sampling: z.record(z.unknown()).optional(),
  elicitation: z.record(z.unknown()).optional(),
  roots: z.record(z.unknown()).optional(),
  extensions: z.record(z.unknown()).optional(),
}).passthrough();

export const requestMetaSchema = z.object({
  [MCP_PROTOCOL_VERSION_META]: z.string().min(1),
  [MCP_CLIENT_INFO_META]: clientInfoSchema.optional(),
  [MCP_CLIENT_CAPABILITIES_META]: clientCapabilitiesSchema,
}).passthrough();

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

export const isJsonRpcRequest = (value: unknown): value is JsonRpcRequest => {
  if (!isRecord(value) || value.jsonrpc !== "2.0" || typeof value.method !== "string" || !value.method) return false;
  if (hasOwn(value, "id") && value.id !== null && typeof value.id !== "string" && typeof value.id !== "number") return false;
  return value.params === undefined || isRecord(value.params);
};

export const hasRequestId = (value: JsonRpcRequest) => hasOwn(value, "id");

const header = (request: Request, name: string) => request.headers.get(name)?.trim() || "";

export function validateModernRequest(request: Request, body: JsonRpcRequest): McpRequestContext {
  const notification = !hasRequestId(body);
  const params = body.params;
  if (!params || !isRecord(params._meta)) {
    throw new McpProtocolError(-32602, "La solicitud MCP requiere el sobre params._meta del protocolo 2026-07-28.");
  }
  const parsed = requestMetaSchema.safeParse(params._meta);
  if (!parsed.success) {
    throw new McpProtocolError(-32602, "El sobre MCP contiene metadatos de cliente inválidos.", 400, parsed.error.issues.map((issue) => issue.path.join(".") || issue.message));
  }

  const bodyVersion = parsed.data[MCP_PROTOCOL_VERSION_META];
  const headerVersion = header(request, MCP_HEADER_PROTOCOL_VERSION);
  const headerMethod = header(request, MCP_HEADER_METHOD);
  if (headerVersion && headerVersion !== bodyVersion) {
    throw new McpProtocolError(MCP_HEADER_MISMATCH_CODE, "MCP-Protocol-Version no coincide con params._meta.io.modelcontextprotocol/protocolVersion.", 400);
  }
  if (bodyVersion !== MCP_PROTOCOL_VERSION) {
    throw new McpProtocolError(MCP_UNSUPPORTED_VERSION_CODE, `Versión MCP no compatible. Versiones soportadas: ${MCP_PROTOCOL_VERSIONS.join(", ")}.`, 400, { supportedVersions: MCP_PROTOCOL_VERSIONS });
  }
  if (!notification && !headerVersion) {
    throw new McpProtocolError(MCP_HEADER_MISMATCH_CODE, "Falta el encabezado MCP-Protocol-Version.", 400);
  }
  if (!notification && !headerMethod) {
    throw new McpProtocolError(MCP_HEADER_MISMATCH_CODE, "Falta el encabezado Mcp-Method.", 400);
  }
  if (headerMethod && headerMethod !== body.method) {
    throw new McpProtocolError(MCP_HEADER_MISMATCH_CODE, "Mcp-Method no coincide con el método JSON-RPC.", 400);
  }

  if (body.method === "tools/call") {
    const name = typeof params.name === "string" ? params.name : "";
    const headerName = header(request, MCP_HEADER_NAME);
    if (!name) throw new McpProtocolError(-32602, "Falta el nombre de la herramienta.");
    if (!notification && !headerName) throw new McpProtocolError(MCP_HEADER_MISMATCH_CODE, "Falta el encabezado Mcp-Name para tools/call.", 400);
    if (headerName && headerName !== name) throw new McpProtocolError(MCP_HEADER_MISMATCH_CODE, "Mcp-Name no coincide con params.name.", 400);
  }

  return {
    protocolVersion: bodyVersion,
    clientInfo: parsed.data[MCP_CLIENT_INFO_META] || null,
    clientCapabilities: parsed.data[MCP_CLIENT_CAPABILITIES_META],
  };
}

export const completeResult = <T extends Record<string, unknown>>(result: T) => ({ resultType: "complete" as const, ...result });

export const cacheableResult = <T extends Record<string, unknown>>(result: T, cacheScope: "public" | "private" = "private") => completeResult({ ttlMs: 0, cacheScope, ...result });

export const jsonRpcResponse = (id: JsonRpcRequest["id"], result: unknown) => ({ jsonrpc: "2.0" as const, id: id ?? null, result });

export const jsonRpcErrorBody = (id: JsonRpcRequest["id"], code: number, message: string, data?: unknown) => ({
  jsonrpc: "2.0" as const,
  id: id ?? null,
  error: { code, message, ...(data === undefined ? {} : { data }) },
});

