import assert from "node:assert/strict";
import test from "node:test";
import { domainFixture, planAction as a, localReference as ref } from "./helpers/domain.ts";
import { createMcpReadService } from "../lib/mcp/read-service.ts";
const actor={userId:"synthetic-owner",email:"owner@example.test",fullName:"Synthetic owner"};
const date="2026-11-24";

test("ajuste positivo usa centavos, queda separado de ingresos/gastos y su anulación restituye saldo",async()=>{
 const f=domainFixture();try{
  const [account]=await setup(f);
  const made=await f.run([a("adjust","finance.transaction.create",{type:"adjustment",accountId:account,amountMinor:501,occurredOn:date,description:"Synthetic balance adjustment"})]);
  const reads=createMcpReadService(f.database,actor);
  const adjusted=await reads.getAccount({account_id:account,as_of:date}) as {account:{balanceMinor:number}};assert.equal(adjusted.account.balanceMinor,100501);
  const report=await reads.getFinanceReport({group_by:"type",date_from:date,date_to:date}) as {items:{key:string}[];summary:{netCashImpactMinor:number}};
  assert.deepEqual(report.items.map(row=>row.key),["adjustment"]);assert.equal(report.summary.netCashImpactMinor,501);
  await f.run([a("void","finance.transaction.void",{id:made.receipt.results[0].entityId!,reason:"Synthetic adjustment reversal"})]);
  assert.equal((await reads.getAccount({account_id:account,as_of:date}) as {account:{balanceMinor:number}}).account.balanceMinor,100000);
  assert.equal((await reads.getFinanceReport({group_by:"type",date_from:date,date_to:date}) as {summary:{netCashImpactMinor:number}}).summary.netCashImpactMinor,0);
 }finally{f.close();}
});
async function setup(f:ReturnType<typeof domainFixture>) {
 const made=await f.run([a("a","finance.account.create",{name:"Synthetic bank A",type:"bank",bankName:"Synthetic Bank",openingBalanceMinor:100000,openingBalanceDate:date}),a("b","finance.account.create",{name:"Synthetic bank B",type:"bank",bankName:"Synthetic Bank",openingBalanceMinor:0,openingBalanceDate:date}),a("c","finance.category.create",{name:"Synthetic category",kind:"expense"})]);
 return made.receipt.results.map(r=>r.entityId!);
}

test("transferencia propia conserva liquidez y no inventa ingresos/gastos; void restaura saldos",async()=>{
 const f=domainFixture();try{
  const [account,destination]=await setup(f);
  const {plan}=await f.run([a("t","finance.transaction.create",{type:"transfer",accountId:account,destinationAccountId:destination,amountMinor:12345,occurredOn:date,description:"Synthetic own transfer",transferMode:"same_bank"})]);
  assert.equal(plan.payload.financialImpact?.before.liquidMinor,100000);assert.equal(plan.payload.financialImpact?.after.liquidMinor,100000);assert.equal(plan.payload.financialImpact?.accounts.length,2);assert.ok(plan.payload.results[0].effects?.some(e=>e.table==="finance_transactions"));
  const row=f.sqlite.prepare("SELECT * FROM finance_transactions").get()!;assert.equal(row.amount_minor,12345);assert.equal(row.fee_minor,0);
  const reads=createMcpReadService(f.database,actor);
  const report=await reads.getFinanceReport({group_by:"type",date_from:date,date_to:date}) as {summary:{netCashImpactMinor:number}};
  assert.equal(report.summary.netCashImpactMinor,0);
  const balances=await reads.listAccounts({as_of:date,limit:50}) as {items:Array<{balanceMinor:number}>};
  assert.equal(balances.items.reduce((sum,r)=>sum+r.balanceMinor,0),100000);
  await assert.rejects(()=>f.engine.prepareReversal(plan.proposalId,1),{code:"invalid_reversal"});
  await f.run([a("v","finance.transaction.void",{id:String(row.id),reason:"Synthetic reversal"})]);
  const restored=await reads.listAccounts({as_of:date,limit:50}) as {items:Array<{balanceMinor:number}>};
  assert.equal(restored.items.reduce((sum,r)=>sum+r.balanceMinor,0),100000);
 }finally{f.close();}
});

