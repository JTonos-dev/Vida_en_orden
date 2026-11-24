import assert from "node:assert/strict";
import test from "node:test";
import { credential } from "./helpers/webauthn.ts";
import { webAuthnVerifier } from "../lib/mcp/plans/approval.ts";
import { randomChallenge } from "../lib/mcp/plans/canonical.ts";

const actor = { userId: "test-owner", email: "owner@example.test", fullName: null };
const origin = "https://approval.example.test";

test("verifica una assertion criptográfica ligada a origen, challenge, credencial y usuario", async () => {
  const fixture = credential(), challenge = randomChallenge();
  const verifier = webAuthnVerifier({ origin, credentials: [fixture.pin] });
  assert.deepEqual(await verifier.verify(fixture.assertion(challenge), challenge, actor), { credentialId: fixture.pin.id });
});

test("rechaza firma de otra clave, challenge/origen distintos y ausencia de verificación humana", async () => {
  const fixture = credential(), challenge = randomChallenge();
  const verifier = webAuthnVerifier({ origin, credentials: [fixture.pin] });
  await assert.rejects(() => verifier.verify(fixture.assertion(challenge), randomChallenge(), actor));
  await assert.rejects(() => verifier.verify(fixture.assertion(challenge, "https://other.example.test"), challenge, actor));
  await assert.rejects(() => verifier.verify(fixture.assertion(challenge, origin, 1), challenge, actor));
  await assert.rejects(() => verifier.verify(fixture.assertion(challenge, origin, 4), challenge, actor));
  await assert.rejects(() => verifier.verify(fixture.assertion(challenge), challenge, { ...actor, userId: "other-owner" }));
  await assert.rejects(() => verifier.verify({ confirmed: true }, challenge, actor));
  const other = credential().assertion(challenge); other.id = fixture.pin.id; other.rawId = fixture.pin.id;
  await assert.rejects(() => verifier.verify(other, challenge, actor));
});

test("no acepta origen HTTP ni una credencial no fijada por configuración confiable", async () => {
  assert.throws(() => webAuthnVerifier({ origin: "http://approval.example.test", credentials: [] }));
  const fixture = credential(), challenge = randomChallenge();
  await assert.rejects(() => webAuthnVerifier({ origin, credentials: [] }).verify(fixture.assertion(challenge), challenge, actor));
});
