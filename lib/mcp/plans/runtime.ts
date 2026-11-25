import { z } from "zod";
import { ProposalEngine } from "./engine.ts";
import { actionRegistry } from "./catalog.ts";
import { webAuthnVerifier, type PinnedCredential } from "./approval.ts";
import { MCP_BUSINESS_WRITES_ENABLED } from "../future-contracts.ts";
import type { McpIdentity } from "../auth.ts";
import { PlanError } from "./types.ts";
export type ProposalEnvironment={MCP_PROPOSALS_ENABLED?:string;MCP_APPROVAL_ORIGIN?:string;MCP_APPROVAL_CREDENTIALS?:string;};
const pins=z.array(z.object({ownerId:z.string().min(1).max(200),id:z.string().regex(/^[A-Za-z0-9_-]+$/).max(2048),publicKey:z.string().regex(/^[A-Za-z0-9_-]+$/).max(8192)}).strict()).max(5);
export function approvalConfiguration(environment:ProposalEnvironment):{origin:string;credentials:PinnedCredential[]}{
 if(environment.MCP_PROPOSALS_ENABLED!=="true")throw new PlanError("proposals_disabled","Las propuestas están deshabilitadas.",503);
 const origin=environment.MCP_APPROVAL_ORIGIN||"";
 try{const url=new URL(origin);if(url.protocol!=="https:"||url.origin!==origin)throw Error("origin");}catch{throw new PlanError("approval_unavailable","Configura un origen HTTPS exacto de aprobación.",503);}
 let credentials:PinnedCredential[];try{credentials=pins.parse(JSON.parse(environment.MCP_APPROVAL_CREDENTIALS||"[]"));}catch{throw new PlanError("approval_unavailable","La configuración administrativa de credenciales no es válida.",503);}
 return {origin,credentials};
}
export function runtimeProposalEngine(database:D1Database,actor:McpIdentity,environment:ProposalEnvironment){
 const config=approvalConfiguration(environment);
 return new ProposalEngine(database,{actor,registry:actionRegistry,verifier:webAuthnVerifier(config),executionEnabled:MCP_BUSINESS_WRITES_ENABLED});
}
