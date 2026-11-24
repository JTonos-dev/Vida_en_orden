"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ActionFn, AppData, FinanceBudgetAllocation, FinanceGoal, FinanceTransaction } from "@/lib/app-types";
import { ConceptInput } from "@/components/concept-input";
import { Modal, dateLabel, localToday, money } from "@/components/v2-modules";

const minor = (value: string) => Math.round((Number(value) || 0) * 100);
const Empty = ({ children }: { children: React.ReactNode }) => <div className="empty compactEmpty">{children}</div>;
const MiniProgress = ({ value, tone = "blue" }: { value: number; tone?: string }) => <div className="progress"><span className={tone} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;

export function BudgetPanel({ data, act, month, setMonth, newCategory, manageCategories, assignBudget, openTransaction, newTransaction }: {
  data: AppData; act: ActionFn; month: string; setMonth: (month: string) => void; newCategory: () => void; manageCategories: () => void; assignBudget: () => void; openTransaction: (transaction: FinanceTransaction) => void; newTransaction: (categoryId: string, concept?: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [editing, setEditing] = useState<FinanceBudgetAllocation | null>(null);
  const categories = data.finance.categories.filter((item) => item.kind === "expense");
  const rowFor = (id: string) => data.finance.budgets.find((item) => item.month === month && item.categoryId === id);
  // Una partida sólo es útil en la vista mensual si tiene actividad real:
  // presupuesto, obligación, aporte a meta o gasto reportado.
  const visibleCategories = categories.filter((category) => {
    const row = rowFor(category.id);
    return !!row && (
      row.effectiveAssignedMinor > 0 ||
      row.spentMinor > 0 ||
      row.obligationPlannedMinor > 0 ||
      row.goalAllocatedMinor > 0 ||
      row.manualAssignedMinor > 0
    );
  });
  const selected = categories.find((item) => item.id === selectedId);
  const allocations = data.finance.budgetAllocations.filter((item) => item.month === month && item.categoryId === selectedId);
  const goalEntries = data.finance.goalEntries.filter((entry) => !entry.voidedAt && entry.occurredOn.startsWith(month));
  const goalsThisMonth = goalEntries.flatMap((entry) => {
    const goal = data.finance.goals.find((item) => item.id === entry.goalId);
    return goal ? [{ entry, goal }] : [];
  });
  const selectedGoals = goalsThisMonth.filter(({ goal }) => goal.categoryId === selectedId);
  const selectedObligations = data.finance.occurrences.flatMap((occurrence) => {
    const obligation = data.finance.obligations.find((item) => item.id === occurrence.obligationId);
    return obligation?.kind === "expense" && obligation.categoryId === selectedId && occurrence.dueDate.startsWith(month) ? [{ occurrence, obligation }] : [];
  });
  const categoryTransactions = useMemo(() => data.finance.transactions
    .filter((transaction) => transaction.status === "confirmed" && transaction.occurredOn.startsWith(month))
    .flatMap((transaction) => {
      const isExpense = transaction.type === "expense" && transaction.categoryId === selectedId;
      const isFee = transaction.feeMinor > 0 && (transaction.feeCategoryId || (transaction.type === "transfer" ? transaction.categoryId : null)) === selectedId;
      if (!isExpense && !isFee) return [];
      return [{
        transaction,
        label: isExpense ? transaction.description || "Gasto" : `Comisión · ${transaction.description || "Transferencia"}`,
        amount: (isExpense ? transaction.amountMinor : 0) + (isFee ? transaction.feeMinor : 0),
        isFeeOnly: !isExpense,
      }];
    })
    .sort((a, b) => b.transaction.occurredOn.localeCompare(a.transaction.occurredOn) || b.amount - a.amount), [data.finance.transactions, month, selectedId]);
  const reset = () => { setConcept(""); setAmount(""); setEditing(null); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    if (editing) await act("finance.budget.update", { id: editing.id, month, categoryId: selected.id, concept, assignedMinor: minor(amount), allocationType: editing.allocationType });
    else await act("finance.budget.addition.create", { month, categoryId: selected.id, concept, assignedMinor: minor(amount) });
    reset();
  };
  const openEdit = (item: FinanceBudgetAllocation) => { setEditing(item); setConcept(item.concept); setAmount(String(item.assignedMinor / 100)); };
  const addTo = (name: string) => { setEditing(null); setConcept(name); setAmount(""); };
  const monthLabel = new Date(`${month}-01T12:00:00`).toLocaleDateString("es-DO", { month: "long", year: "numeric" });
  if (selected) {
    const row = rowFor(selected.id);
    const budgeted = [
      ...allocations.map((item) => ({ id: `manual-${item.id}`, concept: item.concept, amount: item.assignedMinor, source: item.allocationType === "base" ? "Base manual" : "Adicional", allocation: item })),
      ...selectedObligations.map(({ occurrence, obligation }) => ({ id: `obligation-${occurrence.id}`, concept: obligation.title, amount: occurrence.expectedMinor, source: "Obligación", allocation: null })),
      ...selectedGoals.map(({ entry, goal }) => ({ id: `goal-${entry.id}`, concept: goal.title, amount: entry.amountMinor, source: "Meta", allocation: null })),
    ];
    return <section className="panel budgetDetail">
      <div className="panelHead"><div><button className="backButton" onClick={() => { setSelectedId(null); reset(); }}>‹ Presupuesto</button><h2>{selected.name} · {monthLabel}</h2><p className="soft">La base cubre obligaciones sin duplicarlas; los adicionales y aportes a metas amplían el presupuesto.</p></div><input aria-label="Mes del presupuesto" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
      <div className="budgetDetailMetrics"><div><span>Presupuesto efectivo</span><b>{money(row?.effectiveAssignedMinor || 0)}</b></div><div><span>Gastos reportados</span><b>{money(row?.spentMinor || 0)}</b></div><div><span>Metas del mes</span><b>{money(row?.goalAllocatedMinor || 0)}</b></div><div><span>Disponible</span><b>{money(row?.remainingMinor || 0)}</b></div></div>
      <div className="budgetSplit"><div><h3>Conceptos presupuestados</h3>{budgeted.length ? budgeted.map((item) => <div className="conceptRow" key={item.id}><span><b>{item.concept}</b><small>{item.source}</small></span><strong>{money(item.amount)}</strong><div>{item.allocation && <button onClick={() => openEdit(item.allocation!)}>Editar</button>}<button onClick={() => newTransaction(selected.id, item.concept)}>Gasto</button><button onClick={() => addTo(item.concept)}>＋ Adicional</button>{item.allocation && <button className="textDanger" onClick={() => window.confirm("¿Eliminar esta asignación?") && act("finance.budget.delete", { id: item.allocation!.id })}>Eliminar</button>}</div></div>) : <Empty>Esta partida aún no tiene conceptos presupuestados.</Empty>}</div>
        <div><div className="categoryExpenseHead"><h3>Gastos registrados</h3><button className="primary" onClick={() => newTransaction(selected.id)}>＋ Registrar gasto</button></div>{categoryTransactions.length ? <div className="categoryExpenseList">{categoryTransactions.map((item) => <button className="categoryExpenseRow" key={`${item.transaction.id}-${item.isFeeOnly ? "fee" : "amount"}`} onClick={() => openTransaction(item.transaction)}><span><b>{item.label}</b><small>{dateLabel(item.transaction.occurredOn)} · {item.isFeeOnly ? "Cargo bancario" : item.transaction.obligationOccurrenceId ? "Gasto de obligación" : "Movimiento confirmado"}{item.transaction.feeMinor > 0 && !item.isFeeOnly ? ` · incluye ${money(item.transaction.feeMinor)} de cargo` : ""}</small></span><strong>{money(item.amount)}</strong><i>›</i></button>)}</div> : <Empty>No hay gastos reportados en esta partida.</Empty>}</div></div>
      <form className="form budgetAdditionForm" onSubmit={submit}><h3>{editing ? `Editar ${editing.concept}` : "Añadir presupuesto por concepto"}</h3><div className="formgrid"><ConceptInput concepts={data.finance.concepts} name="budgetConcept" value={concept} onChange={(e) => setConcept(e.target.value)} required placeholder="Concepto del adicional" /><label>Importe adicional RD$*<input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></label></div><div className="formActions">{editing && <button type="button" onClick={reset}>Cancelar edición</button>}<button className="primary">{editing ? "Guardar cambios" : "Añadir a esta partida"}</button></div></form>
    </section>;
  }
  const income = data.finance.incomeBudgets.filter((item) => item.month === month);
  return <section className="panel"><div className="panelHead"><div><h2>Presupuesto de {monthLabel}</h2><p className="soft">Abre una partida para ver sus conceptos presupuestados y sus gastos reportados.</p></div><div className="buttonRow"><input aria-label="Mes del presupuesto" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /><button className="primary" onClick={assignBudget}>＋ Asignar presupuesto</button><button onClick={newCategory}>Nueva categoría</button><button onClick={manageCategories}>Gestionar categorías</button></div></div>
    <div className="budgetCategoryList">{visibleCategories.map((category) => { const row = rowFor(category.id)!; const total = row.effectiveAssignedMinor || 0; const used = row.spentMinor + row.goalAllocatedMinor; return <button className="budgetCategory budgetCategoryButton" onClick={() => setSelectedId(category.id)} key={category.id}><i style={{ background: category.color }} /><div><b>{category.name}</b><span>{money(row.spentMinor)} gastado · {money(row.goalAllocatedMinor)} a metas · {money(row.remainingMinor)} disponible</span><MiniProgress value={total ? used / total * 100 : 0} tone={used > total ? "red" : "blue"} /><small className="budgetSources">Base: {money(row.manualBaseMinor)} · Obligaciones: {money(row.obligationPlannedMinor)} · Adicionales: {money(row.manualAdditionalMinor)} · Metas: {money(row.goalAllocatedMinor)}</small></div><strong>{money(total)}<small>presupuesto efectivo</small></strong></button>; })}</div>
    {visibleCategories.length === 0 && goalsThisMonth.length === 0 && income.length === 0 && <Empty>No hay partidas con presupuesto, obligaciones, metas o gastos reportados para este mes.</Empty>}
    {goalsThisMonth.length > 0 && <div className="incomeBudgetSection goalBudgetSection"><div className="panelHead"><div><h3>Metas</h3><p className="soft">Aportes realizados en este mes e incorporados automáticamente al presupuesto.</p></div></div>{goalsThisMonth.map(({ entry, goal }) => { const category = categories.find((item) => item.id === goal.categoryId); return <div className="budgetCategory" key={entry.id}><i style={{ background: category?.color || "#1e8397" }} /><div><b>{goal.title}</b><span>{category?.name || "Metas"} · aporte del {dateLabel(entry.occurredOn)}</span><small className="budgetSources">Concepto: {entry.concept || goal.title}</small></div><strong>{money(entry.amountMinor)}<small>aporte a meta</small></strong></div>; })}</div>}
    {income.length > 0 && <div className="incomeBudgetSection"><div className="panelHead"><div><h3>Ingresos previstos</h3><p className="soft">Los ingresos recurrentes se incorporan automáticamente.</p></div></div>{income.map((item) => <div className="budgetCategory incomeBudgetCategory" key={item.id}><i style={{ background: "#21835a" }} /><div><b>{item.title}</b><span>Recibido {money(item.receivedMinor)} · pendiente {money(item.remainingMinor)}</span></div><strong>{money(item.expectedMinor)}<small>ingreso esperado</small></strong></div>)}</div>}
  </section>;
}

export function BudgetAssignmentModal({ data, act, month, close }: { data: AppData; act: ActionFn; month: string; close: () => void }) {
  const categories = data.finance.categories.filter((item) => item.kind === "expense");
  const [form, setForm] = useState({ month, categoryId: categories[0]?.id || "", concept: "", amount: "" });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await act("finance.budget.set", { month: form.month, categoryId: form.categoryId, concept: form.concept, assignedMinor: minor(form.amount) });
    close();
  };
  return <Modal title="Asignar presupuesto" onClose={close}><form className="form" onSubmit={submit}><div className="formgrid"><label>Mes*<input required type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></label><label>Partida*<select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></div><ConceptInput concepts={data.finance.concepts} name="budgetAssignmentConcept" value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} required placeholder="Concepto de la asignación" /><label>Importe asignado RD$*<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label><div className="infoBox"><b>Asignación base</b><span>Esta asignación hará visible la partida en el mes seleccionado. Si ya existe una base para esa partida, se actualizará su importe y concepto.</span></div><div className="formActions"><button type="button" onClick={close}>Cancelar</button><button className="primary">Guardar asignación</button></div></form></Modal>;
}

