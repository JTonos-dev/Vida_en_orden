/**
 * Contratos reservados para Fase 3. No están registrados como herramientas y
 * no contienen lógica capaz de escribir datos de negocio.
 */
export const MCP_BUSINESS_WRITES_ENABLED = false as const;

export type ChangePlanState =
  | "DRAFT"
  | "VALIDATED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "EXECUTING"
  | "COMMITTED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "INVALIDATED"
  | "FAILED";

export type ProposedAction = Readonly<{
  actionId: string;
  kind: string;
  risk: "R1" | "R2" | "R3";
  targetId?: string;
  input: Readonly<Record<string, unknown>>;
  expectedVersion?: string;
}>;

export type ChangePlan = Readonly<{
  proposalId: string;
  ownerUserId: string;
  revision: number;
  digest: string;
  state: ChangePlanState;
  summary: string;
  effects: readonly string[];
  actions: readonly ProposedAction[];
  createdAt: string;
  expiresAt: string;
}>;

export type ApprovalEvidence = Readonly<{
  proposalId: string;
  digest: string;
  revision: number;
  approvedByUserId: string;
  channel: "mcp_app_control" | "authenticated_site_page";
  nonce: string;
  approvedAt: string;
  expiresAt: string;
  serverProof: string;
}>;

export type CommitApprovedChangePlanRequest = Readonly<{
  proposalId: string;
  digest: string;
  revision: number;
  idempotencyKey: string;
}>;

export type CommitApprovedChangePlanResult = Readonly<{
  proposalId: string;
  executionId: string;
  state: "COMMITTED" | "FAILED";
  results: readonly Readonly<{ actionId: string; entityId?: string; status: "committed" | "failed" }>[];
}>;
