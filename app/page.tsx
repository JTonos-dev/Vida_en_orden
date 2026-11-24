"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import type { ActionFn, AppData, Area, Project, Task } from "@/lib/app-types";
import { emptyData } from "@/lib/app-types";
import { Icon, type IconName } from "@/components/icons";
import {
  ActivityModule, CalendarModule, FinanceModule, Modal, ProjectsModule, SettingsModule,
  dateLabel, eventOccursOn, legacyMoney, localToday, money,
} from "@/components/v2-modules";

type View = "summary" | "tasks" | "calendar" | "projects" | "finance" | "activity" | "settings";
const priorities = ["P+++", "P++", "P+", "P", "NP++", "NP+", "NP"];
const viewInfo: Record<View, [string, string]> = {
  summary: ["Resumen", "Vista estratégica de tu vida, tu tiempo y tu dinero"],
  tasks: ["Tareas", "Acciones, subtareas y prioridades"],
  calendar: ["Planificación", "Calendario, eventos y cronograma"],
  projects: ["Áreas y proyectos", "Contexto para lo que haces"],
  finance: ["Finanzas", "Cuentas, presupuesto, obligaciones y metas"],
  activity: ["Bitácora", "Historial de decisiones y cambios"],
  settings: ["Configuración", "Preferencias, privacidad y respaldo"],
};
const nav: Array<[View, IconName, string]> = [
  ["summary", "home", "Resumen"], ["tasks", "tasks", "Tareas"], ["calendar", "calendar", "Planificación"],
  ["projects", "projects", "Áreas y proyectos"], ["finance", "wallet", "Finanzas"], ["activity", "activity", "Bitácora"], ["settings", "settings", "Configuración"],
];

