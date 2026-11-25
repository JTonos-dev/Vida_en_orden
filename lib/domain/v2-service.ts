import { domainDatabase, domainNow } from "./context.ts";
import { HOUSEHOLD_SCOPE } from "../data-scopes.ts";
import {
  calculateAccountBalance,
  calculateCommitments,
  calculateIncomeBudgetRows,
  consumeReservation,
  dateInTimeZone,
  normalizeBankName,
  nextRecurringDate,
  transferFeeFor,
} from "../finance-math.ts";

const now = domainNow;
const today = () => dateInTimeZone(new Date(now()), "America/Santo_Domingo");
const uid = () => crypto.randomUUID();
const db = domainDatabase;

function text(value: unknown, label: string, required = false) {
  const result = String(value ?? "").trim();
  if (required && !result) throw new Error(`${label} es obligatorio`);
  return result;
}

function date(value: unknown, label: string, required = false) {
  const result = text(value, label, required);
  if (!result) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(`${result}T12:00:00Z`))) {
    throw new Error(`${label} no es válida`);
  }
  return result;
}

function time(value: unknown, label: string) {
  const result = text(value, label);
  if (result && !/^([01]\d|2[0-3]):[0-5]\d$/.test(result)) throw new Error(`${label} no es válida`);
  return result;
}

function minor(value: unknown, label: string, allowZero = true) {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 0 || (!allowZero && result === 0)) {
    throw new Error(`${label} debe ser un importe válido`);
  }
  return result;
}

function rateBps(value: unknown, label: string) {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 0) throw new Error(`${label} debe ser un porcentaje válido`);
  return result;
}

function boolean(value: unknown) {
  return value === true || value === 1 || value === "1";
}

function transferProfiles(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, { achRateBps: number; lbtrSurchargeMinor: number }>;
  const result: Record<string, { achRateBps: number; lbtrSurchargeMinor: number }> = {};
  for (const [name, profile] of Object.entries(value as Record<string, unknown>)) {
    const cleanName = text(name, "El banco");
    if (!cleanName || !profile || typeof profile !== "object" || Array.isArray(profile)) continue;
    const row = profile as Record<string, unknown>;
    result[cleanName] = {
      achRateBps: rateBps(row.achRateBps ?? 0, "El porcentaje ACH"),
      lbtrSurchargeMinor: minor(row.lbtrSurchargeMinor ?? 0, "El cargo adicional LBTR"),
    };
  }
  return result;
}

function settingsTransferFees(row: Row | null | undefined) {
  let profiles: Record<string, { achRateBps: number; lbtrSurchargeMinor: number }> = {};
  try { profiles = transferProfiles(JSON.parse(String(row?.transfer_bank_fees_json || "{}"))); } catch { profiles = {}; }
  return {
    transferSameBankRateBps: Number(row?.transfer_same_bank_rate_bps || 0),
    transferAchRateBps: Number(row?.transfer_ach_rate_bps || 0),
    transferLbtrSurchargeMinor: Number(row?.transfer_lbtr_surcharge_minor || 0),
    transferBankFees: profiles,
  };
}

async function audit(ownerId: string, entityType: string, entityId: string, action: string, metadata: unknown = {}) {
  await db().prepare(
    "INSERT INTO audit_log (id,owner_id,entity_type,entity_id,action,metadata,occurred_at) VALUES (?,?,?,?,?,?,?)",
  ).bind(uid(), ownerId, entityType, entityId, action, JSON.stringify(metadata), now()).run();
}

async function owned(table: string, id: string, ownerId: string) {
  const row = await db().prepare(`SELECT id FROM ${table} WHERE id=? AND owner_id=?`).bind(id, ownerId).first();
  if (!row) throw new Error("Registro no encontrado o sin acceso");
}

async function shared(table: "home_areas" | "home_projects", id: unknown) {
  if (!id) return;
  const row=await db().prepare(`SELECT id FROM ${table} WHERE id=? AND scope_id=?`).bind(String(id),HOUSEHOLD_SCOPE).first();
  if(!row) throw new Error("El área o proyecto seleccionado no existe");
}

async function sharedTask(id: unknown) {
  if (!id) return;
  const row=await db().prepare("SELECT id FROM home_tasks WHERE id=? AND user_id=?").bind(String(id),HOUSEHOLD_SCOPE).first();
  if(!row) throw new Error("La tarea seleccionada no existe");
}

