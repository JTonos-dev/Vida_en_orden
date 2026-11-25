import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { captureUserTables, recoverProposalPayload, rehearseUserTableRestore } from "../scripts/rehearse-user-table-restore.mjs";
import { digest } from "../lib/mcp/plans/canonical.ts";

const directory = new URL("../drizzle/", import.meta.url);
const migrations = readdirSync(directory).filter(name => /^\d{4}_.+\.sql$/.test(name) && Number(name.slice(0, 4)) <= 11).sort().map(name => readFileSync(new URL(name, directory), "utf8"));
const upgrade = readFileSync(new URL("0012_mcp_audit_context_index.sql", directory), "utf8");
function fixture() {
  const db = new DatabaseSync(":memory:");
  try {
    for (const sql of migrations) db.exec(sql);
    db.exec("INSERT INTO home_tasks(id,user_id,title,updated_at) VALUES('synthetic-task','home-shared','Fictitious restore task','2026-01-01')");
    db.exec("UPDATE mcp_installation SET installation_id='synthetic-recovery-installation',business_revision=37 WHERE id=1");
    return captureUserTables(db);
  } finally { db.close(); }
}
test("isolated restore and 0012 preserve identity/revision, rows, triggers and index", () => {
  const restored = rehearseUserTableRestore(fixture(), migrations, upgrade);
  try {
    assert.equal(restored.summary.tables, 48);
    assert.equal(restored.summary.triggers, 54);
    assert.equal(restored.db.prepare("SELECT business_revision FROM mcp_installation").get().business_revision, 37);
    assert.equal(restored.db.prepare("SELECT installation_id FROM mcp_installation").get().installation_id, "synthetic-recovery-installation");
    assert.equal(restored.db.prepare("SELECT title FROM home_tasks").get().title, "Fictitious restore task");
  } finally { restored.db.close(); }
});
test("incomplete tables/columns and truncated cell projections are rejected", () => {
  const tables = fixture(); delete tables.mcp_approval_evidence;
  assert.throws(() => rehearseUserTableRestore(tables, migrations, upgrade), /inventory/);
  const columns = fixture(); columns.mcp_installation.columns.pop();
  assert.throws(() => rehearseUserTableRestore(columns, migrations, upgrade), /column inventory/);
  const truncated = fixture(); truncated.mcp_installation.rows[0].installation_id = { truncated: true };
  assert.throws(() => rehearseUserTableRestore(truncated, migrations, upgrade), /lossy cell/);
});
test("corrupt migration modifying user data fails preservation gate", () => {
  assert.throws(() => rehearseUserTableRestore(fixture(), migrations, `${upgrade}\nUPDATE mcp_installation SET business_revision=999;`), /changed user data/);
});
test("typed payload recovery verifies digest/owner and preserves stored state after TTL", async () => {
  const payload = { proposalId: "synthetic-proposal", revision: 1, ownerId: "synthetic-owner", title: "Fictitious" };
  const row = { proposal_id: payload.proposalId, revision: 1, owner_id: payload.ownerId, state: "APPROVED", digest: await digest({ domain: "vida-en-orden/proposal/v1", payload }) };
  assert.equal((await recoverProposalPayload(row, payload)).state, "APPROVED");
  await assert.rejects(recoverProposalPayload(row, { ...payload, title: "Altered" }), /digest/);
  await assert.rejects(recoverProposalPayload(row, { ...payload, ownerId: "another" }), /owner/);
});