function sortTasks(items: Task[], mode: string) {
  return [...items].sort((a, b) => mode === "priority" ? priorities.indexOf(a.priority) - priorities.indexOf(b.priority) || a.order - b.order : mode === "effort" ? ({ baja: 0, media: 1, alta: 2 }[a.effort] || 0) - ({ baja: 0, media: 1, alta: 2 }[b.effort] || 0) : a.order - b.order);
}
function Pill({ children, tone = "blue" }: { children: ReactNode; tone?: string }) { return <span className={`pill ${tone}`}>{children}</span>; }
function Metric({ label, value, help, tone }: { label: string; value: ReactNode; help: string; tone?: string }) { return <div className={`metric ${tone || ""}`}><span>{label}</span><b>{value}</b><small>{help}</small></div>; }
function Chevron({ open }: { open: boolean }) { return <svg viewBox="0 0 20 20" className={`chevron ${open ? "open" : ""}`} aria-hidden="true"><path d="M7.4 4.8 12.6 10l-5.2 5.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }

export default function Home() {
  const [data, setData] = useState<AppData>(emptyData);
  const [view, setView] = useState<View>("summary");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("open");
  const [showDone, setShowDone] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailId, setDetailId] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>([]);
  const [editor, setEditor] = useState<{ task?: Task; parentId?: string; scheduledDate?: string; returnTo?: string } | null>(null);
  const [completion, setCompletion] = useState<{ task: Task; returnTo?: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/state", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json() as AppData & { error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudieron cargar los datos");
      if (active) setData(payload);
    }).catch((e) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const act: ActionFn = async (action, payload = {}) => {
    setError("");
    const response = await fetch("/api/action", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
    const result = await response.json() as AppData & { error?: string };
    if (!response.ok) { const text = result.error || "No se pudo guardar"; setError(text); throw new Error(text); }
    setData(result); setMessage("Cambios guardados"); window.setTimeout(() => setMessage(""), 1800);
  };
  const tasks = data.tasks.filter((t) => !t.archived);
  const task = (id: string | null) => tasks.find((x) => x.id === id);
  const today = localToday();
  const counts = { total: tasks.length, done: tasks.filter((x) => x.done).length, open: tasks.filter((x) => !x.done).length, late: tasks.filter((x) => !x.done && x.dueDate && x.dueDate < today).length };
  const planned = tasks.reduce((s, x) => s + (x.estimate || 0), 0);
  const confirmedSpendMinor = Object.values(data.finance.taskSpend).reduce((s, x) => s + x, 0);

  const openTask = (value: Task) => { setTrail([]); setDetailId(value.id); };
  const openChild = (value: Task) => { if (detailId) setTrail((x) => [...x, detailId]); setDetailId(value.id); };
  const goBack = () => setTrail((existing) => { const next = [...existing]; const previous = next.pop(); setDetailId(previous || null); return next; });
  const beginCompletion = (value: Task, returnTo?: string) => {
    if (value.done) { act("setDone", { id: value.id, done: false }).catch(() => undefined); return; }
    setDetailId(null); setCompletion({ task: value, returnTo });
  };
  const changeView = (next: View) => { setView(next); setDetailId(null); setEditor(null); window.scrollTo({ top: 0, behavior: "smooth" }); };

  if (loading) return <div className="loading"><div className="loaderMark">V</div><span>Organizando tu información…</span></div>;
  return <div className="app">
    <aside className="sidebar">
      <button className="brand" onClick={() => changeView("summary")}><b>V</b><span>Vida en Orden<small>ORGANIZACIÓN INTEGRAL</small></span></button>
      <nav>{nav.map(([id, icon, label]) => <button key={id} className={view === id ? "active" : ""} onClick={() => changeView(id)}><i><Icon name={icon} /></i>{label}</button>)}</nav>
      <div className="sideSummary"><span>Disponible sin comprometer</span><b className={data.finance.summary.uncommittedMinor < 0 ? "negative" : ""}>{money(data.finance.summary.uncommittedMinor)}</b><small>Saldo menos presupuesto, reservas y colchón</small></div>
    </aside>
    <main>
      <header><div><em>PANEL DE ORGANIZACIÓN PERSONAL</em><h1>{viewInfo[view][0]}</h1><p>{viewInfo[view][1]}</p></div><div className="headerRight"><span>{new Date().toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" })}</span><button className="iconButton" title="Configuración" aria-label="Configuración" onClick={() => changeView("settings")}><Icon name="settings" /></button></div></header>
      <div className="content">
        {error && <div className="errorBanner"><span>{error}</span><button onClick={() => setError("")}>×</button></div>}
        {view === "summary" && <Summary data={data} tasks={tasks} counts={counts} planned={planned} spentMinor={confirmedSpendMinor} openTask={openTask} go={changeView} />}
        {view === "tasks" && <TasksView data={data} tasks={tasks} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} showDone={showDone} setShowDone={setShowDone} expanded={expanded} setExpanded={setExpanded} openTask={openTask} beginCompletion={beginCompletion} setEditor={setEditor} act={act} />}
        {view === "calendar" && <CalendarModule data={data} act={act} openTask={openTask} newTask={(date) => setEditor({ scheduledDate: date })} />}
        {view === "projects" && <ProjectsModule data={data} act={act} openTask={openTask} />}
        {view === "finance" && <FinanceModule data={data} act={act} openTask={openTask} />}
        {view === "activity" && <ActivityModule data={data} />}
        {view === "settings" && <SettingsModule data={data} act={act} />}
      </div>
    </main>
    {message && <div className="toast">✓ {message}</div>}
    {detailId && task(detailId) && <TaskDetail value={task(detailId)!} data={data} trail={trail} goBack={goBack} openChild={openChild} close={() => { setDetailId(null); setTrail([]); }} edit={() => { setEditor({ task: task(detailId)!, returnTo: detailId }); setDetailId(null); }} addChild={() => { setEditor({ parentId: detailId, returnTo: detailId }); setDetailId(null); }} complete={() => beginCompletion(task(detailId)!, detailId)} duplicate={() => act("duplicateTask", { id: detailId })} remove={async () => { const current = task(detailId)!; if (!window.confirm(`¿Eliminar “${current.title}” y todas sus subtareas? Esta acción no elimina transacciones financieras; sus vínculos quedarán en la auditoría.`)) return; await act("deleteTask", { id: current.id }); setDetailId(null); }} addNote={(text) => act("addNote", { taskId: detailId, text })} deleteNote={(id) => act("deleteNote", { id })} goFinance={() => { setDetailId(null); changeView("finance"); }} />}
    {editor && <TaskEditor value={editor} data={data} close={() => { const back = editor.returnTo; setEditor(null); if (back) setDetailId(back); }} save={async (payload) => { const back = editor.returnTo; if (editor.task) await act("updateTask", { id: editor.task.id, ...payload }); else await act("createTask", payload); setEditor(null); if (back) setDetailId(back); }} />}
    {completion && <CompleteTask value={completion.task} close={() => { const back = completion.returnTo; setCompletion(null); if (back) setDetailId(back); }} save={async (date) => { const back = completion.returnTo; await act("setDone", { id: completion.task.id, done: true, completedAt: date }); setCompletion(null); if (back) setDetailId(back); }} />}
  </div>;
}

function Summary({ data, tasks, counts, planned, spentMinor, openTask, go }: { data: AppData; tasks: Task[]; counts: { total: number; done: number; open: number; late: number }; planned: number; spentMinor: number; openTask: (task: Task) => void; go: (view: View) => void }) {
  const pct = counts.total ? Math.round(counts.done / counts.total * 100) : 0;
  const today = localToday();
  const todayTasks = tasks.filter((x) => !x.done && x.scheduledDate === today);
  const todayEvents = data.events.filter((x) => eventOccursOn(x, today));
  const upcoming = tasks.filter((x) => !x.done && (x.scheduledDate || x.dueDate)).sort((a, b) => (a.scheduledDate || a.dueDate).localeCompare(b.scheduledDate || b.dueDate)).slice(0, 6);
  const goals = data.finance.goals.filter((x) => x.status === "active").slice(0, 4);
  const commitments = data.finance.summary.committedMinor;
  const context = (task: Task) => { const area = data.areas.find((x) => x.id === task.areaId), project = data.projects.find((x) => x.id === task.projectId); return <span className="summaryContexts">{area && <span className="contextBadge areaContext"><i style={{ background: area.color }} />{area.name}</span>}{project && <span className="contextBadge projectContext"><Icon name="folder" size={11} />{project.name}</span>}</span>; };
  return <>
    <section className="hero v2hero"><div><em>VIDA EN ORDEN</em><h2>Decide qué hacer, cuándo hacerlo y cómo financiarlo.</h2><p>Tareas, calendario, proyectos y dinero conectados en una sola fuente de verdad.</p><div className="heroActions"><button onClick={() => go("tasks")}>Ver tareas</button><button onClick={() => go("calendar")}>Abrir planificación</button></div></div><div className="heroProgress"><strong>{pct}%</strong><small>avance de tareas</small><div className="ring" style={{ "--progress": `${pct * 3.6}deg` } as React.CSSProperties}><span>{counts.done}/{counts.total}</span></div></div></section>
    <div className="metrics"><Metric label="Pendientes" value={counts.open} help={`${counts.late} fuera de plazo`} tone={counts.late ? "warningMetric" : ""} /><Metric label="Agenda de hoy" value={todayTasks.length + todayEvents.length} help={`${todayTasks.length} tareas · ${todayEvents.length} eventos`} /><Metric label="Gasto real vinculado" value={money(spentMinor)} help={`Estimado de tareas: ${legacyMoney(planned)}`} /><Metric label="Libre para decidir" value={money(data.finance.summary.uncommittedMinor)} help={`${money(commitments)} comprometido`} tone={data.finance.summary.uncommittedMinor < 0 ? "dangerMetric" : "successMetric"} /></div>
    <div className="dashboardGrid"><div>
      <section className="panel"><div className="panelHead"><div><h2>Hoy</h2><p className="soft">Acciones y eventos en una sola agenda</p></div><button onClick={() => go("calendar")}>Planificar →</button></div>{todayTasks.length || todayEvents.length ? <>{todayTasks.map((x) => <button className="summaryItem" onClick={() => openTask(x)} key={x.id}><span className="summaryType taskType">Tarea</span><b>{x.title}</b><small>{x.scheduledStartTime || "Todo el día"}{context(x)}</small></button>)}{todayEvents.map((x) => <div className="summaryItem" key={x.id}><span className="summaryType eventType">Evento</span><b>{x.title}</b><small>{x.startTime || "Todo el día"}</small></div>)}</> : <div className="empty compactEmpty">No hay actividades para hoy.</div>}</section>
      <section className="panel"><div className="panelHead"><div><h2>Próximas acciones</h2><p className="soft">Ordenadas por fecha programada o límite</p></div><button onClick={() => go("tasks")}>Ver todas →</button></div>{upcoming.length ? upcoming.map((x) => <button className="summaryTask" onClick={() => openTask(x)} key={x.id}><i className={x.dueDate && x.dueDate < localToday() ? "late" : ""} /><span><b>{x.title}</b><small>{x.scheduledDate ? `Programada ${dateLabel(x.scheduledDate)}` : `Límite ${dateLabel(x.dueDate)}`}{context(x)}</small></span><Pill>{x.priority}</Pill></button>) : <div className="empty compactEmpty">No hay fechas próximas.</div>}</section>
    </div><div>
      <section className="panel financialSnapshot"><div className="panelHead"><div><h2>Panorama financiero</h2><p className="soft">Disponible frente a compromisos, sin duplicidades</p></div><button onClick={() => go("finance")}>Abrir finanzas →</button></div><span>Saldo líquido</span><strong>{money(data.finance.summary.liquidMinor)}</strong><div className="snapshotBars"><div><i style={{ width: `${data.finance.summary.liquidMinor ? Math.min(100, commitments / Math.max(1, data.finance.summary.liquidMinor) * 100) : 0}%` }} /></div><p><span>Comprometido <b>{money(commitments)}</b></span><span>Sin comprometer <b className={data.finance.summary.uncommittedMinor < 0 ? "negative" : "positive"}>{money(data.finance.summary.uncommittedMinor)}</b></span></p></div><div className="financeBreakdown"><span>Presupuesto <b>{money(data.finance.summary.budgetRemainingMinor)}</b></span><span>Reservas de otros meses <b>{money(data.finance.summary.obligationReservedMinor)}</b></span><span>Metas <b>{money(data.finance.summary.goalReservedMinor)}</b></span><span>Colchón <b>{money(data.finance.summary.safetyBufferMinor)}</b></span></div></section>
      <section className="panel"><div className="panelHead"><div><h2>Metas en curso</h2><p className="soft">Reservas para decisiones futuras</p></div><button onClick={() => go("finance")}>Gestionar →</button></div>{goals.length ? goals.map((x) => { const pctGoal = x.targetMinor ? x.reservedMinor / x.targetMinor * 100 : 0; return <div className="summaryGoal" key={x.id}><div><b>{x.title}</b><span>{money(x.reservedMinor)} de {money(x.targetMinor)}</span></div><div className="progress"><span style={{ width: `${Math.min(100, pctGoal)}%` }} /></div></div>; }) : <div className="empty compactEmpty">Aún no hay metas de ahorro.</div>}</section>
    </div></div>
  </>;
}

function TasksView({ data, tasks, query, setQuery, filter, setFilter, showDone, setShowDone, expanded, setExpanded, openTask, beginCompletion, setEditor, act }: { data: AppData; tasks: Task[]; query: string; setQuery: (x: string) => void; filter: string; setFilter: (x: string) => void; showDone: boolean; setShowDone: (x: boolean) => void; expanded: Record<string, boolean>; setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>; openTask: (x: Task) => void; beginCompletion: (x: Task) => void; setEditor: React.Dispatch<React.SetStateAction<{ task?: Task; parentId?: string; scheduledDate?: string; returnTo?: string } | null>>; act: ActionFn }) {
  const children = (id: string | null) => sortTasks(tasks.filter((x) => x.parentId === id), data.sort);
  const textMatches = (t: Task) => !query || [t.title, t.description, t.owner, t.risk, ...t.tags].join(" ").toLowerCase().includes(query.toLowerCase());
  const statusMatches = (t: Task) => filter === "all" || filter === "open" && !t.done || filter === "done" && t.done || filter === "late" && !t.done && !!t.dueDate && t.dueDate < localToday();
  const branchMatches = (t: Task): boolean => textMatches(t) || children(t.id).some(branchMatches);
  const move = async (t: Task, delta: number) => { const siblings = children(t.parentId), index = siblings.findIndex((x) => x.id === t.id); if (index + delta < 0 || index + delta >= siblings.length) return; [siblings[index], siblings[index + delta]] = [siblings[index + delta], siblings[index]]; await act("reorder", { ids: siblings.map((x) => x.id) }); };
  const roots = children(null).filter((x) => branchMatches(x) && (filter === "all" || statusMatches(x) || children(x.id).some(statusMatches)) && (showDone || !x.done || children(x.id).some((z) => !z.done)));
  const Tree = ({ value, depth = 0 }: { value: Task; depth?: number }) => { const kids = children(value.id).filter((x) => branchMatches(x) && (showDone || !x.done)), open = !!expanded[value.id] || !!query; if (!textMatches(value) && !kids.length) return null; return <div className="tree"><TaskLine value={value} depth={depth} kids={kids} open={open} area={data.areas.find((x) => x.id === value.areaId)} project={data.projects.find((x) => x.id === value.projectId)} toggle={() => setExpanded((x) => ({ ...x, [value.id]: !open }))} openTask={openTask} complete={() => beginCompletion(value)} add={() => setEditor({ parentId: value.id })} edit={() => setEditor({ task: value })} up={() => move(value, -1)} down={() => move(value, 1)} spendMinor={data.finance.taskSpend[value.id] || 0} />{open && kids.map((x) => <Tree value={x} depth={depth + 1} key={x.id} />)}</div>; };
  const addQuick = async (title: string) => { await act("createTask", { title, priority: "P", effort: "baja" }); };
  return <>
    <div className="toolbar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar tareas, responsable o etiquetas…" /><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="open">Pendientes</option><option value="all">Todas</option><option value="done">Completadas</option><option value="late">Vencidas</option></select><select value={data.sort} onChange={(e) => act("workspace", { budgetLimit: data.budgetLimit, sort: e.target.value })}><option value="manual">Orden personalizado</option><option value="priority">Por prioridad</option><option value="effort">Más fáciles primero</option></select><button className={`doneToggle ${showDone ? "on" : ""}`} aria-pressed={showDone} onClick={() => setShowDone(!showDone)}><span>{showDone ? "✓" : ""}</span>Completas</button></div>
    <QuickTask add={addQuick} advanced={() => setEditor({})} />
    <div className="tasklist">{roots.length ? roots.map((x) => <Tree value={x} key={x.id} />) : <div className="empty">No encontramos tareas con estos filtros.</div>}</div>
    <p className="notice">Las subtareas permanecen contraídas por defecto. Usa el chevrón para desplegarlas o abre la tarea para navegar su estructura y bitácora.</p>
  </>;
}

function QuickTask({ add, advanced }: { add: (title: string) => Promise<void>; advanced: () => void }) {
  const [title, setTitle] = useState("");
  const save = async () => { if (!title.trim()) return; await add(title.trim()); setTitle(""); };
  return <div className="quick"><input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); }} placeholder="Escribe una nueva tarea…" /><button onClick={advanced}>Más opciones</button><button className="primary" disabled={!title.trim()} onClick={save}>Agregar</button></div>;
}

