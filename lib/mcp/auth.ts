export type McpIdentity = {
  userId: string;
  email: string;
  fullName: string | null;
};

export type McpOwnerPolicy = {
  ownerUserId?: string;
  ownerEmail?: string;
};

export class McpAuthenticationError extends Error {
  readonly status: 401 | 403 | 503;
  readonly code: "missing_identity" | "owner_only" | "owner_policy_missing";

  constructor(
    message: string,
    status: 401 | 403 | 503,
    code: "missing_identity" | "owner_only" | "owner_policy_missing",
  ) {
    super(message);
    this.name = "McpAuthenticationError";
    this.status = status;
    this.code = code;
  }
}

const decodeFullName = (request: Request) => {
  const value = request.headers.get("oai-authenticated-user-full-name");
  if (!value || request.headers.get("oai-authenticated-user-full-name-encoding") !== "percent-encoded-utf-8") return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

/**
 * Sites authenticates the caller before forwarding /mcp and supplies these
 * identity headers. Tool arguments never participate in authorization.
 */
export function authenticateMcpRequest(request: Request, policy: McpOwnerPolicy): McpIdentity {
  const userId = request.headers.get("oai-authenticated-user-id")?.trim() || "";
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLocaleLowerCase() || "";
  if (!userId || !email) {
    throw new McpAuthenticationError("La solicitud MCP no contiene una identidad autenticada.", 401, "missing_identity");
  }

  const ownerUserId = policy.ownerUserId?.trim() || "";
  const ownerEmail = policy.ownerEmail?.trim().toLocaleLowerCase() || "";
  if (!ownerUserId && !ownerEmail) {
    throw new McpAuthenticationError("La política de propietario MCP no está configurada.", 503, "owner_policy_missing");
  }
  if ((ownerUserId && userId !== ownerUserId) || (ownerEmail && email !== ownerEmail)) {
    throw new McpAuthenticationError("El servidor MCP está restringido al propietario del Site.", 403, "owner_only");
  }

  return { userId, email, fullName: decodeFullName(request) };
}
