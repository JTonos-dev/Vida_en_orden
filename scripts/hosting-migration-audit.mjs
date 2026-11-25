import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { unstable_splitSqlQuery } from "wrangler";

export function inspectHostingMigration(source) {
  return unstable_splitSqlQuery(source).flatMap((statement, index) => {
    const sql = statement.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/, "").trim();
    if (!sql || /^(?:CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX|TRIGGER)|ALTER\s+TABLE)\b/i.test(sql)) return [];
    return [{ statement: index + 1, operation: sql.match(/^[A-Z]+/i)?.[0].toUpperCase() || "UNKNOWN" }];
  });
}

export function inspectHostingMigrations(directory) {
  const files = readdirSync(directory).filter(file => /^\d{4}_.+\.sql$/.test(file)).sort();
  const findings = files.flatMap(file => inspectHostingMigration(readFileSync(join(directory, file), "utf8")).map(finding => ({ file, ...finding })));
  return { status: findings.length ? "blocked_non_schema_migrations" : "schema_only_candidate", backendVerified: false, findings };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = inspectHostingMigrations(join(dirname(fileURLToPath(import.meta.url)), "../drizzle"));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.findings.length ? 1 : 0;
}
