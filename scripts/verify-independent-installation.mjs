import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

  const source = tracked
    .filter((file) => !file.endsWith("package-lock.json"))
    .map((file) => readFileSync(join(root, file), "utf8"))
    .join("\n");
  const privateMarkers = [
    /jorgetonos@gmail\.com/i,
    /chatgpt-tic@infotep\.gob\.do/i,
    /casa-en-orden-cj\.jorgetonos\.chatgpt\.site/i,
    /appgprj_[a-z0-9]{20,}/i,
    /appgdep_[a-z0-9]{20,}/i,
  ];
  if (privateMarkers.some((marker) => marker.test(source))) fail("a known personal Site identifier or email is present");

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
  const expected = ["0000", "0001", "0002", "0003", "0004", "0005", "0006", "0007"];
  if (migrations.length !== expected.length || migrations.some((file, index) => !file.startsWith(`${expected[index]}_`))) {
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
