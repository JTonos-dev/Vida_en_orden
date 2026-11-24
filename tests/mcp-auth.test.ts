import assert from "node:assert/strict";
import test from "node:test";
import { authenticateMcpRequest, McpAuthenticationError } from "../lib/mcp/auth.ts";

const request = (headers: Record<string, string> = {}) => new Request("https://vida.test/mcp", { headers });

test("rechaza solicitudes MCP sin identidad autenticada", () => {
  assert.throws(
    () => authenticateMcpRequest(request(), { ownerEmail: "owner@example.com" }),
    (error) => error instanceof McpAuthenticationError && error.status === 401 && error.code === "missing_identity",
  );
});

test("falla cerrado si la política de propietario no está configurada", () => {
  assert.throws(
    () => authenticateMcpRequest(request({ "oai-authenticated-user-id": "owner-id", "oai-authenticated-user-email": "owner@example.com" }), {}),
    (error) => error instanceof McpAuthenticationError && error.status === 503 && error.code === "owner_policy_missing",
  );
});

test("rechaza a un viewer aunque Sites lo haya autenticado", () => {
  assert.throws(
    () => authenticateMcpRequest(request({ "oai-authenticated-user-id": "viewer-id", "oai-authenticated-user-email": "viewer@example.com" }), { ownerEmail: "owner@example.com" }),
    (error) => error instanceof McpAuthenticationError && error.status === 403 && error.code === "owner_only",
  );
});

test("acepta únicamente la identidad verificada del propietario", () => {
  const identity = authenticateMcpRequest(request({
    "oai-authenticated-user-id": "owner-id",
    "oai-authenticated-user-email": "Owner@Example.com",
    "oai-authenticated-user-full-name": "Jorge%20Tonos",
    "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
  }), { ownerUserId: "owner-id", ownerEmail: "owner@example.com" });
  assert.deepEqual(identity, { userId: "owner-id", email: "owner@example.com", fullName: "Jorge Tonos" });
});

test("si se configuran id y correo, ambos deben coincidir", () => {
  assert.throws(
    () => authenticateMcpRequest(request({ "oai-authenticated-user-id": "other-id", "oai-authenticated-user-email": "owner@example.com" }), { ownerUserId: "owner-id", ownerEmail: "owner@example.com" }),
    (error) => error instanceof McpAuthenticationError && error.status === 403,
  );
});
