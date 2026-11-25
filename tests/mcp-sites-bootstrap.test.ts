import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { projectSitesMigration } from "../scripts/sites-migration-projection.mjs";
import { inspectHostingMigration } from "../scripts/hosting-migration-audit.mjs";
import { testDatabase } from "./helpers/d1.ts";
import { ProposalEngine } from "../lib/mcp/plans/engine.ts";
import { actionRegistry } from "../lib/mcp/plans/catalog.ts";
import { initializeRuntimeMetadata } from "../lib/mcp/plans/metadata.ts";
import { callExtendedTool } from "../lib/mcp/plans/extended-tools.ts";
import { HOUSEHOLD_SCOPE } from "../lib/data-scopes.ts";
import { credentialEnrollment } from "../lib/mcp/plans/enrollment.ts";
import { handleEnrollmentRequest } from "../lib/mcp/plans/enrollment-http.ts";
import { credential } from "./helpers/webauthn.ts";
const actor={userId:"synthetic-owner",email:"owner@example.test",fullName:"Synthetic owner"};
const verifier={channel:"isolated-test" as const,async verify(proof:unknown,challenge:string){if(proof!==challenge)throw Error("denied");return {credentialId:"test-key"};}};
const project=(file:string,sql:string)=>projectSitesMigration(file,sql).sql;
const plan=[{actionId:"t",kind:"task.create",input:{title:"Synthetic projected proposal"}}];
const engine=(database:D1Database)=>new ProposalEngine(database,{actor,registry:actionRegistry,verifier,executionEnabled:false});

test("regresión: inscripción humana funciona antes de preparar la primera propuesta en Sites",async()=>{
 const f=testDatabase(Infinity,project),origin="https://approval.example.test",url=origin+"/api/mcp/enrollment";
 const identity={"oai-authenticated-user-id":actor.userId,"oai-authenticated-user-email":actor.email};
 const deps={database:f.database,ownerPolicy:{ownerUserId:actor.userId},origin};
 try{
  const get=await handleEnrollmentRequest(new Request(url,{headers:identity}),deps),session=await get.json() as {csrfToken:string};
  const headers={...identity,"content-type":"application/json",origin,cookie:get.headers.get("set-cookie")!.split(";")[0],"x-veo-csrf":session.csrfToken};
  const post=(body:unknown,extra:Record<string,string>={})=>handleEnrollmentRequest(new Request(url,{method:"POST",headers:{...headers,...extra},body:JSON.stringify(body)}),deps);
  assert.equal((await engine(f.database).health()).metadataReady,false);
  assert.equal((await post({action:"options"},{"x-veo-csrf":"bad"})).status,403);
  assert.equal((await post({action:"options"},{"oai-authenticated-user-id":"other"})).status,403);
  assert.equal((await post({action:"options",confirmed:true})).status,400);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_installation").get()?.n,0);
  const response=await post({action:"options"});assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
  const options=await response.json() as {publicKey:{challenge:string;user:{id:string}}};
  const candidate=await post({action:"candidate",challenge:options.publicKey.challenge,proof:credential(actor.userId,origin).registration(options.publicKey.challenge)});
  assert.equal(candidate.status,200);assert.equal((await candidate.json() as {trusted:boolean}).trusted,false);
  const installation=f.sqlite.prepare("SELECT * FROM mcp_installation").get();assert.equal(installation?.metadata_version,1);
  const again=await post({action:"options"});assert.equal(again.status,200);
  assert.equal((await again.json() as {publicKey:{user:{id:string}}}).publicKey.user.id,options.publicKey.user.id);
  await engine(f.database).prepare(plan);
  assert.equal(f.sqlite.prepare("SELECT installation_id FROM mcp_installation").get()?.installation_id,installation?.installation_id);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_plan_audit WHERE event='metadata_initialized'").get()?.n,1);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM home_tasks").get()?.n,0);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_approvals").get()?.n,0);
 }finally{f.close();}
});

test("proyección Sites conserva esquema/triggers y bytes de 0000–0007, sin ejecutar DML de metadatos",()=>{
 const full=testDatabase(),sites=testDatabase(Infinity,project);try{
  const schema=(db:typeof full)=>db.sqlite.prepare("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all().map(row=>({...row,sql:String(row.sql).replace(/\s+/g," ").trim()}));
  assert.deepEqual(schema(sites),schema(full));
  assert.equal(sites.sqlite.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='trigger'").get()?.n,54);
  assert.equal(sites.sqlite.prepare("SELECT COUNT(*) n FROM mcp_installation").get()?.n,0);
  for(const file of full.migrations){const source=readFileSync(new URL(`../drizzle/${file}`,import.meta.url),"utf8"),result=projectSitesMigration(file,source);assert.deepEqual(inspectHostingMigration(result.sql),[]);if(Number(file.slice(0,4))<=7)assert.equal(result.sql,source);}
  assert.throws(()=>projectSitesMigration("0010_mcp_hardening.sql","DELETE FROM finance_transactions;"),/unsupported data/);
  assert.throws(()=>projectSitesMigration("0010_mcp_hardening.sql","UPDATE mcp_proposals SET payload='{}';"),/unsupported data/);
  assert.deepEqual(inspectHostingMigration("CREATE TABLE seeded AS SELECT 1 value;").map(row=>row.operation),["CREATE"]);
 }finally{full.close();sites.close();}
});

test("registro inicial no oculta un esquema incompleto ni degrada metadatos futuros",async()=>{
 const f=testDatabase(Infinity,project),origin="https://approval.example.test";try{
  assert.throws(()=>credentialEnrollment(f.database,{...actor,userId:""},origin),{code:"missing_identity"});
  f.sqlite.exec("DROP TRIGGER mcp_revision_home_tasks_insert");
  await assert.rejects(()=>credentialEnrollment(f.database,actor,origin).options(),{code:"migration_required"});
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_installation").get()?.n,0);
 }finally{f.close();}
 const future=testDatabase();try{
  future.sqlite.exec("UPDATE mcp_installation SET metadata_version=2");
  await assert.rejects(()=>credentialEnrollment(future.database,actor,origin).options(),{code:"metadata_version_unsupported"});
  assert.equal(future.sqlite.prepare("SELECT metadata_version FROM mcp_installation").get()?.metadata_version,2);
  assert.equal(future.sqlite.prepare("SELECT COUNT(*) n FROM mcp_registration_challenges").get()?.n,0);
 }finally{future.close();}
});

test("fallo del bootstrap de registro revierte identidad y no produce desafío ni negocio",async()=>{
 const f=testDatabase(Infinity,project);try{
  f.failWhen(sql=>sql.includes("metadata_initialized"));
  await assert.rejects(()=>credentialEnrollment(f.database,actor,"https://approval.example.test").options());
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_installation").get()?.n,0);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_registration_challenges").get()?.n,0);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM home_tasks").get()?.n,0);
 }finally{f.close();}
});

