import type { DomainDatabase } from "../../domain/context.ts";
import { PlanError } from "./types.ts";
const native=Symbol("budget-statement");
export function queryBudget(database:DomainDatabase,maxQueries=400,maxMilliseconds=60000){
 const started=performance.now();let queries=0;
 const consume=(count:number)=>{queries+=count;if(queries>maxQueries||performance.now()-started>maxMilliseconds)throw new PlanError("query_budget","El plan excede el presupuesto de consultas/tiempo; divídelo.",413);};
 const wrap=(statement:D1PreparedStatement):D1PreparedStatement=>({[native]:statement,bind(...values:unknown[]){return wrap(statement.bind(...values));},first<T>(column?:string){consume(1);return column?statement.first<T>(column):statement.first<T>();},all<T>(){consume(1);return statement.all<T>();},run<T>(){consume(1);return statement.run<T>();}}) as unknown as D1PreparedStatement;
 return {database:{prepare(sql:string){return wrap(database.prepare(sql));},async batch(statements:D1PreparedStatement[]){consume(statements.length);return database.batch(statements.map(s=>{const value=(s as D1PreparedStatement&{[native]:D1PreparedStatement})[native];if(!value)throw Error("Unbudgeted statement");return value;}));}} as DomainDatabase,stats:()=>({domainQueries:queries,elapsedMs:Math.ceil(performance.now()-started)})};
}