test("gasto consume reserva de meta, actualización y anulación restauran integridad",async()=>{
 const f=domainFixture();try{
  const [account,,category]=await setup(f);
  const made=await f.run([a("g","finance.goal.create",{title:"Synthetic goal",targetMinor:50000,accountId:account,categoryId:category}),a("c","finance.goal.contribute",{goalId:ref("g"),amountMinor:20000,occurredOn:date})]);
  const goal=made.receipt.results[0].entityId!,entry=made.receipt.results[1].entityId!;
  const spent=await f.run([a("e","finance.transaction.create",{type:"expense",accountId:account,amountMinor:12000,occurredOn:date,description:"Synthetic expense",goalId:goal})]);const transaction=spent.receipt.results[0].entityId!;
  assert.equal(f.sqlite.prepare("SELECT reserved_minor FROM finance_goals WHERE id=?").get(goal)?.reserved_minor,8000);
  await assert.rejects(()=>f.engine.prepare([a("r","finance.goal.entry.revert",{id:entry})]));
  await f.run([a("u","finance.transaction.update_amount",{id:transaction,amountMinor:10000})]);
  assert.equal(f.sqlite.prepare("SELECT reserved_minor FROM finance_goals WHERE id=?").get(goal)?.reserved_minor,10000);
  await f.run([a("v","finance.transaction.void",{id:transaction,reason:"Synthetic void"})]);
  assert.equal(f.sqlite.prepare("SELECT reserved_minor FROM finance_goals WHERE id=?").get(goal)?.reserved_minor,20000);
  assert.equal(f.sqlite.prepare("SELECT used_minor FROM finance_goals WHERE id=?").get(goal)?.used_minor,0);
  await f.run([a("u","finance.goal.entry.update",{id:entry,amountMinor:18000}),a("r","finance.goal.entry.revert",{id:entry})]);
  assert.equal(f.sqlite.prepare("SELECT reserved_minor FROM finance_goals WHERE id=?").get(goal)?.reserved_minor,0);
 }finally{f.close();}
});

test("pago parcial, recurrencia y anulación restauran ocurrencia/reserva sin duplicar",async()=>{
 const f=domainFixture();try{
  const [account,,category]=await setup(f);
  const made=await f.run([a("b","finance.budget.set",{month:"2026-11",categoryId:category,assignedMinor:30000}),a("o","finance.obligation.create",{title:"Synthetic obligation",kind:"expense",expectedAmountMinor:10000,reservedMinor:10000,accountId:account,categoryId:category,nextDueDate:date,frequency:"monthly"})]);
  const obligation=made.receipt.results[1].entityId!;const occurrence=String(f.sqlite.prepare("SELECT id FROM finance_obligation_occurrences WHERE obligation_id=?").get(obligation)?.id);
  const partial=await f.run([a("p","finance.obligation.pay",{occurrenceId:occurrence,amountMinor:4000,occurredOn:date})]);
  assert.equal(f.sqlite.prepare("SELECT paid_minor FROM finance_obligation_occurrences WHERE id=?").get(occurrence)?.paid_minor,4000);
  assert.equal(f.sqlite.prepare("SELECT reserved_minor FROM finance_obligations WHERE id=?").get(obligation)?.reserved_minor,6000);
  await f.run([a("p","finance.obligation.pay",{occurrenceId:occurrence,amountMinor:6000,occurredOn:date})]);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM finance_obligation_occurrences WHERE obligation_id=?").get(obligation)?.n,2);
  await assert.rejects(()=>f.engine.prepare([a("p","finance.obligation.pay",{occurrenceId:occurrence,amountMinor:1})]));
  await f.run([a("v","finance.transaction.void",{id:partial.receipt.results[0].entityId!,reason:"Synthetic void"})]);
  assert.equal(f.sqlite.prepare("SELECT paid_minor FROM finance_obligation_occurrences WHERE id=?").get(occurrence)?.paid_minor,6000);
 }finally{f.close();}
});

