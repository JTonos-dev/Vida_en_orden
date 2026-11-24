import { createHash, generateKeyPairSync, randomBytes, sign } from "node:crypto";
export function credential(ownerId = "test-owner", origin = "https://approval.example.test") {
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
  const registration = (challenge: string, responseOrigin = origin, flags = 69) => {
    const client = Buffer.from(JSON.stringify({ type: "webauthn.create", challenge, origin: responseOrigin, crossOrigin: false }));
    const credId = Buffer.from(id,"base64url");
    const authData = Buffer.concat([createHash("sha256").update(new URL(origin).hostname).digest(),Buffer.from([flags]),Buffer.alloc(4),Buffer.alloc(16),Buffer.from([0,credId.length]),credId,Buffer.from(publicKey,"base64url")]);
    const attestation = Buffer.concat([Buffer.from([0xa3,0x63]),Buffer.from("fmt"),Buffer.from([0x64]),Buffer.from("none"),Buffer.from([0x67]),Buffer.from("attStmt"),Buffer.from([0xa0,0x68]),Buffer.from("authData"),Buffer.from([0x58,authData.length]),authData]);
    return {id,rawId:id,type:"public-key",response:{clientDataJSON:client.toString("base64url"),attestationObject:attestation.toString("base64url"),transports:["internal"]},clientExtensionResults:{}};
  };
  return { registration, pin: { ownerId, id, publicKey }, assertion };
}
