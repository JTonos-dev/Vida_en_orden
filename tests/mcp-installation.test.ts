import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import test from "node:test";
import { HOUSEHOLD_SCOPE } from "../lib/data-scopes.ts";
import type { McpReadDatabase } from "../lib/mcp/read-service.ts";
import { handleMcpRequest, MCP_TOOL_DEFINITIONS } from "../lib/mcp/server.ts";
import { MCP_PROTOCOL_VERSION } from "../lib/mcp/protocol.ts";
import type { McpOwnerPolicy } from "../lib/mcp/auth.ts";

type RpcBody = {
  error?: unknown;
  result: {
    supportedVersions: string[];
    tools: unknown[];
    isError?: boolean;
    structuredContent: {
      readOnly?: boolean; businessWritesEnabled?: boolean; valid?: boolean; error?: string;
      items: Array<{ id: string }>;
      page: { total: number; nextCursor: string | null };
    };
  };
};

const owner = { userId: "installation-owner", email: "owner@example.test" };
const stamp = "2026-11-01T12:00:00.000Z";
const args: Record<string, Record<string, unknown>> = {
  get_task: { task_id: "task" }, list_task_relations: { task_id: "task" },
  get_area: { area_id: "area" }, get_project: { project_id: "project" },
  get_calendar_event: { event_id: "event" }, get_account: { account_id: "account" },
  get_transaction: { transaction_id: "transaction" }, get_budget: { month: "2026-11" },
  get_obligation: { obligation_id: "obligation" }, get_goal: { goal_id: "goal" },
  search_all: { query: "synthetic" },
};
const detailTools = new Set([
  "get_task", "list_task_relations", "get_area", "get_project", "get_calendar_event",
  "get_account", "get_transaction", "get_obligation", "get_goal",
]);