test("concurrencia de pagos confirma una sola propuesta y reintentos devuelven el recibo",async()=>{
 const f=domainFixture();try{
  const [account,,category]=await setup(f);
  await f.run([a("o","finance.obligation.create",{title:"Synthetic once",kind:"expense",expectedAmountMinor:1000,accountId:account,categoryId:category,nextDueDate:date,frequency:"once"})]);
  const occurrence=String(f.sqlite.prepare("SELECT id FROM finance_obligation_occurrences").get()?.id);
  const plans=await Promise.all([f.engine.prepare([a("p","finance.obligation.pay",{occurrenceId:occurrence,amountMinor:1000})]),f.engine.prepare([a("p","finance.obligation.pay",{occurrenceId:occurrence,amountMinor:1000})])]);
  for(const p of plans){const c=await f.engine.requestApproval(p.proposalId);await f.engine.approve(p.proposalId,c.challenge,c.challenge);}
  const results=await Promise.allSettled(plans.map((p,i)=>f.engine.commit(p.proposalId,1,p.digest,`payment-${i}`)));
  assert.equal(results.filter(r=>r.status==="fulfilled").length,1);assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM finance_transactions").get()?.n,1);
  const index=results.findIndex(r=>r.status==="fulfilled"),p=plans[index];
  const repeated=await f.engine.commit(p.proposalId,1,p.digest,`payment-${index}`);assert.deepEqual(repeated,(results[index] as PromiseFulfilledResult<unknown>).value);
 }finally{f.close();}
});

test("importes fraccionarios, desbordamientos, cuentas ajenas y referencias inválidas no preparan",async()=>{
 const f=domainFixture();try{
  const [account]=await setup(f);
  for(const input of [{amountMinor:0},{amountMinor:1.5},{amountMinor:Number.MAX_SAFE_INTEGER},{amountMinor:100,accountId:"other-owner-account"},{amountMinor:100,taskId:"missing"}]) await assert.rejects(()=>f.engine.prepare([a("e","finance.transaction.create",Object.assign({type:"expense",accountId:account,occurredOn:date,description:"Synthetic invalid"},input))]));
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM finance_transactions").get()?.n,0);
 }finally{f.close();}
});

test("comisiones ACH se redondean en centavos y el reporte refleja la salida real",async()=>{
 const f=domainFixture();try{
  const [account,destination]=await setup(f);
  await f.run([a("s","finance.settings.update",{timezone:"America/Santo_Domingo",safetyBufferMinor:0,transferSameBankRateBps:0,transferAchRateBps:5,transferLbtrSurchargeMinor:100,transferBankFees:{}}),a("u","finance.account.update",{id:destination,name:"Synthetic foreign bank",type:"bank",bankName:"Another Synthetic Bank"})]);
  await f.run([a("t","finance.transaction.create",{type:"transfer",accountId:account,destinationAccountId:destination,amountMinor:12345,occurredOn:date,description:"Synthetic ACH",transferMode:"ach"})]);
  const tx=f.sqlite.prepare("SELECT * FROM finance_transactions").get()!;assert.equal(tx.fee_minor,6);
  const reads=createMcpReadService(f.database,actor);const report=await reads.getFinanceReport({group_by:"type",date_from:date,date_to:date}) as {summary:{netCashImpactMinor:number;feesMinor:number}};
  assert.equal(report.summary.netCashImpactMinor,-6);assert.equal(report.summary.feesMinor,6);
  const balances=await reads.listAccounts({as_of:date,limit:50}) as {items:Array<{balanceMinor:number}>};assert.equal(balances.items.reduce((s,r)=>s+r.balanceMinor,0),99994);
 }finally{f.close();}
});

