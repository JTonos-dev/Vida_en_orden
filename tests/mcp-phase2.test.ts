import assert from "node:assert/strict";
import test from "node:test";
import { createMcpReadService, type McpReadDatabase, type ReadPreparedStatement } from "../lib/mcp/read-service.ts";

class EmptyStatement implements ReadPreparedStatement {
  readonly sql: string;
  values: unknown[] = [];
  constructor(sql: string) { this.sql = sql; }
  bind(...values: unknown[]) { this.values = values; return this; }
  async first<T>() { return (/COUNT\(/i.test(this.sql) ? { total: 0 } : null) as T | null; }
  async all<T>() { return { results: [] as T[] }; }
}

test("Fase 2 conserva una capa estrictamente de lectura en todas las consultas nuevas", async () => {
  const statements: EmptyStatement[] = [];
  const database: McpReadDatabase = { prepare(sql) { const statement = new EmptyStatement(sql); statements.push(statement); return statement; } };
  const service = createMcpReadService(database, { userId: "owner-id", email: "owner@example.com", fullName: null });

  await service.listAreas({});
  await service.listProjects({});
  await service.listCalendarEvents({});
  await service.getAgenda({});
  await service.listAccounts({});
  await service.listCategories({});
  await service.listConcepts({});
  await service.searchTransactions({});
  await service.getBudget({ month: "2026-11" });
  await service.listBudgetAllocations({});
  await service.listObligations({});
  await service.listObligationOccurrences({});
  await service.listGoals({});
  await service.listGoalEntries({});
  await service.getFinanceReport({ group_by: "month" });
  await service.listAuditLog({});
  await service.getConfiguration({});
  await service.validateReferences({});

  assert.ok(statements.length > 20);
  assert.ok(statements.every((statement) => /^\s*SELECT\b/i.test(statement.sql)));
  const privateStatements = statements.filter((statement) => /finance_|calendar_events|audit_log/.test(statement.sql));
  assert.ok(privateStatements.length > 0);
  assert.ok(privateStatements.every((statement) => statement.values.includes("owner-id")));
});

test("las listas financieras devuelven cursores explícitos y no truncan silenciosamente", async () => {
  const database: McpReadDatabase = {
    prepare(sql) {
      const statement = new EmptyStatement(sql);
      statement.first = async <T>() => (/COUNT\(/i.test(sql) ? { total: 3 } : null) as T | null;
      statement.all = async <T>() => /finance_accounts/.test(sql) ? { results: [
        { id: "account-1", name: "Banco", type: "bank", bank_name: "Banco A", currency: "DOP", opening_balance_minor: 1000, opening_balance_date: "2026-01-01", balance_minor: 1000, archived: 0 },
        { id: "account-2", name: "Efectivo", type: "cash", bank_name: "", currency: "DOP", opening_balance_minor: 2000, opening_balance_date: "2026-01-01", balance_minor: 2000, archived: 0 },
      ] as T[] } : { results: [] as T[] };
      return statement;
    },
  };
  const service = createMcpReadService(database, { userId: "owner-id", email: "owner@example.com", fullName: null });
  const result = await service.listAccounts({ limit: 2 }) as { items: unknown[]; page: { total: number; returned: number; nextCursor: string | null } };
  assert.equal(result.page.total, 3);
  assert.equal(result.page.returned, 2);
  assert.equal(result.page.nextCursor, "Mg");
});

test("la validación de referencias cruza entidades sin crear defaults ni modificar datos", async () => {
  const statements: EmptyStatement[] = [];
  const database: McpReadDatabase = { prepare(sql) { const statement = new EmptyStatement(sql); statements.push(statement); return statement; } };
  const service = createMcpReadService(database, { userId: "owner-id", email: "owner@example.com", fullName: null });
  const result = await service.validateReferences({ limit: 10 }) as { valid: boolean; issueCount: number; checked: Record<string, number> };
  assert.equal(result.valid, true);
  assert.equal(result.issueCount, 0);
  assert.equal(result.checked.transactions, 0);
  assert.ok(statements.every((statement) => /^\s*SELECT\b/i.test(statement.sql)));
});
