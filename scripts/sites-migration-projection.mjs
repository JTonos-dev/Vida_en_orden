import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { hostingStatements } from "./hosting-migration-audit.mjs";
import { BUSINESS_TABLES } from "../lib/mcp/plans/tables.ts";

const hash=value=>createHash("sha256").update(value).digest("hex");
const stageTables=new Set(BUSINESS_TABLES.map(table=>"mcp_stage_"+table.name));

/** A fresh Sites schema projection; original/released SQL is never changed. */
export function projectSitesMigration(file,source){
 const statements=hostingStatements(source),removed=[];
 for(const statement of statements.filter(item=>!item.schemaOnly)){
  const clean=statement.sql.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/,"").trim();
  const table=clean.match(/^(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([a-z_]+)\b/i)?.[1];
  const normalized=clean.replace(/\s+/g,"").replace(/;$/,"").toLowerCase();
  const allowed=file==="0008_mcp_proposal_engine.sql"&&normalized==="insertintomcp_installation(id,installation_id)values(1,lower(hex(randomblob(16))))"||file==="0010_mcp_hardening.sql"&&(normalized==="updatemcp_proposalssetstate='invalidated'wherestatein('validated','pending_approval','approved')"||statement.operation==="DELETE"&&(table==="mcp_approvals"||stageTables.has(table))&&normalized===`deletefrom${table}`);
  if(!allowed)throw Error(`Migration ${file}, statement ${statement.statement}: unsupported data operation; requires a reviewed adapter.`);
  removed.push({statement:statement.statement,operation:statement.operation,table});
 }
 const sql=removed.length?statements.filter(item=>item.schemaOnly).map(item=>item.sql.trim().replace(/;\s*$/,"" )+";").join("\n--> statement-breakpoint\n")+"\n":source;
 return {sql,originalSha256:hash(source),projectedSha256:hash(sql),removed};
}

export function sitesMigrationProjection(directory){
 const files=readdirSync(directory).filter(file=>/^\d{4}_.+\.sql$/.test(file)).sort();
 return files.map(file=>({file,...projectSitesMigration(file,readFileSync(join(directory,file),"utf8"))}));
}