export function GoalsPanel({ data, act, onNew }: { data: AppData; act: ActionFn; onNew: () => void }) {
  const [contribution, setContribution] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [manageId, setManageId] = useState<string | null>(null);
  const managedGoal = data.finance.goals.find((item) => item.id === manageId) || null;
  return <section className="panel"><div className="panelHead"><div><h2>Metas de ahorro</h2><p className="soft">Los aportes amplían el presupuesto del mes y la reserva se consume al vincular el gasto real.</p></div><button className="primary" onClick={onNew}>＋ Meta</button></div>{data.finance.goals.length ? <div className="goalGrid">{data.finance.goals.map((goal) => { const funded = goal.reservedMinor + goal.usedMinor, pct = goal.targetMinor ? funded / goal.targetMinor * 100 : 0; return <article className="goalCard" key={goal.id}><div className="goalTop"><span className={`status ${goal.status}`}>{goal.status === "completed" ? "Completada" : goal.status === "funded" ? "Financiada" : "Activa"}</span><small>{goal.targetDate ? dateLabel(goal.targetDate) : "Sin fecha objetivo"}</small></div><h3>{goal.title}</h3><strong>{money(goal.reservedMinor)}<small> disponible · {money(goal.usedMinor)} utilizado</small></strong><MiniProgress value={pct} tone={pct >= 100 ? "green" : "purple"} /><div className="goalFooter"><span>{Math.round(pct)}% · faltan {money(Math.max(0, goal.targetMinor - funded))}</span><div className="buttonRow"><button onClick={() => setManageId(goal.id)}>Gestionar</button>{goal.status !== "completed" && (contribution === goal.id ? <div className="payInline"><input autoFocus type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /><button className="primary" onClick={async () => { await act("finance.goal.contribute", { goalId: goal.id, amountMinor: minor(amount), occurredOn: localToday(), note: "Aporte" }); setContribution(null); setAmount(""); }}>Aportar</button></div> : <button onClick={() => setContribution(goal.id)}>Añadir reserva</button>)}</div></div></article>; })}</div> : <Empty>Crea una meta para separar dinero destinado a una compra o proyecto.</Empty>}{managedGoal && <GoalManager goal={managedGoal} data={data} act={act} close={() => setManageId(null)} />}</section>;
}

