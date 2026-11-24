import { calculateAccountBalance, dateInTimeZone } from "../../finance-math.ts";
import type { FinancialImpact, Snapshot } from "./types.ts";
function balances(snapshot:Snapshot,date:string){
 const transactions=snapshot.finance_transactions.map(row=>({type:String(row.type),accountId:String(row.account_id),destinationAccountId:row.destination_account_id?String(row.destination_account_id):null,amountMinor:Number(row.amount_minor),feeMinor:Number(row.fee_minor||0),occurredOn:String(row.occurred_on),status:String(row.status)}));
 return snapshot.finance_accounts.map(row=>({id:String(row.id),name:String(row.name),balanceMinor:calculateAccountBalance(String(row.id),Number(row.opening_balance_minor),String(row.opening_balance_date),date,transactions)}));
}
export function financialImpact(before:Snapshot,after:Snapshot,beforeSummary:Record<string,number>,afterSummary:Record<string,number>,now:Date):FinancialImpact{
 const date=dateInTimeZone(now,"America/Santo_Domingo"),old=balances(before,date),next=balances(after,date);
 const accounts=[...new Set([...old.map(a=>a.id),...next.map(a=>a.id)])].map(id=>{const from=old.find(a=>a.id===id),to=next.find(a=>a.id===id);return {id,name:to?.name||from!.name,beforeMinor:from?.balanceMinor??null,afterMinor:to?.balanceMinor??null};}).filter(a=>a.beforeMinor!==a.afterMinor);
 const warnings=[];if(accounts.some(a=>a.afterMinor!==null&&a.afterMinor<0))warnings.push("Alguna cuenta quedaría con saldo negativo.");if(afterSummary.uncommittedMinor<0)warnings.push("El disponible no comprometido quedaría negativo.");
 if(after.finance_transactions.some(row=>String(row.occurred_on)>date&&!before.finance_transactions.some(old=>old.id===row.id)))warnings.push("Hay movimientos futuros; los saldos mostrados corresponden a la fecha de cálculo, sin anticiparlos.");
 const key=(row:Record<string,string|number|null>)=>JSON.stringify([row.type,row.account_id,row.destination_account_id,row.amount_minor,row.occurred_on,String(row.description||"").trim().toLowerCase()]);
 const counts=new Map<string,number>();for(const row of after.finance_transactions.filter(row=>row.status==="confirmed"))counts.set(key(row),(counts.get(key(row))||0)+1);
 const beforeKeys=new Map(before.finance_transactions.map(row=>[String(row.id),key(row)]));
 if(after.finance_transactions.some(row=>row.status==="confirmed"&&(counts.get(key(row))||0)>1&&beforeKeys.get(String(row.id))!==key(row)))warnings.push("Hay posibles movimientos repetidos por cuenta, tipo, importe, fecha y concepto; revisar antes de aprobar.");
 return {date,month:date.slice(0,7),before:beforeSummary,after:afterSummary,accounts,warnings};
}
