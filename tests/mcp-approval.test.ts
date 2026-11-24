import assert from "node:assert/strict";
import test from "node:test";
import { createHash, generateKeyPairSync, randomBytes, sign } from "node:crypto";
import { webAuthnVerifier } from "../lib/mcp/plans/approval.ts";
import { randomChallenge } from "../lib/mcp/plans/canonical.ts";

const actor = { userId: "test-owner", email: "owner@example.test", fullName: null };
const origin = "https://approval.example.test";
function credential() {
  const keys = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const jwk = keys.publicKey.export({ format: "jwk" });
  const id = randomBytes(24).toString("base64url");
  const publicKey = Buffer.concat([Buffer.from([0xa5, 1, 2, 3, 0x26, 0x20, 1, 0x21, 0x58, 0x20]), Buffer.from(jwk.x!, "base64url"), Buffer.from([0x22, 0x58, 0x20]), Buffer.from(jwk.y!, "base64url")]).toString("base64url");
  const assertion = (challenge: string, responseOrigin = origin, flags = 5) => {
    const client = Buffer.from(JSON.stringify({ type: "webauthn.get", challenge, origin: responseOrigin, crossOrigin: false }));
    const authData = Buffer.concat([createHash("sha256").update(new URL(origin).hostname).digest(), Buffer.from([flags]), Buffer.alloc(4)]);
    const signature = sign("sha256", Buffer.concat([authData, createHash("sha256").update(client).digest()]), keys.privateKey);
    return { id, rawId: id, type: "public-key", response: { clientDataJSON: client.toString("base64url"), authenticatorData: authData.toString("base64url"), signature: signature.toString("base64url") }, clientExtensionResults: {} };
  };
  return { pin: { ownerId: actor.userId, id, publicKey }, assertion };
}

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