function TaskLine({ value, depth, kids, open, area, project, toggle, openTask, complete, add, edit, up, down, spendMinor }: { value: Task; depth: number; kids: Task[]; open: boolean; area?: Area; project?: Project; toggle: () => void; openTask: (t: Task) => void; complete: () => void; add: () => void; edit: () => void; up: () => void; down: () => void; spendMinor: number }) {
  const late = !value.done && !!value.dueDate && value.dueDate < localToday();
  return <div className={`task ${value.done ? "done" : ""}`} style={{ paddingLeft: 12 + depth * 18 }}>
    {kids.length ? <button className="expander" aria-label={`${open ? "Contraer" : "Expandir"} subtareas de ${value.title}`} onClick={toggle}><Chevron open={open} /></button> : <span className="expander emptyExpander" />}
    <input type="checkbox" aria-label={`Completar ${value.title}`} checked={value.done} onChange={complete} />
    <button className="taskName" onClick={() => openTask(value)}><span className="taskTitleText">{value.title}</span><small><Pill tone={value.done ? "success" : "blue"}>{value.done ? "Hecha" : value.priority}</Pill>{value.effort === "baja" ? "Fácil" : value.effort === "media" ? "Media" : "Compleja"}{kids.length ? ` · ${kids.filter((x) => x.done).length}/${kids.length} subtareas` : ""}{value.scheduledDate ? ` · ${value.scheduledStartTime ? `${value.scheduledStartTime} · ` : ""}${dateLabel(value.scheduledDate)}` : value.dueDate ? ` · ${late ? "Vencida" : `Límite ${dateLabel(value.dueDate)}`}` : ""}{spendMinor ? ` · Gastado ${money(spendMinor)}` : ""}</small>{(area || project) && <span className="taskContexts">{area && <span className="contextBadge areaContext"><i style={{ background: area.color }} />{area.name}</span>}{project && <span className="contextBadge projectContext"><Icon name="folder" size={11} />{project.name}</span>}</span>}</button>
    <div className="taskButtons"><button title="Subir" aria-label={`Subir ${value.title}`} onClick={up}><Icon name="arrowUp" size={15} /></button><button title="Bajar" aria-label={`Bajar ${value.title}`} onClick={down}><Icon name="arrowDown" size={15} /></button><button title="Añadir subtarea" aria-label={`Añadir subtarea a ${value.title}`} onClick={add}><Icon name="plus" size={16} /></button><button title="Editar" aria-label={`Editar ${value.title}`} onClick={edit}><Icon name="pencil" size={15} /></button></div>
  </div>;
}

