import type { DomainDatabase } from "../../domain/context.ts";
import type { McpReadDatabase } from "../read-service.ts";
import { BUSINESS_TABLES } from "./tables.ts";
import { PlanError } from "./types.ts";

export const MCP_METADATA_VERSION = 1 as const;
export type RuntimeMetadata = { installation_id:string; business_revision:number; metadata_version:number };

export async function runtimeMetadata(database:McpReadDatabase):Promise<RuntimeMetadata|null>{
 try{return await database.prepare("SELECT installation_id,business_revision,metadata_version FROM mcp_installation WHERE id=1").first<RuntimeMetadata>();}
 catch{throw new PlanError("migration_required","Falta la migración de metadatos MCP; aplicar el esquema completo.",503);}
}

/** Read-only schema check shared by proposal preparation and explicit credential registration. */
export async function requireRuntimeSchema(database:McpReadDatabase){
 const entries=await database.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','trigger')").all<{name:string}>();
 const names=new Set(entries.results.map(row=>row.name));
 const expected=["mcp_installation","mcp_proposal_heads","mcp_proposals","mcp_approval_challenges","mcp_approvals","mcp_executions","mcp_execution_guards","mcp_plan_audit","mcp_registration_challenges","mcp_prepare_requests","mcp_stage_leases","mcp_approval_evidence",...BUSINESS_TABLES.flatMap(table=>[table.name,`mcp_stage_${table.name}`,...["insert","update","delete"].map(event=>`mcp_revision_${table.name}_${event}`)])];
 if(expected.some(name=>!names.has(name)))throw new PlanError("migration_required","Faltan tablas o triggers del motor; aplicar todas las migraciones.",503);
 await runtimeMetadata(database);
}

/** Only explicit authenticated prepare or enrollment POST calls this. No DDL or business DML. */
export async function initializeRuntimeMetadata(database:DomainDatabase,owner:string,now:number){
 const current=await runtimeMetadata(database);
 if(current?.metadata_version===MCP_METADATA_VERSION)return current;
 if(current&&current.metadata_version!==0)throw new PlanError("metadata_version_unsupported","Versión de metadatos no compatible; no se degrada automáticamente.",503);
 const pending="EXISTS(SELECT 1 FROM mcp_installation WHERE id=1 AND metadata_version=0)";
 await database.batch([
  database.prepare("INSERT OR IGNORE INTO mcp_installation(id,installation_id,business_revision,metadata_version) VALUES(?,?,0,0)").bind(1,crypto.randomUUID().replaceAll("-","")),
  database.prepare(`UPDATE mcp_proposals SET state='INVALIDATED' WHERE state IN ('VALIDATED','PENDING_APPROVAL','APPROVED') AND ${pending}`),
  database.prepare(`DELETE FROM mcp_approvals WHERE ${pending}`),
  database.prepare(`DELETE FROM mcp_approval_challenges WHERE ${pending}`),
  ...BUSINESS_TABLES.map(table=>database.prepare(`DELETE FROM mcp_stage_${table.name} WHERE ${pending}`)),
  database.prepare(`DELETE FROM mcp_stage_leases WHERE ${pending}`),
  database.prepare(`DELETE FROM mcp_execution_guards WHERE ${pending}`),
  database.prepare(`INSERT INTO mcp_plan_audit(id,owner_id,proposal_id,revision,event,created_at,metrics) SELECT ?,?,'system:metadata',0,'metadata_initialized',?,? WHERE ${pending}`).bind(crypto.randomUUID(),owner,now,JSON.stringify({version:MCP_METADATA_VERSION})),
  database.prepare("UPDATE mcp_installation SET metadata_version=? WHERE id=1 AND metadata_version=0").bind(MCP_METADATA_VERSION),
 ]);
 const result=await runtimeMetadata(database);
 if(result?.metadata_version!==MCP_METADATA_VERSION)throw new PlanError("metadata_initialization_failed","No se confirmó la inicialización de metadatos.",503);
 return result;
}

export async function requireRuntimeMetadata(database:McpReadDatabase){
 const info=await runtimeMetadata(database);
 if(info?.metadata_version!==MCP_METADATA_VERSION)throw new PlanError("initialization_required","Inicia el registro de tu autenticador o prepara una propuesta propia para inicializar metadatos; las lecturas no lo hacen.",503);
 return info;
}
