import { z } from "zod";
import { HOUSEHOLD_SCOPE } from "../../data-scopes.ts";
import { dateInTimeZone } from "../../finance-math.ts";
import { runWithDomainDatabase, type DomainDatabase } from "../../domain/context.ts";
import { createMcpReadService } from "../read-service.ts";
import type { McpIdentity } from "../auth.ts";
import { canonicalize, digest, randomChallenge } from "./canonical.ts";
import { stagingDatabase } from "./staging.ts";
import { BUSINESS_TABLES } from "./tables.ts";
import { PlanError, type ActionRegistry, type ActionResult, type ApprovalVerifier, type ExecutionReceipt, type PlanAction, type PreparedPayload, type Proposal, type ProposalState, type Row, type RowChange, type Snapshot } from "./types.ts";

const actionsSchema = z.array(z.object({ actionId: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/), kind: z.string().min(1).max(80), input: z.record(z.unknown()) }).strict()).min(1).max(20);
const MAX_SNAPSHOT_ROWS = 2000;
const MAX_SNAPSHOT_BYTES = 2 * 1024 * 1024;
const MAX_DIFF_BYTES = 64 * 1024;
const MAX_CHANGED_ROWS = 100;
type Stored = { proposal_id: string; revision: number; state: ProposalState; digest: string; payload: string; expires_at: number; base_revision: number };
type EngineOptions = { actor: McpIdentity; registry: ActionRegistry; verifier: ApprovalVerifier; executionEnabled: boolean; now?: () => Date; ttlMs?: number };

function changes(before: Snapshot, after: Snapshot): RowChange[] {
  const result: RowChange[] = [];
  for (const table of BUSINESS_TABLES) {
    const oldRows = new Map(before[table.name].map((row) => [String(row[table.primaryKey]), row]));
    const newRows = new Map(after[table.name].map((row) => [String(row[table.primaryKey]), row]));
    for (const id of new Set([...oldRows.keys(), ...newRows.keys()])) {
      const from = oldRows.get(id) ?? null, to = newRows.get(id) ?? null;
      if (canonicalize(from) !== canonicalize(to)) result.push({ table: table.name, id, before: from, after: to });
    }
  }
  return result;
}

function resolveReferences(value: unknown, results: Map<string, string | null>): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const object = value as Record<string, unknown>;
    if (Object.keys(object).length === 1 && typeof object.$ref === "string") {
      const id = results.get(object.$ref);
      if (!id) throw new PlanError("invalid_reference", "La referencia debe apuntar al resultado de una acción anterior.", 400);
      return id;
    }
    return Object.fromEntries(Object.entries(object).map(([key, item]) => [key, resolveReferences(item, results)]));
  }
  return Array.isArray(value) ? value.map((item) => resolveReferences(item, results)) : value;
}

