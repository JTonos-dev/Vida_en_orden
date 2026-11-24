import { verifyAuthenticationResponse, type AuthenticationResponseJSON } from "@simplewebauthn/server";
import type { McpIdentity } from "../auth.ts";
import type { ApprovalVerifier } from "./types.ts";

export type PinnedCredential = { ownerId: string; id: string; publicKey: string };
export function decodeBase64url(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > 8192) throw new Error("Invalid credential encoding");
  return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));
}

/** Pins are installed by an administrator outside MCP; there is no model-callable enrollment. */
export function webAuthnVerifier(config: { origin: string; credentials: readonly PinnedCredential[] }): ApprovalVerifier {
  const origin = new URL(config.origin);
  if (origin.protocol !== "https:" || config.origin !== origin.origin) throw new Error("Approval requires one exact HTTPS origin");
  return {
    channel: "webauthn",
    async verify(proof: unknown, challenge: string, actor: McpIdentity) {
      if (!proof || typeof proof !== "object" || JSON.stringify(proof).length > 16 * 1024) throw new Error("Invalid assertion");
      const response = proof as AuthenticationResponseJSON;
      const credential = config.credentials.find((entry) => entry.ownerId === actor.userId && entry.id === response.id);
      if (!credential) throw new Error("Credential is not pinned for this owner");
      const verified = await verifyAuthenticationResponse({
        response, expectedChallenge: challenge, expectedOrigin: config.origin, expectedRPID: origin.hostname,
        credential: { id: credential.id, publicKey: decodeBase64url(credential.publicKey), counter: 0 },
        requireUserVerification: true,
      });
      // Nonces are consumed transactionally by the engine. Counter=0 accommodates synced passkeys;
      // neither a counter nor an identity header is accepted as approval without this signature.
      if (!verified.verified || !verified.authenticationInfo.userVerified) throw new Error("User verification required");
      return { credentialId: credential.id };
    },
  };
}
