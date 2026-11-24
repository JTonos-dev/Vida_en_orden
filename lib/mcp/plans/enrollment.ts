import { generateRegistrationOptions, verifyRegistrationResponse, type RegistrationResponseJSON } from "@simplewebauthn/server";
import type { DomainDatabase } from "../../domain/context.ts";
import type { McpIdentity } from "../auth.ts";
import { PlanError } from "./types.ts";
export function credentialEnrollment(database:DomainDatabase,actor:McpIdentity,origin:string,now=()=>Date.now()){
 const url=new URL(origin);if(url.protocol!=="https:"||url.origin!==origin)throw new PlanError("origin_mismatch","Se requiere el origen HTTPS exacto.",403);
 return {
  async options(){
   const installation=await database.prepare("SELECT installation_id FROM mcp_installation WHERE id=1").first<{installation_id:string}>();if(!installation)throw new PlanError("migration_required","Falta migrar la base MCP.",503);
   const userID=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(`vida-en-orden/credential/${installation.installation_id}/${actor.userId}`)));
   const options=await generateRegistrationOptions({rpName:"Vida en Orden",rpID:url.hostname,userID,userName:actor.email,userDisplayName:actor.fullName||actor.email,attestationType:"none",supportedAlgorithmIDs:[-7,-257],authenticatorSelection:{residentKey:"preferred",userVerification:"required"},timeout:60000});
   await database.batch([database.prepare("DELETE FROM mcp_registration_challenges WHERE owner_id=? OR expires_at<=?").bind(actor.userId,now()),database.prepare("INSERT INTO mcp_registration_challenges(challenge,owner_id,expires_at,used) VALUES(?,?,?,0)").bind(options.challenge,actor.userId,now()+5*60000)]);
   return options;
  },
  async candidate(challenge:string,proof:unknown){
   const nonce=await database.prepare("SELECT challenge FROM mcp_registration_challenges WHERE challenge=? AND owner_id=? AND expires_at>? AND used=0").bind(challenge,actor.userId,now()).first();if(!nonce)throw new PlanError("invalid_enrollment","Solicitud vencida o consumida.",403);
   let result;try{result=await verifyRegistrationResponse({response:proof as RegistrationResponseJSON,expectedChallenge:challenge,expectedOrigin:origin,expectedRPID:url.hostname,requireUserVerification:true});}catch{throw new PlanError("invalid_enrollment","No se verificó el autenticador.",403);}
   if(!result.verified||!result.registrationInfo.userVerified)throw new PlanError("invalid_enrollment","Se requiere verificación del usuario.",403);
   const guard=crypto.randomUUID();await database.batch([database.prepare("INSERT INTO mcp_execution_guards(execution_id,valid) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM mcp_registration_challenges WHERE challenge=? AND owner_id=? AND expires_at>? AND used=0) THEN 1 ELSE 0 END").bind(guard,challenge,actor.userId,now()),database.prepare("UPDATE mcp_registration_challenges SET used=1 WHERE challenge=? AND owner_id=?").bind(challenge,actor.userId),database.prepare("DELETE FROM mcp_execution_guards WHERE execution_id=?").bind(guard)]);
   const credential=result.registrationInfo.credential;
   const publicKey=btoa(String.fromCharCode(...credential.publicKey)).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
   // Candidate only. No key is trusted, enrolled in approval config, or used to enable writes here.
   return {candidate:{ownerId:actor.userId,id:credential.id,publicKey},trusted:false,businessWritesEnabled:false,instructions:"Solo el administrador puede fijar la credencial que creó personalmente. Este candidato no autoriza propuestas."};
  },
 };
}
