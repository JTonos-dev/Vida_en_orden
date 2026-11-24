import assert from "node:assert/strict";
import test from "node:test";
import { createMcpReadService, McpReadError, type McpReadDatabase, type ReadPreparedStatement } from "../lib/mcp/read-service.ts";

class RecordingStatement implements ReadPreparedStatement {
  values: unknown[] = [];
  readonly sql: string;
  constructor(sql: string) { this.sql = sql; }
  bind(...values: unknown[]) { this.values = values; return this; }
  async first<T>() { return (/COUNT\(/i.test(this.sql) ? { total: 0 } : null) as T | null; }
  async all<T>() { return { results: [] as T[] }; }
}

test("toda consulta del servicio MCP es SELECT y conserva el owner en consultas privadas", async () => {
  const statements: RecordingStatement[] = [];
  const database: McpReadDatabase = {
    prepare(sql) { const statement = new RecordingStatement(sql); statements.push(statement); return statement; },
  };
  const service = createMcpReadService(database, { userId: "owner-id", email: "owner@example.com", fullName: null });
  await service.searchTasks({ status: "all" });
  await assert.rejects(() => service.getTask({ task_id: "missing" }), (error) => error instanceof McpReadError && error.code === "not_found");
  await service.listAccounts({});
  await service.getBudget({ month: "2026-11" });
  await service.listObligations({});
  await service.listGoals({});
  await service.searchAll({ query: "casa" });
  assert.ok(statements.length > 10);
  assert.ok(statements.every((statement) => /^\s*SELECT\b/i.test(statement.sql)));
  const privateQueries = statements.filter((statement) => /finance_|calendar_events|audit_log/.test(statement.sql));
  assert.ok(privateQueries.length > 0);
  assert.ok(privateQueries.every((statement) => statement.values.includes("owner-id")));
});

test("rechaza cursores manipulados antes de consultar", async () => {
  const database: McpReadDatabase = { prepare() { throw new Error("No debe consultar"); } };
  const service = createMcpReadService(database, { userId: "owner-id", email: "owner@example.com", fullName: null });
  await assert.rejects(() => service.listAccounts({ cursor: "***" }), (error) => error instanceof McpReadError && error.code === "invalid_input");
});

test("calcula el presupuesto con el mismo líquido y colchón que Finanzas", async () => {
  const database: McpReadDatabase = {
    prepare(sql) {
      const statement = new RecordingStatement(sql);
      statement.first = async <T>() => {
        if (/finance_settings/.test(sql)) return { safety_buffer_minor: 5000 } as T;
        return (/COUNT\(/i.test(sql) ? { total: 0 } : null) as T | null;
      };
      statement.all = async <T>() => {
        if (/finance_categories/.test(sql)) return { results: [{ id: "cat-1", name: "Casa", color: "#fff" }] as T[] };
        if (/finance_budgets/.test(sql)) return { results: [{ id: "budget-1", category_id: "cat-1", assigned_minor: 50000, concept: "Base", allocation_type: "base" }] as T[] };
        if (/finance_accounts/.test(sql)) return { results: [{ id: "cash-1", type: "bank", opening_balance_minor: 100000, opening_balance_date: "2026-01-01", archived: 0 }] as T[] };
        if (/finance_transactions/.test(sql)) return { results: [{ type: "expense", account_id: "cash-1", destination_account_id: null, amount_minor: 10000, fee_minor: 0, fee_category_id: null, category_id: "cat-1", occurred_on: "2026-11-10", status: "confirmed", obligation_occurrence_id: null, goal_id: null, goal_reservation_consumed_minor: 0 }] as T[] };
        return { results: [] as T[] };
      };
      return statement;
    },
  };
  const service = createMcpReadService(database, { userId: "owner-id", email: "owner@example.com", fullName: null });
  const result = await service.getBudget({ month: "2026-11" }) as { summary: Record<string, number> };
  assert.deepEqual(result.summary, {
    liquidMinor: 90000,
    safetyBufferMinor: 5000,
    budgetRemainingMinor: 40000,
    obligationReservedMinor: 0,
    goalReservedMinor: 0,
    coveredByBudgetMinor: 0,
    committedMinor: 45000,
    uncommittedMinor: 45000,
    incomeExpectedMinor: 0,
    incomeReceivedMinor: 0,
    incomeRemainingMinor: 0,
  });
});