function installation(label?: string) {
  const sqlite = new DatabaseSync(":memory:");
  const migrations = readdirSync(new URL("../drizzle/", import.meta.url))
    .filter((file) => /^\d{4}_.+\.sql$/.test(file)).sort();
  assert.equal(migrations.length, 8);
  for (const migration of migrations) sqlite.exec(readFileSync(new URL(`../drizzle/${migration}`, import.meta.url), "utf8"));
  const insert = (table: string, values: Record<string, SQLInputValue>) => {
    const columns = Object.keys(values);
    sqlite.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`).run(...Object.values(values));
  };
  if (label) {
    const dated = { created_at: stamp, updated_at: stamp };
    const privateRow = { owner_id: owner.userId, ...dated };
    insert("home_workspaces", { user_id: HOUSEHOLD_SCOPE, ...dated });
    insert("home_areas", { id: "area", scope_id: HOUSEHOLD_SCOPE, name: `synthetic ${label}`, ...dated });
    insert("home_projects", { id: "project", scope_id: HOUSEHOLD_SCOPE, area_id: "area", name: `synthetic ${label}`, ...dated });
    insert("home_tasks", { id: "task", user_id: HOUSEHOLD_SCOPE, title: `synthetic ${label}`, area_id: "area", project_id: "project", ...dated });
    insert("home_notes", { id: "note", user_id: HOUSEHOLD_SCOPE, task_id: "task", text: "synthetic note", ...dated });
    insert("home_movements", { id: "movement", user_id: HOUSEHOLD_SCOPE, task_id: "task", amount: "1", date: "2026-11-01", created_at: stamp });
    insert("calendar_events", { id: "event", ...privateRow, title: `synthetic ${label}`, start_date: "2026-11-01", end_date: "2026-11-01", linked_task_id: "task" });
    insert("finance_settings", { owner_id: owner.userId, updated_at: stamp });
    for (const id of ["account", "account-2"]) insert("finance_accounts", { id, ...privateRow, name: `synthetic ${label} ${id}`, type: "bank", opening_balance_minor: 10000, opening_balance_date: "2026-01-01" });
    insert("finance_accounts", { id: "foreign-account", ...dated, owner_id: "another-owner", name: "foreign-sentinel", type: "bank", opening_balance_date: "2026-01-01" });
    insert("finance_categories", { id: "category", ...privateRow, name: `synthetic ${label}` });
    insert("finance_concepts", { id: "concept", ...privateRow, concept: `synthetic ${label}`, normalized: `synthetic ${label}` });
    insert("finance_transactions", { id: "transaction", ...privateRow, type: "expense", account_id: "account", category_id: "category", task_id: "task", project_id: "project", amount_minor: 100, occurred_on: "2026-11-01", description: `synthetic ${label}` });
    insert("finance_budgets", { id: "budget", ...privateRow, month: "2026-11", category_id: "category", assigned_minor: 500 });
    insert("finance_obligations", { id: "obligation", ...privateRow, title: `synthetic ${label}`, kind: "expense", expected_amount_minor: 100, next_due_date: "2026-11-15", category_id: "category", account_id: "account" });
    insert("finance_obligation_occurrences", { id: "occurrence", ...privateRow, obligation_id: "obligation", due_date: "2026-11-15", expected_minor: 100 });
    insert("finance_goals", { id: "goal", ...privateRow, title: `synthetic ${label}`, target_minor: 1000, account_id: "account", linked_task_id: "task", linked_project_id: "project", category_id: "category" });
    insert("finance_goal_entries", { id: "entry", ...privateRow, goal_id: "goal", amount_minor: 100, occurred_on: "2026-11-01" });
    insert("audit_log", { id: "audit", owner_id: owner.userId, entity_type: "task", entity_id: "task", action: "synthetic", occurred_at: stamp });
  }
  const database: McpReadDatabase = {
    prepare(sql) {
      assert.match(sql, /^\s*SELECT\b/i, "MCP must only issue SELECT statements");
      const statement = sqlite.prepare(sql);
      let values: SQLInputValue[] = [];
      return {
        bind(...input) { values = input as SQLInputValue[]; return this; },
        async first<T>() { return (statement.get(...values) ?? null) as T | null; },
        async all<T>() { return { results: statement.all(...values) as T[] }; },
      };
    },
  };
  const snapshot = () => {
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    return JSON.stringify(tables.map(({ name }) => [name, sqlite.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all()]));
  };
  return { sqlite, database, snapshot };
}

async function rpc(database: McpReadDatabase, method: string, params: Record<string, unknown> = {}, identity: Record<string, string> = owner, policy: McpOwnerPolicy = { ownerEmail: owner.email }) {
  const response = await handleMcpRequest(new Request("https://installation.test/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json", "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
      "Mcp-Method": method, ...(params.name ? { "Mcp-Name": String(params.name) } : {}),
      ...(identity.userId ? { "oai-authenticated-user-id": identity.userId } : {}),
      ...(identity.email ? { "oai-authenticated-user-email": identity.email } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: { ...params, _meta: {
      "io.modelcontextprotocol/protocolVersion": MCP_PROTOCOL_VERSION,
      "io.modelcontextprotocol/clientCapabilities": {},
    } } }),
  }), { database, ownerPolicy: policy });
  return { status: response.status, body: await response.json() as RpcBody };
}
const call = (database: McpReadDatabase, name: string, input = args[name] || {}) => rpc(database, "tools/call", { name, arguments: input });

test("instalación nueva: las 31 herramientas ejecutan SQL real sin modificar registros", async (t) => {
  const instance = installation("instance-a");
  try {
    const before = instance.snapshot();
    const discovery = await rpc(instance.database, "server/discover");
    assert.deepEqual(discovery.body.result.supportedVersions, [MCP_PROTOCOL_VERSION]);
    const catalog = await rpc(instance.database, "tools/list");
    assert.equal(catalog.body.result.tools.length, 31);
    for (const tool of MCP_TOOL_DEFINITIONS) await t.test(tool.name, async () => {
      assert.equal(tool.annotations.readOnlyHint, true);
      assert.equal(tool.annotations.destructiveHint, false);
      const result = await call(instance.database, tool.name);
      assert.equal(result.status, 200);
      assert.equal(result.body.error, undefined, JSON.stringify(result.body));
      assert.equal(result.body.result.isError, undefined, JSON.stringify(result.body));
      assert.ok(result.body.result.structuredContent);
      assert.ok(!JSON.stringify(result.body).includes("foreign-sentinel"));
      if (tool.name === "get_capabilities") {
        assert.equal(result.body.result.structuredContent.readOnly, true);
        assert.equal(result.body.result.structuredContent.businessWritesEnabled, false);
      }
      if (tool.name === "validate_references") assert.equal(result.body.result.structuredContent.valid, true);
    });
    assert.equal(instance.snapshot(), before);
  } finally { instance.sqlite.close(); }
});

test("instalación vacía: las 31 lecturas no crean valores predeterminados ni tablas", async () => {
  const instance = installation();
  try {
    const before = instance.snapshot();
    for (const tool of MCP_TOOL_DEFINITIONS) {
      const { body, status } = await call(instance.database, tool.name);
      assert.equal(status, 200);
      assert.equal(body.error, undefined, JSON.stringify(body));
      if (detailTools.has(tool.name)) {
        assert.equal(body.result.isError, true, tool.name);
        assert.equal(body.result.structuredContent.error, "not_found", tool.name);
      } else assert.equal(body.result.isError, undefined, JSON.stringify(body));
    }
    assert.equal(instance.snapshot(), before);
  } finally { instance.sqlite.close(); }
});

test("dos bases independientes mantienen separados incluso los mismos IDs y alcance compartido", async () => {
  const first = installation("instance-a"), second = installation("instance-b");
  try {
    for (const name of ["search_tasks", "list_accounts", "search_all"]) {
      const a = JSON.stringify((await call(first.database, name)).body);
      const b = JSON.stringify((await call(second.database, name)).body);
      assert.ok(a.includes("instance-a") && !a.includes("instance-b"), name);
      assert.ok(b.includes("instance-b") && !b.includes("instance-a"), name);
    }
  } finally { first.sqlite.close(); second.sqlite.close(); }
});

test("paginación y autorización se comprueban contra una instalación migrada", async () => {
  const instance = installation("instance-a");
  try {
    const first = (await call(instance.database, "list_accounts", { limit: 1 })).body.result.structuredContent;
    const second = (await call(instance.database, "list_accounts", { limit: 1, cursor: first.page.nextCursor })).body.result.structuredContent;
    assert.equal(first.page.total, 2);
    assert.equal(second.items.length, 1);
    assert.notEqual(first.items[0].id, second.items[0].id);
    assert.equal(second.page.nextCursor, null);
    assert.equal((await rpc(instance.database, "tools/list", {}, {})).status, 401);
    assert.equal((await rpc(instance.database, "tools/list", {}, { userId: "other", email: "other@example.test" })).status, 403);
    assert.equal((await rpc(instance.database, "tools/list", {}, owner, {})).status, 503);
    const foreign = (await call(instance.database, "get_account", { account_id: "foreign-account" })).body.result;
    assert.equal(foreign.isError, true);
    assert.equal(foreign.structuredContent.error, "not_found");
  } finally { instance.sqlite.close(); }
});
