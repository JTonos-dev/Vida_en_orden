import assert from "node:assert/strict";
import test from "node:test";
import { inspectHostingMigration } from "../scripts/hosting-migration-audit.mjs";

test("el gate de publicación distingue DDL de backfills y no interpreta UPDATE interno de un trigger como backfill", () => {
  const ddl = "-- schema\nCREATE TABLE test(id INTEGER); CREATE TRIGGER test_change AFTER INSERT ON test BEGIN UPDATE test SET id=id WHERE id=1; END; CREATE UNIQUE INDEX test_unique ON test(id); ALTER TABLE test ADD COLUMN label TEXT;";
  assert.deepEqual(inspectHostingMigration(ddl), []);
  const result = inspectHostingMigration("/* metadata */ INSERT INTO test VALUES(1); -- cleanup\nUPDATE test SET id=2; DELETE FROM test; DROP TABLE test;");
  assert.deepEqual(result.map(item => item.operation), ["INSERT", "UPDATE", "DELETE", "DROP"]);
  assert.equal(result.length, 4);
});
