import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { getPlatformProxy, unstable_splitSqlQuery } from "wrangler";
import { ProposalEngine } from "../lib/mcp/plans/engine.ts";
import { actionRegistry } from "../lib/mcp/plans/catalog.ts";
import type { PlatformProxy } from "wrangler";

test("D1 local de workerd: migraciones, aprobación, idempotencia y rollback real de batch",async()=>{
 const root=mkdtempSync(join(tmpdir(),"veo-d1-runtime-")),config=join(root,"wrangler.json");let proxy:PlatformProxy<{DB:D1Database}>|undefined;
 try{
  writeFileSync(config,JSON.stringify({name:"veo-isolated-runtime",compatibility_date:"2026-05-15",compatibility_flags:["nodejs_compat"],d1_databases:[{binding:"DB",database_name:"synthetic-db",database_id:"00000000-0000-4000-8000-000000000000"}]}));
  proxy=await getPlatformProxy<{DB:D1Database}>({configPath:config,envFiles:[],persist:false,remoteBindings:false});const db=proxy.env.DB;
  const files=readdirSync(new URL("../drizzle/",import.meta.url)).filter(file=>/^\d{4}.*\.sql$/.test(file)).sort();
  for(const file of files){const statements=unstable_splitSqlQuery(readFileSync(new URL("../drizzle/"+file,import.meta.url),"utf8"));await db.batch(statements.map(sql=>db.prepare(sql)));}
  const actor={userId:"synthetic-runtime-owner",email:"owner@example.test",fullName:null};
  const engine=new ProposalEngine(db,{actor,registry:actionRegistry,executionEnabled:true,verifier:{channel:"isolated-test",async verify(proof,challenge){if(proof!==challenge)throw Error("Test denied");return {credentialId:"synthetic-key"};}}});
  const actions=[{actionId:"t",kind:"task.create",input:{title:"Synthetic runtime task"}}];
  const approve=async(id:string)=>{const c=await engine.requestApproval(id);await engine.approve(id,c.challenge,c.challenge);};
  const p=await engine.prepare(actions);assert.equal((await db.prepare("SELECT COUNT(*) n FROM home_tasks").first<{n:number}>())?.n,0);await approve(p.proposalId);
  const receipt=await engine.commit(p.proposalId,1,p.digest,"one");assert.deepEqual(await engine.commit(p.proposalId,1,p.digest,"one"),receipt);
  const next=await engine.prepare(actions);await approve(next.proposalId);
  await db.exec("CREATE TRIGGER synthetic_receipt_failure BEFORE INSERT ON mcp_executions BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;");
  await assert.rejects(()=>engine.commit(next.proposalId,1,next.digest,"two"));assert.equal((await db.prepare("SELECT COUNT(*) n FROM home_tasks").first<{n:number}>())?.n,1);assert.equal((await engine.get(next.proposalId)).state,"APPROVED");
  await db.exec("DROP TRIGGER synthetic_receipt_failure;");await engine.commit(next.proposalId,1,next.digest,"two");assert.equal((await db.prepare("SELECT COUNT(*) n FROM home_tasks").first<{n:number}>())?.n,2);
  assert.equal((await engine.verifyExecution(next.proposalId,1)).stillMatches,true);
 }finally{
  await proxy?.dispose();const target=resolve(root);assert.ok(target.startsWith(resolve(tmpdir())+sep)&&target.includes("veo-d1-runtime-"));rmSync(target,{recursive:true,force:true,maxRetries:5,retryDelay:100});
 }
});