function TaskDetail({ value, data, trail, goBack, openChild, close, edit, addChild, complete, duplicate, remove, addNote, deleteNote, goFinance }: { value: Task; data: AppData; trail: string[]; goBack: () => void; openChild: (task: Task) => void; close: () => void; edit: () => void; addChild: () => void; complete: () => void; duplicate: () => void; remove: () => void; addNote: (text: string) => Promise<void>; deleteNote: (id: string) => void; goFinance: () => void }) {
  const kids = sortTasks(data.tasks.filter((x) => x.parentId === value.id && !x.archived), data.sort);
  const notes = data.notes.filter((x) => x.taskId === value.id);
  const legacy = data.movements.filter((x) => x.taskId === value.id).reduce((s, x) => s + x.amount, value.actual || 0);
  const actualMinor = data.finance.taskSpend[value.id] || 0;
  const area = data.areas.find((x) => x.id === value.areaId), project = data.projects.find((x) => x.id === value.projectId);
  const [note, setNote] = useState("");
  return <Modal title={value.title} onClose={close} wide><div className="taskDetail">
    {trail.length > 0 && <button className="back" onClick={goBack}>← Volver a la tarea anterior</button>}
    <div className="detailMeta"><Pill tone={value.done ? "success" : "blue"}>{value.done ? "Hecha" : value.priority}</Pill><span>{value.effort === "baja" ? "Fácil" : value.effort === "media" ? "Media" : "Compleja"}</span>{area && <span>Área: {area.name}</span>}{project && <span>Proyecto: {project.name}</span>}<span>Actualizada: {dateLabel(value.updatedAt)}</span></div>
    {value.description && <p className="detailDescription">{value.description}</p>}
    <div className="detailActions"><button onClick={edit}>Editar</button><button onClick={addChild}>Añadir subtarea</button><button className={value.done ? "" : "completeAction"} onClick={complete}>{value.done ? "Reabrir" : "✓ Marcar como hecha"}</button><button onClick={duplicate}>Duplicar</button><button className="danger" onClick={remove}>Eliminar</button></div>
    <div className="scheduleSummary"><span><b>Inicio</b>{dateLabel(value.startDate)}</span><span><b>Fecha para hacerla</b>{dateLabel(value.scheduledDate)}{value.scheduledStartTime && <small>{value.scheduledStartTime}{value.scheduledEndTime ? `–${value.scheduledEndTime}` : ""}</small>}</span><span><b>Fecha límite</b>{dateLabel(value.dueDate)}</span></div>
    <div className="taskFinance"><div><span>Estimado</span><b>{legacyMoney(value.estimate)}</b></div><div><span>Gasto real confirmado</span><b>{money(actualMinor)}</b></div><div><span>Histórico anterior</span><b>{legacyMoney(legacy || null)}</b></div><button onClick={goFinance}>Registrar gasto →</button></div>
    {legacy > 0 && <p className="legacyNotice">El importe histórico se conserva para consulta, pero no se suma al gasto financiero nuevo para evitar duplicidades.</p>}
    {value.risk && <div className="risk"><b>Riesgo o bloqueo</b><span>{value.risk}</span></div>}
    <section className="modalChildren"><h3>Subtareas ({kids.length})</h3>{kids.length ? kids.map((x) => <button className="modalChild" key={x.id} onClick={() => openChild(x)}><span>{x.done ? "✓" : "○"}</span><b>{x.title}</b><small>{x.priority} · {x.effort === "baja" ? "Fácil" : x.effort === "media" ? "Media" : "Compleja"}{data.finance.taskSpend[x.id] ? ` · ${money(data.finance.taskSpend[x.id])}` : ""}</small><i>›</i></button>) : <p className="soft">No tiene subtareas.</p>}</section>
    <section className="log"><h3>Bitácora</h3>{notes.length ? notes.map((x) => <div className="note" key={x.id}><i /><div><b>{dateLabel(x.createdAt)} · {x.author || "Usuario"}</b><p>{x.text}</p></div><button className="iconDanger" onClick={() => deleteNote(x.id)}>×</button></div>) : <p className="soft">Todavía no hay novedades registradas.</p>}<form className="noteForm" onSubmit={async (e) => { e.preventDefault(); if (!note.trim()) return; await addNote(note); setNote(""); }}><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Registrar una novedad, decisión o bloqueo…" /><button className="primary">Añadir nota</button></form></section>
  </div></Modal>;
}

