import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { auditPublicSource } from "./public-source-audit.mjs";
import { sitesMigrationProjection } from "./sites-migration-projection.mjs";
import { inspectHostingMigrations } from "./hosting-migration-audit.mjs";

const root=realpathSync(resolve(dirname(fileURLToPath(import.meta.url)),".."));
const target=process.argv[2];
if(process.argv.length!==3||!target||!isAbsolute(target))throw Error("Provide an absolute, new empty directory inside this repository's work folder.");
const work=join(root,"work");mkdirSync(work,{recursive:true});
const location=resolve(target),within=relative(realpathSync(work),location);
if(!within||within===".."||within.startsWith(".."+sep)||isAbsolute(within)||existsSync(location))throw Error("The export must be a new directory inside work; existing source is never overwritten.");
if(realpathSync(dirname(location))!==realpathSync(work))throw Error("Use a new direct child of work, without symlinked parent directories.");
const git=args=>execFileSync("git",args,{cwd:root,encoding:"utf8"});
if(git(["status","--porcelain","--untracked-files=normal"]).trim())throw Error("Commit/review the public source before exporting it.");
const sourceCommit=git(["rev-parse","HEAD"]).trim();if(!/^[a-f0-9]{40}$/.test(sourceCommit))throw Error("Expected a pinned Git commit.");
if(git(["ls-tree","-r","--format=%(objectmode)",sourceCommit]).split(/\r?\n/).includes("120000"))throw Error("Site templates must not include symlinks.");
if(auditPublicSource(root).findings.length)throw Error("Public source audit failed; no source exported.");
const scratch=mkdtempSync(join(tmpdir(),"veo-sites-source-"));
try{
 const archive=join(scratch,"source.tar");execFileSync("git",["archive","--format=tar","--output",archive,sourceCommit],{cwd:root});
 mkdirSync(location);execFileSync("tar",["-xf",archive,"-C",location],{cwd:root});
 if(existsSync(join(location,".git")))throw Error("Git metadata must not be exported.");
 const projected=sitesMigrationProjection(join(location,"drizzle"));
 for(const migration of projected)if(migration.removed.length)writeFileSync(join(location,"drizzle",migration.file),migration.sql);
 const hosting=join(location,".openai/hosting.json"),manifest=JSON.parse(readFileSync(hosting,"utf8"));manifest.project_id=null;writeFileSync(hosting,JSON.stringify(manifest,null,2)+"\n");
 const report={sourceCommit,mode:"schema-only-sites-projection",freshInstallationOnly:true,migrations:projected.map(migration=>({file:migration.file,originalSha256:migration.originalSha256,projectedSha256:migration.projectedSha256,removed:migration.removed}))};
 writeFileSync(join(location,".openai/sites-migration-projection.json"),JSON.stringify(report,null,2)+"\n");
 const gate=inspectHostingMigrations(join(location,"drizzle"));if(gate.findings.length)throw Error("Projection failed the schema-only gate.");
 console.log(JSON.stringify({sourceCommit,template:realpathSync(location),sqlFiles:projected.length,deferredMetadataStatements:projected.reduce((sum,item)=>sum+item.removed.length,0),schemaOnly:true,backendVerified:false}));
}finally{
 const absolute=resolve(scratch);if(!absolute.startsWith(resolve(tmpdir())+sep)||!absolute.includes("veo-sites-source-"))throw Error("Unsafe temporary path");
 rmSync(absolute,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
