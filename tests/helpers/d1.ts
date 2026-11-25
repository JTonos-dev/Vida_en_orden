import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";

export function testDatabase(through = Number.POSITIVE_INFINITY, transform?: (file:string,sql:string)=>string) {
  const sqlite = new DatabaseSync(":memory:");
  const migrations = readdirSync(new URL("../../drizzle/", import.meta.url)).filter((file) => /^\d{4}_.+\.sql$/.test(file) && Number(file.slice(0,4))<=through).sort();
  for (const file of migrations) {const sql=readFileSync(new URL(`../../drizzle/${file}`, import.meta.url), "utf8");sqlite.exec(transform?transform(file,sql):sql);}
  const sync = Symbol("synchronous-test-execution");
  let fail: ((sql: string) => boolean) | undefined;
  const prepare = (sql: string) => {
    const statement = sqlite.prepare(sql);
    let values: SQLInputValue[] = [];
    const wrapped = {
      [sync]() {
        if (fail?.(sql)) throw new Error("Injected batch failure");
        return { results: statement.all(...values).map((row) => ({ ...row })), success: true, meta: {} };
      },
      bind(...input: unknown[]) { values = input as SQLInputValue[]; return this; },
      async first<T>(column?: string) {
        const row = statement.get(...values);
        return (column ? row?.[column] : row ? { ...row } : null) as T | null;
      },
      async all<T>() { return { results: statement.all(...values).map((row) => ({ ...row })) as T[], success: true, meta: {} }; },
      async run<T>() {
        const result = statement.run(...values);
        return { results: [] as T[], success: true, meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
      },
      async raw() { return statement.all(...values).map(Object.values); },
    };
    return wrapped;
  };
  const database = {
    prepare,
    async batch(statements: Array<{ [sync](): unknown }>) {
      // Same ordered, all-or-nothing semantics as a D1 batch. Do not use this as a production D1 substitute.
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        const results = [];
        for (const statement of statements) results.push(statement[sync]());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
    withSession() { return this; },
  } as unknown as D1Database;
  return { database, sqlite, close: () => sqlite.close(), migrations, failWhen: (predicate?: (sql: string) => boolean) => { fail = predicate; } };
}
