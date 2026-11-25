// Offline rehearsal only. This module never accepts a remote database or executes host SQL.
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { canonicalize, digest } from "../lib/mcp/plans/canonical.ts";

const quote = name => `"${name.replaceAll('"', '""')}"`;
const tableNames = db => db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
const fingerprint = tables => createHash("sha256").update(canonicalize(Object.fromEntries(Object.entries(tables).map(([name, table]) => [name, { columns: table.columns, rows: table.rows.map(canonicalize).sort() }])))).digest("hex");

export function captureUserTables(db) {
  return Object.fromEntries(tableNames(db).map(name => [name, {
    columns: db.prepare(`PRAGMA table_info(${quote(name)})`).all().map(row => row.name),
    rows: db.prepare(`SELECT * FROM ${quote(name)}`).all().map(row => ({ ...row })),
  }]));
}

/** Recover only immutable payload, never the derived state returned by MCP after expiry. */
export async function recoverProposalPayload(row, payload) {
  assert.equal(row.proposal_id, payload.proposalId, "Proposal identity mismatch");
  assert.equal(row.revision, payload.revision, "Proposal revision mismatch");
  assert.equal(row.owner_id, payload.ownerId, "Proposal owner mismatch");
  assert.equal(row.digest, await digest({ domain: "vida-en-orden/proposal/v1", payload }), "Proposal digest mismatch");
  return { ...row, payload: canonicalize(payload) };
}

/** SQL comes from reviewed migration files, never from the captured data. */
export function rehearseUserTableRestore(tables, migrations, upgradeSql) {
  const db = new DatabaseSync(":memory:");
  try {
    for (const sql of migrations) db.exec(sql);
    assert.deepEqual(Object.keys(tables).sort(), tableNames(db), "Incomplete user-table inventory");
    const triggers = db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='trigger' ORDER BY name").all();
    db.exec("BEGIN IMMEDIATE; PRAGMA defer_foreign_keys=ON;");
    try {
      // Only this disposable in-memory copy: importing with business revision triggers active
      // would silently change the restored installation's concurrency identity.
      for (const trigger of triggers) db.exec(`DROP TRIGGER ${quote(trigger.name)}`);
      for (const name of tableNames(db)) db.exec(`DELETE FROM ${quote(name)}`);
      for (const [name, table] of Object.entries(tables)) {
        const expected = db.prepare(`PRAGMA table_info(${quote(name)})`).all().map(row => row.name);
        assert.deepEqual([...table.columns].sort(), [...expected].sort(), "Incomplete column inventory");
        const statement = db.prepare(`INSERT INTO ${quote(name)} (${expected.map(quote).join(",")}) VALUES (${expected.map(() => "?").join(",")})`);
        for (const row of table.rows) {
          assert.deepEqual(Object.keys(row).sort(), [...expected].sort(), "Incomplete row");
          const values = expected.map(column => row[column]);
          assert.ok(values.every(value => value === null || typeof value === "string" || (typeof value === "number" && Number.isSafeInteger(value))), "Unsupported or lossy cell value");
          statement.run(...values);
        }
      }
      for (const trigger of triggers) db.exec(trigger.sql);
      assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), [], "Foreign key violations");
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
    const before = captureUserTables(db), beforeHash = fingerprint(before);
    assert.equal(beforeHash, fingerprint(tables), "Restoration changed user data");
    const bytes = () => Number(db.prepare("PRAGMA page_count").get().page_count) * Number(db.prepare("PRAGMA page_size").get().page_size);
    const bytesBefore = bytes(), started = performance.now();
    db.exec(upgradeSql);
    const migrationMilliseconds = performance.now() - started, bytesAfter = bytes();
    assert.equal(fingerprint(captureUserTables(db)), beforeHash, "Migration changed user data");
    assert.deepEqual(db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='trigger' ORDER BY name").all(), triggers, "Migration changed triggers");
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), [], "Post-migration foreign key violations");
    assert.deepEqual(db.prepare("PRAGMA integrity_check").all().map(row => row.integrity_check), ["ok"]);
    assert.deepEqual(db.prepare("PRAGMA index_info(audit_log_seed_context_idx)").all().map(row => row.name), ["owner_id", "entity_type", "entity_id", "action", "id"]);
    return { db, summary: { tables: tableNames(db).length, triggers: triggers.length, rows: Object.values(tables).reduce((n, table) => n + table.rows.length, 0), dataPreserved: true, integrity: "ok", migrationMilliseconds, bytesBefore, bytesAfter } };
  } catch (error) { db.close(); throw error; }
}
