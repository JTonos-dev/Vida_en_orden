import assert from "node:assert/strict";
import test from "node:test";
import { testDatabase } from "./helpers/d1.ts";
import { ProposalEngine } from "../lib/mcp/plans/engine.ts";
import { actionRegistry } from "../lib/mcp/plans/catalog.ts";
import type { PlanAction, ApprovalVerifier } from "../lib/mcp/plans/types.ts";
const actor = { userId: "synthetic-owner", email: "owner@example.test", fullName: "Synthetic owner" };
const verifier: ApprovalVerifier = { channel: "isolated-test", async verify(proof,challenge) { if (proof !== challenge) throw Error("not human fixture"); return { credentialId: "test-key" }; } };
export function domainFixture() {
  const db = testDatabase();
  const engine = new ProposalEngine(db.database, { actor, registry: actionRegistry, verifier, executionEnabled: true, now: () => new Date("2026-11-24T14:00:00Z") });
  const run = async (actions: PlanAction[]) => { const plan = await engine.prepare(actions); const challenge = await engine.requestApproval(plan.proposalId); await engine.approve(plan.proposalId,challenge.challenge,challenge.challenge); return { plan, receipt: await engine.commit(plan.proposalId,plan.revision,plan.digest,crypto.randomUUID()) }; };
  return { ...db, engine, run };
}
const a = (actionId: string,kind: string,input: Record<string,unknown>): PlanAction => ({ actionId,kind,input });
const ref = (name: string) => ({ $ref: name });

test("catálogo no financiero cerrado y sin restauraciones, SQL ni privilegios", () => {
  assert.equal(actionRegistry.size,19);
  for (const definition of actionRegistry.values()) {
    assert.equal(definition.inputSchema?.additionalProperties,false);
    assert.equal(definition.schema.safeParse({ userId: "other", confirmed: true }).success,false);
  }
  for (const kind of ["importBackup","backup.restoreV2","execute_sql","approve","area.delete"]) assert.equal(actionRegistry.has(kind),false);
});

test("área, proyecto, tarea, subtarea, evento y bitácora usan referencias locales y un solo commit", async () => {
  const f=domainFixture();
  try {
    const {receipt}=await f.run([
      a("area","area.create",{name:"Synthetic area"}),
      a("project","project.create",{name:"Synthetic project",areaId:ref("area")}),
      a("parent","task.create",{title:"Synthetic parent",areaId:ref("area"),projectId:ref("project")}),
      a("child","task.create",{title:"Synthetic child",parentId:ref("parent")}),
      a("note","journal.create",{taskId:ref("child"),text:"Synthetic note"}),
      a("event","event.create",{title:"Synthetic event",startDate:"2026-11-25",allDay:true,linkedTaskId:ref("child"),projectId:ref("project")}),
    ]);
    const ids=Object.fromEntries(receipt.results.map((r)=>[r.actionId,r.entityId]));
    assert.equal(f.sqlite.prepare("SELECT parent_id FROM home_tasks WHERE id=?").get(ids.child!)?.parent_id,ids.parent);
    assert.equal(f.sqlite.prepare("SELECT linked_task_id FROM calendar_events WHERE id=?").get(ids.event!)?.linked_task_id,ids.child);
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM home_tasks").get()?.n,2);
    assert.equal(f.sqlite.prepare("SELECT text FROM home_notes WHERE id=?").get(ids.note!)?.text,"Synthetic note");
  } finally { f.close(); }
});

test("tarea completa/reabre ancestros, duplica, ordena, archiva y revierte archivado", async()=>{
  const f=domainFixture();
  try {
    const created=await f.run([a("p","task.create",{title:"Synthetic parent"}),a("c","task.create",{title:"Synthetic child",parentId:ref("p")})]);
    const [p,c]=created.receipt.results.map(r=>r.entityId!);
    await assert.rejects(()=>f.engine.prepare([a("p","task.complete",{id:p,done:true})]));
    await f.run([a("c","task.complete",{id:c,done:true})]);
    assert.equal(f.sqlite.prepare("SELECT done FROM home_tasks WHERE id=?").get(p)?.done,1);
    await f.run([a("c","task.complete",{id:c,done:false}),a("dup","task.duplicate",{id:c}),a("archive","task.archive",{id:c,archived:true})]);
    assert.equal(f.sqlite.prepare("SELECT done FROM home_tasks WHERE id=?").get(p)?.done,0);
    await f.run([a("order","task.reorder",{ids:[c,p]}),a("restore","task.archive",{id:c,archived:false}),a("rename","task.update",{id:c,title:"Synthetic renamed"})]);
    const task=f.sqlite.prepare("SELECT title,archived,order_index FROM home_tasks WHERE id=?").get(c);
    assert.equal(task?.title,"Synthetic renamed"); assert.equal(task?.archived,0); assert.equal(task?.order_index,0);
  } finally { f.close(); }
});

