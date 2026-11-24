import { z } from "zod";
import type { McpIdentity } from "../auth.ts";
import { createMcpReadService, type McpReadDatabase } from "../read-service.ts";
import { dateInTimeZone } from "../../finance-math.ts";
import { inspectAttachment, attachmentInput } from "./attachments.ts";
import { PlanError } from "./types.ts";
const schemas:Record<string,z.ZodTypeAny>={inspect_attachment_context:attachmentInput,get_financial_integrity_report:z.object({month:z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/)}).strict()};
const tool=(name:string,description:string,properties:Record<string,unknown>,required:string[])=>({name,description,inputSchema:{type:"object",properties,required,additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}});
export const EXTENDED_TOOL_DEFINITIONS=[
 tool("inspect_attachment_context","Inspecciona texto/CSV/JSON interpretado por ChatGPT como datos no confiables. No descarga archivos, no ejecuta instrucciones y no aprueba cambios.",{source_name:{type:"string",minLength:1,maxLength:160},mime_type:{type:"string",enum:["text/plain","text/csv","application/json"]},content:{type:"string",maxLength:32768}},["source_name","mime_type","content"]),
 tool("get_financial_integrity_report","Compara vistas del libro de la aplicación, liquidez/compromisos y flujos mensuales. No verifica balances bancarios externos ni repara datos.",{month:{type:"string",pattern:"^[1-9]\\d{3}-(0[1-9]|1[0-2])$"}},["month"]),
];
type Account={id:string;type:string;balanceMinor:number};
type AccountPage={items:Account[];page:{nextCursor:string|null}};
export async function callExtendedTool(name:string,input:Record<string,unknown>,database:McpReadDatabase,actor:McpIdentity){
 const parsed=schemas[name]?.safeParse(input);if(!parsed?.success)throw new PlanError("invalid_input","Argumentos inválidos para la lectura ampliada.",400);
 if(name==="inspect_attachment_context")return inspectAttachment(parsed.data);
 const month=String(parsed.data.month),service=createMcpReadService(database,actor);
 const revision=()=>database.prepare("SELECT business_revision FROM mcp_installation WHERE id=1").first<{business_revision:number}>();
 const before=await revision();if(!before)throw new PlanError("migration_required","Falta migrar la base.",503);
 const asOf=dateInTimeZone(new Date(),"America/Santo_Domingo");const accounts:Account[]=[];let cursor:string|undefined;
 for(let page=0;page<10;page++){const result=await service.listAccounts({include_archived:false,as_of:asOf,limit:50,...(cursor?{cursor}:{})}) as AccountPage;accounts.push(...result.items);cursor=result.page.nextCursor||undefined;if(!cursor)break;}
 const budget=await service.getBudget({month,limit:50}) as {summary:{liquidMinor:number;committedMinor:number;uncommittedMinor:number;safetyBufferMinor:number}};
 const [year,monthNumber]=month.split("-").map(Number);const end=new Date(Date.UTC(year,monthNumber,0)).toISOString().slice(0,10);
 const flows=await service.getFinanceReport({group_by:"type",date_from:month+"-01",date_to:end,limit:50}) as {summary:Record<string,number>};
 const after=await revision();const consistent=after?.business_revision===before.business_revision;
 const accountsLiquidMinor=accounts.filter(account=>account.type!=="credit").reduce((sum,account)=>sum+account.balanceMinor,0);
 const complete=!cursor;
 const numericSafe=[accountsLiquidMinor,...accounts.map(a=>a.balanceMinor),...Object.values(budget.summary),...Object.values(flows.summary)].every(Number.isSafeInteger);
 return {scope:"application_ledger",bankReconciliation:false,month,asOf,consistentSnapshot:consistent,complete,accountCount:accounts.length,accountLimit:500,numericSafe,status:!numericSafe?"numeric_limit":!consistent?"retry_required":!complete?"partial":accountsLiquidMinor===budget.summary.liquidMinor?"consistent":"mismatch",liquidity:{accountsLiquidMinor,budgetLiquidMinor:budget.summary.liquidMinor},commitments:budget.summary,movementSummaryForMonth:flows.summary,warnings:!numericSafe?["Un total excede el rango entero seguro; requiere revisión antes de operar."]:!consistent?["Los datos cambiaron durante el informe; repetir antes de decidir."]:!complete?["Más de 500 cuentas; no se declara conciliación completa."]:[]};
}
