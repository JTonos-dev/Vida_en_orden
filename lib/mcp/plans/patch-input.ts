import { domainDatabase } from "../../domain/context.ts";
import { HOUSEHOLD_SCOPE } from "../../data-scopes.ts";
import type { McpIdentity } from "../auth.ts";
import type { ActionDefinition } from "./types.ts";
import { optional, type Field } from "./fields.ts";
const mappings:Record<string,{table:string;shared:boolean;columns:Record<string,string>}>= {
 "area.update":{table:"home_areas",shared:true,columns:{name:"name",color:"color"}},
 "project.update":{table:"home_projects",shared:true,columns:{name:"name",areaId:"area_id",description:"description",status:"status",startDate:"start_date",targetDate:"target_date",budgetMinor:"budget_minor"}},
 "event.update":{table:"calendar_events",shared:false,columns:{title:"title",description:"description",location:"location",startDate:"start_date",endDate:"end_date",startTime:"start_time",endTime:"end_time",allDay:"all_day",timezone:"timezone",status:"status",recurrence:"recurrence",recurrenceUntil:"recurrence_until",areaId:"area_id",projectId:"project_id",linkedTaskId:"linked_task_id",notes:"notes"}},
 "finance.account.update":{table:"finance_accounts",shared:false,columns:{name:"name",type:"type",bankName:"bank_name"}},
 "finance.category.update":{table:"finance_categories",shared:false,columns:{name:"name",kind:"kind",color:"color"}},
 "finance.obligation.update":{table:"finance_obligations",shared:false,columns:{title:"title",concept:"concept",kind:"kind",expectedAmountMinor:"expected_amount_minor",reservedMinor:"reserved_minor",accountId:"account_id",categoryId:"category_id",frequency:"frequency",nextDueDate:"next_due_date"}},
 "finance.goal.update":{table:"finance_goals",shared:false,columns:{title:"title",targetMinor:"target_minor",targetDate:"target_date",priority:"priority",accountId:"account_id",categoryId:"category_id",linkedTaskId:"linked_task_id",linkedProjectId:"linked_project_id"}},
};
export function patchFields(kind:string,fields:Record<string,Field>){return mappings[kind]?Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,key==="id"?field:optional(field)])):fields;}
export function patchDefinition(definition:ActionDefinition):ActionDefinition{return mappings[definition.kind]?{...definition,schema:definition.schema.refine(input=>Object.keys(input).length>1),inputSchema:{...definition.inputSchema,minProperties:2}}:definition;}
/** Keeps domain validation/calculation in v2Action; only fills omitted form fields. */
export async function mergeUpdate(kind:string,actor:McpIdentity,input:Record<string,unknown>){
 const mapping=mappings[kind];if(!mapping)return input;
 const row=await domainDatabase().prepare(`SELECT * FROM ${mapping.table} WHERE id=? AND ${mapping.shared?"scope_id":"owner_id"}=?`).bind(input.id,mapping.shared?HOUSEHOLD_SCOPE:actor.userId).first<Record<string,unknown>>();
 if(!row)return input; // The existing domain service reports its normal not-found error.
 const original=Object.fromEntries(Object.entries(mapping.columns).map(([key,column])=>[key,key==="allDay"?Number(row[column])===1:row[column]]));
 if(kind==="event.update" && typeof input.startDate==="string" && !("endDate" in input)){
  const duration=Date.parse(String(row.end_date)+"T00:00:00Z")-Date.parse(String(row.start_date)+"T00:00:00Z");
  original.endDate=new Date(Date.parse(input.startDate+"T00:00:00Z")+duration).toISOString().slice(0,10);
 }
 return {...original,...input};
}
