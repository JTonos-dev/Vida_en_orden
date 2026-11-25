import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { auditPublicHistory, privatePath, scanPublicText } from "../scripts/public-source-audit.mjs";

test("la auditoría rechaza identidad de instalación aunque esté escapada, sin imprimirla", () => {
  const address = ["synthetic", "example", "invalid"].join(".").replace("synthetic.", "synthetic@");
  const domain = ["synthetic", "tenant", "chatgpt", "site"].join(".");
  const resource = "appgprj_" + "a".repeat(32);
  for (const value of [address, address.replaceAll(".", "\\."), domain, domain.replaceAll(".", "\\."), resource]) {
    const result = scanPublicText(value);
    assert.ok(result.length > 0);
    assert.ok(!JSON.stringify(result).includes(value));
  }
});

test("permite fixtures ficticios y atribución pública noreply", () => {
  assert.deepEqual(scanPublicText("owner@example.test owner@example.com seedy@sites.test person@users.noreply.github.com noreply@github.com"), []);
});

test("detecta credenciales y archivos privados sin depender de valores originales", () => {
  for (const value of ["ghp_" + "a".repeat(36), "Bearer " + "b".repeat(32), "-----BEGIN " + "PRIVATE KEY-----"]) assert.ok(scanPublicText(value).length);
  for (const file of [".env", ".env.example", ".dev.vars", "data/example.sqlite", "copy.backup"]) assert.equal(privatePath(file), true);
  assert.equal(privatePath("drizzle/schema.sql"), false);
});

test("el historial incluye blobs antiguos aunque HEAD ya esté limpio", () => {
  const repo = mkdtempSync(join(tmpdir(), "public-history-test-"));
  const git = (...args: string[]) => execFileSync("git", ["-C", repo, ...args], { stdio: "pipe" });
  try {
    git("init", "--initial-branch=main");
    git("config", "user.name", "Synthetic"); git("config", "user.email", "synthetic@example.test");
    const secret = "ghp_" + "z".repeat(36);
    writeFileSync(join(repo, "sample.txt"), secret);
    git("add", "sample.txt"); git("commit", "-m", "Synthetic historical fixture");
    writeFileSync(join(repo, "sample.txt"), "clean");
    git("add", "sample.txt"); git("commit", "-m", "Clean current source");
    const result = auditPublicHistory(repo);
    assert.ok(result.findings.some((finding: { category: string }) => finding.category === "credential"));
    assert.ok(!JSON.stringify(result).includes(secret));
    // An unreachable blob must also be detected, even without a reference.
    const unreachable = "Bearer " + "q".repeat(32);
    execFileSync("git", ["-C", repo, "hash-object", "-w", "--stdin"], { input: unreachable });
    assert.ok(auditPublicHistory(repo).findings.some((finding: { category: string }) => finding.category === "bearer_credential"));
  } finally {
    assert.ok(repo.startsWith(join(tmpdir(), "public-history-test-")));
    rmSync(repo, { recursive: true, force: true });
  }
});
