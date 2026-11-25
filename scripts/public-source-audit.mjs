import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** @type {Array<[string, RegExp]>} */
const rules = [
  ["credential", /\b(?:sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16})\b/g],
  ["bearer_credential", /Bearer\s+[A-Za-z0-9._~-]{20,}/g],
  ["private_key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ["private_resource_id", /\b(?:appgprj|appgdep|appgver)_[a-z0-9]{20,}\b/gi],
  ["private_site_origin", /\b[a-z0-9.-]+\.chatgpt\.site\b/gi],
  ["personal_email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi],
];
const publicEmail = (value) => /@(?:example\.(?:com|org|test)|sites\.test|users\.noreply\.github\.com)$/i.test(value) || value.toLowerCase() === "noreply@github.com";
export const privatePath = (file) => /(?:^|\/)(?:\.env(?:\.[^/]*)?|\.dev\.vars(?:\.[^/]*)?|[^/]*\.(?:sqlite3?|db|dump|bak|backup|pem))$/i.test(file);

/** Findings intentionally exclude matched values: reports may be public CI output. */
export function scanPublicText(text, path = "(text)") {
  // Escaping punctuation does not make a real email or Site address anonymous.
  const normalized = text.replace(/\\\./g, ".");
  const findings = [];
  for (const [category, pattern] of rules) {
    for (const match of normalized.matchAll(pattern)) {
      if (category === "personal_email" && publicEmail(match[0])) continue;
      findings.push({ category, path, line: normalized.slice(0, match.index).split("\n").length });
    }
  }
  if (path.startsWith("lib/") && /(?:const|let)\s+seedRows\b|org-project-|OrganizationTask/.test(text)) {
    findings.push({ category: "legacy_installation_bootstrap", path });
  }
  return findings;
}

const git = (repo, args, options = {}) => execFileSync("git", ["-C", repo, ...args], { maxBuffer: 64 * 1024 * 1024, ...options });

export function auditPublicSource(repo = process.cwd()) {
  const files = git(repo, ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
  const findings = [];
  for (const path of files) {
    if (privatePath(path)) findings.push({ category: "private_file", path });
    const data = readFileSync(resolve(repo, path));
    if (!data.includes(0)) findings.push(...scanPublicText(data.toString("utf8"), path));
  }
  return { mode: "source", files: files.length, findings };
}

export function auditPublicHistory(repo = process.cwd()) {
  // Include loose/unreachable objects too, rather than trusting only branch tips.
  const ids = git(repo, ["cat-file", "--batch-all-objects", "--batch-check=%(objectname) %(objecttype)"], { encoding: "utf8" })
    .trim().split("\n").filter(Boolean).filter((row) => / (blob|commit|tag)$/.test(row)).map((row) => row.split(" ")[0]);
  const paths = new Map(git(repo, ["rev-list", "--objects", "--all"], { encoding: "utf8" }).trim().split("\n").map((row) => [row.slice(0, 40), row.slice(41)]));
  const batch = git(repo, ["cat-file", "--batch"], { input: ids.join("\n") + "\n" });
  const findings = [];
  let offset = 0;
  while (offset < batch.length) {
    const end = batch.indexOf(10, offset);
    if (end < 0) break;
    const [oid, type, sizeText] = batch.subarray(offset, end).toString().split(" ");
    const size = Number(sizeText);
    const data = batch.subarray(end + 1, end + 1 + size);
    offset = end + size + 2;
    const path = paths.get(oid) || `(${type})`;
    if (privatePath(path)) findings.push({ category: "private_file", path, oid });
    if (!data.includes(0)) findings.push(...scanPublicText(data.toString("utf8"), path).map((finding) => ({ ...finding, oid })));
  }
  return { mode: "history", objects: ids.length, findings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.some((arg) => !["--history"].includes(arg))) throw new Error("Usage: node scripts/public-source-audit.mjs [--history]");
  const result = args.includes("--history") ? auditPublicHistory() : auditPublicSource();
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.findings.length ? 1 : 0;
}