test("presupuesto y obligación cubiertos no duplican compromisos; fallo del recibo revierte el pago entero",async()=>{
 const f=domainFixture();try{
  const [account,,category]=await setup(f);
  await f.run([a("b","finance.budget.set",{month:"2026-11",categoryId:category,assignedMinor:10000}),a("o","finance.obligation.create",{title:"Synthetic covered",kind:"expense",expectedAmountMinor:10000,reservedMinor:10000,categoryId:category,accountId:account,nextDueDate:date,frequency:"once"})]);
  const reads=createMcpReadService(f.database,actor);const budget=await reads.getBudget({month:"2026-11"}) as {summary:{committedMinor:number}};assert.equal(budget.summary.committedMinor,10000);
  const occurrence=String(f.sqlite.prepare("SELECT id FROM finance_obligation_occurrences").get()?.id);
  const p=await f.engine.prepare([a("p","finance.obligation.pay",{occurrenceId:occurrence,amountMinor:10000})]);const c=await f.engine.requestApproval(p.proposalId);await f.engine.approve(p.proposalId,c.challenge,c.challenge);
  f.failWhen(sql=>sql.startsWith("INSERT INTO mcp_executions"));await assert.rejects(()=>f.engine.commit(p.proposalId,1,p.digest,"fail-payment"));
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM finance_transactions").get()?.n,0);assert.equal(f.sqlite.prepare("SELECT paid_minor FROM finance_obligation_occurrences").get()?.paid_minor,0);
  assert.equal(f.sqlite.prepare("SELECT reserved_minor FROM finance_obligations").get()?.reserved_minor,10000);
  f.failWhen(undefined);await f.engine.commit(p.proposalId,1,p.digest,"fail-payment");
  const after=await reads.getBudget({month:"2026-11"}) as {summary:{committedMinor:number}};assert.equal(after.summary.committedMinor,0);
 }finally{f.close();}
});

test("actualización de catálogos/presupuestos/metas y movimientos de tarea conserva la paridad",async()=>{
 const f=domainFixture();try{
  const [,zero,category]=await setup(f);
  const initial=await f.run([a("b","finance.budget.addition.create",{month:"2026-11",categoryId:category,concept:"Synthetic addition",assignedMinor:1000}),a("g","finance.goal.create",{title:"Synthetic goal",targetMinor:10000,categoryId:category}),a("t","task.create",{title:"Synthetic task"}),a("m","task.movement.create",{taskId:ref("t"),amountMinor:123,description:"Synthetic legacy"})]);
  const [budget,goal,,movement]=initial.receipt.results.map(r=>r.entityId!);
  await f.run([a("c","finance.category.update",{id:category,name:"Synthetic revised category",kind:"expense",color:"#112233"}),a("b","finance.budget.update",{id:budget,month:"2026-12",categoryId:category,assignedMinor:2000,concept:"Synthetic revised",allocationType:"additional"}),a("g","finance.goal.update",{id:goal,title:"Synthetic revised goal",targetMinor:20000,categoryId:category}),a("a","finance.account.archive",{id:zero})]);
  assert.equal(f.sqlite.prepare("SELECT month FROM finance_budgets WHERE id=?").get(budget)?.month,"2026-12");
  assert.equal(f.sqlite.prepare("SELECT archived FROM finance_accounts WHERE id=?").get(zero)?.archived,1);
  await assert.rejects(()=>f.engine.prepare([a("c","finance.category.delete",{id:category})]));
  await f.run([a("b","finance.budget.delete",{id:budget}),a("m","task.movement.delete",{id:movement})]);
  const temp=await f.run([a("c","finance.category.create",{name:"Synthetic unused",kind:"expense"})]);
  await f.run([a("d","finance.category.delete",{id:temp.receipt.results[0].entityId!})]);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM home_movements").get()?.n,0);
 }finally{f.close();}
});

test("obligación de ingreso se actualiza y registra cobro sin reserva de gasto",async()=>{
 const f=domainFixture();try{
  const [account]=await setup(f);const made=await f.run([a("o","finance.obligation.create",{title:"Synthetic income",kind:"income",expectedAmountMinor:1000,frequency:"once",nextDueDate:date,accountId:account})]);const obligation=made.receipt.results[0].entityId!;
  await f.run([a("u","finance.obligation.update",{id:obligation,title:"Synthetic updated income",kind:"income",expectedAmountMinor:1200,frequency:"once",nextDueDate:date,accountId:account})]);
  const occurrence=String(f.sqlite.prepare("SELECT id FROM finance_obligation_occurrences WHERE obligation_id=?").get(obligation)?.id);
  await f.run([a("p","finance.obligation.pay",{occurrenceId:occurrence,amountMinor:1200})]);
  assert.equal(f.sqlite.prepare("SELECT type,amount_minor FROM finance_transactions").get()?.type,"income");
  const budget=await createMcpReadService(f.database,actor).getBudget({month:"2026-11"}) as {summary:{incomeReceivedMinor:number;incomeRemainingMinor:number}};assert.equal(budget.summary.incomeReceivedMinor,1200);assert.equal(budget.summary.incomeRemainingMinor,0);
 }finally{f.close();}
});