function goalFormState(goal?: FinanceGoal) { return { title: goal?.title || "", target: goal ? String(goal.targetMinor / 100) : "", targetDate: goal?.targetDate || "", priority: goal?.priority || "media", accountId: goal?.accountId || "", categoryId: goal?.categoryId || "", linkedTaskId: goal?.linkedTaskId || "", linkedProjectId: goal?.linkedProjectId || "" }; }

export function GoalFormModal({ data, act, close }: { data: AppData; act: ActionFn; close: () => void }) {
  const metas = data.finance.categories.find((item) => item.kind === "expense" && item.name === "Metas");
  const [form, setForm] = useState({ ...goalFormState(), categoryId: metas?.id || data.finance.categories.find((item) => item.kind === "expense")?.id || "" });
  return <GoalEditForm title="Nueva meta de ahorro" form={form} setForm={setForm} data={data} close={close} submit={async () => { await act("finance.goal.create", { ...form, targetMinor: minor(form.target) }); close(); }} />;
}

function GoalManager({ goal, data, act, close }: { goal: FinanceGoal; data: AppData; act: ActionFn; close: () => void }) {
  const [form, setForm] = useState(goalFormState(goal));
  const [editEntry, setEditEntry] = useState<string | null>(null);
  const [entryAmount, setEntryAmount] = useState("");
  const entries = data.finance.goalEntries.filter((item) => item.goalId === goal.id);
  const used = data.finance.transactions.filter((item) => item.goalId === goal.id && item.status === "confirmed" && item.goalReservationConsumedMinor > 0);
  return <Modal title={`Gestionar · ${goal.title}`} onClose={close} wide><GoalEditForm embedded title="Datos de la meta" form={form} setForm={setForm} data={data} close={close} submit={async () => { await act("finance.goal.update", { id: goal.id, ...form, targetMinor: minor(form.target) }); close(); }} /><hr /><h3>Historial de aportes</h3>{entries.length ? entries.map((entry) => <div className={`conceptRow ${entry.voidedAt ? "voided" : ""}`} key={entry.id}><span><b>{entry.concept || goal.title}</b><small>{dateLabel(entry.occurredOn)}{entry.voidedAt ? " · Revertido" : ""}</small></span>{editEntry === entry.id ? <div className="payInline"><input type="number" min="0.01" step="0.01" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} /><button className="primary" onClick={async () => { await act("finance.goal.entry.update", { id: entry.id, amountMinor: minor(entryAmount) }); setEditEntry(null); }}>Guardar</button><button onClick={() => setEditEntry(null)}>×</button></div> : <><strong>{money(entry.amountMinor)}</strong>{!entry.voidedAt && <div><button onClick={() => { setEditEntry(entry.id); setEntryAmount(String(entry.amountMinor / 100)); }}>Editar</button><button className="textDanger" onClick={() => window.confirm("¿Revertir este aporte? La operación quedará en el historial.") && act("finance.goal.entry.revert", { id: entry.id })}>Revertir</button></div>}</>}</div>) : <Empty>Esta meta todavía no tiene aportes.</Empty>}{used.length > 0 && <><h3>Reserva aplicada a gastos</h3>{used.map((item) => <div className="conceptRow" key={item.id}><span><b>{item.description}</b><small>{dateLabel(item.occurredOn)} · Movimiento confirmado</small></span><strong>{money(item.goalReservationConsumedMinor)}</strong></div>)}</>}</Modal>;
}

