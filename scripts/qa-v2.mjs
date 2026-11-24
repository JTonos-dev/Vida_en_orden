const base = process.env.QA_BASE_URL || "http://127.0.0.1:4173";
const get = async () => {
  const response = await fetch(`${base}/api/state`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `GET ${response.status}`);
  return data;
};
const post = async (action, payload = {}, expected = 200) => {
  const response = await fetch(`${base}/api/action`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
  const data = await response.json();
  if (response.status !== expected) throw new Error(`${action}: esperaba ${expected}, recibió ${response.status}: ${data.error || ""}`);
  return data;
};
const check = (condition, message) => { if (!condition) throw new Error(message); console.log(`PASS · ${message}`); };
const pesos = (value) => Math.round(value * 100);

const original = await get();
const backup = { version: 2, exportedAt: new Date().toISOString(), ...original };
const stamp = Date.now().toString(36);

try {
  let state = await post("createTask", { title: `QA madre ${stamp}`, priority: "P++", effort: "alta", startDate: "2026-11-18", scheduledDate: "2026-11-20", dueDate: "2026-11-30", estimate: "30000" });
  const parent = state.tasks.find((x) => x.title === `QA madre ${stamp}`);
  check(Boolean(parent), "crea una tarea con intervalo y estimado");
  state = await post("createTask", { title: `QA hija ${stamp}`, parentId: parent.id, scheduledDate: "2026-11-20", scheduledStartTime: "09:00", scheduledEndTime: "10:00" });
  const child = state.tasks.find((x) => x.title === `QA hija ${stamp}`);
  check(child?.parentId === parent.id, "conserva la jerarquía recursiva");
  await post("setDone", { id: parent.id, done: true, completedAt: "2026-11-18" }, 400);
  console.log("PASS · impide completar la tarea madre con subtareas pendientes");
  state = await post("setDone", { id: child.id, done: true, completedAt: "2026-11-18" });
  check(state.tasks.find((x) => x.id === parent.id)?.done === true, "propaga el completado hacia la tarea madre");

  state = await post("area.create", { name: `QA Hogar ${stamp}`, color: "#2463eb" });
  const area = state.areas.find((x) => x.name === `QA Hogar ${stamp}`);
  state = await post("project.create", { name: `QA Proyecto ${stamp}`, areaId: area.id, startDate: "2026-11-18", targetDate: "2027-01-01", budgetMinor: pesos(35000) });
  const project = state.projects.find((x) => x.name === `QA Proyecto ${stamp}`);
  state = await post("task.context", { id: parent.id, areaId: area.id, projectId: project.id, scheduledStartTime: "09:00", scheduledEndTime: "11:00" });
  check(state.tasks.find((x) => x.id === parent.id)?.projectId === project.id, "asigna área, proyecto y horario a una tarea");

  state = await post("event.create", { title: `QA Evento ${stamp}`, startDate: "2026-11-20", endDate: "2026-11-20", allDay: false, startTime: "09:30", endTime: "10:30", recurrence: "weekly", recurrenceUntil: "2026-12-31", projectId: project.id, timezone: "America/Santo_Domingo" });
  check(state.events.some((x) => x.title === `QA Evento ${stamp}` && x.recurrence === "weekly"), "crea un evento recurrente con horario");

  state = await post("finance.account.create", { name: `QA Banco A ${stamp}`, type: "bank", bankName: "Banco QA", openingBalanceMinor: pesos(1000), openingBalanceDate: "2026-11-18" });
  const accountA = state.finance.accounts.find((x) => x.name === `QA Banco A ${stamp}`);
  state = await post("finance.account.create", { name: `QA Banco B ${stamp}`, type: "savings", bankName: "Banco QA", openingBalanceMinor: pesos(500), openingBalanceDate: "2026-11-18" });
  const accountB = state.finance.accounts.find((x) => x.name === `QA Banco B ${stamp}`);
  const baseLiquid = state.finance.summary.liquidMinor;
  state = await post("finance.transaction.create", { type: "transfer", accountId: accountA.id, destinationAccountId: accountB.id, transferMode: "same_bank", amountMinor: pesos(200), occurredOn: "2026-11-18", status: "confirmed", description: "QA transferencia" });
  check(state.finance.summary.liquidMinor === baseLiquid, "una transferencia no altera el patrimonio total");

  state = await post("finance.transaction.create", { type: "income", accountId: accountA.id, amountMinor: pesos(5000), occurredOn: "2026-12-20", status: "confirmed", description: "QA ingreso futuro" });
  check(state.finance.summary.liquidMinor === baseLiquid, "un ingreso futuro no está disponible hoy");
  check(state.finance.cashflow.some((x) => x.date === "2026-12-20" && x.changeMinor >= pesos(5000)), "el ingreso futuro aparece en la proyección");

  const homeCategory = state.finance.categories.find((x) => x.kind === "expense" && x.name === "Hogar") || state.finance.categories.find((x) => x.kind === "expense");
  state = await post("finance.transaction.create", { type: "expense", accountId: accountA.id, amountMinor: pesos(300), occurredOn: "2026-11-18", status: "confirmed", categoryId: homeCategory.id, taskId: parent.id, projectId: project.id, description: "QA gasto vinculado" });
  check(state.finance.taskSpend[parent.id] === pesos(300), "el gasto vinculado se refleja una sola vez en la tarea");
  check(state.tasks.find((x) => x.id === parent.id)?.estimate === 30000, "el estimado permanece separado del gasto real");
  check(state.projects.find((x) => x.id === project.id)?.spentMinor === pesos(300), "el mismo movimiento alimenta el gasto del proyecto sin duplicarse");

  state = await post("finance.budget.set", { month: "2026-11", categoryId: homeCategory.id, assignedMinor: pesos(400) });
  check(state.finance.summary.budgetRemainingMinor >= pesos(100), "el presupuesto mensual descuenta sólo gastos confirmados del mes");
  state = await post("finance.goal.create", { title: `QA Meta ${stamp}`, targetMinor: pesos(1000), targetDate: "2027-02-01", priority: "alta", categoryId: homeCategory.id, linkedTaskId: parent.id, linkedProjectId: project.id });
  const goal = state.finance.goals.find((x) => x.title === `QA Meta ${stamp}`);
  state = await post("finance.goal.contribute", { goalId: goal.id, amountMinor: pesos(100), occurredOn: "2026-11-18", note: "QA aporte" });
  check(state.finance.goals.find((x) => x.id === goal.id)?.reservedMinor === pesos(100), "la meta registra reservas sin crear un gasto");
  check(state.finance.budgets.find((x) => x.month === "2026-11" && x.categoryId === homeCategory.id)?.goalAllocatedMinor >= pesos(100), "el aporte amplía automáticamente el presupuesto del mes");
  const goalEntry = state.finance.goalEntries.find((x) => x.goalId === goal.id && !x.voidedAt);
  state = await post("finance.goal.entry.update", { id: goalEntry.id, amountMinor: pesos(90) });
  check(state.finance.goals.find((x) => x.id === goal.id)?.reservedMinor === pesos(90), "permite reducir un aporte no utilizado");
  state = await post("finance.goal.update", { id: goal.id, title: `QA Meta editada ${stamp}`, targetMinor: pesos(900), targetDate: "2027-03-01", priority: "media", categoryId: homeCategory.id, linkedTaskId: parent.id, linkedProjectId: project.id });
  check(state.finance.goals.find((x) => x.id === goal.id)?.targetMinor === pesos(900), "edita la meta sin romper sus aportes");
  state = await post("finance.transaction.create", { type: "expense", accountId: accountA.id, amountMinor: pesos(50), occurredOn: "2026-11-18", categoryId: homeCategory.id, paymentMethod: "transfer", counterpartyBank: "Banco QA", transferMode: "same_bank", goalId: goal.id, description: "QA gasto desde meta" });
  const goalExpense = state.finance.transactions.find((x) => x.description === "QA gasto desde meta");
  check(state.finance.goals.find((x) => x.id === goal.id)?.reservedMinor === pesos(40), "el gasto consume automáticamente la reserva vinculada");
  state = await post("finance.transaction.void", { id: goalExpense.id, reason: "QA reversión" });
  check(state.finance.goals.find((x) => x.id === goal.id)?.reservedMinor === pesos(90), "anular el gasto restaura la reserva de la meta");
  state = await post("finance.budget.addition.create", { month: "2026-11", categoryId: homeCategory.id, concept: "QA adicional", assignedMinor: pesos(25) });
  check(state.finance.budgetAllocations.some((x) => x.concept === "QA adicional" && x.allocationType === "additional"), "registra adicionales presupuestarios por concepto");

  state = await post("finance.obligation.create", { title: `QA Servicio ${stamp}`, kind: "expense", expectedAmountMinor: pesos(200), reservedMinor: pesos(50), accountId: accountA.id, categoryId: homeCategory.id, frequency: "monthly", nextDueDate: "2026-11-25" });
  const obligation = state.finance.obligations.find((x) => x.title === `QA Servicio ${stamp}`);
  const occurrence = state.finance.occurrences.find((x) => x.obligationId === obligation.id);
  state = await post("finance.obligation.pay", { occurrenceId: occurrence.id, accountId: accountA.id, amountMinor: pesos(200), occurredOn: "2026-11-18" });
  check(state.finance.occurrences.some((x) => x.obligationId === obligation.id && x.status === "paid"), "el vencimiento conserva su pago individual");
  check(state.finance.occurrences.some((x) => x.obligationId === obligation.id && x.status === "pending" && x.dueDate > occurrence.dueDate), "la recurrencia genera el próximo vencimiento");

  const testBackup = { version: 2, exportedAt: new Date().toISOString(), ...state };
  await post("createTask", { title: `QA temporal ${stamp}` });
  state = await post("backup.restore", { data: testBackup });
  check(!state.tasks.some((x) => x.title === `QA temporal ${stamp}`), "la restauración integral reemplaza los cambios posteriores");
  check(state.finance.taskSpend[parent.id] === pesos(300), "la restauración recalcula saldos y vínculos financieros");
} finally {
  await post("backup.restore", { data: backup });
  console.log("PASS · restaura el estado local previo a las pruebas");
}

console.log("QA V2 COMPLETADO");
