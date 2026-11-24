"use client";

import { FormEvent, useState } from "react";
import type { ActionFn, AppData } from "@/lib/app-types";
import { transferFeeFor } from "@/lib/finance-math";
import { Modal, legacyMoney, localToday, money } from "@/components/v2-modules";
import { ConceptInput } from "@/components/concept-input";

const names: Record<string, string> = { income: "Ingreso", expense: "Gasto", transfer: "Transferencia", adjustment: "Ajuste" };
const minor = (value: string) => Math.round((Number(value) || 0) * 100);

export function TransferTransactionForm({ data, act, close, initialCategoryId = "", initialDescription = "", expenseOnly = false }: { data: AppData; act: ActionFn; close: () => void; initialCategoryId?: string; initialDescription?: string; expenseOnly?: boolean }) {
  const accounts = data.finance.accounts.filter((x) => !x.archived);
  const [form, setForm] = useState({ type: "expense", accountId: accounts[0]?.id || "", destinationAccountId: "", paymentMethod: "standard", transferMode: "same_bank", counterpartyBank: "", goalId: "", amount: "", occurredOn: localToday(), categoryId: initialCategoryId, taskId: "", projectId: "", description: initialDescription });
  const change = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const categories = data.finance.categories.filter((x) => x.kind === (form.type === "income" ? "income" : "expense"));
  const task = data.tasks.find((x) => x.id === form.taskId);
  const source = accounts.find((x) => x.id === form.accountId);
  const destination = accounts.find((x) => x.id === form.destinationAccountId);
  const expenseTransfer = form.type === "expense" && form.paymentMethod === "transfer";
  const targetBank = form.type === "transfer" ? destination?.bankName || "" : expenseTransfer ? form.counterpartyBank : "";
  const sameBank = !!source?.bankName && !!targetBank && source.bankName.trim().localeCompare(targetBank.trim(), "es", { sensitivity: "base" }) === 0;
  const fee = (form.type === "transfer" || expenseTransfer) && source && targetBank ? transferFeeFor(sameBank ? "same_bank" : form.transferMode, source.bankName, targetBank, minor(form.amount), data.finance.settings) : 0;
  const bankNames = [...new Set([...accounts.map((x) => x.bankName), ...Object.keys(data.finance.settings.transferBankFees || {})].filter(Boolean))].sort();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget).entries());
    await act("finance.transaction.create", { ...fields, type: form.type, paymentMethod: expenseTransfer ? "transfer" : "standard", transferMode: form.type === "transfer" || expenseTransfer ? (sameBank ? "same_bank" : form.transferMode) : null, amountMinor: minor(String(fields.amount || "0")), status: "confirmed" });
    close();
  };
  return <Modal title="Nuevo movimiento" onClose={close} wide>
    <form className="form" onSubmit={submit}>
      <div className="typeChooser">{(expenseOnly ? ["expense", "transfer"] : ["expense", "income", "transfer", "adjustment"]).map((type) => <button type="button" className={form.type === type ? "active" : ""} onClick={() => setForm((current) => ({ ...current, type, categoryId: type === "expense" ? current.categoryId || initialCategoryId : "", destinationAccountId: "", paymentMethod: "standard", counterpartyBank: "", goalId: "", transferMode: "same_bank" }))} key={type}>{names[type]}</button>)}</div>
      <div className="formgrid">
        <label>Cuenta de origen*<select name="accountId" required value={form.accountId} onChange={(e) => change("accountId", e.target.value)}>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}{account.bankName ? ` · ${account.bankName}` : ""} · {money(account.balanceMinor)}</option>)}</select></label>
        {form.type === "transfer" ? <label>Cuenta destino*<select name="destinationAccountId" required value={form.destinationAccountId} onChange={(e) => change("destinationAccountId", e.target.value)}><option value="">Selecciona…</option>{accounts.filter((account) => account.id !== form.accountId).map((account) => <option value={account.id} key={account.id}>{account.name}{account.bankName ? ` · ${account.bankName}` : ""}</option>)}</select></label> : <label>Categoría<select name="categoryId" value={form.categoryId} onChange={(e) => change("categoryId", e.target.value)}><option value="">Sin categoría</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>}
      </div>
      {form.type === "expense" && <div className="formgrid"><label>Método de pago<select name="paymentMethod" value={form.paymentMethod} onChange={(e) => change("paymentMethod", e.target.value)}><option value="standard">Efectivo, tarjeta u otro</option><option value="transfer">Transferencia bancaria</option></select></label>{expenseTransfer && <label>Banco destino*<input name="counterpartyBank" list="expense-bank-list" required value={form.counterpartyBank} onChange={(e) => change("counterpartyBank", e.target.value)} placeholder="Banco del destinatario" /><datalist id="expense-bank-list">{bankNames.map((bank) => <option value={bank} key={bank} />)}</datalist></label>}</div>}
      {(form.type === "transfer" || expenseTransfer) && <>
        <div className="formgrid">
          <label>Modalidad<select name="transferMode" value={sameBank ? "same_bank" : form.transferMode} onChange={(e) => change("transferMode", e.target.value)}>{sameBank ? <option value="same_bank">Mismo banco</option> : <><option value="ach">ACH (normal)</option><option value="lbtr">LBTR / inmediata</option></>}</select></label>
          <div className="transferPreview"><span>Comisión automática</span><b>{money(fee)}</b><small>{sameBank ? "Tarifa configurada para cuentas del mismo banco." : "Tarifa según el banco destino y la modalidad."}</small></div>
        </div>
        {(!source?.bankName || !targetBank) && <div className="warningBox"><b>Falta configurar el banco</b><span>Indica el banco de origen y destino para calcular la tarifa automáticamente.</span></div>}
        {fee > 0 && <div className="infoBox"><b>Total que saldrá de la cuenta de origen: {money(minor(form.amount) + fee)}</b><span>La cuenta destino recibirá {money(minor(form.amount))}. La comisión se registra como gasto bancario y no se suma al importe recibido.</span></div>}
      </>}
      <div className="formgrid"><label>{form.type === "transfer" ? "Importe enviado RD$*" : "Importe RD$*"}<input name="amount" required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => change("amount", e.target.value)} /></label><label>Fecha*<input name="occurredOn" required type="date" value={form.occurredOn} onChange={(e) => change("occurredOn", e.target.value)} /></label></div>
      <ConceptInput concepts={data.finance.concepts} name="description" value={form.description} onChange={(e) => change("description", e.target.value)} required placeholder={form.type === "transfer" ? "Persona o motivo de la transferencia" : form.type === "expense" ? "¿En qué se gastó?" : "Descripción del movimiento"} />
      {form.type === "expense" && <><div className="formgrid"><label>Vincular a tarea<select name="taskId" value={form.taskId} onChange={(e) => { const id = e.target.value; setForm((current) => ({ ...current, taskId: id, projectId: id ? data.tasks.find((item) => item.id === id)?.projectId || current.projectId : current.projectId })); }}><option value="">Sin tarea</option>{data.tasks.filter((item) => !item.archived).map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><label>Vincular a proyecto<select name="projectId" value={form.projectId} onChange={(e) => change("projectId", e.target.value)}><option value="">Sin proyecto</option>{data.projects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></div><label>Consumir reserva de una meta<select name="goalId" value={form.goalId} onChange={(e) => { const goal = data.finance.goals.find((item) => item.id === e.target.value); setForm((current) => ({ ...current, goalId: e.target.value, categoryId: goal?.categoryId || current.categoryId })); }}><option value="">Sin meta vinculada</option>{data.finance.goals.filter((goal) => goal.status !== "completed" && goal.reservedMinor > 0).map((goal) => <option value={goal.id} key={goal.id}>{goal.title} · disponible {money(goal.reservedMinor)}</option>)}</select></label>{form.goalId && <div className="infoBox"><b>Reserva aplicada automáticamente</b><span>Al guardar, se consumirá hasta el importe disponible de la meta. Si anulas el gasto, la reserva se restaurará.</span></div>}{task && <div className="infoBox"><b>{task.title}</b><span>Estimado: {legacyMoney(task.estimate)} · Gastado confirmado: {money(data.finance.taskSpend[task.id] || 0)}</span><small>Este movimiento actualizará el gasto real de la tarea sin duplicar el importe.</small></div>}</>}
      {form.occurredOn > localToday() && <div className="warningBox"><b>Movimiento futuro</b><span>Se guardará para la proyección, pero no afectará el saldo disponible de hoy.</span></div>}
      <div className="formActions"><button type="button" onClick={close}>Cancelar</button><button className="primary">Registrar movimiento</button></div>
    </form>
  </Modal>;
}