function GoalEditForm({ title, form, setForm, data, close, submit, embedded = false }: { title: string; form: ReturnType<typeof goalFormState>; setForm: (value: ReturnType<typeof goalFormState>) => void; data: AppData; close: () => void; submit: () => Promise<void>; embedded?: boolean }) {
  const categories = data.finance.categories.filter((item) => item.kind === "expense");
  const content = <form className="form" onSubmit={async (event) => { event.preventDefault(); await submit(); }}><h3>{title}</h3><label>Nombre*<input required autoFocus={!embedded} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><div className="formgrid"><label>Objetivo RD$*<input required type="number" min="0.01" step="0.01" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></label><label>Fecha objetivo<input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></label></div><div className="formgrid"><label>Prioridad<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></label><label>Categoría presupuestaria*<select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></div><div className="formgrid"><label>Vincular a tarea<select value={form.linkedTaskId} onChange={(e) => setForm({ ...form, linkedTaskId: e.target.value })}><option value="">Sin tarea</option>{data.tasks.filter((item) => !item.archived).map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><label>Vincular a proyecto<select value={form.linkedProjectId} onChange={(e) => setForm({ ...form, linkedProjectId: e.target.value })}><option value="">Sin proyecto</option>{data.projects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></div><label>Cuenta de referencia<select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}><option value="">Sin cuenta específica</option>{data.finance.accounts.filter((item) => !item.archived).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><div className="infoBox"><b>Presupuesto automático</b><span>Cada aporte aumentará el presupuesto de la categoría elegida y aparecerá con el nombre de esta meta, sin reducir lo que ya habías destinado.</span></div><div className="formActions"><button type="button" onClick={close}>Cancelar</button><button className="primary">Guardar</button></div></form>;
  return embedded ? content : <Modal title={title} onClose={close}>{content}</Modal>;
}