export class ProposalEngine {
  private database: DomainDatabase;
  private options: EngineOptions;
  constructor(database: D1Database, options: EngineOptions) {
    if (!options.actor.userId || !options.actor.email) throw new PlanError("missing_identity", "Se requiere identidad autenticada.", 401);
    this.database = database.withSession?.("first-primary") ?? database;
    this.options = options;
  }
  private now() { return this.options.now?.() ?? new Date(); }
  private owner() { return this.options.actor.userId; }
  private async audit(proposalId: string, revision: number, event: string) {
    await this.database.prepare("INSERT INTO mcp_plan_audit(id,owner_id,proposal_id,revision,event,created_at) VALUES(?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), this.owner(), proposalId, revision, event, this.now().getTime()).run();
  }
  private async stored(proposalId: string, revision?: number): Promise<Stored> {
    const row = await this.database.prepare(`SELECT p.* FROM mcp_proposals p JOIN mcp_proposal_heads h ON h.proposal_id=p.proposal_id WHERE p.proposal_id=? AND p.owner_id=? AND p.revision=${revision === undefined ? "h.revision" : "?"}`)
      .bind(proposalId, this.owner(), ...(revision === undefined ? [] : [revision])).first<Stored>();
    if (!row) throw new PlanError("not_found", "Propuesta no encontrada.", 404);
    return row;
  }
  async get(proposalId: string, revision?: number): Promise<Proposal> {
    const row = await this.stored(proposalId, revision);
    const state = ["VALIDATED", "PENDING_APPROVAL", "APPROVED"].includes(row.state) && row.expires_at <= this.now().getTime() ? "EXPIRED" : row.state;
    return { proposalId, revision: row.revision, state, digest: row.digest, payload: JSON.parse(row.payload) as PreparedPayload };
  }
  async list() {
    const rows = await this.database.prepare("SELECT p.proposal_id,p.revision,p.state,p.digest,p.expires_at,p.created_at FROM mcp_proposals p JOIN mcp_proposal_heads h ON h.proposal_id=p.proposal_id AND h.revision=p.revision WHERE p.owner_id=? ORDER BY p.created_at DESC LIMIT 50").bind(this.owner()).all<Record<string, unknown>>();
    return rows.results.map((row) => ({ ...row, state: ["VALIDATED", "PENDING_APPROVAL", "APPROVED"].includes(String(row.state)) && Number(row.expires_at) <= this.now().getTime() ? "EXPIRED" : row.state }));
  }
  private async stageRows(stageId: string): Promise<Snapshot> {
    const results = await this.database.batch(BUSINESS_TABLES.map((table) => this.database.prepare(`SELECT ${table.columns.join(",")} FROM mcp_stage_${table.name} WHERE proposal_id=? ORDER BY ${table.primaryKey}`).bind(stageId)));
    return Object.fromEntries(BUSINESS_TABLES.map((table, index) => [table.name, (results[index].results || []).map((row) => Object.fromEntries(table.columns.map((key) => [key, (row as Row)[key] ?? null])) as Row)]));
  }
  private async cleanupStage(stageId: string) {
    await this.database.batch([
      ...BUSINESS_TABLES.map((table) => this.database.prepare(`DELETE FROM mcp_stage_${table.name} WHERE proposal_id=?`).bind(stageId)),
      this.database.prepare("DELETE FROM mcp_execution_guards WHERE execution_id=?").bind(stageId),
    ]);
  }
  async prepare(input: unknown, prior?: { proposalId: string; revision: number }): Promise<Proposal> {
    if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 64 * 1024) throw new PlanError("input_limit", "El plan excede 64 KiB.", 413);
    const parsed = actionsSchema.safeParse(input);
    if (!parsed.success) throw new PlanError("invalid_input", "El plan requiere entre una y veinte acciones con esquema cerrado.", 400);
    if (new Set(parsed.data.map((action) => action.actionId)).size !== parsed.data.length) throw new PlanError("duplicate_action", "Los IDs de acción deben ser únicos.", 400);
    const definitions = parsed.data.map((action) => {
      const definition = this.options.registry.get(action.kind);
      if (!definition) throw new PlanError("unsupported_action", "Operación no soportada por esta versión.", 400);
      return definition;
    });
    const info = await this.database.prepare("SELECT installation_id,business_revision FROM mcp_installation WHERE id=1").first<{ installation_id: string; business_revision: number }>();
    if (!info) throw new PlanError("migration_required", "Falta la migración del motor MCP.", 503);
    const stageId = crypto.randomUUID();
    const proposalId = prior?.proposalId ?? crypto.randomUUID(), revision = prior?.revision ?? 1;
    const now = this.now(), expiresAt = now.getTime() + Math.min(10 * 60_000, Math.max(1000, this.options.ttlMs ?? 10 * 60_000));
    const scopeValues = BUSINESS_TABLES.map((table) => table.shared ? HOUSEHOLD_SCOPE : this.owner());
    const countSql = BUSINESS_TABLES.map((table) => `(SELECT COUNT(*) FROM ${table.name} WHERE ${table.scopeColumn}=?)`).join("+");
    await this.database.batch([
      this.database.prepare(`INSERT INTO mcp_execution_guards(execution_id,valid) SELECT ?,CASE WHEN (${countSql})<=? THEN 1 ELSE 0 END`).bind(stageId, ...scopeValues, MAX_SNAPSHOT_ROWS),
      ...BUSINESS_TABLES.map((table, index) => this.database.prepare(`INSERT INTO mcp_stage_${table.name}(proposal_id,${table.columns.join(",")}) SELECT ?,${table.columns.join(",")} FROM ${table.name} WHERE ${table.scopeColumn}=?`).bind(stageId, scopeValues[index])),
    ]);
    try {
      const before = await this.stageRows(stageId);
      if (new TextEncoder().encode(canonicalize(before)).byteLength > MAX_SNAPSHOT_BYTES) throw new PlanError("snapshot_limit", "La base excede el límite seguro de preparación.", 413);
      const stage = stagingDatabase(this.database, stageId);
      const resolved: PlanAction[] = [], results: ActionResult[] = [], references = new Map<string, string | null>();
      let previous = before;
      for (const [index, action] of parsed.data.entries()) {
        const definition = definitions[index];
        const validated = definition.schema.safeParse(resolveReferences(action.input, references));
        if (!validated.success) throw new PlanError("invalid_input", `Argumentos inválidos en ${action.actionId}.`, 400);
        const value = await runWithDomainDatabase(stage, () => definition.execute(this.options.actor, validated.data), () => now);
        const next = await this.stageRows(stageId);
        const created = changes(previous, next).filter((change) => change.table === definition.targetTable && !change.before && change.after);
        const returnedId = value && typeof value === "object" && "id" in value ? String(value.id) : null;
        const entityId = returnedId || (created.length === 1 ? created[0].id : typeof validated.data.id === "string" ? validated.data.id : null);
        references.set(action.actionId, entityId);
        results.push({ actionId: action.actionId, kind: action.kind, entityId });
        resolved.push({ ...action, input: validated.data });
        previous = next;
      }
      const integrity = await createMcpReadService(stage, this.options.actor).validateReferences({ limit: 50 }) as { valid: boolean };
      if (!integrity.valid) throw new PlanError("invalid_reference", "El plan produciría referencias inválidas.", 400);
      const delta = changes(before, previous);
      if (delta.length > MAX_CHANGED_ROWS || new TextEncoder().encode(canonicalize(delta)).byteLength > MAX_DIFF_BYTES) throw new PlanError("diff_limit", "El cambio excede el límite seguro; divide el plan.", 413);
      const payload: PreparedPayload = { contractVersion: 1, installationId: info.installation_id, ownerId: this.owner(), proposalId, revision, createdAt: now.getTime(), expiresAt, contextDate: dateInTimeZone(now, "America/Santo_Domingo"), baseRevision: info.business_revision, actions: resolved, changes: delta, results, risk: definitions.some((definition) => definition.risk === "R2") ? "R2" : "R1" };
      const fingerprint = await digest({ domain: "vida-en-orden/proposal/v1", payload });
      const revisionGuard = crypto.randomUUID();
      await this.database.batch([
        ...(prior ? [this.database.prepare("INSERT INTO mcp_execution_guards(execution_id,valid) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM mcp_proposal_heads h JOIN mcp_proposals p ON p.proposal_id=h.proposal_id AND p.revision=h.revision WHERE h.proposal_id=? AND h.owner_id=? AND h.revision=? AND p.state='INVALIDATED') THEN 1 ELSE 0 END").bind(revisionGuard, proposalId, this.owner(), revision - 1)] : []),
        ...(prior ? [] : [this.database.prepare("INSERT INTO mcp_proposal_heads(proposal_id,owner_id,revision) VALUES(?,?,?)").bind(proposalId, this.owner(), revision)]),
        this.database.prepare("INSERT INTO mcp_proposals(proposal_id,revision,owner_id,state,digest,payload,base_revision,expires_at,created_at) VALUES(?,?,?,'VALIDATED',?,?,?,?,?)").bind(proposalId, revision, this.owner(), fingerprint, canonicalize(payload), info.business_revision, expiresAt, now.getTime()),
        ...(prior ? [this.database.prepare("UPDATE mcp_proposal_heads SET revision=? WHERE proposal_id=? AND owner_id=?").bind(revision, proposalId, this.owner()), this.database.prepare("DELETE FROM mcp_execution_guards WHERE execution_id=?").bind(revisionGuard)] : []),
      ]);
      await this.audit(proposalId, revision, "prepared");
      return { proposalId, revision, state: "VALIDATED", digest: fingerprint, payload };
    } finally { await this.cleanupStage(stageId); }
  }
  async revise(proposalId: string, input: unknown) {
    const old = await this.stored(proposalId);
    if (old.state === "COMMITTED") throw new PlanError("already_committed", "Prepara una operación de reversión independiente.");
    const guard = crypto.randomUUID();
    await this.database.batch([
      this.database.prepare("INSERT INTO mcp_execution_guards(execution_id,valid) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM mcp_proposals p JOIN mcp_proposal_heads h ON h.proposal_id=p.proposal_id AND h.revision=p.revision WHERE p.proposal_id=? AND p.revision=? AND p.owner_id=? AND p.state<>'COMMITTED') THEN 1 ELSE 0 END").bind(guard, proposalId, old.revision, this.owner()),
      this.database.prepare("UPDATE mcp_proposals SET state='INVALIDATED' WHERE proposal_id=? AND revision=? AND owner_id=? AND state<>'COMMITTED'").bind(proposalId, old.revision, this.owner()),
      this.database.prepare("DELETE FROM mcp_approvals WHERE proposal_id=? AND revision=? AND owner_id=?").bind(proposalId, old.revision, this.owner()),
      this.database.prepare("DELETE FROM mcp_execution_guards WHERE execution_id=?").bind(guard),
    ]);
    return this.prepare(input, { proposalId, revision: old.revision + 1 });
  }
  async cancel(proposalId: string) {
    const proposal = await this.stored(proposalId);
    if (proposal.state === "COMMITTED") throw new PlanError("already_committed", "La ejecución ya fue confirmada.");
    const guard = crypto.randomUUID();
    await this.database.batch([
      this.database.prepare("INSERT INTO mcp_execution_guards(execution_id,valid) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM mcp_proposals p JOIN mcp_proposal_heads h ON h.proposal_id=p.proposal_id AND h.revision=p.revision WHERE p.proposal_id=? AND p.revision=? AND p.owner_id=? AND p.state<>'COMMITTED') THEN 1 ELSE 0 END").bind(guard, proposalId, proposal.revision, this.owner()),
      this.database.prepare("UPDATE mcp_proposals SET state='CANCELLED' WHERE proposal_id=? AND revision=? AND owner_id=? AND state<>'COMMITTED'").bind(proposalId, proposal.revision, this.owner()),
      this.database.prepare("DELETE FROM mcp_approvals WHERE proposal_id=? AND revision=? AND owner_id=?").bind(proposalId, proposal.revision, this.owner()),
      this.database.prepare("DELETE FROM mcp_execution_guards WHERE execution_id=?").bind(guard),
    ]);
    await this.audit(proposalId, proposal.revision, "cancelled");
    return this.get(proposalId);
  }
  async requestApproval(proposalId: string) {
    const proposal = await this.get(proposalId);
    if (!["VALIDATED", "PENDING_APPROVAL"].includes(proposal.state)) throw new PlanError("invalid_state", "La propuesta no admite aprobación.");
    const challenge = randomChallenge();
    await this.database.batch([
      this.database.prepare("UPDATE mcp_proposals SET state='PENDING_APPROVAL' WHERE proposal_id=? AND revision=? AND owner_id=? AND state='VALIDATED'").bind(proposalId, proposal.revision, this.owner()),
      this.database.prepare("INSERT INTO mcp_approval_challenges(challenge,proposal_id,revision,owner_id,digest,expires_at) VALUES(?,?,?,?,?,?)").bind(challenge, proposalId, proposal.revision, this.owner(), proposal.digest, proposal.payload.expiresAt),
    ]);
    return { proposalId, revision: proposal.revision, digest: proposal.digest, challenge, expiresAt: proposal.payload.expiresAt };
  }
  async approve(proposalId: string, challenge: string, proof: unknown) {
    const proposal = await this.get(proposalId);
    const nonce = await this.database.prepare("SELECT challenge FROM mcp_approval_challenges WHERE challenge=? AND proposal_id=? AND revision=? AND owner_id=? AND digest=? AND used=0 AND expires_at>?").bind(challenge, proposalId, proposal.revision, this.owner(), proposal.digest, this.now().getTime()).first();
    if (!nonce || proposal.state !== "PENDING_APPROVAL") throw new PlanError("invalid_approval", "Aprobación inválida, vencida o consumida.", 403);
    let verified: { credentialId: string };
    try { verified = await this.options.verifier.verify(proof, challenge, this.options.actor); }
    catch { throw new PlanError("invalid_approval", "No se pudo verificar la acción humana.", 403); }
    const guard = crypto.randomUUID();
    await this.database.batch([
      this.database.prepare("INSERT INTO mcp_execution_guards(execution_id,valid) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM mcp_proposals p JOIN mcp_proposal_heads h ON h.proposal_id=p.proposal_id AND h.revision=p.revision JOIN mcp_approval_challenges c ON c.proposal_id=p.proposal_id AND c.revision=p.revision WHERE p.proposal_id=? AND p.owner_id=? AND p.state='PENDING_APPROVAL' AND p.digest=? AND p.expires_at>? AND c.challenge=? AND c.owner_id=p.owner_id AND c.digest=p.digest AND c.expires_at=p.expires_at AND c.used=0) THEN 1 ELSE 0 END").bind(guard, proposalId, this.owner(), proposal.digest, this.now().getTime(), challenge),
      this.database.prepare("INSERT INTO mcp_approvals(proposal_id,revision,owner_id,digest,challenge,credential_id,expires_at,approved_at) VALUES(?,?,?,?,?,?,?,?)").bind(proposalId, proposal.revision, this.owner(), proposal.digest, challenge, verified.credentialId, proposal.payload.expiresAt, this.now().getTime()),
      this.database.prepare("UPDATE mcp_approval_challenges SET used=1 WHERE challenge=?").bind(challenge),
      this.database.prepare("UPDATE mcp_proposals SET state='APPROVED' WHERE proposal_id=? AND revision=? AND owner_id=?").bind(proposalId, proposal.revision, this.owner()),
      this.database.prepare("DELETE FROM mcp_execution_guards WHERE execution_id=?").bind(guard),
    ]);
    await this.audit(proposalId, proposal.revision, "approved");
    return this.get(proposalId);
  }
  async executionResult(proposalId: string, revision: number): Promise<ExecutionReceipt | null> {
    const row = await this.database.prepare("SELECT result FROM mcp_executions WHERE proposal_id=? AND revision=? AND owner_id=?").bind(proposalId, revision, this.owner()).first<{ result: string }>();
    return row ? JSON.parse(row.result) as ExecutionReceipt : null;
  }
  async commit(proposalId: string, revision: number, fingerprint: string, key: string): Promise<ExecutionReceipt> {
    if (!/^[a-f0-9]{64}$/.test(fingerprint) || !Number.isSafeInteger(revision) || revision < 1 || !key || key.length > 128) throw new PlanError("invalid_input", "Solicitud de ejecución inválida.", 400);
    const idempotencyHash = await digest({ owner: this.owner(), key });
    const used = await this.database.prepare("SELECT proposal_id,revision FROM mcp_executions WHERE owner_id=? AND idempotency_hash=?").bind(this.owner(), idempotencyHash).first<{ proposal_id: string; revision: number }>();
    if (used && (used.proposal_id !== proposalId || used.revision !== revision)) throw new PlanError("idempotency_conflict", "La clave pertenece a otra propuesta.");
    const existing = await this.executionResult(proposalId, revision);
    if (existing) { if (existing.digest !== fingerprint) throw new PlanError("digest_mismatch", "La huella no coincide."); return existing; }
    if (!this.options.executionEnabled) throw new PlanError("writes_disabled", "Las escrituras MCP reales permanecen deshabilitadas.", 403);
    const proposal = await this.get(proposalId, revision);
    if (proposal.state === "COMMITTED") {
      const concurrent = await this.executionResult(proposalId, revision);
      if (concurrent?.digest === fingerprint) return concurrent;
    }
    if (proposal.state !== "APPROVED") throw new PlanError("approval_required", "Se requiere aprobación humana vigente.", 403);
    if (proposal.digest !== fingerprint || await digest({ domain: "vida-en-orden/proposal/v1", payload: proposal.payload }) !== fingerprint) throw new PlanError("digest_mismatch", "La propuesta fue alterada.", 403);
    if (dateInTimeZone(this.now(), "America/Santo_Domingo") !== proposal.payload.contextDate) throw new PlanError("stale_proposal", "Cambió la fecha de cálculo; prepara nuevamente.");
    const executionId = crypto.randomUUID();
    const statements = [this.database.prepare("INSERT INTO mcp_execution_guards(execution_id,valid) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM mcp_proposals p JOIN mcp_proposal_heads h ON h.proposal_id=p.proposal_id AND h.revision=p.revision JOIN mcp_approvals a ON a.proposal_id=p.proposal_id AND a.revision=p.revision JOIN mcp_installation i ON i.id=1 WHERE p.proposal_id=? AND p.revision=? AND p.owner_id=? AND p.state='APPROVED' AND p.digest=? AND p.expires_at>? AND a.expires_at>? AND a.owner_id=p.owner_id AND a.digest=p.digest AND i.installation_id=? AND i.business_revision=p.base_revision) THEN 1 ELSE 0 END").bind(executionId, proposalId, revision, this.owner(), fingerprint, this.now().getTime(), this.now().getTime(), proposal.payload.installationId)];
    for (const change of proposal.payload.changes) {
      const table = BUSINESS_TABLES.find((entry) => entry.name === change.table);
      if (!table) throw new PlanError("invalid_delta", "Tabla no autorizada.", 403);
      if (change.after) {
        const columns = table.columns as readonly string[];
        if (change.before) statements.push(this.database.prepare(`UPDATE ${table.name} SET ${columns.filter((column) => column !== table.primaryKey).map((column) => `${column}=?`).join(",")} WHERE ${table.primaryKey}=?`).bind(...columns.filter((column) => column !== table.primaryKey).map((column) => change.after![column]), change.id));
        else statements.push(this.database.prepare(`INSERT INTO ${table.name}(${columns.join(",")}) VALUES(${columns.map(() => "?").join(",")})`).bind(...columns.map((column) => change.after![column])));
      } else statements.push(this.database.prepare(`DELETE FROM ${table.name} WHERE ${table.primaryKey}=?`).bind(change.id));
    }
    const receipt: ExecutionReceipt = { executionId, proposalId, revision, digest: fingerprint, state: "COMMITTED", results: proposal.payload.results, changes: proposal.payload.changes.length, revisionAfter: 0 };
    statements.push(
      this.database.prepare("INSERT INTO audit_log(id,owner_id,entity_type,entity_id,action,metadata,occurred_at) VALUES(?,?,'mcp_plan',?,'committed',?,?)").bind(crypto.randomUUID(), this.owner(), proposalId, JSON.stringify({ revision, kinds: proposal.payload.actions.map((action) => action.kind) }), this.now().toISOString()),
      this.database.prepare("UPDATE mcp_proposals SET state='COMMITTED' WHERE proposal_id=? AND revision=? AND owner_id=?").bind(proposalId, revision, this.owner()),
      this.database.prepare("DELETE FROM mcp_approvals WHERE proposal_id=? AND revision=? AND owner_id=?").bind(proposalId, revision, this.owner()),
      this.database.prepare("INSERT INTO mcp_executions(execution_id,proposal_id,revision,owner_id,idempotency_hash,result,created_at) VALUES(?,?,?,?,?,json_set(?,'$.revisionAfter',(SELECT business_revision FROM mcp_installation WHERE id=1)),?)").bind(executionId, proposalId, revision, this.owner(), idempotencyHash, JSON.stringify(receipt), this.now().getTime()),
      this.database.prepare("INSERT INTO mcp_plan_audit(id,owner_id,proposal_id,revision,event,created_at) VALUES(?,?,?,?,'committed',?)").bind(crypto.randomUUID(), this.owner(), proposalId, revision, this.now().getTime()),
      this.database.prepare("DELETE FROM mcp_execution_guards WHERE execution_id=?").bind(executionId),
    );
    try { await this.database.batch(statements); }
    catch {
      const concurrent = await this.executionResult(proposalId, revision);
      if (concurrent && concurrent.digest === fingerprint) return concurrent;
      throw new PlanError("commit_conflict", "La ejecución no se confirmó: cambió la propuesta, sus datos o falló el lote.");
    }
    const result = await this.executionResult(proposalId, revision);
    if (!result) throw new PlanError("execution_uncertain", "Consulta el resultado antes de reintentar.", 503);
    return result;
  }
}