function normalizeConcept(value: unknown) {
  return text(value, "El concepto").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

async function ensureConceptSchema() {
  const database = db();
  await database.prepare("CREATE TABLE IF NOT EXISTS finance_concepts (id TEXT PRIMARY KEY NOT NULL, owner_id TEXT NOT NULL, concept TEXT NOT NULL, normalized TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
  await database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS finance_concepts_owner_normalized_idx ON finance_concepts(owner_id, normalized)").run();
  const columns = await database.prepare("PRAGMA table_info(finance_obligations)").all<Row>();
  if (!columns.results.some((row) => String(row.name) === "concept")) {
    await database.prepare("ALTER TABLE finance_obligations ADD COLUMN concept TEXT NOT NULL DEFAULT ''").run();
  }
  const ensureColumns = async (table: string, additions: Array<[string, string]>) => {
    const result = await database.prepare(`PRAGMA table_info(${table})`).all<Row>();
    const existing = new Set(result.results.map((row) => String(row.name)));
    for (const [name, declaration] of additions) {
      if (!existing.has(name)) await database.prepare(`ALTER TABLE ${table} ADD COLUMN ${name} ${declaration}`).run();
    }
  };
  await ensureColumns("finance_transactions", [
    ["transfer_mode", "TEXT"], ["fee_minor", "INTEGER NOT NULL DEFAULT 0"],
    ["obligation_occurrence_id", "TEXT"], ["reservation_consumed_minor", "INTEGER NOT NULL DEFAULT 0"],
    ["reservation_month", "TEXT NOT NULL DEFAULT ''"],
    ["payment_method", "TEXT NOT NULL DEFAULT 'standard'"], ["counterparty_bank", "TEXT NOT NULL DEFAULT ''"],
    ["fee_category_id", "TEXT"], ["goal_id", "TEXT"], ["goal_reservation_consumed_minor", "INTEGER NOT NULL DEFAULT 0"],
  ]);
  await ensureColumns("finance_accounts", [["bank_name", "TEXT NOT NULL DEFAULT ''"]]);
  await ensureColumns("finance_settings", [
    ["transfer_same_bank_rate_bps", "INTEGER NOT NULL DEFAULT 0"], ["transfer_ach_rate_bps", "INTEGER NOT NULL DEFAULT 0"],
    ["transfer_lbtr_surcharge_minor", "INTEGER NOT NULL DEFAULT 0"], ["transfer_bank_fees_json", "TEXT NOT NULL DEFAULT '{}'"],
  ]);
  await ensureColumns("finance_budgets", [["concept", "TEXT NOT NULL DEFAULT 'Asignación base'"], ["allocation_type", "TEXT NOT NULL DEFAULT 'base'"]]);
  await ensureColumns("finance_goals", [
    ["category_id", "TEXT"], ["covered_by_budget", "INTEGER NOT NULL DEFAULT 1"], ["used_minor", "INTEGER NOT NULL DEFAULT 0"],
  ]);
  await ensureColumns("finance_obligations", [["covered_by_budget", "INTEGER NOT NULL DEFAULT 1"], ["reserve_month", "TEXT NOT NULL DEFAULT ''"]]);
  await ensureColumns("finance_goal_entries", [
    ["concept", "TEXT NOT NULL DEFAULT ''"], ["voided_at", "TEXT"], ["updated_at", "TEXT NOT NULL DEFAULT ''"],
  ]);
}

async function rememberConcept(ownerId: string, value: unknown) {
  const concept = text(value, "El concepto");
  const normalized = normalizeConcept(concept);
  if (!normalized) return;
  const stamp = now();
  await db().prepare("INSERT OR IGNORE INTO finance_concepts (id,owner_id,concept,normalized,created_at,updated_at) VALUES (?,?,?,?,?,?)")
    .bind(uid(), ownerId, concept.replace(/\s+/g, " ").trim(), normalized, stamp, stamp).run();
}

async function ensureDefaults(ownerId: string) {
  const database = db();
  await ensureConceptSchema();
  const stamp = now();
  const settings = await database.prepare("SELECT owner_id FROM finance_settings WHERE owner_id=?").bind(ownerId).first();
  if (!settings) {
    const defaults = [
      ["Alimentación", "expense", "#2a9769"], ["Hogar", "expense", "#2463eb"],
      ["Transporte", "expense", "#7c5ce7"], ["Hijos", "expense", "#e48c2a"],
      ["Compromisos", "expense", "#c24247"], ["Ocio y salidas", "expense", "#d45fa8"],
      ["Emergencias", "expense", "#6b7787"], ["Metas", "expense", "#1e8397"], ["Comisiones bancarias", "expense", "#a86a22"],
      ["Salario", "income", "#21835a"], ["Otros ingresos", "income", "#3f9f69"],
    ];
    await database.batch([
      database.prepare("INSERT INTO finance_settings (owner_id,currency,timezone,safety_buffer_minor,transfer_same_bank_rate_bps,transfer_ach_rate_bps,transfer_lbtr_surcharge_minor,transfer_bank_fees_json,updated_at) VALUES (?,?,?,?,?,?,?,?,?)")
        .bind(ownerId, "DOP", "America/Santo_Domingo", 0, 0, 0, 0, "{}", stamp),
      ...defaults.map(([name, kind, color]) => database.prepare(
        "INSERT INTO finance_categories (id,owner_id,name,kind,color,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
      ).bind(uid(), ownerId, name, kind, color, stamp, stamp)),
    ]);
  }
  const feeCategory = await database.prepare("SELECT id FROM finance_categories WHERE owner_id=? AND name=? AND kind='expense' LIMIT 1").bind(ownerId, "Comisiones bancarias").first();
  if (!feeCategory) await database.prepare("INSERT INTO finance_categories (id,owner_id,name,kind,color,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").bind(uid(), ownerId, "Comisiones bancarias", "expense", "#a86a22", stamp, stamp).run();
  let goalsCategory = await database.prepare("SELECT id FROM finance_categories WHERE owner_id=? AND name=? AND kind='expense' LIMIT 1").bind(ownerId, "Metas").first<Row>();
  if (!goalsCategory) {
    const id = uid();
    await database.prepare("INSERT INTO finance_categories (id,owner_id,name,kind,color,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").bind(id, ownerId, "Metas", "expense", "#1e8397", stamp, stamp).run();
    goalsCategory = { id };
  }
  await database.batch([
    database.prepare("UPDATE finance_goals SET category_id=?,covered_by_budget=1 WHERE owner_id=? AND (category_id IS NULL OR category_id='')").bind(goalsCategory.id, ownerId),
    database.prepare("UPDATE finance_goal_entries SET concept=COALESCE(NULLIF(concept,''),(SELECT title FROM finance_goals WHERE finance_goals.id=finance_goal_entries.goal_id),''),updated_at=CASE WHEN updated_at='' THEN created_at ELSE updated_at END WHERE owner_id=?").bind(ownerId),
  ]);
  const conceptSeed = await database.prepare("SELECT id FROM audit_log WHERE owner_id=? AND entity_type='system' AND entity_id='concepts-v1' AND action='seeded' LIMIT 1").bind(ownerId).first();
  if (!conceptSeed) {
    const [transactions, obligations] = await Promise.all([
      database.prepare("SELECT description FROM finance_transactions WHERE owner_id=? AND trim(description)!=''").bind(ownerId).all<Row>(),
      database.prepare("SELECT CASE WHEN trim(concept)!='' THEN concept ELSE title END AS concept FROM finance_obligations WHERE owner_id=? AND (trim(concept)!='' OR trim(title)!='')").bind(ownerId).all<Row>(),
    ]);
    const concepts = [...transactions.results.map((row) => row.description), ...obligations.results.map((row) => row.concept)]
      .map((value) => text(value, "El concepto").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const statements: D1PreparedStatement[] = [];
    for (const concept of concepts) {
      const normalized = normalizeConcept(concept);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      statements.push(database.prepare("INSERT OR IGNORE INTO finance_concepts (id,owner_id,concept,normalized,created_at,updated_at) VALUES (?,?,?,?,?,?)").bind(uid(), ownerId, concept, normalized, stamp, stamp));
    }
    statements.push(database.prepare("INSERT OR IGNORE INTO audit_log (id,owner_id,entity_type,entity_id,action,metadata,occurred_at) VALUES (?,?,?,?,?,?,?)").bind(`concepts-${ownerId}`, ownerId, "system", "concepts-v1", "seeded", JSON.stringify({ count: seen.size }), stamp));
    await database.batch(statements);
  }
  const areas = await database.prepare("SELECT id FROM home_areas WHERE scope_id=? LIMIT 1").bind(HOUSEHOLD_SCOPE).first();
  if (!areas) {
    await database.prepare("INSERT INTO home_areas (id,scope_id,name,color,order_index,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
      .bind(uid(), HOUSEHOLD_SCOPE, "Hogar", "#2463eb", 0, stamp, stamp).run();
  }
}

type Row = Record<string, unknown>;

export async function v2StateFor(ownerId: string) {
  const database = db();
  const month = today().slice(0, 7);
  const [areas, projects, events, accounts, categories, concepts, transactions, budgets, obligations, occurrences, goals, goalEntries, settings, audits] = await Promise.all([
    database.prepare("SELECT * FROM home_areas WHERE scope_id=? ORDER BY order_index,name").bind(HOUSEHOLD_SCOPE).all<Row>(),
    database.prepare("SELECT * FROM home_projects WHERE scope_id=? ORDER BY status,name").bind(HOUSEHOLD_SCOPE).all<Row>(),
    database.prepare("SELECT * FROM calendar_events WHERE owner_id=? ORDER BY start_date,start_time").bind(ownerId).all<Row>(),
    database.prepare("SELECT * FROM finance_accounts WHERE owner_id=? ORDER BY archived,name").bind(ownerId).all<Row>(),
    database.prepare("SELECT * FROM finance_categories WHERE owner_id=? ORDER BY kind,name").bind(ownerId).all<Row>(),
    database.prepare("SELECT id,concept FROM finance_concepts WHERE owner_id=? ORDER BY concept COLLATE NOCASE").bind(ownerId).all<Row>(),
    database.prepare("SELECT * FROM finance_transactions WHERE owner_id=? ORDER BY occurred_on DESC,created_at DESC").bind(ownerId).all<Row>(),
    database.prepare("SELECT * FROM finance_budgets WHERE owner_id=? ORDER BY month DESC").bind(ownerId).all<Row>(),
    database.prepare("SELECT * FROM finance_obligations WHERE owner_id=? ORDER BY next_due_date").bind(ownerId).all<Row>(),
    database.prepare("SELECT * FROM finance_obligation_occurrences WHERE owner_id=? ORDER BY due_date").bind(ownerId).all<Row>(),
    database.prepare("SELECT * FROM finance_goals WHERE owner_id=? ORDER BY status,target_date").bind(ownerId).all<Row>(),
    database.prepare("SELECT * FROM finance_goal_entries WHERE owner_id=? ORDER BY occurred_on DESC").bind(ownerId).all<Row>(),
    database.prepare("SELECT * FROM finance_settings WHERE owner_id=?").bind(ownerId).first<Row>(),
    database.prepare("SELECT * FROM audit_log WHERE owner_id=? ORDER BY occurred_at DESC LIMIT 100").bind(ownerId).all<Row>(),
  ]);

  const tx = transactions.results.map((r) => ({
    id: String(r.id), type: String(r.type), accountId: String(r.account_id),
    destinationAccountId: r.destination_account_id ? String(r.destination_account_id) : null,
    amountMinor: Number(r.amount_minor), transferMode: r.transfer_mode ? String(r.transfer_mode) : null, feeMinor: Number(r.fee_minor || 0),
    paymentMethod: String(r.payment_method || "standard"), counterpartyBank: String(r.counterparty_bank || ""), feeCategoryId: r.fee_category_id ? String(r.fee_category_id) : null,
    occurredOn: String(r.occurred_on), status: String(r.status),
    categoryId: r.category_id ? String(r.category_id) : null, taskId: r.task_id ? String(r.task_id) : null,
    projectId: r.project_id ? String(r.project_id) : null, description: String(r.description || ""),
    obligationOccurrenceId: r.obligation_occurrence_id ? String(r.obligation_occurrence_id) : null,
    reservationConsumedMinor: Number(r.reservation_consumed_minor || 0),
    reservationMonth: String(r.reservation_month || ""),
    goalId: r.goal_id ? String(r.goal_id) : null, goalReservationConsumedMinor: Number(r.goal_reservation_consumed_minor || 0),
    voidedAt: r.voided_at ? String(r.voided_at) : null, createdAt: String(r.created_at),
  }));
  // A future-dated movement belongs to the projection, never to today's available balance.
  const confirmed = tx.filter((t) => t.status === "confirmed" && t.occurredOn <= today());
  const accountRows = accounts.results.map((r) => {
    const balanceMinor = calculateAccountBalance(
      String(r.id),
      Number(r.opening_balance_minor),
      String(r.opening_balance_date),
      today(),
      tx,
    );
    return {
      id: String(r.id), name: String(r.name), type: String(r.type), bankName: String(r.bank_name || ""), currency: String(r.currency),
      openingBalanceMinor: Number(r.opening_balance_minor), openingBalanceDate: String(r.opening_balance_date),
      archived: Number(r.archived) === 1, balanceMinor, createdAt: String(r.created_at),
    };
  });
  // Credit availability is not cash and must never inflate liquid funds.
  const liquid = accountRows.filter((a) => !a.archived && a.type !== "credit").reduce((sum, a) => sum + a.balanceMinor, 0);
  const currentBudgets = budgets.results.filter((r) => String(r.month) === month);
  const spendByCategory = new Map<string, number>();
  const spendByPeriod = new Map<string, number>();
  const goalSpendByCategory = new Map<string, number>();
  const goalSpendByPeriod = new Map<string, number>();
  const taskSpend = new Map<string, number>();
  const projectSpend = new Map<string, number>();
  const addSpend = (categoryId: string | null, occurredOn: string, amount: number) => {
    if (categoryId === null || amount <= 0) return;
    if (occurredOn.startsWith(month)) spendByCategory.set(categoryId, (spendByCategory.get(categoryId) || 0) + amount);
    const key = `${occurredOn.slice(0, 7)}|${categoryId}`;
    spendByPeriod.set(key, (spendByPeriod.get(key) || 0) + amount);
  };
  for (const t of confirmed.filter((x) => x.type === "expense" || (x.type === "transfer" && x.feeMinor > 0))) {
    if (t.type === "expense") {
      addSpend(t.categoryId || (t.obligationOccurrenceId ? "" : null), t.occurredOn, t.amountMinor);
      addSpend(t.feeCategoryId, t.occurredOn, t.feeMinor);
    } else addSpend(t.categoryId, t.occurredOn, t.feeMinor);
    if (t.type === "expense" && t.taskId) taskSpend.set(t.taskId, (taskSpend.get(t.taskId) || 0) + t.amountMinor);
    if (t.type === "expense" && t.projectId) projectSpend.set(t.projectId, (projectSpend.get(t.projectId) || 0) + t.amountMinor);
    if (t.type === "expense" && t.categoryId && t.goalReservationConsumedMinor > 0) {
      if (t.occurredOn.startsWith(month)) goalSpendByCategory.set(t.categoryId, (goalSpendByCategory.get(t.categoryId) || 0) + t.goalReservationConsumedMinor);
      const key = `${t.occurredOn.slice(0, 7)}|${t.categoryId}`;
      goalSpendByPeriod.set(key, (goalSpendByPeriod.get(key) || 0) + t.goalReservationConsumedMinor);
    }
  }
  const safety = Number(settings?.safety_buffer_minor || 0);
  const obligationInputs = obligations.results.map((row) => ({
    id: String(row.id), kind: String(row.kind), active: Number(row.active) === 1,
    reservedMinor: Number(row.reserved_minor), categoryId: row.category_id ? String(row.category_id) : null,
    coveredByBudget: Number(row.covered_by_budget) === 1, reserveMonth: String(row.reserve_month || ""),
  }));
  const occurrenceInputs = occurrences.results.map((row) => ({
    id: String(row.id), obligationId: String(row.obligation_id), dueDate: String(row.due_date),
    expectedMinor: Number(row.expected_minor), paidMinor: Number(row.paid_minor), status: String(row.status),
  }));
  const obligationPaymentInputs = tx.filter((row) => row.obligationOccurrenceId).map((row) => ({
    occurrenceId: String(row.obligationOccurrenceId), amountMinor: row.amountMinor, occurredOn: row.occurredOn, status: row.status,
  }));
  const goalInputs = goals.results.map((row) => ({
    id: String(row.id), status: String(row.status), reservedMinor: Number(row.reserved_minor),
    categoryId: row.category_id ? String(row.category_id) : null, coveredByBudget: Number(row.covered_by_budget) === 1,
  }));
  const goalContributionInputs = goalEntries.results.filter((row) => !row.voided_at).map((row) => ({ goalId: String(row.goal_id), amountMinor: Number(row.amount_minor), occurredOn: String(row.occurred_on) }));
  const commitment = calculateCommitments({
    month,
    liquidMinor: liquid,
    safetyMinor: safety,
    budgets: currentBudgets.map((row) => ({ categoryId: String(row.category_id), assignedMinor: Number(row.assigned_minor), allocationType: String(row.allocation_type || "base") === "additional" ? "additional" as const : "base" as const })),
    expenseSpendByCategory: spendByCategory,
    goalSpendByCategory,
    obligations: obligationInputs,
    obligationOccurrences: occurrenceInputs,
    obligationPayments: obligationPaymentInputs,
    goals: goalInputs,
    goalContributions: goalContributionInputs,
  });
  const budgetMonths = new Set<string>([
    month,
    ...budgets.results.map((row) => String(row.month)),
    ...occurrenceInputs.map((row) => row.dueDate.slice(0, 7)),
    ...goalContributionInputs.map((row) => row.occurredOn.slice(0, 7)),
  ]);
  const computedBudgets = [...budgetMonths].sort().flatMap((budgetMonth) => {
    const monthSpend = new Map<string, number>();
    const monthGoalSpend = new Map<string, number>();
    for (const [key, value] of spendByPeriod) {
      const [period, ...categoryParts] = key.split("|");
      if (period === budgetMonth) monthSpend.set(categoryParts.join("|"), value);
    }
    for (const [key, value] of goalSpendByPeriod) {
      const [period, ...categoryParts] = key.split("|");
      if (period === budgetMonth) monthGoalSpend.set(categoryParts.join("|"), value);
    }
    const manualRows = budgets.results.filter((row) => String(row.month) === budgetMonth);
    const result = calculateCommitments({
      month: budgetMonth,
      liquidMinor: liquid,
      safetyMinor: 0,
      budgets: manualRows.map((row) => ({ categoryId: String(row.category_id), assignedMinor: Number(row.assigned_minor), allocationType: String(row.allocation_type || "base") === "additional" ? "additional" as const : "base" as const })),
      expenseSpendByCategory: monthSpend,
      goalSpendByCategory: monthGoalSpend,
      obligations: obligationInputs,
      obligationOccurrences: occurrenceInputs,
      obligationPayments: obligationPaymentInputs,
      goals: goalInputs,
      goalContributions: goalContributionInputs,
    });
    return result.budgetRows.map((row) => {
      return { id: `summary-${budgetMonth}-${row.categoryId || "uncategorized"}`, month: budgetMonth, ...row };
    });
  });
  const incomeBudgetRows = calculateIncomeBudgetRows(
    obligations.results.map((row) => ({ id: String(row.id), title: String(row.title), kind: String(row.kind), categoryId: row.category_id ? String(row.category_id) : null })),
    occurrenceInputs.map((row) => ({ id: row.id, obligationId: row.obligationId, dueDate: row.dueDate, expectedMinor: row.expectedMinor, paidMinor: row.paidMinor })),
  );
  const projected = new Map<string, number>();
  for (const r of occurrences.results.filter((x) => String(x.status) !== "paid")) {
    const obligation = obligations.results.find((x) => x.id === r.obligation_id);
    if (!obligation || Number(obligation.active) !== 1) continue;
    const signed = String(obligation.kind) === "income" ? Number(r.expected_minor) - Number(r.paid_minor) : -(Number(r.expected_minor) - Number(r.paid_minor));
    const projectionDate = String(r.due_date) < today() ? today() : String(r.due_date);
    projected.set(projectionDate, (projected.get(projectionDate) || 0) + signed);
  }
  for (const t of tx.filter((x) => x.status === "confirmed" && x.occurredOn > today())) {
    const signed = t.type === "income" || t.type === "adjustment" ? t.amountMinor : t.type === "expense" ? -(t.amountMinor + t.feeMinor) : t.type === "transfer" ? -t.feeMinor : 0;
    if (signed) projected.set(t.occurredOn, (projected.get(t.occurredOn) || 0) + signed);
  }
  let running = liquid;
  const cashflow = [...projected.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dateValue, changeMinor]) => {
    running += changeMinor;
    return { date: dateValue, changeMinor, balanceMinor: running };
  });

  return {
    areas: areas.results.map((r) => ({ id: String(r.id), name: String(r.name), color: String(r.color), order: Number(r.order_index) })),
    projects: projects.results.map((r) => ({
      id: String(r.id), areaId: r.area_id ? String(r.area_id) : null, name: String(r.name),
      description: String(r.description || ""), status: String(r.status), startDate: String(r.start_date || ""),
      targetDate: String(r.target_date || ""), budgetMinor: r.budget_minor == null ? null : Number(r.budget_minor),
      spentMinor: projectSpend.get(String(r.id)) || 0,
    })),
    events: events.results.map((r) => ({
      id: String(r.id), title: String(r.title), description: String(r.description || ""), location: String(r.location || ""),
      startDate: String(r.start_date), endDate: String(r.end_date), startTime: String(r.start_time || ""), endTime: String(r.end_time || ""),
      allDay: Number(r.all_day) === 1, timezone: String(r.timezone), status: String(r.status), recurrence: String(r.recurrence),
      recurrenceUntil: String(r.recurrence_until || ""), areaId: r.area_id ? String(r.area_id) : null,
      projectId: r.project_id ? String(r.project_id) : null, linkedTaskId: r.linked_task_id ? String(r.linked_task_id) : null,
      notes: String(r.notes || ""),
    })),
    finance: {
      accounts: accountRows,
      categories: categories.results.map((r) => ({ id: String(r.id), name: String(r.name), kind: String(r.kind), color: String(r.color) })),
      concepts: concepts.results.map((r) => ({ id: String(r.id), concept: String(r.concept) })),
      transactions: tx,
      budgets: computedBudgets,
      budgetAllocations: budgets.results.map((r) => ({ id: String(r.id), month: String(r.month), categoryId: String(r.category_id), assignedMinor: Number(r.assigned_minor), concept: String(r.concept || "Asignación base"), allocationType: String(r.allocation_type || "base") === "additional" ? "additional" : "base" })),
      incomeBudgets: incomeBudgetRows,
      obligations: obligations.results.map((r) => ({ id: String(r.id), title: String(r.title), concept: String(r.concept || r.title || ""), kind: String(r.kind), expectedAmountMinor: Number(r.expected_amount_minor), reservedMinor: Number(r.reserved_minor), accountId: r.account_id ? String(r.account_id) : null, categoryId: r.category_id ? String(r.category_id) : null, frequency: String(r.frequency), coveredByBudget: Number(r.covered_by_budget) === 1, reserveMonth: String(r.reserve_month || ""), nextDueDate: String(r.next_due_date), active: Number(r.active) === 1 })),
      occurrences: occurrences.results.map((r) => ({ id: String(r.id), obligationId: String(r.obligation_id), dueDate: String(r.due_date), expectedMinor: Number(r.expected_minor), paidMinor: Number(r.paid_minor), status: String(r.status), transactionId: r.transaction_id ? String(r.transaction_id) : null })),
      goals: goals.results.map((r) => ({ id: String(r.id), title: String(r.title), targetMinor: Number(r.target_minor), reservedMinor: Number(r.reserved_minor), usedMinor: Number(r.used_minor || 0), targetDate: String(r.target_date || ""), priority: String(r.priority), accountId: r.account_id ? String(r.account_id) : null, categoryId: r.category_id ? String(r.category_id) : null, coveredByBudget: Number(r.covered_by_budget) === 1, linkedTaskId: r.linked_task_id ? String(r.linked_task_id) : null, linkedProjectId: r.linked_project_id ? String(r.linked_project_id) : null, status: String(r.status) })),
      goalEntries: goalEntries.results.map((r) => ({ id: String(r.id), goalId: String(r.goal_id), amountMinor: Number(r.amount_minor), occurredOn: String(r.occurred_on), concept: String(r.concept || ""), note: String(r.note || ""), voidedAt: r.voided_at ? String(r.voided_at) : null })),
      settings: { currency: String(settings?.currency || "DOP"), timezone: String(settings?.timezone || "America/Santo_Domingo"), safetyBufferMinor: safety, ...settingsTransferFees(settings) },
      summary: { liquidMinor: liquid, budgetRemainingMinor: commitment.budgetRemainingMinor, obligationReservedMinor: commitment.obligationReservedMinor, goalReservedMinor: commitment.goalReservedMinor, coveredByBudgetMinor: commitment.coveredByBudgetMinor, committedMinor: commitment.committedMinor, safetyBufferMinor: safety, uncommittedMinor: commitment.uncommittedMinor },
      taskSpend: Object.fromEntries(taskSpend),
      projectSpend: Object.fromEntries(projectSpend),
      cashflow,
      audits: audits.results.map((r) => ({ id: String(r.id), entityType: String(r.entity_type), entityId: String(r.entity_id), action: String(r.action), metadata: String(r.metadata), occurredAt: String(r.occurred_at) })),
    },
  };
}

export async function v2Action(ownerId: string, body: Record<string, unknown>) {
  await ensureDefaults(ownerId);
  const database = db();
  const action = String(body.action || "");
  const stamp = now();

  if (action === "area.create") {
    const id = uid();
    const name = text(body.name, "El nombre", true);
    const count = await database.prepare("SELECT COUNT(*) total FROM home_areas WHERE scope_id=?").bind(HOUSEHOLD_SCOPE).first<{ total: number }>();
    await database.prepare("INSERT INTO home_areas (id,scope_id,name,color,order_index,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
      .bind(id, HOUSEHOLD_SCOPE, name, text(body.color, "El color") || "#2463eb", Number(count?.total || 0), stamp, stamp).run();
    return { id };
  }
  if (action === "area.update") {
    const id = text(body.id, "El área", true);
    await shared("home_areas", id);
    await database.prepare("UPDATE home_areas SET name=?,color=?,updated_at=? WHERE id=? AND scope_id=?")
      .bind(text(body.name, "El nombre", true), text(body.color, "El color") || "#2463eb", stamp, id, HOUSEHOLD_SCOPE).run();
    await audit(ownerId, "area", id, "updated", { name: body.name });
    return;
  }
  if (action === "project.create") {
    const id = uid();
    const name = text(body.name, "El nombre", true);
    const startDate = date(body.startDate, "La fecha de inicio");
    const targetDate = date(body.targetDate, "La fecha objetivo");
    if (startDate && targetDate && startDate > targetDate) throw new Error("La fecha objetivo debe ser posterior al inicio");
    await shared("home_areas",body.areaId);
    await database.prepare("INSERT INTO home_projects (id,scope_id,area_id,name,description,status,start_date,target_date,budget_minor,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id, HOUSEHOLD_SCOPE, body.areaId || null, name, text(body.description, "La descripción"), "active", startDate, targetDate, body.budgetMinor == null ? null : minor(body.budgetMinor, "El presupuesto"), stamp, stamp).run();
    return { id };
  }
  if (action === "project.update") {
    const id = text(body.id, "El proyecto", true);
    const row = await database.prepare("SELECT id FROM home_projects WHERE id=? AND scope_id=?").bind(id, HOUSEHOLD_SCOPE).first();
    if (!row) throw new Error("Proyecto no encontrado");
    await shared("home_areas",body.areaId);
    const startDate = date(body.startDate, "El inicio");
    const targetDate = date(body.targetDate, "La fecha objetivo");
    const status = ["active", "paused", "completed"].includes(String(body.status)) ? String(body.status) : "active";
    if (startDate && targetDate && startDate > targetDate) throw new Error("La fecha objetivo debe ser posterior al inicio");
    await database.prepare("UPDATE home_projects SET area_id=?,name=?,description=?,status=?,start_date=?,target_date=?,budget_minor=?,updated_at=? WHERE id=? AND scope_id=?")
      .bind(body.areaId || null, text(body.name, "El nombre", true), text(body.description, "La descripción"), status, startDate, targetDate, body.budgetMinor == null ? null : minor(body.budgetMinor, "El presupuesto"), stamp, id, HOUSEHOLD_SCOPE).run();
    await audit(ownerId, "project", id, "updated", { name: body.name, status });
    return;
  }
  if (action === "event.create" || action === "event.update") {
    const startDate = date(body.startDate, "La fecha de inicio", true);
    const endDate = date(body.endDate || body.startDate, "La fecha final", true);
    const allDay = boolean(body.allDay);
    const startTime = allDay ? "" : time(body.startTime, "La hora de inicio");
    const endTime = allDay ? "" : time(body.endTime, "La hora final");
    if (endDate < startDate || (endDate === startDate && startTime && endTime && endTime <= startTime)) throw new Error("El final del evento debe ser posterior al inicio");
    const recurrence = ["none", "daily", "weekly", "monthly", "yearly"].includes(String(body.recurrence)) ? String(body.recurrence) : "none";
    await shared("home_areas",body.areaId); await shared("home_projects",body.projectId); await sharedTask(body.linkedTaskId);
    if (action === "event.create") {
      const id = uid();
      await database.prepare("INSERT INTO calendar_events (id,owner_id,title,description,location,start_date,end_date,start_time,end_time,all_day,timezone,status,recurrence,recurrence_until,area_id,project_id,linked_task_id,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(id, ownerId, text(body.title, "El título", true), text(body.description, "La descripción"), text(body.location, "La ubicación"), startDate, endDate, startTime, endTime, allDay ? 1 : 0, text(body.timezone, "La zona horaria") || "America/Santo_Domingo", "scheduled", recurrence, date(body.recurrenceUntil, "El fin de recurrencia"), body.areaId || null, body.projectId || null, body.linkedTaskId || null, text(body.notes, "Las notas"), stamp, stamp).run();
      await audit(ownerId, "event", id, "created");
      return { id };
    } else {
      const id = text(body.id, "El evento", true);
      await owned("calendar_events", id, ownerId);
      await database.prepare("UPDATE calendar_events SET title=?,description=?,location=?,start_date=?,end_date=?,start_time=?,end_time=?,all_day=?,timezone=?,status=?,recurrence=?,recurrence_until=?,area_id=?,project_id=?,linked_task_id=?,notes=?,updated_at=? WHERE id=? AND owner_id=?")
        .bind(text(body.title, "El título", true), text(body.description, "La descripción"), text(body.location, "La ubicación"), startDate, endDate, startTime, endTime, allDay ? 1 : 0, text(body.timezone, "La zona horaria") || "America/Santo_Domingo", text(body.status, "El estado") || "scheduled", recurrence, date(body.recurrenceUntil, "El fin de recurrencia"), body.areaId || null, body.projectId || null, body.linkedTaskId || null, text(body.notes, "Las notas"), stamp, id, ownerId).run();
      await audit(ownerId, "event", id, "updated");
    }
    return;
  }
  if (action === "event.cancel") {
    const id = text(body.id, "El evento", true);
    await owned("calendar_events", id, ownerId);
    await database.prepare("UPDATE calendar_events SET status='cancelled',updated_at=? WHERE id=? AND owner_id=?").bind(stamp, id, ownerId).run();
    await audit(ownerId, "event", id, "cancelled");
    return;
  }
  if (action === "finance.account.create") {
    const id = uid();
    const type = ["bank", "cash", "savings", "credit"].includes(String(body.type)) ? String(body.type) : "bank";
    const openingBalanceDate = date(body.openingBalanceDate, "La fecha de corte", true);
    if (openingBalanceDate > today()) throw new Error("La fecha de corte no puede estar en el futuro");
    const bankName = text(body.bankName, "El banco");
    await database.prepare("INSERT INTO finance_accounts (id,owner_id,name,type,bank_name,currency,opening_balance_minor,opening_balance_date,archived,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id, ownerId, text(body.name, "El nombre", true), type, bankName, "DOP", minor(body.openingBalanceMinor, "El saldo inicial"), openingBalanceDate, 0, stamp, stamp).run();
    await audit(ownerId, "account", id, "created", { openingBalanceMinor: body.openingBalanceMinor });
    return;
  }
  if (action === "finance.account.update") {
    const id = text(body.id, "La cuenta", true);
    const account = await database.prepare("SELECT id FROM finance_accounts WHERE id=? AND owner_id=?").bind(id, ownerId).first();
    if (!account) throw new Error("Cuenta no encontrada");
    const type = ["bank", "cash", "savings", "credit"].includes(String(body.type)) ? String(body.type) : "bank";
    await database.prepare("UPDATE finance_accounts SET name=?,type=?,bank_name=?,updated_at=? WHERE id=? AND owner_id=?")
      .bind(text(body.name, "El nombre", true), type, text(body.bankName, "El banco"), stamp, id, ownerId).run();
    await audit(ownerId, "account", id, "updated", { name: body.name, bankName: body.bankName });
    return;
  }
  if (action === "finance.account.archive") {
    const id = text(body.id, "La cuenta", true);
    const account = await database.prepare("SELECT * FROM finance_accounts WHERE id=? AND owner_id=?").bind(id, ownerId).first<Row>();
    if (!account) throw new Error("Cuenta no encontrada");
    const transactionRows = await database.prepare("SELECT * FROM finance_transactions WHERE owner_id=? AND (account_id=? OR destination_account_id=?)").bind(ownerId, id, id).all<Row>();
    const balance = calculateAccountBalance(id, Number(account.opening_balance_minor), String(account.opening_balance_date), today(), transactionRows.results.map((row) => ({
      type: String(row.type), accountId: String(row.account_id), destinationAccountId: row.destination_account_id ? String(row.destination_account_id) : null,
      amountMinor: Number(row.amount_minor), feeMinor: Number(row.fee_minor || 0), occurredOn: String(row.occurred_on), status: String(row.status),
    })));
    if (balance !== 0) throw new Error("Traslada o ajusta el saldo a cero antes de archivar la cuenta");
    await database.prepare("UPDATE finance_accounts SET archived=1,updated_at=? WHERE id=? AND owner_id=?").bind(stamp, id, ownerId).run();
    await audit(ownerId, "account", id, "archived");
    return;
  }
  if (action === "finance.category.create") {
    const kind = String(body.kind) === "income" ? "income" : "expense";
    const name = text(body.name, "El nombre", true);
    const color = text(body.color, "El color") || "#2463eb";
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error("El color no es válido");
    const duplicate = await database.prepare("SELECT id FROM finance_categories WHERE owner_id=? AND kind=? AND lower(name)=lower(?) LIMIT 1")
      .bind(ownerId, kind, name).first<Row>();
    if (duplicate) throw new Error("Ya existe una categoría con ese nombre y tipo");
    const id = uid();
    await database.prepare("INSERT INTO finance_categories (id,owner_id,name,kind,color,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
      .bind(id, ownerId, name, kind, color, stamp, stamp).run();
    await audit(ownerId, "category", id, "created", { name, kind });
    return;
  }
  if (action === "finance.category.update") {
    const id = text(body.id, "La categoría", true);
    const existing = await database.prepare("SELECT id,name,kind FROM finance_categories WHERE id=? AND owner_id=?").bind(id, ownerId).first<Row>();
    if (!existing) throw new Error("Categoría no encontrada");
    const name = text(body.name, "El nombre", true);
    const kind = String(body.kind) === "income" ? "income" : "expense";
    const color = text(body.color, "El color") || "#2463eb";
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error("El color no es válido");
    const duplicate = await database.prepare("SELECT id FROM finance_categories WHERE owner_id=? AND kind=? AND lower(name)=lower(?) AND id!=? LIMIT 1")
      .bind(ownerId, kind, name, id).first<Row>();
    if (duplicate) throw new Error("Ya existe otra categoría con ese nombre y tipo");
    if (String(existing.kind) !== kind) {
      const [transactions, budgets, obligations, goals] = await Promise.all([
        database.prepare("SELECT COUNT(*) AS count FROM finance_transactions WHERE owner_id=? AND category_id=?").bind(ownerId, id).first<Row>(),
        database.prepare("SELECT COUNT(*) AS count FROM finance_budgets WHERE owner_id=? AND category_id=?").bind(ownerId, id).first<Row>(),
        database.prepare("SELECT COUNT(*) AS count FROM finance_obligations WHERE owner_id=? AND category_id=?").bind(ownerId, id).first<Row>(),
        database.prepare("SELECT COUNT(*) AS count FROM finance_goals WHERE owner_id=? AND category_id=?").bind(ownerId, id).first<Row>(),
      ]);
      const references = [transactions, budgets, obligations, goals].reduce((sum, row) => sum + Number(row?.count || 0), 0);
      if (references > 0) throw new Error("No puedes cambiar el tipo de una categoría que ya está vinculada a datos");
    }
    await database.prepare("UPDATE finance_categories SET name=?,kind=?,color=?,updated_at=? WHERE id=? AND owner_id=?")
      .bind(name, kind, color, stamp, id, ownerId).run();
    await audit(ownerId, "category", id, "updated", { name, kind });
    return;
  }
  if (action === "finance.category.delete") {
    const id = text(body.id, "La categoría", true);
    const existing = await database.prepare("SELECT id,name,kind FROM finance_categories WHERE id=? AND owner_id=?").bind(id, ownerId).first<Row>();
    if (!existing) throw new Error("Categoría no encontrada");
    if (String(existing.name) === "Comisiones bancarias" && String(existing.kind) === "expense") {
      throw new Error("La categoría de comisiones bancarias es necesaria para calcular transferencias y no se puede eliminar");
    }
    const [transactions, budgets, obligations, goals] = await Promise.all([
      database.prepare("SELECT COUNT(*) AS count FROM finance_transactions WHERE owner_id=? AND category_id=?").bind(ownerId, id).first<Row>(),
      database.prepare("SELECT COUNT(*) AS count FROM finance_budgets WHERE owner_id=? AND category_id=?").bind(ownerId, id).first<Row>(),
      database.prepare("SELECT COUNT(*) AS count FROM finance_obligations WHERE owner_id=? AND category_id=?").bind(ownerId, id).first<Row>(),
      database.prepare("SELECT COUNT(*) AS count FROM finance_goals WHERE owner_id=? AND category_id=?").bind(ownerId, id).first<Row>(),
    ]);
    const references = [transactions, budgets, obligations, goals].reduce((sum, row) => sum + Number(row?.count || 0), 0);
    if (references > 0) throw new Error("No se puede eliminar una categoría que ya está vinculada a movimientos, presupuestos, obligaciones o metas");
    await database.prepare("DELETE FROM finance_categories WHERE id=? AND owner_id=?").bind(id, ownerId).run();
    await audit(ownerId, "category", id, "deleted", { name: existing.name, kind: existing.kind });
    return;
  }
  if (action === "finance.transaction.create") {
    const type = text(body.type, "El tipo", true);
    if (!["income", "expense", "transfer", "adjustment"].includes(type)) throw new Error("Tipo de movimiento inválido");
    const accountId = text(body.accountId, "La cuenta", true);
    const account = await database.prepare("SELECT id,bank_name,opening_balance_date,archived FROM finance_accounts WHERE id=? AND owner_id=?").bind(accountId, ownerId).first<Row>();
    if (!account || Number(account.archived) === 1) throw new Error("La cuenta no existe o está archivada");
    const occurredOn = date(body.occurredOn, "La fecha", true);
    if (occurredOn < String(account.opening_balance_date)) throw new Error("La fecha del movimiento no puede ser anterior al saldo inicial de la cuenta");
    const destination = type === "transfer" ? text(body.destinationAccountId, "La cuenta destino", true) : "";
    let destinationAccount: Row | null = null;
    if (destination) {
      destinationAccount = await database.prepare("SELECT id,bank_name,opening_balance_date,archived FROM finance_accounts WHERE id=? AND owner_id=?").bind(destination, ownerId).first<Row>();
      if (!destinationAccount || Number(destinationAccount.archived) === 1) throw new Error("La cuenta destino no existe o está archivada");
      if (destination === accountId) throw new Error("La cuenta destino debe ser diferente");
      if (occurredOn < String(destinationAccount.opening_balance_date)) throw new Error("La transferencia no puede ser anterior al saldo inicial de la cuenta destino");
    }
    let categoryId: string | null = null;
    if ((type === "income" || type === "expense") && body.categoryId) {
      const category = await database.prepare("SELECT id,kind FROM finance_categories WHERE id=? AND owner_id=?").bind(String(body.categoryId), ownerId).first<Row>();
      if (!category || String(category.kind) !== type) throw new Error("La categoría no corresponde al tipo de movimiento");
      categoryId = String(category.id);
    }
    const amountMinor = minor(body.amountMinor, "El importe", false);
    const paymentMethod = type === "transfer" || (type === "expense" && String(body.paymentMethod) === "transfer") ? "transfer" : "standard";
    const counterpartyBank = type === "expense" && paymentMethod === "transfer" ? text(body.counterpartyBank, "El banco destino", true) : "";
    let transferMode: string | null = null;
    let feeMinor = 0;
    let feeCategoryId: string | null = null;
    if (type === "transfer" || paymentMethod === "transfer") {
      const sourceBank = text(account.bank_name, "El banco de origen", true);
      const targetBank = type === "transfer" ? text(destinationAccount?.bank_name, "El banco de destino", true) : counterpartyBank;
      const sameBank = normalizeBankName(sourceBank) === normalizeBankName(targetBank);
      const requestedMode = String(body.transferMode || (sameBank ? "same_bank" : "ach"));
      if (sameBank && requestedMode !== "same_bank") throw new Error("Las cuentas pertenecen al mismo banco; usa transferencia al mismo banco");
      if (!sameBank && !["ach", "lbtr"].includes(requestedMode)) throw new Error("Selecciona ACH o LBTR para una transferencia interbancaria");
      transferMode = sameBank ? "same_bank" : requestedMode;
      const settings = await database.prepare("SELECT * FROM finance_settings WHERE owner_id=?").bind(ownerId).first<Row>();
      const fees = settingsTransferFees(settings);
      feeMinor = transferFeeFor(transferMode, sourceBank, targetBank, amountMinor, fees);
      const feeCategory = await database.prepare("SELECT id FROM finance_categories WHERE owner_id=? AND name=? AND kind='expense' LIMIT 1").bind(ownerId, "Comisiones bancarias").first<Row>();
      feeCategoryId = feeMinor > 0 && feeCategory?.id ? String(feeCategory.id) : null;
      if (type === "transfer") categoryId = feeCategoryId;
    }
    await sharedTask(body.taskId); await shared("home_projects",body.projectId);
    let goal: Row | null = null;
    let goalId: string | null = null;
    let goalConsumed = 0;
    if (type === "expense" && body.goalId) {
      goalId = text(body.goalId, "La meta", true);
      goal = await database.prepare("SELECT * FROM finance_goals WHERE id=? AND owner_id=?").bind(goalId, ownerId).first<Row>();
      if (!goal) throw new Error("La meta seleccionada no existe");
      if (String(goal.status) === "completed") throw new Error("La meta seleccionada ya fue completada");
      if (goal.category_id) categoryId = String(goal.category_id);
      goalConsumed = Math.min(Number(goal.reserved_minor || 0), amountMinor);
    }
    const id = uid();
    const statements: D1PreparedStatement[] = [database.prepare("INSERT INTO finance_transactions (id,owner_id,type,account_id,destination_account_id,amount_minor,transfer_mode,fee_minor,payment_method,counterparty_bank,fee_category_id,occurred_on,status,category_id,task_id,project_id,description,obligation_occurrence_id,reservation_consumed_minor,reservation_month,goal_id,goal_reservation_consumed_minor,voided_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id, ownerId, type, accountId, destination || null, amountMinor, transferMode, feeMinor, paymentMethod, counterpartyBank, feeCategoryId, occurredOn, "confirmed", categoryId, type === "expense" ? body.taskId || null : null, type === "expense" ? body.projectId || null : null, text(body.description, "El concepto", true), null, 0, "", goalId, goalConsumed, null, stamp, stamp)];
    if (goal && goalId) {
      const reserved = Math.max(0, Number(goal.reserved_minor || 0) - goalConsumed);
      const used = Number(goal.used_minor || 0) + goalConsumed;
      const target = Number(goal.target_minor || 0);
      const status = used >= target ? "completed" : reserved + used >= target ? "funded" : "active";
      statements.push(database.prepare("UPDATE finance_goals SET reserved_minor=?,used_minor=?,status=?,updated_at=? WHERE id=? AND owner_id=?").bind(reserved, used, status, stamp, goalId, ownerId));
    }
    await database.batch(statements);
    await rememberConcept(ownerId, body.description);
    await audit(ownerId, "transaction", id, "created", { type, amountMinor, feeMinor, transferMode, paymentMethod, goalId, goalConsumed, taskId: body.taskId || null });
    return;
  }
  if (action === "finance.transaction.update_amount") {
    const id = text(body.id, "El movimiento", true);
    const transaction = await database.prepare("SELECT * FROM finance_transactions WHERE id=? AND owner_id=?").bind(id, ownerId).first<Row>();
    if (!transaction) throw new Error("Movimiento no encontrado");
    if (String(transaction.status) !== "confirmed") throw new Error("Solo se pueden editar movimientos confirmados");
    const amountMinor = minor(body.amountMinor, "El importe", false);
    const accountId = body.accountId ? text(body.accountId, "La cuenta de origen", true) : String(transaction.account_id);
    const sourceAccount = await database.prepare("SELECT id,bank_name,opening_balance_date,archived FROM finance_accounts WHERE id=? AND owner_id=?").bind(accountId, ownerId).first<Row>();
    if (!sourceAccount || Number(sourceAccount.archived) === 1) throw new Error("La cuenta de origen no existe o está archivada");
    if (String(transaction.occurred_on) < String(sourceAccount.opening_balance_date)) throw new Error("La fecha del movimiento no puede ser anterior al saldo inicial de la cuenta seleccionada");
    const oldAmount = Number(transaction.amount_minor || 0);
    const type = String(transaction.type);
    const description = text(body.description !== undefined ? body.description : transaction.description, "El concepto");
    let categoryId: string | null = transaction.category_id ? String(transaction.category_id) : null;
    if ((type === "income" || type === "expense") && body.categoryId !== undefined) {
      categoryId = body.categoryId ? text(body.categoryId, "La categoría", true) : null;
      if (categoryId) {
        const category = await database.prepare("SELECT id,kind FROM finance_categories WHERE id=? AND owner_id=?").bind(categoryId, ownerId).first<Row>();
        if (!category || String(category.kind) !== type) throw new Error("La categoría no corresponde al tipo de movimiento");
      }
    }
    let paymentMethod = String(transaction.payment_method || "standard");
    let counterpartyBank = String(transaction.counterparty_bank || "");
    let transferMode: string | null = transaction.transfer_mode ? String(transaction.transfer_mode) : null;
    let feeMinor = 0;
    let feeCategoryId: string | null = transaction.fee_category_id ? String(transaction.fee_category_id) : null;
    const settings = await database.prepare("SELECT * FROM finance_settings WHERE owner_id=?").bind(ownerId).first<Row>();
    const fees = settingsTransferFees(settings);
    if (type === "expense") {
      paymentMethod = String(body.paymentMethod || paymentMethod) === "transfer" ? "transfer" : "standard";
      if (paymentMethod === "transfer") {
        const sourceBank = text(sourceAccount.bank_name, "El banco de origen", true);
        counterpartyBank = text(body.counterpartyBank !== undefined ? body.counterpartyBank : counterpartyBank, "El banco destino", true);
        const sameBank = normalizeBankName(sourceBank) === normalizeBankName(counterpartyBank);
        const requestedMode = String(body.transferMode || transferMode || (sameBank ? "same_bank" : "ach"));
        if (sameBank && requestedMode !== "same_bank") throw new Error("El banco destino coincide con el de origen; usa transferencia al mismo banco");
        if (!sameBank && !["ach", "lbtr"].includes(requestedMode)) throw new Error("Selecciona ACH o LBTR para una transferencia interbancaria");
        transferMode = sameBank ? "same_bank" : requestedMode;
        feeMinor = transferFeeFor(transferMode, sourceBank, counterpartyBank, amountMinor, fees);
        const feeCategory = await database.prepare("SELECT id FROM finance_categories WHERE owner_id=? AND name=? AND kind='expense' LIMIT 1").bind(ownerId, "Comisiones bancarias").first<Row>();
        feeCategoryId = feeMinor > 0 && feeCategory?.id ? String(feeCategory.id) : null;
      } else {
        counterpartyBank = "";
        transferMode = null;
        feeCategoryId = null;
      }
    } else if (type === "transfer") {
      paymentMethod = "transfer";
      const destinationAccount = await database.prepare("SELECT id,bank_name FROM finance_accounts WHERE id=? AND owner_id=?").bind(transaction.destination_account_id, ownerId).first<Row>();
      if (!destinationAccount) throw new Error("La cuenta destino no existe");
      if (accountId === String(transaction.destination_account_id)) throw new Error("La cuenta de origen debe ser diferente de la cuenta destino");
      const sourceBank = text(sourceAccount.bank_name, "El banco de origen", true);
      const targetBank = text(destinationAccount.bank_name, "El banco de destino", true);
      const sameBank = normalizeBankName(sourceBank) === normalizeBankName(targetBank);
      const requestedMode = String(body.transferMode || transferMode || (sameBank ? "same_bank" : "ach"));
      if (sameBank && requestedMode !== "same_bank") throw new Error("Las cuentas pertenecen al mismo banco; usa transferencia al mismo banco");
      if (!sameBank && !["ach", "lbtr"].includes(requestedMode)) throw new Error("Selecciona ACH o LBTR para una transferencia interbancaria");
      transferMode = sameBank ? "same_bank" : requestedMode;
      feeMinor = transferFeeFor(transferMode, sourceBank, targetBank, amountMinor, fees);
      const feeCategory = await database.prepare("SELECT id FROM finance_categories WHERE owner_id=? AND name=? AND kind='expense' LIMIT 1").bind(ownerId, "Comisiones bancarias").first<Row>();
      feeCategoryId = feeMinor > 0 && feeCategory?.id ? String(feeCategory.id) : null;
      categoryId = feeCategoryId;
    } else {
      paymentMethod = "standard";
      counterpartyBank = "";
      transferMode = null;
      feeCategoryId = null;
    }
    if (amountMinor === oldAmount && accountId === String(transaction.account_id) && categoryId === (transaction.category_id ? String(transaction.category_id) : null) && paymentMethod === String(transaction.payment_method || "standard") && description === String(transaction.description || "") && counterpartyBank === String(transaction.counterparty_bank || "") && transferMode === (transaction.transfer_mode ? String(transaction.transfer_mode) : null)) return;
    const statements: D1PreparedStatement[] = [];
    if (transaction.goal_id && Number(transaction.goal_reservation_consumed_minor || 0) > 0) {
      const goal = await database.prepare("SELECT * FROM finance_goals WHERE id=? AND owner_id=?").bind(transaction.goal_id, ownerId).first<Row>();
      if (!goal) throw new Error("La meta vinculada no existe");
      if (goal.category_id && categoryId !== String(goal.category_id)) throw new Error("La categoría de un gasto consumido de una meta está determinada por la meta");
      const previousConsumed = Number(transaction.goal_reservation_consumed_minor || 0);
      const availableBefore = Number(goal.reserved_minor || 0) + previousConsumed;
      const consumed = Math.min(availableBefore, amountMinor);
      const reserved = availableBefore - consumed;
      const used = Math.max(0, Number(goal.used_minor || 0) - previousConsumed) + consumed;
      const status = used >= Number(goal.target_minor || 0) ? "completed" : reserved + used >= Number(goal.target_minor || 0) ? "funded" : "active";
      statements.push(database.prepare("UPDATE finance_goals SET reserved_minor=?,used_minor=?,status=?,updated_at=? WHERE id=? AND owner_id=?").bind(reserved, used, status, stamp, goal.id, ownerId));
      statements.push(database.prepare("UPDATE finance_transactions SET account_id=?,amount_minor=?,payment_method=?,counterparty_bank=?,transfer_mode=?,fee_minor=?,fee_category_id=?,category_id=?,description=?,goal_reservation_consumed_minor=?,updated_at=? WHERE id=? AND owner_id=?").bind(accountId, amountMinor, paymentMethod, counterpartyBank, transferMode, feeMinor, feeCategoryId, categoryId, description, consumed, stamp, id, ownerId));
    } else if (transaction.obligation_occurrence_id) {
      const occurrence = await database.prepare("SELECT * FROM finance_obligation_occurrences WHERE id=? AND owner_id=?").bind(transaction.obligation_occurrence_id, ownerId).first<Row>();
      const obligation = occurrence ? await database.prepare("SELECT * FROM finance_obligations WHERE id=? AND owner_id=?").bind(occurrence.obligation_id, ownerId).first<Row>() : null;
      if (!occurrence || !obligation) throw new Error("La obligación vinculada no existe");
      const paid = Math.max(0, Number(occurrence.paid_minor || 0) - oldAmount + amountMinor);
      if (paid > Number(occurrence.expected_minor || 0)) throw new Error("El nuevo importe supera el saldo esperado de la obligación");
      const oldConsumed = Number(transaction.reservation_consumed_minor || 0);
      const availableBefore = Number(obligation.reserved_minor || 0) + oldConsumed;
      const consumed = String(transaction.type) === "expense" ? Math.min(availableBefore, amountMinor) : 0;
      const reserved = String(transaction.type) === "expense" ? availableBefore - consumed : Number(obligation.reserved_minor || 0);
      const status = paid >= Number(occurrence.expected_minor || 0) ? "paid" : paid > 0 ? "partial" : "pending";
      statements.push(database.prepare("UPDATE finance_obligation_occurrences SET paid_minor=?,status=?,updated_at=? WHERE id=? AND owner_id=?").bind(paid, status, stamp, occurrence.id, ownerId));
      statements.push(database.prepare("UPDATE finance_obligations SET reserved_minor=?,reserve_month=?,updated_at=? WHERE id=? AND owner_id=?").bind(reserved, reserved ? String(obligation.reserve_month || today().slice(0, 7)) : "", stamp, obligation.id, ownerId));
      if (obligation.category_id && categoryId !== String(obligation.category_id)) throw new Error("La categoría de un pago de obligación está determinada por la obligación");
      statements.push(database.prepare("UPDATE finance_transactions SET account_id=?,amount_minor=?,payment_method=?,counterparty_bank=?,transfer_mode=?,fee_minor=?,fee_category_id=?,category_id=?,description=?,reservation_consumed_minor=?,updated_at=? WHERE id=? AND owner_id=?").bind(accountId, amountMinor, paymentMethod, counterpartyBank, transferMode, feeMinor, feeCategoryId, categoryId, description, consumed, stamp, id, ownerId));
    } else {
      statements.push(database.prepare("UPDATE finance_transactions SET account_id=?,amount_minor=?,payment_method=?,counterparty_bank=?,transfer_mode=?,fee_minor=?,fee_category_id=?,category_id=?,description=?,updated_at=? WHERE id=? AND owner_id=?").bind(accountId, amountMinor, paymentMethod, counterpartyBank, transferMode, feeMinor, feeCategoryId, categoryId, description, stamp, id, ownerId));
    }
    await database.batch(statements);
    await rememberConcept(ownerId, description);
    await audit(ownerId, "transaction", id, "updated", { oldAmountMinor: oldAmount, amountMinor, oldAccountId: transaction.account_id, accountId, oldFeeMinor: Number(transaction.fee_minor || 0), feeMinor, categoryId, paymentMethod, description });
    return;
  }
  if (action === "finance.transaction.void") {
    const id = text(body.id, "El movimiento", true);
    const transaction = await database.prepare("SELECT * FROM finance_transactions WHERE id=? AND owner_id=?").bind(id, ownerId).first<Row>();
    if (!transaction) throw new Error("Movimiento no encontrado");
    if (String(transaction.status) === "voided") throw new Error("El movimiento ya está anulado");
    const statements: D1PreparedStatement[] = [];
    if (transaction.obligation_occurrence_id) {
      const occurrence = await database.prepare("SELECT * FROM finance_obligation_occurrences WHERE id=? AND owner_id=?").bind(transaction.obligation_occurrence_id, ownerId).first<Row>();
      if (!occurrence) throw new Error("El pago está vinculado a un vencimiento inexistente");
      const obligation = await database.prepare("SELECT * FROM finance_obligations WHERE id=? AND owner_id=?").bind(occurrence.obligation_id, ownerId).first<Row>();
      if (!obligation) throw new Error("El pago está vinculado a una obligación inexistente");
      const reversedPaid = Math.max(0, Number(occurrence.paid_minor) - Number(transaction.amount_minor));
      const nextStatus = reversedPaid === 0 ? "pending" : reversedPaid < Number(occurrence.expected_minor) ? "partial" : "paid";
      const latestPayment = await database.prepare("SELECT id FROM finance_transactions WHERE owner_id=? AND obligation_occurrence_id=? AND id!=? AND status='confirmed' ORDER BY created_at DESC LIMIT 1")
        .bind(ownerId, occurrence.id, id).first<Row>();
      if (String(occurrence.status) === "paid" && nextStatus !== "paid") {
        if (String(obligation.frequency) !== "once") {
          const nextDue = nextRecurringDate(String(occurrence.due_date), String(obligation.frequency));
          const nextOccurrence = await database.prepare("SELECT * FROM finance_obligation_occurrences WHERE owner_id=? AND obligation_id=? AND due_date=? AND id!=? ORDER BY created_at LIMIT 1")
            .bind(ownerId, obligation.id, nextDue, occurrence.id).first<Row>();
          if (nextOccurrence && (Number(nextOccurrence.paid_minor) > 0 || String(nextOccurrence.status) !== "pending")) {
            throw new Error("No se puede anular este pago porque el siguiente vencimiento ya tiene movimientos");
          }
          if (nextOccurrence) statements.push(database.prepare("DELETE FROM finance_obligation_occurrences WHERE id=? AND owner_id=?").bind(nextOccurrence.id, ownerId));
        }
        statements.push(database.prepare("UPDATE finance_obligations SET next_due_date=?,active=1,updated_at=? WHERE id=? AND owner_id=?").bind(occurrence.due_date, stamp, obligation.id, ownerId));
      }
      const restoredReservation = Number(obligation.reserved_minor) + Number(transaction.reservation_consumed_minor || 0);
      statements.push(
        database.prepare("UPDATE finance_obligation_occurrences SET paid_minor=?,status=?,transaction_id=?,updated_at=? WHERE id=? AND owner_id=?")
          .bind(reversedPaid, nextStatus, latestPayment?.id || null, stamp, occurrence.id, ownerId),
        database.prepare("UPDATE finance_obligations SET reserved_minor=?,reserve_month=?,updated_at=? WHERE id=? AND owner_id=?")
          .bind(restoredReservation, restoredReservation ? String(transaction.reservation_month || today().slice(0, 7)) : "", stamp, obligation.id, ownerId),
      );
    }
    if (transaction.goal_id && Number(transaction.goal_reservation_consumed_minor || 0) > 0) {
      const goal = await database.prepare("SELECT * FROM finance_goals WHERE id=? AND owner_id=?").bind(transaction.goal_id, ownerId).first<Row>();
      if (!goal) throw new Error("El gasto está vinculado a una meta inexistente");
      const restored = Number(goal.reserved_minor || 0) + Number(transaction.goal_reservation_consumed_minor || 0);
      const used = Math.max(0, Number(goal.used_minor || 0) - Number(transaction.goal_reservation_consumed_minor || 0));
      const status = restored + used >= Number(goal.target_minor) ? "funded" : "active";
      statements.push(database.prepare("UPDATE finance_goals SET reserved_minor=?,used_minor=?,status=?,updated_at=? WHERE id=? AND owner_id=?").bind(restored, used, status, stamp, goal.id, ownerId));
    }
    statements.push(database.prepare("UPDATE finance_transactions SET status='voided',voided_at=?,updated_at=? WHERE id=? AND owner_id=?").bind(stamp, stamp, id, ownerId));
    await database.batch(statements);
    await audit(ownerId, "transaction", id, "voided", { reason: text(body.reason, "El motivo") });
    return;
  }
  if (action === "finance.budget.set") {
    const month = text(body.month, "El mes", true);
    if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("Mes inválido");
    const categoryId = text(body.categoryId, "La categoría", true);
    const category = await database.prepare("SELECT id,kind FROM finance_categories WHERE id=? AND owner_id=?").bind(categoryId, ownerId).first<Row>();
    if (!category || String(category.kind) !== "expense") throw new Error("El presupuesto sólo admite categorías de gasto");
    const existing = await database.prepare("SELECT id FROM finance_budgets WHERE owner_id=? AND month=? AND category_id=? AND allocation_type='base' LIMIT 1").bind(ownerId, month, categoryId).first<{ id: string }>();
    const concept = text(body.concept || "Asignación base", "El concepto", true);
    const assigned = minor(body.assignedMinor, "La asignación");
    if (existing) await database.prepare("UPDATE finance_budgets SET assigned_minor=?,concept=?,allocation_type='base',updated_at=? WHERE id=? AND owner_id=?").bind(assigned, concept, stamp, existing.id, ownerId).run();
    else await database.prepare("INSERT INTO finance_budgets (id,owner_id,month,category_id,assigned_minor,concept,allocation_type,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(uid(), ownerId, month, categoryId, assigned, concept, "base", stamp, stamp).run();
    await rememberConcept(ownerId, concept);
    await audit(ownerId, "budget", `${month}:${categoryId}`, "set", { assignedMinor: body.assignedMinor });
    return;
  }
  if (action === "finance.budget.update") {
    const id = text(body.id, "El presupuesto", true);
    const existing = await database.prepare("SELECT id FROM finance_budgets WHERE id=? AND owner_id=?").bind(id, ownerId).first<Row>();
    if (!existing) throw new Error("Asignación presupuestaria no encontrada");
    const month = text(body.month, "El mes", true);
    if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("Mes inválido");
    const categoryId = text(body.categoryId, "La categoría", true);
    const category = await database.prepare("SELECT id,kind FROM finance_categories WHERE id=? AND owner_id=?").bind(categoryId, ownerId).first<Row>();
    if (!category || String(category.kind) !== "expense") throw new Error("El presupuesto sólo admite categorías de gasto");
    const assigned = minor(body.assignedMinor, "La asignación");
    const concept = text(body.concept || "Asignación base", "El concepto", true);
    const allocationType = String(body.allocationType) === "additional" ? "additional" : "base";
    await database.prepare("UPDATE finance_budgets SET month=?,category_id=?,assigned_minor=?,concept=?,allocation_type=?,updated_at=? WHERE id=? AND owner_id=?")
      .bind(month, categoryId, assigned, concept, allocationType, stamp, id, ownerId).run();
    await rememberConcept(ownerId, concept);
    await audit(ownerId, "budget", id, "updated", { month, categoryId, assignedMinor: assigned });
    return;
  }
  if (action === "finance.budget.addition.create") {
    const month = text(body.month, "El mes", true);
    if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("Mes inválido");
    const categoryId = text(body.categoryId, "La categoría", true);
    const category = await database.prepare("SELECT id,kind FROM finance_categories WHERE id=? AND owner_id=?").bind(categoryId, ownerId).first<Row>();
    if (!category || String(category.kind) !== "expense") throw new Error("La categoría presupuestaria no es válida");
    const concept = text(body.concept, "El concepto", true);
    const amount = minor(body.assignedMinor, "La asignación", false);
    const id = uid();
    await database.prepare("INSERT INTO finance_budgets (id,owner_id,month,category_id,assigned_minor,concept,allocation_type,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)")
      .bind(id, ownerId, month, categoryId, amount, concept, "additional", stamp, stamp).run();
    await rememberConcept(ownerId, concept);
    await audit(ownerId, "budget", id, "addition_created", { month, categoryId, concept, amount });
    return;
  }
  if (action === "finance.budget.delete") {
    const id = text(body.id, "El presupuesto", true);
    const existing = await database.prepare("SELECT id FROM finance_budgets WHERE id=? AND owner_id=?").bind(id, ownerId).first<Row>();
    if (!existing) throw new Error("Asignación presupuestaria no encontrada");
    await database.prepare("DELETE FROM finance_budgets WHERE id=? AND owner_id=?").bind(id, ownerId).run();
    await audit(ownerId, "budget", id, "deleted");
    return;
  }
  if (action === "finance.obligation.create") {
    const id = uid();
    const amount = minor(body.expectedAmountMinor, "El importe", false);
    const concept = text(body.concept || body.title, "El concepto", true);
    const due = date(body.nextDueDate, "El vencimiento", true);
    const frequency = ["once", "weekly", "monthly", "yearly"].includes(String(body.frequency)) ? String(body.frequency) : "monthly";
    const kind = String(body.kind) === "income" ? "income" : "expense";
    const reserved = kind === "expense" ? minor(body.reservedMinor || 0, "La reserva") : 0;
    if (reserved > amount) throw new Error("La reserva no puede superar el importe esperado del próximo vencimiento");
    const occurrenceId = uid();
    if(body.accountId) await owned("finance_accounts",String(body.accountId),ownerId);
    let categoryId = body.categoryId ? String(body.categoryId) : "";
    if (kind === "expense" && !categoryId) {
      const fallback = await database.prepare("SELECT id FROM finance_categories WHERE owner_id=? AND kind='expense' AND name='Compromisos' LIMIT 1").bind(ownerId).first<Row>();
      categoryId = fallback ? String(fallback.id) : "";
    }
    if(categoryId) {
      const category = await database.prepare("SELECT id,kind FROM finance_categories WHERE id=? AND owner_id=?").bind(categoryId, ownerId).first<Row>();
      if (!category || String(category.kind) !== kind) throw new Error("La categoría no corresponde al tipo de obligación");
    }
    if (kind === "expense" && !categoryId) throw new Error("Toda obligación de gasto necesita una categoría presupuestaria");
    const coveredByBudget = kind === "expense";
    await database.batch([
      database.prepare("INSERT INTO finance_obligations (id,owner_id,title,concept,kind,expected_amount_minor,reserved_minor,account_id,category_id,frequency,covered_by_budget,reserve_month,next_due_date,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(id, ownerId, text(body.title, "El título", true), concept, kind, amount, reserved, body.accountId || null, categoryId || null, frequency, coveredByBudget ? 1 : 0, reserved ? today().slice(0, 7) : "", due, 1, stamp, stamp),
      database.prepare("INSERT INTO finance_obligation_occurrences (id,owner_id,obligation_id,due_date,expected_minor,paid_minor,status,transaction_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
        .bind(occurrenceId, ownerId, id, due, amount, 0, "pending", null, stamp, stamp),
    ]);
    await rememberConcept(ownerId, concept);
    await audit(ownerId, "obligation", id, "created");
    return;
  }
  if (action === "finance.obligation.update") {
    const id = text(body.id, "La obligación", true);
    const existing = await database.prepare("SELECT * FROM finance_obligations WHERE id=? AND owner_id=?").bind(id, ownerId).first<Row>();
    if (!existing) throw new Error("Obligación no encontrada");
    const amount = minor(body.expectedAmountMinor, "El importe", false);
    const concept = Object.prototype.hasOwnProperty.call(body, "concept") ? text(body.concept, "El concepto") : text(existing.concept || existing.title, "El concepto", true);
    const due = date(body.nextDueDate, "El vencimiento", true);
    const frequency = ["once", "weekly", "monthly", "yearly"].includes(String(body.frequency)) ? String(body.frequency) : "monthly";
    const kind = String(body.kind) === "income" ? "income" : "expense";
    const reserved = kind === "expense" ? minor(body.reservedMinor || 0, "La reserva") : 0;
    if (reserved > amount) throw new Error("La reserva no puede superar el importe esperado del próximo vencimiento");
    if (body.accountId) await owned("finance_accounts", String(body.accountId), ownerId);
    let categoryId = body.categoryId ? String(body.categoryId) : "";
    if (kind === "expense" && !categoryId) {
      const fallback = await database.prepare("SELECT id FROM finance_categories WHERE owner_id=? AND kind='expense' AND name='Compromisos' LIMIT 1").bind(ownerId).first<Row>();
      categoryId = fallback ? String(fallback.id) : "";
    }
    if (categoryId) {
      const category = await database.prepare("SELECT id,kind FROM finance_categories WHERE id=? AND owner_id=?").bind(categoryId, ownerId).first<Row>();
      if (!category || String(category.kind) !== kind) throw new Error("La categoría no corresponde al tipo de obligación");
    }
    if (kind === "expense" && !categoryId) throw new Error("Toda obligación de gasto necesita una categoría presupuestaria");
    if (String(existing.kind) !== kind) {
      const linkedPayment = await database.prepare("SELECT id FROM finance_transactions WHERE owner_id=? AND obligation_occurrence_id IN (SELECT id FROM finance_obligation_occurrences WHERE obligation_id=? ) LIMIT 1").bind(ownerId, id).first<Row>();
      if (linkedPayment) throw new Error("No se puede cambiar el tipo de una obligación que ya tiene cobros o pagos registrados");
    }
    const pending = await database.prepare("SELECT id,paid_minor FROM finance_obligation_occurrences WHERE owner_id=? AND obligation_id=? AND status!='paid' ORDER BY due_date,created_at LIMIT 1").bind(ownerId, id).first<Row>();
    if (pending && Number(pending.paid_minor) > amount) throw new Error("El importe no puede ser menor que lo ya pagado o cobrado en el próximo vencimiento");
    const coveredByBudget = kind === "expense" ? 1 : 0;
    const reserveMonth = reserved ? today().slice(0, 7) : "";
    const statements: D1PreparedStatement[] = [
      database.prepare("UPDATE finance_obligations SET title=?,concept=?,kind=?,expected_amount_minor=?,reserved_minor=?,account_id=?,category_id=?,frequency=?,covered_by_budget=?,reserve_month=?,next_due_date=?,updated_at=? WHERE id=? AND owner_id=?")
        .bind(text(body.title, "El título", true), concept, kind, amount, reserved, body.accountId || null, categoryId || null, frequency, coveredByBudget, reserveMonth, due, stamp, id, ownerId),
    ];
    if (pending) {
      const paidMinor = Number(pending.paid_minor || 0);
      statements.push(database.prepare("UPDATE finance_obligation_occurrences SET due_date=?,expected_minor=?,status=?,updated_at=? WHERE id=? AND owner_id=?")
        .bind(due, amount, paidMinor >= amount ? "paid" : paidMinor > 0 ? "partial" : "pending", stamp, pending.id, ownerId));
    } else if (Number(existing.active) === 1 && frequency !== "once") {
      statements.push(database.prepare("INSERT INTO finance_obligation_occurrences (id,owner_id,obligation_id,due_date,expected_minor,paid_minor,status,transaction_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
        .bind(uid(), ownerId, id, due, amount, 0, "pending", null, stamp, stamp));
    }
    await database.batch(statements);
    await rememberConcept(ownerId, concept);
    await audit(ownerId, "obligation", id, "updated", { kind, amount, due, frequency });
    return;
  }
  if (action === "finance.obligation.pay") {
    const occurrenceId = text(body.occurrenceId, "La ocurrencia", true);
    const occurrence = await database.prepare("SELECT * FROM finance_obligation_occurrences WHERE id=? AND owner_id=?").bind(occurrenceId, ownerId).first<Row>();
    if (!occurrence) throw new Error("Vencimiento no encontrado");
    const obligation = await database.prepare("SELECT * FROM finance_obligations WHERE id=? AND owner_id=?").bind(occurrence.obligation_id, ownerId).first<Row>();
    if (!obligation) throw new Error("Obligación no encontrada");
    const accountId = text(body.accountId || obligation.account_id, "La cuenta", true);
    const account = await database.prepare("SELECT id,bank_name,opening_balance_date,archived FROM finance_accounts WHERE id=? AND owner_id=?").bind(accountId, ownerId).first<Row>();
    if (!account || Number(account.archived) === 1) throw new Error("La cuenta no existe o está archivada");
    const occurredOn = date(body.occurredOn || today(), "La fecha", true);
    if (occurredOn > today()) throw new Error("Un pago o cobro de obligación no puede registrarse en el futuro");
    if (occurredOn < String(account.opening_balance_date)) throw new Error("La fecha no puede ser anterior al saldo inicial de la cuenta");
    const remaining = Number(occurrence.expected_minor) - Number(occurrence.paid_minor);
    if (remaining <= 0) throw new Error("Este vencimiento ya está pagado");
    const paid = minor(body.amountMinor, "El pago", false);
    if (paid > remaining) throw new Error("El pago no puede superar el saldo pendiente del vencimiento");
    const type = String(obligation.kind) === "income" ? "income" : "expense";
    const description = text(body.description !== undefined ? body.description : (obligation.concept || obligation.title), "El concepto", true);
    const paymentMethod = type === "expense" && String(body.paymentMethod) === "transfer" ? "transfer" : "standard";
    const counterpartyBank = paymentMethod === "transfer" ? text(body.counterpartyBank, "El banco destino", true) : "";
    let transferMode: string | null = null;
    let feeMinor = 0;
    let feeCategoryId: string | null = null;
    if (paymentMethod === "transfer") {
      const sourceBank = text(account.bank_name, "El banco de origen", true);
      const sameBank = normalizeBankName(sourceBank) === normalizeBankName(counterpartyBank);
      const requestedMode = String(body.transferMode || (sameBank ? "same_bank" : "ach"));
      if (sameBank && requestedMode !== "same_bank") throw new Error("El banco destino coincide con el de origen; usa transferencia al mismo banco");
      if (!sameBank && !["ach", "lbtr"].includes(requestedMode)) throw new Error("Selecciona ACH o LBTR para una transferencia interbancaria");
      transferMode = sameBank ? "same_bank" : requestedMode;
      const settings = await database.prepare("SELECT * FROM finance_settings WHERE owner_id=?").bind(ownerId).first<Row>();
      feeMinor = transferFeeFor(transferMode, sourceBank, counterpartyBank, paid, settingsTransferFees(settings));
      const feeCategory = await database.prepare("SELECT id FROM finance_categories WHERE owner_id=? AND name=? AND kind='expense' LIMIT 1").bind(ownerId, "Comisiones bancarias").first<Row>();
      feeCategoryId = feeMinor > 0 && feeCategory?.id ? String(feeCategory.id) : null;
    }
    await sharedTask(type === "expense" ? body.taskId : null);
    await shared("home_projects", type === "expense" ? body.projectId : null);
    const transactionId = uid();
    const totalPaid = Number(occurrence.paid_minor) + paid;
    const full = totalPaid >= Number(occurrence.expected_minor);
    const reservation = String(obligation.kind) === "expense" ? consumeReservation(Number(obligation.reserved_minor), paid) : { consumedMinor: 0, remainingReservedMinor: Number(obligation.reserved_minor) };
    const reservationMonth = reservation.consumedMinor ? String(obligation.reserve_month || "") : "";
    const statements = [
      database.prepare("INSERT INTO finance_transactions (id,owner_id,type,account_id,destination_account_id,amount_minor,transfer_mode,fee_minor,payment_method,counterparty_bank,fee_category_id,occurred_on,status,category_id,task_id,project_id,description,obligation_occurrence_id,reservation_consumed_minor,reservation_month,goal_id,goal_reservation_consumed_minor,voided_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(transactionId, ownerId, type, accountId, null, paid, transferMode, feeMinor, paymentMethod, counterpartyBank, feeCategoryId, occurredOn, "confirmed", obligation.category_id || null, type === "expense" ? body.taskId || null : null, type === "expense" ? body.projectId || null : null, description, occurrenceId, reservation.consumedMinor, reservationMonth, null, 0, null, stamp, stamp),
      database.prepare("UPDATE finance_obligation_occurrences SET paid_minor=?,status=?,transaction_id=?,updated_at=? WHERE id=? AND owner_id=?")
        .bind(totalPaid, full ? "paid" : "partial", transactionId, stamp, occurrenceId, ownerId),
      database.prepare("UPDATE finance_obligations SET reserved_minor=?,reserve_month=?,updated_at=? WHERE id=? AND owner_id=?")
        .bind(reservation.remainingReservedMinor, reservation.remainingReservedMinor ? String(obligation.reserve_month || today().slice(0, 7)) : "", stamp, obligation.id, ownerId),
    ];
    if (full && String(obligation.frequency) !== "once") {
      const due = nextRecurringDate(String(occurrence.due_date), String(obligation.frequency));
      statements.push(database.prepare("UPDATE finance_obligations SET next_due_date=?,updated_at=? WHERE id=? AND owner_id=?").bind(due, stamp, obligation.id, ownerId));
      statements.push(database.prepare("INSERT INTO finance_obligation_occurrences (id,owner_id,obligation_id,due_date,expected_minor,paid_minor,status,transaction_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
        .bind(uid(), ownerId, obligation.id, due, obligation.expected_amount_minor, 0, "pending", null, stamp, stamp));
    } else if (full) statements.push(database.prepare("UPDATE finance_obligations SET active=0,updated_at=? WHERE id=? AND owner_id=?").bind(stamp, obligation.id, ownerId));
    await database.batch(statements);
    await rememberConcept(ownerId, description);
    await audit(ownerId, "obligation", String(obligation.id), full ? "paid" : "partially_paid", { paid, feeMinor, paymentMethod, taskId: body.taskId || null, projectId: body.projectId || null });
    return;
  }
  if (action === "finance.goal.create") {
    const id = uid();
    if(body.accountId) await owned("finance_accounts",String(body.accountId),ownerId);
    let categoryId = body.categoryId ? String(body.categoryId) : "";
    if (!categoryId) categoryId = String((await database.prepare("SELECT id FROM finance_categories WHERE owner_id=? AND name='Metas' AND kind='expense' LIMIT 1").bind(ownerId).first<Row>())?.id || "");
    const category = await database.prepare("SELECT id,kind FROM finance_categories WHERE id=? AND owner_id=?").bind(categoryId, ownerId).first<Row>();
    if (!category || String(category.kind) !== "expense") throw new Error("La categoría de la meta debe ser de gasto");
    await sharedTask(body.linkedTaskId); await shared("home_projects",body.linkedProjectId);
    await database.prepare("INSERT INTO finance_goals (id,owner_id,title,target_minor,reserved_minor,used_minor,target_date,priority,account_id,category_id,covered_by_budget,linked_task_id,linked_project_id,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id, ownerId, text(body.title, "El nombre", true), minor(body.targetMinor, "La meta", false), 0, 0, date(body.targetDate, "La fecha objetivo"), text(body.priority, "La prioridad") || "media", body.accountId || null, categoryId, 1, body.linkedTaskId || null, body.linkedProjectId || null, "active", stamp, stamp).run();
    await audit(ownerId, "goal", id, "created");
    return;
  }
  if (action === "finance.goal.update") {
    const id = text(body.id, "La meta", true);
    const goal = await database.prepare("SELECT * FROM finance_goals WHERE id=? AND owner_id=?").bind(id, ownerId).first<Row>();
    if (!goal) throw new Error("Meta no encontrada");
    if (body.accountId) await owned("finance_accounts", String(body.accountId), ownerId);
    await sharedTask(body.linkedTaskId); await shared("home_projects", body.linkedProjectId);
    const target = minor(body.targetMinor, "La meta", false);
    const reserved = Number(goal.reserved_minor || 0), used = Number(goal.used_minor || 0);
    if (target < reserved + used) throw new Error("El objetivo no puede ser menor que lo ya reservado y utilizado");
    const categoryId = body.categoryId ? String(body.categoryId) : String((await database.prepare("SELECT id FROM finance_categories WHERE owner_id=? AND name='Metas' AND kind='expense' LIMIT 1").bind(ownerId).first<Row>())?.id || "");
    const category = await database.prepare("SELECT id,kind FROM finance_categories WHERE id=? AND owner_id=?").bind(categoryId, ownerId).first<Row>();
    if (!category || String(category.kind) !== "expense") throw new Error("La categoría de la meta debe ser de gasto");
    const status = used >= target ? "completed" : reserved + used >= target ? "funded" : "active";
    await database.prepare("UPDATE finance_goals SET title=?,target_minor=?,target_date=?,priority=?,account_id=?,category_id=?,covered_by_budget=1,linked_task_id=?,linked_project_id=?,status=?,updated_at=? WHERE id=? AND owner_id=?")
      .bind(text(body.title, "El nombre", true), target, date(body.targetDate, "La fecha objetivo"), text(body.priority, "La prioridad") || "media", body.accountId || null, categoryId, body.linkedTaskId || null, body.linkedProjectId || null, status, stamp, id, ownerId).run();
    await audit(ownerId, "goal", id, "updated", { target, categoryId });
    return;
  }
  if (action === "finance.goal.contribute") {
    const goalId = text(body.goalId, "La meta", true);
    const goal = await database.prepare("SELECT * FROM finance_goals WHERE id=? AND owner_id=?").bind(goalId, ownerId).first<Row>();
    if (!goal) throw new Error("Meta no encontrada");
    const amount = minor(body.amountMinor, "El aporte", false);
    const remaining = Number(goal.target_minor) - Number(goal.reserved_minor) - Number(goal.used_minor || 0);
    if (remaining <= 0) throw new Error("La meta ya está financiada");
    if (amount > remaining) throw new Error("El aporte no puede superar lo que falta para completar la meta");
    const occurredOn = date(body.occurredOn || today(), "La fecha", true);
    if (occurredOn > today()) throw new Error("Un aporte a una meta no puede registrarse en el futuro");
    const next = Number(goal.reserved_minor) + amount;
    const totalFunded = next + Number(goal.used_minor || 0);
    const entryId = uid();
    await database.batch([
      database.prepare("UPDATE finance_goals SET reserved_minor=?,status=?,updated_at=? WHERE id=? AND owner_id=?")
        .bind(next, totalFunded >= Number(goal.target_minor) ? "funded" : "active", stamp, goalId, ownerId),
      database.prepare("INSERT INTO finance_goal_entries (id,owner_id,goal_id,amount_minor,occurred_on,concept,note,voided_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
        .bind(entryId, ownerId, goalId, amount, occurredOn, String(goal.title), text(body.note, "La nota"), null, stamp, stamp),
    ]);
    await audit(ownerId, "goal", goalId, "contribution", { amount });
    return;
  }
  if (action === "finance.goal.entry.update") {
    const entryId = text(body.id, "El aporte", true);
    const entry = await database.prepare("SELECT * FROM finance_goal_entries WHERE id=? AND owner_id=?").bind(entryId, ownerId).first<Row>();
    if (!entry || entry.voided_at) throw new Error("Aporte no encontrado o ya revertido");
    const goal = await database.prepare("SELECT * FROM finance_goals WHERE id=? AND owner_id=?").bind(entry.goal_id, ownerId).first<Row>();
    if (!goal) throw new Error("Meta no encontrada");
    const amount = minor(body.amountMinor, "El aporte", false);
    const delta = amount - Number(entry.amount_minor);
    const reserved = Number(goal.reserved_minor || 0);
    if (delta < 0 && -delta > reserved) throw new Error("No puedes reducir una parte de la reserva que ya fue utilizada en un gasto");
    if (delta > 0 && delta > Number(goal.target_minor) - reserved - Number(goal.used_minor || 0)) throw new Error("El aporte supera lo que falta para completar la meta");
    const next = reserved + delta, used = Number(goal.used_minor || 0), target = Number(goal.target_minor);
    const status = used >= target ? "completed" : next + used >= target ? "funded" : "active";
    await database.batch([
      database.prepare("UPDATE finance_goal_entries SET amount_minor=?,updated_at=? WHERE id=? AND owner_id=?").bind(amount, stamp, entryId, ownerId),
      database.prepare("UPDATE finance_goals SET reserved_minor=?,status=?,updated_at=? WHERE id=? AND owner_id=?").bind(next, status, stamp, goal.id, ownerId),
    ]);
    await audit(ownerId, "goal", String(goal.id), "contribution_updated", { entryId, previous: entry.amount_minor, amount });
    return;
  }
  if (action === "finance.goal.entry.revert") {
    const entryId = text(body.id, "El aporte", true);
    const entry = await database.prepare("SELECT * FROM finance_goal_entries WHERE id=? AND owner_id=?").bind(entryId, ownerId).first<Row>();
    if (!entry || entry.voided_at) throw new Error("Aporte no encontrado o ya revertido");
    const goal = await database.prepare("SELECT * FROM finance_goals WHERE id=? AND owner_id=?").bind(entry.goal_id, ownerId).first<Row>();
    if (!goal) throw new Error("Meta no encontrada");
    const amount = Number(entry.amount_minor), reserved = Number(goal.reserved_minor || 0);
    if (amount > reserved) throw new Error("Este aporte ya fue utilizado total o parcialmente y no puede revertirse completo");
    const next = reserved - amount, used = Number(goal.used_minor || 0), target = Number(goal.target_minor);
    const status = used >= target ? "completed" : next + used >= target ? "funded" : "active";
    await database.batch([
      database.prepare("UPDATE finance_goal_entries SET voided_at=?,updated_at=? WHERE id=? AND owner_id=?").bind(stamp, stamp, entryId, ownerId),
      database.prepare("UPDATE finance_goals SET reserved_minor=?,status=?,updated_at=? WHERE id=? AND owner_id=?").bind(next, status, stamp, goal.id, ownerId),
    ]);
    await audit(ownerId, "goal", String(goal.id), "contribution_reverted", { entryId, amount });
    return;
  }
  if (action === "finance.settings.update") {
    const profiles = transferProfiles(body.transferBankFees);
    await database.prepare("UPDATE finance_settings SET safety_buffer_minor=?,timezone=?,transfer_same_bank_rate_bps=?,transfer_ach_rate_bps=?,transfer_lbtr_surcharge_minor=?,transfer_bank_fees_json=?,updated_at=? WHERE owner_id=?")
      .bind(minor(body.safetyBufferMinor, "El colchón"), text(body.timezone, "La zona horaria") || "America/Santo_Domingo", rateBps(body.transferSameBankRateBps ?? 0, "El porcentaje del mismo banco"), rateBps(body.transferAchRateBps ?? 0, "El porcentaje ACH"), minor(body.transferLbtrSurchargeMinor ?? 0, "El cargo adicional LBTR"), JSON.stringify(profiles), stamp, ownerId).run();
    await audit(ownerId, "settings", ownerId, "updated");
    return;
  }
  if (action === "backup.restoreV2") {
    const source = body.data as Record<string, unknown>;
    if (!source || Number(source.version) !== 2 || !Array.isArray(source.areas) || !Array.isArray(source.projects) || !Array.isArray(source.events)) {
      throw new Error("El respaldo integral no es válido o pertenece a una versión incompatible");
    }
    const finance = source.finance as Record<string, unknown>;
    if (!finance || !Array.isArray(finance.accounts) || !Array.isArray(finance.categories) || !Array.isArray(finance.transactions)) {
      throw new Error("El respaldo no contiene una estructura financiera válida");
    }
    const rows = (value: unknown) => Array.isArray(value) ? value as Record<string, unknown>[] : [];
    const ids = (value: unknown, label: string) => {
      const list = rows(value).map((x) => String(x.id || ""));
      if (list.some((x) => !x) || new Set(list).size !== list.length) throw new Error(`${label} contiene identificadores inválidos`);
      return new Set(list);
    };
    const areaIds = ids(source.areas, "Las áreas");
    const projectIds = ids(source.projects, "Los proyectos");
    const accountIds = ids(finance.accounts, "Las cuentas");
    const categoryIds = ids(finance.categories, "Las categorías");
    const obligationIds = ids(finance.obligations, "Las obligaciones");
    const goalIds = ids(finance.goals, "Las metas");
    for (const p of rows(source.projects)) if (p.areaId && !areaIds.has(String(p.areaId))) throw new Error("Un proyecto apunta a un área inexistente");
    for (const e of rows(source.events)) if (e.projectId && !projectIds.has(String(e.projectId))) throw new Error("Un evento apunta a un proyecto inexistente");
    for (const t of rows(finance.transactions)) {
      if (!accountIds.has(String(t.accountId || ""))) throw new Error("Un movimiento apunta a una cuenta inexistente");
      if (t.destinationAccountId && !accountIds.has(String(t.destinationAccountId))) throw new Error("Una transferencia apunta a una cuenta destino inexistente");
      if (t.categoryId && !categoryIds.has(String(t.categoryId))) throw new Error("Un movimiento apunta a una categoría inexistente");
    }
    const statements = [
      database.prepare("DELETE FROM finance_goal_entries WHERE owner_id=?").bind(ownerId),
      database.prepare("DELETE FROM finance_obligation_occurrences WHERE owner_id=?").bind(ownerId),
      database.prepare("DELETE FROM finance_transactions WHERE owner_id=?").bind(ownerId),
      database.prepare("DELETE FROM finance_budgets WHERE owner_id=?").bind(ownerId),
      database.prepare("DELETE FROM finance_goals WHERE owner_id=?").bind(ownerId),
      database.prepare("DELETE FROM finance_obligations WHERE owner_id=?").bind(ownerId),
      database.prepare("DELETE FROM finance_accounts WHERE owner_id=?").bind(ownerId),
      database.prepare("DELETE FROM finance_categories WHERE owner_id=?").bind(ownerId),
      database.prepare("DELETE FROM finance_concepts WHERE owner_id=?").bind(ownerId),
      database.prepare("DELETE FROM calendar_events WHERE owner_id=?").bind(ownerId),
      database.prepare("DELETE FROM audit_log WHERE owner_id=?").bind(ownerId),
      database.prepare("DELETE FROM finance_settings WHERE owner_id=?").bind(ownerId),
      database.prepare("DELETE FROM home_projects WHERE scope_id=?").bind(HOUSEHOLD_SCOPE),
      database.prepare("DELETE FROM home_areas WHERE scope_id=?").bind(HOUSEHOLD_SCOPE),
    ];
    for (const a of rows(source.areas)) statements.push(database.prepare("INSERT INTO home_areas (id,scope_id,name,color,order_index,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").bind(String(a.id), HOUSEHOLD_SCOPE, text(a.name, "El área", true), text(a.color, "El color") || "#2463eb", Number(a.order || 0), stamp, stamp));
    for (const p of rows(source.projects)) statements.push(database.prepare("INSERT INTO home_projects (id,scope_id,area_id,name,description,status,start_date,target_date,budget_minor,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(String(p.id), HOUSEHOLD_SCOPE, p.areaId || null, text(p.name, "El proyecto", true), text(p.description, "La descripción"), text(p.status, "El estado") || "active", date(p.startDate, "El inicio"), date(p.targetDate, "La fecha objetivo"), p.budgetMinor == null ? null : minor(p.budgetMinor, "El presupuesto"), stamp, stamp));
    for (const e of rows(source.events)) statements.push(database.prepare("INSERT INTO calendar_events (id,owner_id,title,description,location,start_date,end_date,start_time,end_time,all_day,timezone,status,recurrence,recurrence_until,area_id,project_id,linked_task_id,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(String(e.id), ownerId, text(e.title, "El evento", true), text(e.description, "La descripción"), text(e.location, "La ubicación"), date(e.startDate, "El inicio", true), date(e.endDate || e.startDate, "El final", true), time(e.startTime, "La hora"), time(e.endTime, "La hora"), boolean(e.allDay) ? 1 : 0, text(e.timezone, "La zona") || "America/Santo_Domingo", text(e.status, "El estado") || "scheduled", text(e.recurrence, "La recurrencia") || "none", date(e.recurrenceUntil, "El fin de recurrencia"), e.areaId || null, e.projectId || null, e.linkedTaskId || null, text(e.notes, "Las notas"), stamp, stamp));
    for (const a of rows(finance.accounts)) statements.push(database.prepare("INSERT INTO finance_accounts (id,owner_id,name,type,bank_name,currency,opening_balance_minor,opening_balance_date,archived,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(String(a.id), ownerId, text(a.name, "La cuenta", true), text(a.type, "El tipo") || "bank", text(a.bankName, "El banco"), "DOP", minor(a.openingBalanceMinor, "El saldo inicial"), date(a.openingBalanceDate, "La fecha de corte", true), boolean(a.archived) ? 1 : 0, stamp, stamp));
    for (const c of rows(finance.categories)) statements.push(database.prepare("INSERT INTO finance_categories (id,owner_id,name,kind,color,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").bind(String(c.id), ownerId, text(c.name, "La categoría", true), text(c.kind, "El tipo") || "expense", text(c.color, "El color") || "#2463eb", stamp, stamp));
    for (const c of rows(finance.concepts)) { const concept = text(c.concept, "El concepto", true).replace(/\s+/g, " ").trim(); const normalized = normalizeConcept(concept); if (normalized) statements.push(database.prepare("INSERT OR IGNORE INTO finance_concepts (id,owner_id,concept,normalized,created_at,updated_at) VALUES (?,?,?,?,?,?)").bind(String(c.id), ownerId, concept, normalized, stamp, stamp)); }
    for (const t of rows(finance.transactions)) statements.push(database.prepare("INSERT INTO finance_transactions (id,owner_id,type,account_id,destination_account_id,amount_minor,transfer_mode,fee_minor,payment_method,counterparty_bank,fee_category_id,occurred_on,status,category_id,task_id,project_id,description,obligation_occurrence_id,reservation_consumed_minor,reservation_month,goal_id,goal_reservation_consumed_minor,voided_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(String(t.id), ownerId, text(t.type, "El tipo", true), String(t.accountId), t.destinationAccountId || null, minor(t.amountMinor, "El importe"), t.transferMode || null, minor(t.feeMinor || 0, "El cargo"), text(t.paymentMethod, "El método") || (t.type === "transfer" ? "transfer" : "standard"), text(t.counterpartyBank, "El banco destino"), t.feeCategoryId || null, date(t.occurredOn, "La fecha", true), text(t.status, "El estado") || "confirmed", t.categoryId || null, t.taskId || null, t.projectId || null, text(t.description, "La descripción"), t.obligationOccurrenceId || null, minor(t.reservationConsumedMinor || 0, "La reserva consumida"), text(t.reservationMonth, "El mes de reserva"), t.goalId || null, minor(t.goalReservationConsumedMinor || 0, "La reserva de meta consumida"), t.voidedAt || null, text(t.createdAt, "La creación") || stamp, stamp));
    const restoredBudgets = rows(finance.budgetAllocations).length ? rows(finance.budgetAllocations) : rows(finance.budgets);
    for (const b of restoredBudgets) {
      const manual = b.assignedMinor ?? b.manualAssignedMinor ?? 0;
      if (Number(manual) > 0) statements.push(database.prepare("INSERT INTO finance_budgets (id,owner_id,month,category_id,assigned_minor,concept,allocation_type,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(String(b.id), ownerId, text(b.month, "El mes", true), String(b.categoryId), minor(manual, "La asignación"), text(b.concept, "El concepto") || "Asignación base", text(b.allocationType, "El tipo") === "additional" ? "additional" : "base", stamp, stamp));
    }
    for (const o of rows(finance.obligations)) statements.push(database.prepare("INSERT INTO finance_obligations (id,owner_id,title,concept,kind,expected_amount_minor,reserved_minor,account_id,category_id,frequency,covered_by_budget,reserve_month,next_due_date,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(String(o.id), ownerId, text(o.title, "La obligación", true), text(o.concept || o.title, "El concepto", true), text(o.kind, "El tipo") || "expense", minor(o.expectedAmountMinor, "El importe"), minor(o.reservedMinor, "La reserva"), o.accountId || null, o.categoryId || null, text(o.frequency, "La frecuencia") || "monthly", o.coveredByBudget === undefined ? 1 : (boolean(o.coveredByBudget) ? 1 : 0), text(o.reserveMonth, "El mes de reserva"), date(o.nextDueDate, "El vencimiento", true), boolean(o.active) ? 1 : 0, stamp, stamp));
    for (const o of rows(finance.occurrences)) { if (!obligationIds.has(String(o.obligationId))) throw new Error("Un vencimiento apunta a una obligación inexistente"); statements.push(database.prepare("INSERT INTO finance_obligation_occurrences (id,owner_id,obligation_id,due_date,expected_minor,paid_minor,status,transaction_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(String(o.id), ownerId, String(o.obligationId), date(o.dueDate, "El vencimiento", true), minor(o.expectedMinor, "El importe"), minor(o.paidMinor, "El pago"), text(o.status, "El estado") || "pending", o.transactionId || null, stamp, stamp)); }
    for (const g of rows(finance.goals)) statements.push(database.prepare("INSERT INTO finance_goals (id,owner_id,title,target_minor,reserved_minor,used_minor,target_date,priority,account_id,category_id,covered_by_budget,linked_task_id,linked_project_id,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(String(g.id), ownerId, text(g.title, "La meta", true), minor(g.targetMinor, "El objetivo"), minor(g.reservedMinor, "La reserva"), minor(g.usedMinor || 0, "Lo utilizado"), date(g.targetDate, "La fecha objetivo"), text(g.priority, "La prioridad") || "media", g.accountId || null, g.categoryId || null, 1, g.linkedTaskId || null, g.linkedProjectId || null, text(g.status, "El estado") || "active", stamp, stamp));
    for (const g of rows(finance.goalEntries)) { if (!goalIds.has(String(g.goalId))) throw new Error("Un aporte apunta a una meta inexistente"); statements.push(database.prepare("INSERT INTO finance_goal_entries (id,owner_id,goal_id,amount_minor,occurred_on,concept,note,voided_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(String(g.id), ownerId, String(g.goalId), minor(g.amountMinor, "El aporte"), date(g.occurredOn, "La fecha", true), text(g.concept, "El concepto"), text(g.note, "La nota"), g.voidedAt || null, stamp, stamp)); }
    const settings = finance.settings as Record<string, unknown> | undefined;
    const restoredProfiles = transferProfiles(settings?.transferBankFees);
    statements.push(database.prepare("INSERT INTO finance_settings (owner_id,currency,timezone,safety_buffer_minor,transfer_same_bank_rate_bps,transfer_ach_rate_bps,transfer_lbtr_surcharge_minor,transfer_bank_fees_json,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(ownerId, "DOP", text(settings?.timezone, "La zona") || "America/Santo_Domingo", minor(settings?.safetyBufferMinor || 0, "El colchón"), rateBps(settings?.transferSameBankRateBps || 0, "El porcentaje del mismo banco"), rateBps(settings?.transferAchRateBps || 0, "El porcentaje ACH"), minor(settings?.transferLbtrSurchargeMinor || 0, "El cargo adicional LBTR"), JSON.stringify(restoredProfiles), stamp));
    for (const t of rows(source.tasks)) statements.push(database.prepare("UPDATE home_tasks SET area_id=?,project_id=?,scheduled_start_time=?,scheduled_end_time=? WHERE id=? AND user_id=?").bind(t.areaId || null, t.projectId || null, time(t.scheduledStartTime, "La hora"), time(t.scheduledEndTime, "La hora"), String(t.id), HOUSEHOLD_SCOPE));
    await database.batch(statements);
    await audit(ownerId, "backup", ownerId, "restored", { version: 2 });
    return;
  }
  if (action === "task.context") {
    const id = text(body.id, "La tarea", true);
    const task = await database.prepare("SELECT id FROM home_tasks WHERE id=? AND user_id=?").bind(id, HOUSEHOLD_SCOPE).first();
    if (!task) throw new Error("Tarea no encontrada");
    const startTime = time(body.scheduledStartTime, "La hora de inicio");
    const endTime = time(body.scheduledEndTime, "La hora final");
    if (startTime && endTime && endTime <= startTime) throw new Error("La hora final debe ser posterior a la hora de inicio");
    await shared("home_areas",body.areaId); await shared("home_projects",body.projectId);
    await database.prepare("UPDATE home_tasks SET area_id=?,project_id=?,scheduled_start_time=?,scheduled_end_time=?,updated_at=? WHERE id=? AND user_id=?")
      .bind(body.areaId || null, body.projectId || null, startTime, endTime, stamp, id, HOUSEHOLD_SCOPE).run();
    return;
  }
  throw new Error("Acción V2 no reconocida");
}