test("salud/lecturas no inicializan; preparación autenticada inicializa una vez sin negocio",async()=>{
 const f=testDatabase(Infinity,project),p=engine(f.database);try{
  assert.equal((await p.health()).metadataReady,false);
  await assert.rejects(()=>callExtendedTool("get_financial_integrity_report",{month:"2026-11"},f.database,actor),{code:"initialization_required"});
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_installation").get()?.n,0);
  const proposals=await Promise.all(Array.from({length:20},(_,i)=>p.prepare(plan,"synthetic-init-"+i)));
  assert.equal(new Set(proposals.map(row=>row.payload.installationId)).size,1);
  assert.ok(proposals.every(row=>row.payload.metadataVersion===1));
  assert.equal((await p.health()).metadataReady,true);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_plan_audit WHERE event='metadata_initialized'").get()?.n,1);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM home_tasks").get()?.n,0);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_proposals").get()?.n,20);
  assert.equal((await callExtendedTool("get_financial_integrity_report",{month:"2026-11"},f.database,actor) as {status:string}).status,"consistent");
 }finally{f.close();}
});

test("bootstrap atómico conserva negocio, revisión, identidad y recibos; invalida metadatos antiguos",async()=>{
 const f=testDatabase();try{
  f.sqlite.prepare("INSERT INTO home_tasks(id,user_id,title,created_at,updated_at) VALUES(?,?,?,?,?)").run("legacy-task",HOUSEHOLD_SCOPE,"Synthetic preserved","2026-11-24","2026-11-24");
  f.sqlite.prepare("INSERT INTO mcp_stage_home_tasks SELECT 'legacy-stage',t.* FROM home_tasks t").run();
  f.sqlite.prepare("INSERT INTO mcp_proposal_heads VALUES('legacy-plan',?,1)").run(actor.userId);
  f.sqlite.prepare("INSERT INTO mcp_proposals VALUES('legacy-plan',1,?,'APPROVED',?,'{}',1,9999999999999,1)").run(actor.userId,"0".repeat(64));
  f.sqlite.prepare("INSERT INTO mcp_executions VALUES('legacy-receipt','legacy-plan',1,?,'synthetic-key','{}',1)").run(actor.userId);
  const before=f.sqlite.prepare("SELECT * FROM mcp_installation").get(),rows=JSON.stringify(f.sqlite.prepare("SELECT * FROM home_tasks").all());
  f.failWhen(sql=>sql.includes("metadata_initialized"));await assert.rejects(()=>initializeRuntimeMetadata(f.database,actor.userId,1));f.failWhen();
  assert.equal(f.sqlite.prepare("SELECT state FROM mcp_proposals").get()?.state,"APPROVED");
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_stage_home_tasks").get()?.n,1);
  const ready=await initializeRuntimeMetadata(f.database,actor.userId,2);
  assert.equal(ready.installation_id,before?.installation_id);assert.equal(ready.business_revision,before?.business_revision);
  assert.equal(JSON.stringify(f.sqlite.prepare("SELECT * FROM home_tasks").all()),rows);
  assert.equal(f.sqlite.prepare("SELECT state FROM mcp_proposals").get()?.state,"INVALIDATED");
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_stage_home_tasks").get()?.n,0);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_executions").get()?.n,1);
  await initializeRuntimeMetadata(f.database,actor.userId,3);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM mcp_plan_audit WHERE event='metadata_initialized'").get()?.n,1);
 }finally{f.close();}
});

test("no degrada metadatos futuros ni aprueba una propuesta del contrato anterior",async()=>{
 const f=testDatabase(Infinity,project),p=engine(f.database);try{
  const prepared=await p.prepare(plan);
  const legacy={...prepared.payload};delete legacy.metadataVersion;
  f.sqlite.prepare("UPDATE mcp_proposals SET payload=? WHERE proposal_id=?").run(JSON.stringify(legacy),prepared.proposalId);
  await assert.rejects(()=>p.requestApproval(prepared.proposalId),{code:"proposal_version_unsupported"});
  f.sqlite.prepare("UPDATE mcp_installation SET metadata_version=2").run();
  await assert.rejects(()=>p.prepare(plan),{code:"metadata_version_unsupported"});
  assert.equal(f.sqlite.prepare("SELECT metadata_version FROM mcp_installation").get()?.metadata_version,2);
 }finally{f.close();}
});
