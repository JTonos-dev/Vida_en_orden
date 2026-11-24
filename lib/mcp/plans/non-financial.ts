import { patchFields, patchDefinition, mergeUpdate } from "./patch-input.ts";
import { action } from "../../domain/home-service.ts";
import { v2Action } from "../../domain/v2-service.ts";
import type { ActionDefinition } from "./types.ts";
import { actionDefinition, string, enumeration, integer, decimal, bool, id, optional as o, nullable as n, array, emptyDate, time, color, timezone, type Field } from "./fields.ts";

const home = (kind: string, legacy: string, targetTable: ActionDefinition["targetTable"], fields: Record<string,Field>, destructive = false) => actionDefinition({ kind, phase: 4, risk: destructive ? "R2" : "R1", targetTable,
  execute: (actor,input) => action(actor.userId, actor.fullName || actor.email, { action: legacy, ...input }) },fields);
const v2 = (kind: string, targetTable: ActionDefinition["targetTable"], fields: Record<string,Field>, destructive = false) => patchDefinition(actionDefinition({ kind, phase: 4, risk: destructive ? "R2" : "R1", targetTable,
  execute: async (actor,input) => v2Action(actor.userId, { action: kind, ...await mergeUpdate(kind,actor,input) }) },patchFields(kind,fields)));
const taskFields = { title: string(200,1), description: o(string(8000)), parentId: o(n(id)), priority: o(enumeration(["P+++","P++","P+","P","NP++","NP+","NP"])), effort: o(enumeration(["baja","media","alta"])), owner: o(string(200)), areaId: o(n(id)), projectId: o(n(id)), startDate: o(emptyDate), scheduledDate: o(emptyDate), scheduledStartTime: o(time), scheduledEndTime: o(time), dueDate: o(emptyDate), estimate: o(n(decimal())), tags: o(array(string(100),30)), dependencies: o(array(id)), risk: o(string(1000)) };
const project = { name: string(200,1), areaId: o(n(id)), description: o(string(8000)), startDate: o(emptyDate), targetDate: o(emptyDate), budgetMinor: o(n(integer())) };
const event = { title: string(200,1), startDate: emptyDate, endDate: o(emptyDate), startTime: o(time), endTime: o(time), allDay: o(bool), timezone: o(timezone), description: o(string(8000)), location: o(string(500)), recurrence: o(enumeration(["none","daily","weekly","monthly","yearly"])), recurrenceUntil: o(emptyDate), areaId: o(n(id)), projectId: o(n(id)), linkedTaskId: o(n(id)), notes: o(string(8000)) };
export const nonFinancialActions: readonly ActionDefinition[] = [
  home("task.create","createTask","home_tasks",taskFields),
  home("task.update","updateTask","home_tasks",{ id, ...Object.fromEntries(Object.entries(taskFields).map(([key,field]) => [key,o(field)])) }),
  home("task.duplicate","duplicateTask","home_tasks",{ id }),
  home("task.archive","archiveTask","home_tasks",{ id, archived: bool }),
  home("task.complete","setDone","home_tasks",{ id, done: bool, completedAt: o(emptyDate) }),
  home("task.delete","deleteTask","home_tasks",{ id },true),
  home("task.reorder","reorder","home_tasks",{ ids: array(id,100) }),
  home("journal.create","addNote","home_notes",{ taskId: id, text: string(8000,1) }),
  home("journal.update","editNote","home_notes",{ id, text: string(8000,1) }),
  home("journal.delete","deleteNote","home_notes",{ id },true),
  home("workspace.update","workspace","home_workspaces",{ budgetLimit: n(decimal()), sort: enumeration(["manual","priority","effort"]) }),
  v2("area.create","home_areas",{ name: string(200,1), color: o(color) }),
  v2("area.update","home_areas",{ id, name: string(200,1), color: o(color) }),
  v2("project.create","home_projects",project),
  v2("project.update","home_projects",{ id, ...project, status: enumeration(["active","paused","completed"]) }),
  v2("event.create","calendar_events",event),
  v2("event.update","calendar_events",{ id, ...event, status: enumeration(["scheduled","completed","cancelled"]) }),
  v2("event.cancel","calendar_events",{ id }),
  v2("task.context","home_tasks",{ id, areaId: n(id), projectId: n(id), scheduledStartTime: time, scheduledEndTime: time }),
];
