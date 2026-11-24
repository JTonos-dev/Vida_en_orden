import { BUSINESS_TABLES } from "./tables.ts";
import type { DomainDatabase } from "../../domain/context.ts";

const names = new Set<string>(BUSINESS_TABLES.map((table) => table.name));
const native = Symbol("native-statement");
type Wrapped = D1PreparedStatement & { [native]: D1PreparedStatement };
const keywords = new Set("WHERE SET ORDER GROUP LIMIT LEFT RIGHT INNER OUTER CROSS JOIN ON UNION RETURNING AS AND OR HAVING OFFSET".split(" "));
type Token = { value: string; start: number; end: number; depth: number };

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /'(?:''|[^'])*'|"(?:""|[^"])*"|`[^`]*`|[A-Za-z_][A-Za-z_0-9]*|[().,]/g;
  let depth = 0;
  for (const match of sql.matchAll(pattern)) {
    if (match[0] === ")") depth--;
    tokens.push({ value: match[0], start: match.index!, end: match.index! + match[0].length, depth });
    if (match[0] === "(") depth++;
  }
  return tokens;
}

/** Rewrites only trusted domain-service SQL to a server-created partition. */
export function stageSql(sql: string, stageId: string): string | null {
  if (!/^[a-f0-9-]{36}$/.test(stageId)) throw new Error("Invalid stage identifier");
  if (/\bmcp_\w+/i.test(sql) || /;|--|\/\*/.test(sql)) throw new Error("Unsupported domain SQL");
  const tokens = tokenize(sql);
  const method = tokens[0]?.value.toUpperCase();
  if (method === "CREATE") {
    if (/^CREATE (?:TABLE IF NOT EXISTS finance_concepts|UNIQUE INDEX IF NOT EXISTS finance_concepts_owner_normalized_idx)\b/i.test(sql)) return null;
    throw new Error("Request-time schema change is forbidden");
  }
  if (method === "PRAGMA") {
    const table = /^PRAGMA table_info\((\w+)\)$/i.exec(sql)?.[1];
    if (!table || !names.has(table)) throw new Error("Unsupported schema query");
    return `PRAGMA table_info(mcp_stage_${table})`;
  }
  if (method === "INSERT") {
    const match = /^(INSERT(?: OR IGNORE)? INTO) (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]+)\)$/i.exec(sql);
    if (!match || !names.has(match[2])) throw new Error("Unsupported domain insert");
    return `${match[1]} mcp_stage_${match[2]} (proposal_id,${match[3]}) VALUES ('${stageId}',${match[4]})`;
  }
  if (!["SELECT", "UPDATE", "DELETE"].includes(method)) throw new Error("Unsupported domain statement");
  const replacements: Array<{ start: number; end: number; value: string }> = [];
  let target: string | undefined;
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    const previous = tokens[index - 1]?.value.toUpperCase();
    if (!names.has(token.value) || !["FROM", "JOIN", "UPDATE"].includes(previous)) continue;
    const isTarget = (method === "UPDATE" && previous === "UPDATE") || (method === "DELETE" && previous === "FROM" && token.depth === 0);
    if (isTarget) {
      target = token.value;
      replacements.push({ start: token.start, end: token.end, value: `mcp_stage_${token.value} AS ${token.value}` });
    } else {
      const next = tokens[index + 1]?.value;
      const explicitAlias = next === "AS" || (next && /^[A-Za-z_]/.test(next) && !keywords.has(next.toUpperCase()));
      replacements.push({ start: token.start, end: token.end, value: `(SELECT * FROM mcp_stage_${token.value} WHERE proposal_id='${stageId}')${explicitAlias ? "" : ` AS ${token.value}`}` });
    }
  }
  if (method !== "SELECT") {
    if (!target) throw new Error("Missing domain target");
    const where = tokens.find((token) => token.depth === 0 && token.value.toUpperCase() === "WHERE");
    if (where) {
      replacements.push({ start: where.start, end: where.end, value: `WHERE ${target}.proposal_id='${stageId}' AND (` });
      replacements.push({ start: sql.length, end: sql.length, value: ")" });
    } else replacements.push({ start: sql.length, end: sql.length, value: ` WHERE ${target}.proposal_id='${stageId}'` });
  }
  if (!replacements.length) throw new Error("Domain query has no approved table");
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) sql = sql.slice(0, replacement.start) + replacement.value + sql.slice(replacement.end);
  return sql;
}

export function stagingDatabase(database: DomainDatabase, stageId: string): DomainDatabase {
  const prepare = (sql: string): D1PreparedStatement => {
    const rewritten = stageSql(sql, stageId);
    if (rewritten === null) {
      const noop = { bind() { return this; }, async run() { return { success: true, results: [], meta: {} }; } };
      return noop as unknown as D1PreparedStatement;
    }
    const statement = database.prepare(rewritten);
    const wrapped = {
      [native]: statement,
      bind(...values: unknown[]) { return wrap(statement.bind(...values)); },
      first: statement.first.bind(statement), all: statement.all.bind(statement), run: statement.run.bind(statement),
    };
    return wrapped as unknown as D1PreparedStatement;
  };
  const wrap = (statement: D1PreparedStatement): D1PreparedStatement => ({
    [native]: statement,
    bind(...values: unknown[]) { return wrap(statement.bind(...values)); },
    first: statement.first.bind(statement), all: statement.all.bind(statement), run: statement.run.bind(statement),
  }) as unknown as D1PreparedStatement;
  return {
    prepare,
    async batch(statements: D1PreparedStatement[]) {
      const unwrapped = statements.map((statement) => {
        const original = (statement as Wrapped)[native];
        if (!original) throw new Error("Non-staging batch statement");
        return original;
      });
      return database.batch(unwrapped);
    },
  } as unknown as DomainDatabase;
}
