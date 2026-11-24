import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("QA que escribe/restaura rechaza destinos remotos antes de abrir una conexión",()=>{
 for(const target of ["https://example.test","https://127.0.0.1.example.test","https://localhost@example.test"]){const result=spawnSync(process.execPath,[fileURLToPath(new URL("../scripts/qa-v2.mjs",import.meta.url))],{env:{...process.env,QA_BASE_URL:target},encoding:"utf8"});assert.notEqual(result.status,0);assert.match(result.stderr,/solo permite loopback/);assert.doesNotMatch(result.stdout,/PASS/);}
});
