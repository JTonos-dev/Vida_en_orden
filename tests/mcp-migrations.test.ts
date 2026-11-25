import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync,readdirSync } from "node:fs";
import { is } from "drizzle-orm";
import { SQLiteTable, getTableConfig } from "drizzle-orm/sqlite-core";
import * as schema from "../db/schema.ts";
import { testDatabase } from "./helpers/d1.ts";
import { BUSINESS_TABLES } from "../lib/mcp/plans/tables.ts";
import { HOUSEHOLD_SCOPE } from "../lib/data-scopes.ts";

test("schema ORM, manifiesto de negocio y journal cubren todas las migraciones/tablas",()=>{
 const f=testDatabase();try{
  const actual=f.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r=>String(r.name));
  const declared=Object.values(schema).filter(value=>is(value,SQLiteTable)).map(table=>getTableConfig(table));
  assert.deepEqual(actual.sort(),declared.map(table=>table.name).sort());
  for(const table of declared){const columns=f.sqlite.prepare(`PRAGMA table_info(${table.name})`).all().map(row=>({name:String(row.name),type:String(row.type).toLowerCase()}));assert.deepEqual(columns.sort((a,b)=>a.name.localeCompare(b.name)),table.columns.map(column=>({name:column.name,type:column.getSQLType()})).sort((a,b)=>a.name.localeCompare(b.name)),table.name);}
  assert.deepEqual(actual.filter(name=>!name.startsWith("mcp_")).sort(),BUSINESS_TABLES.map(t=>t.name).sort());
  const snapshot=readdirSync(new URL("../drizzle/meta/",import.meta.url)).filter(file=>/^\d{4}_snapshot\.json$/.test(file)).sort().at(-1)!;
  const latest=JSON.parse(readFileSync(new URL(`../drizzle/meta/${snapshot}`,import.meta.url),"utf8")) as {tables:Record<string,{columns:Record<string,{default?:string|number}>}>};
  for(const table of declared)for(const column of f.sqlite.prepare(`PRAGMA table_info(${table.name})`).all()){const expected=latest.tables[table.name].columns[String(column.name)].default;assert.equal(String(column.dflt_value??""),String(expected??""),`${table.name}.${column.name} default`);}
  const journal=JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json",import.meta.url),"utf8")) as {entries:{idx:number;tag:string}[]};
  assert.deepEqual(journal.entries.map(entry=>entry.tag+".sql"),f.migrations);assert.deepEqual(journal.entries.map(entry=>entry.idx),f.migrations.map((_,index)=>index));
 }finally{f.close();}
});

test("upgrade 0009→0010 conserva negocio/revisión e invalida solo metadatos anteriores",()=>{
 const f=testDatabase(9);try{
  f.sqlite.prepare("INSERT INTO home_tasks(id,user_id,title,created_at,updated_at) VALUES(?,?,?,?,?)").run("synthetic-upgrade",HOUSEHOLD_SCOPE,"Synthetic preserved task","2026-11-24","2026-11-24");
  f.sqlite.prepare("INSERT INTO mcp_stage_home_tasks SELECT 'synthetic-stage',t.* FROM home_tasks t").run();
  f.sqlite.prepare("INSERT INTO mcp_proposal_heads VALUES('synthetic-old','synthetic-owner',1)").run();
  f.sqlite.prepare("INSERT INTO mcp_proposals VALUES('synthetic-old',1,'synthetic-owner','APPROVED',?,'{}',1,9999999999999,1)").run("0".repeat(64));
  f.sqlite.prepare("INSERT INTO mcp_approvals VALUES('synthetic-old',1,'synthetic-owner',?,'synthetic-challenge','synthetic-key',9999999999999,1)").run("0".repeat(64));
  const rows=JSON.stringify(f.sqlite.prepare("SELECT * FROM home_tasks").all()),revision=f.sqlite.prepare("SELECT business_revision FROM mcp_installation").get()?.business_revision;
  f.sqlite.exec(readFileSync(new URL("../drizzle/0010_mcp_hardening.sql",import.meta.url),"utf8"));
  assert.equal(JSON.stringify(f.sqlite.prepare("SELECT * FROM home_tasks").all()),rows);assert.equal(f.sqlite.prepare("SELECT business_revision FROM mcp_installation").get()?.business_revision,revision);
  assert.equal(f.sqlite.prepare("SELECT state FROM mcp_proposals").get()?.state,"INVALIDATED");assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_approvals").get()?.n,0);assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_stage_home_tasks").get()?.n,0);
 }finally{f.close();}
});