test("referencias inválidas, ciclos, fechas, duplicados y propietarios fallan sin efectos",async()=>{
  const f=domainFixture();
  try {
    const created=await f.run([a("t","task.create",{title:"Synthetic task"})]); const id=created.receipt.results[0].entityId!;
    for (const actions of [
      [a("x","task.update",{id,parentId:id})],
      [a("x","task.update",{id,dependencies:[id]})],
      [a("x","task.create",{title:"bad",projectId:"missing"})],
      [a("x","event.create",{title:"bad",startDate:"2026-02-30"})],
      [a("x","task.reorder",{ids:[id,id]})],
      [a("x","task.create",{title:"bad",parentId:ref("later")})],
      [a("x","task.create",{title:"bad",owner_id:"other"})],
    ]) await assert.rejects(()=>f.engine.prepare(actions));
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM home_tasks").get()?.n,1);
  } finally { f.close(); }
});

test("editar/eliminar bitácora, cancelar evento y borrar subtareas mantienen referencias",async()=>{
  const f=domainFixture();
  try {
    const made=await f.run([a("t","task.create",{title:"Synthetic task"}),a("n","journal.create",{taskId:ref("t"),text:"Before"}),a("e","event.create",{title:"Synthetic event",startDate:"2026-11-25",allDay:true})]);
    const [task,note,event]=made.receipt.results.map(r=>r.entityId!);
    await f.run([a("n","journal.update",{id:note,text:"After"}),a("e","event.cancel",{id:event})]);
    assert.equal(f.sqlite.prepare("SELECT text FROM home_notes WHERE id=?").get(note)?.text,"After");
    assert.equal(f.sqlite.prepare("SELECT status FROM calendar_events WHERE id=?").get(event)?.status,"cancelled");
    await f.run([a("n","journal.delete",{id:note}),a("t","task.delete",{id:task})]);
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM home_tasks").get()?.n,0);
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM home_notes").get()?.n,0);
  } finally { f.close(); }
});

test("reversión no financiera calcula un nuevo diff y exige otra aprobación",async()=>{
  const f=domainFixture();
  try {
    const {plan}=await f.run([a("t","task.create",{title:"Synthetic reversal"}),a("n","journal.create",{taskId:ref("t"),text:"Synthetic note"})]);
    const inverse=await f.engine.prepareReversal(plan.proposalId,plan.revision);
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM home_tasks").get()?.n,1);
    await assert.rejects(()=>f.engine.commit(inverse.proposalId,1,inverse.digest,"inverse"));
    const challenge=await f.engine.requestApproval(inverse.proposalId); await f.engine.approve(inverse.proposalId,challenge.challenge,challenge.challenge);
    await f.engine.commit(inverse.proposalId,1,inverse.digest,"inverse");
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM home_tasks").get()?.n,0);
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM home_notes").get()?.n,0);
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM audit_log WHERE action='committed'").get()?.n,2);
    await assert.rejects(()=>f.engine.prepareReversal(plan.proposalId,plan.revision),{code:"stale_reversal"});
  } finally { f.close(); }
});

test("actualiza área/proyecto/evento/contexto y configuración sin omitir el diff",async()=>{
  const f=domainFixture();
  try {
    const result=await f.run([a("area","area.create",{name:"A"}),a("project","project.create",{name:"P",areaId:ref("area")}),a("task","task.create",{title:"T"}),a("event","event.create",{title:"E",startDate:"2026-11-25",allDay:true})]);
    const [area,project,task,event]=result.receipt.results.map(r=>r.entityId!);
    await f.run([a("a","area.update",{id:area,name:"A2",color:"#112233"}),a("p","project.update",{id:project,name:"P2",areaId:area,status:"paused"}),a("t","task.context",{id:task,areaId:area,projectId:project,scheduledStartTime:"10:00",scheduledEndTime:"11:00"}),a("e","event.update",{id:event,title:"E2",startDate:"2026-11-26",allDay:true,status:"scheduled"}),a("w","workspace.update",{budgetLimit:10000,sort:"priority"})]);
    assert.equal(f.sqlite.prepare("SELECT name FROM home_areas WHERE id=?").get(area)?.name,"A2");
    assert.equal(f.sqlite.prepare("SELECT status FROM home_projects WHERE id=?").get(project)?.status,"paused");
    assert.equal(f.sqlite.prepare("SELECT project_id FROM home_tasks WHERE id=?").get(task)?.project_id,project);
    assert.equal(f.sqlite.prepare("SELECT title FROM calendar_events WHERE id=?").get(event)?.title,"E2");
  } finally { f.close(); }
});