function TaskEditor({ value, data, close, save }: { value: { task?: Task; parentId?: string; scheduledDate?: string; returnTo?: string }; data: AppData; close: () => void; save: (payload: Record<string, unknown>) => Promise<void> }) {
  const t = value.task;
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ title: t?.title || "", priority: t?.priority || "P", effort: t?.effort || "baja", description: t?.description || "", owner: t?.owner || "", areaId: t?.areaId || "", projectId: t?.projectId || "", startDate: t?.startDate || "", scheduledDate: t?.scheduledDate || value.scheduledDate || "", scheduledStartTime: t?.scheduledStartTime || "", scheduledEndTime: t?.scheduledEndTime || "", dueDate: t?.dueDate || "", estimate: t?.estimate?.toString() || "", risk: t?.risk || "", tags: t?.tags.join(", ") || "" });
  const change = (field: keyof typeof f, next: string) => setF((current) => ({ ...current, [field]: next }));
  const submit = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const fields=Object.fromEntries(new FormData(e.currentTarget).entries()); setSaving(true); try { await save({ ...fields, parentId: t?.parentId ?? value.parentId ?? null, tags: String(fields.tags || "").split(",").map((x) => x.trim()).filter(Boolean) }); } finally { setSaving(false); } };
  return <Modal title={t ? "Editar tarea" : value.parentId ? "Nueva subtarea" : "Nueva tarea"} onClose={close} wide><form className="form" onSubmit={submit}>
    <label>Nombre de la tarea*<input name="title" required autoFocus value={f.title} onChange={(e) => change("title", e.target.value)} /></label>
    <div className="formgrid"><label>Prioridad<select name="priority" value={f.priority} onChange={(e) => change("priority", e.target.value)}>{priorities.map((x) => <option key={x}>{x}</option>)}</select></label><label>Complejidad<select name="effort" value={f.effort} onChange={(e) => change("effort", e.target.value)}><option value="baja">Fácil</option><option value="media">Media</option><option value="alta">Compleja</option></select></label></div>
    <div className="formgrid"><label>Área<select name="areaId" value={f.areaId} onChange={(e) => change("areaId", e.target.value)}><option value="">Sin área</option>{data.areas.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label><label>Proyecto<select name="projectId" value={f.projectId} onChange={(e) => change("projectId", e.target.value)}><option value="">Sin proyecto</option>{data.projects.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label></div>
    <label>Descripción<textarea name="description" value={f.description} onChange={(e) => change("description", e.target.value)} /></label>
    <div className="formgrid"><label>Inicio planificado<input name="startDate" type="date" value={f.startDate} onChange={(e) => change("startDate", e.target.value)} /></label><label>Fecha para hacerla<input name="scheduledDate" type="date" min={f.startDate || undefined} max={f.dueDate || undefined} value={f.scheduledDate} onChange={(e) => change("scheduledDate", e.target.value)} /></label><label>Hora de inicio<input name="scheduledStartTime" type="time" value={f.scheduledStartTime} onChange={(e) => change("scheduledStartTime", e.target.value)} /></label><label>Hora final<input name="scheduledEndTime" type="time" min={f.scheduledStartTime || undefined} value={f.scheduledEndTime} onChange={(e) => change("scheduledEndTime", e.target.value)} /></label><label>Fecha límite<input name="dueDate" type="date" min={f.startDate || undefined} value={f.dueDate} onChange={(e) => change("dueDate", e.target.value)} /></label><label>Responsable<input name="owner" value={f.owner} onChange={(e) => change("owner", e.target.value)} /></label></div>
    <div className="formgrid"><label>Estimado RD$<input name="estimate" type="number" min="0" step="0.01" value={f.estimate} onChange={(e) => change("estimate", e.target.value)} /></label><label>Etiquetas<input name="tags" value={f.tags} onChange={(e) => change("tags", e.target.value)} placeholder="hogar, compra, urgente" /></label></div>
    <div className="infoBox"><b>El gasto real ya no se edita aquí</b><span>Registra una transacción en Finanzas y vincúlala a esta tarea. Así el importe se refleja en todos los módulos una sola vez.</span></div>
    <label>Riesgo o bloqueo<textarea name="risk" value={f.risk} onChange={(e) => change("risk", e.target.value)} /></label>
    <div className="formActions"><button type="button" onClick={close}>Cancelar</button><button className="primary" disabled={saving}>{saving ? "Guardando…" : "Guardar tarea"}</button></div>
  </form></Modal>;
}

function CompleteTask({ value, close, save }: { value: Task; close: () => void; save: (date: string) => Promise<void> }) {
  const earliest = value.createdAt?.slice(0, 10) || "";
  const [date, setDate] = useState(localToday());
  return <Modal title="Marcar como hecha" onClose={close}><form className="form" onSubmit={(e) => { e.preventDefault(); save(date); }}><p className="soft">Indica cuándo completaste “{value.title}”. La fecha puede ser hoy o un día anterior, pero nunca anterior a la creación de la tarea.</p><label>Fecha de finalización<input required type="date" min={earliest} max={localToday()} value={date} onChange={(e) => setDate(e.target.value)} /></label><div className="formActions"><button type="button" onClick={close}>Cancelar</button><button className="primary">Confirmar</button></div></form></Modal>;
}
