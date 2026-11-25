import assert from "node:assert/strict";
import { mkdtempSync, cpSync, readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const root=resolve(dirname(fileURLToPath(import.meta.url)),".."),temp=mkdtempSync(join(tmpdir(),"veo-schema-check-"));
try{
 const mirror=join(temp,"drizzle"),config=join(temp,"drizzle.config.ts");cpSync(join(root,"drizzle"),mirror,{recursive:true});
 writeFileSync(config,`export default ${JSON.stringify({out:mirror.replaceAll("\\","/"),schema:"./db/schema.ts",dialect:"sqlite"})};\n`);
 const before=readdirSync(mirror).filter(name=>name.endsWith(".sql")).sort();
 try { execFileSync(process.execPath,[join(root,"node_modules/drizzle-kit/bin.cjs"),"generate","--config",config],{cwd:root,stdio:"pipe"}); } catch(error) { process.stderr.write(error.stdout?.toString()||error.message);throw new Error("Schema generation failed in isolated verification"); }
 assert.deepEqual(readdirSync(mirror).filter(name=>name.endsWith(".sql")).sort(),before,"ORM/snapshot drift would generate an unreviewed migration");
 const original=JSON.parse(readFileSync(join(root,"drizzle/meta/_journal.json"),"utf8"));const generated=JSON.parse(readFileSync(join(mirror,"meta/_journal.json"),"utf8"));assert.deepEqual(generated,original);
 console.log("Schema verified: Drizzle generated no changes in an isolated copy. No migration was applied.");
}finally{const target=resolve(temp);assert.ok(target.startsWith(resolve(tmpdir())+sep)&&target.includes("veo-schema-check-"));rmSync(target,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
