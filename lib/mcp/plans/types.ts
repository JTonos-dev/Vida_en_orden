import type { ZodType } from "zod";
import type { McpIdentity } from "../auth.ts";
import type { BusinessTableName } from "./tables.ts";

export type Row = Record<string, string | number | null>;
export type Snapshot = Record<string, Row[]>;
export type PlanAction = { actionId: string; kind: string; input: Record<string, unknown> };
export type RowChange = { table: BusinessTableName; id: string; before: Row | null; after: Row | null };
export type ActionResult = { actionId: string; kind: string; entityId: string | null };
export type PreparedPayload = {
  contractVersion: 1; installationId: string; ownerId: string; proposalId: string; revision: number;
  createdAt: number; expiresAt: number; contextDate: string; baseRevision: number;
  actions: PlanAction[]; changes: RowChange[]; results: ActionResult[]; risk: "R1" | "R2";
};
export type ProposalState = "VALIDATED" | "PENDING_APPROVAL" | "APPROVED" | "COMMITTED" | "CANCELLED" | "EXPIRED" | "INVALIDATED";
export type Proposal = { proposalId: string; revision: number; state: ProposalState; digest: string; payload: PreparedPayload };
export type ExecutionReceipt = { executionId: string; proposalId: string; revision: number; digest: string; state: "COMMITTED"; results: ActionResult[]; changes: number; revisionAfter: number };
export type ActionDefinition = {
  kind: string; phase: 4 | 5; risk: "R1" | "R2"; targetTable: BusinessTableName;
  schema: ZodType<Record<string, unknown>>;
  inputSchema?: Record<string, unknown>;
  execute: (actor: McpIdentity, input: Record<string, unknown>) => Promise<unknown>;
};
export type ActionRegistry = ReadonlyMap<string, ActionDefinition>;
export type ApprovalVerifier = {
  readonly channel: "webauthn" | "isolated-test";
  verify: (proof: unknown, challenge: string, actor: McpIdentity) => Promise<{ credentialId: string }>;
};

export class PlanError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 409) { super(message); this.name = "PlanError"; this.code = code; this.status = status; }
}
