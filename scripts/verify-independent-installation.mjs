import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { auditPublicSource } from "./public-source-audit.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "drizzle");
const distConfig = join(root, "dist", "server", "wrangler.json");
const tempRoot = mkdtempSync(join(tmpdir(), "vida-en-orden-independent-"));
const persistDir = join(tempRoot, "wrangler-state");

const fail = (message) => {
  console.error(`Independent installation verification failed: ${message}`);
  throw new Error(message);
};

const run = (command, args) => {
  console.log(`> ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd: root, stdio: "inherit", env: { ...process.env } });
};

try {
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  const forbiddenFiles = tracked.filter((file) =>
    /(^|\/)(\.env(?:\.[^/]+)?|\.dev\.vars(?:\.[^/]+)?|.*\.(?:sqlite|sqlite3|db|dump|bak|backup|pem))$/i.test(file),
  );
  if (forbiddenFiles.length) fail(`tracked private file(s): ${forbiddenFiles.join(", ")}`);

  const publicAudit = auditPublicSource(root);
  if (publicAudit.findings.length) {
    console.error(JSON.stringify(publicAudit.findings));
    fail("public source contains private configuration, identity or credential patterns");
  }

  const runtimeSource = tracked
    .filter((file) => file.startsWith("lib/") && /\.[cm]?tsx?$/.test(file))
    .map((file) => readFileSync(join(root, file), "utf8"))
    .join("\n");
  if (/(?:const|let)\s+seedRows\b|org-project-|OrganizationTask/.test(runtimeSource)) {
    fail("legacy installation fixtures or automatic task organization remain in runtime code");
  }

  const hosting = JSON.parse(readFileSync(join(root, ".openai", "hosting.json"), "utf8"));
  if (!hosting.project_id || /^appgprj_/i.test(hosting.project_id)) {
    fail(".openai/hosting.json must use the public placeholder, not a Site project identifier");
  }
  if (hosting.d1 !== "DB" || !Array.isArray(hosting.capabilities) || !hosting.capabilities.includes("mcp")) {
    fail(".openai/hosting.json does not declare the portable DB/MCP contract");
  }

  const migrations = readdirSync(migrationsDir)
    .filter((file) => /^\d{4}_.+\.sql$/.test(file))
    .sort();
  const expected = migrations.map((_, index) => String(index).padStart(4, "0"));
  if (migrations.length < 8 || migrations.some((file, index) => !file.startsWith(`${expected[index]}_`))) {
    fail(`expected ordered migrations ${expected.join(", ")}; found ${migrations.join(", ")}`);
  }
  if (!existsSync(distConfig)) fail("dist/server/wrangler.json is missing; run npm run build first");

  const wrangler = join(root, "node_modules", "wrangler", "bin", "wrangler.js");
  if (!existsSync(wrangler)) fail("Wrangler is not installed; run npm ci first");
  for (const migration of migrations) {
    run(process.execPath, [wrangler, "d1", "execute", "DB", "--local", "--config", distConfig, "--persist-to", persistDir, "--file", join(migrationsDir, migration)]);
  }
  run(process.execPath, [wrangler, "d1", "execute", "DB", "--local", "--config", distConfig, "--persist-to", persistDir, "--command", "SELECT count(*) AS table_count FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%'"]);
  console.log("Independent D1 installation verified: migrations applied locally and smoke query succeeded.");
  console.log("MCP registration/authentication is covered by npm run test:mcp; no production Site or remote D1 was contacted.");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
