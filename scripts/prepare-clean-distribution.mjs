import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { auditPublicHistory, auditPublicSource } from "./public-source-audit.mjs";

const root = process.cwd();
const git = (repo, args, options = {}) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options });
const [target, ...extra] = process.argv.slice(2);
const allowed = resolve(root, "work", "clean-distribution");
const destination = target && resolve(target);
if (!destination || extra.length || !destination.startsWith(allowed + sep) || relative(allowed, destination).startsWith("..")) {
  throw new Error("Provide one new destination under work/clean-distribution/.");
}
if (existsSync(destination)) throw new Error("Destination already exists; preserve it and select a new path.");
if (git(root, ["status", "--porcelain"]).trim()) throw new Error("Commit and review the exact source before preparing a distribution.");
if (auditPublicSource(root).findings.length) throw new Error("Source audit failed; no distribution prepared.");
const sourceCommit = git(root, ["rev-parse", "HEAD"]).trim();
const sourceTree = git(root, ["rev-parse", "HEAD^{tree}"]).trim();
const entries = git(root, ["ls-tree", "-r", "-z", "HEAD"]).split("\0").filter(Boolean).map((row) => {
  const tab = row.indexOf("\t");
  const [mode, type, oid] = row.slice(0, tab).split(" ");
  const path = row.slice(tab + 1);
  if (type !== "blob" || !["100644", "100755"].includes(mode)) throw new Error("Unsupported tree entry; preserve source and review export handling.");
  if (!resolve(destination, path).startsWith(destination + sep)) throw new Error("Unsafe tree path.");
  return { mode, oid, path };
});
const batch = git(root, ["cat-file", "--batch"], { input: entries.map((entry) => entry.oid).join("\n") + "\n", encoding: null });
mkdirSync(destination, { recursive: true });
let offset = 0;
const manifest = [];
for (const entry of entries) {
  const end = batch.indexOf(10, offset);
  const [oid, type, sizeText] = batch.subarray(offset, end).toString().split(" ");
  if (oid !== entry.oid || type !== "blob") throw new Error("Unexpected object response.");
  const size = Number(sizeText);
  const data = batch.subarray(end + 1, end + 1 + size);
  offset = end + size + 2;
  const file = resolve(destination, entry.path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
  manifest.push({ path: entry.path, mode: entry.mode, sha256: createHash("sha256").update(data).digest("hex") });
}
git(destination, ["init", "--initial-branch=main"]);
git(destination, ["config", "core.autocrlf", "false"]);
git(destination, ["config", "core.filemode", "false"]);
git(destination, ["add", "--all"]);
for (const entry of entries.filter((entry) => entry.mode === "100755")) git(destination, ["update-index", "--chmod=+x", "--", entry.path]);
const tree = git(destination, ["write-tree"]).trim();
if (tree !== sourceTree) throw new Error("Exported Git tree differs; candidate must not be published.");
git(destination, ["-c", "user.name=Vida en Orden contributors", "-c", "user.email=public-contributor@users.noreply.github.com", "commit", "-m", "Initial audited public distribution"]);
const candidateCommit = git(destination, ["rev-parse", "HEAD"]).trim();
const history = auditPublicHistory(destination);
if (history.findings.length || git(destination, ["rev-list", "--all", "--count"]).trim() !== "1" || git(destination, ["remote"]).trim()) {
  throw new Error("Candidate history or remote isolation failed; do not publish.");
}
const result = { sourceCommit, sourceTree, candidateCommit, candidateTree: tree, commits: 1, remotes: 0, files: entries.length, auditFindings: history.findings.length, destination, manifest };
writeFileSync(destination + ".manifest.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ ...result, manifest: undefined }, null, 2));
