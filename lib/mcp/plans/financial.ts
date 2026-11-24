import { patchFields, patchDefinition, mergeUpdate } from "./patch-input.ts";
import { z } from "zod";
import { v2Action } from "../../domain/v2-service.ts";
import { action } from "../../domain/home-service.ts";
import type { ActionDefinition } from "./types.ts";
import { actionDefinition, string, enumeration, integer, id, optional as o, nullable as n, date, emptyDate, color, timezone, type Field } from "./fields.ts";
const fin = (kind: string,targetTable: ActionDefinition["targetTable"],fields: Record<string,Field>) => patchDefinition(actionDefinition({ kind,phase:5,risk:"R2",targetTable,execute:async(actor,input)=>v2Action(actor.userId,{action:kind,...await mergeUpdate(kind,actor,input)}) },patchFields(kind,fields)));
const month: Field = {schema:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),json:{type:"string",pattern:"^\\d{4}-(0[1-9]|1[0-2])$"}};
const account = {name:string(200,1),type:enumeration(["bank","cash","savings","credit"]),bankName:o(string(200))};
const category = {name:string(200,1),kind:enumeration(["income","expense"]),color:o(color)};
const payment = {paymentMethod:o(enumeration(["standard","transfer"])),counterpartyBank:o(string(200)),transferMode:o(enumeration(["same_bank","ach","lbtr"]))};
const budget = {month,categoryId:id,assignedMinor:integer(),concept:o(string(500,1))};
const obligation = {title:string(200,1),concept:o(string(500,1)),kind:enumeration(["income","expense"]),expectedAmountMinor:integer(1),reservedMinor:o(integer()),accountId:o(n(id)),categoryId:o(n(id)),frequency:enumeration(["once","weekly","monthly","yearly"]),nextDueDate:date};
const goal = {title:string(200,1),targetMinor:integer(1),targetDate:o(emptyDate),priority:o(enumeration(["baja","media","alta"])),accountId:o(n(id)),categoryId:o(n(id)),linkedTaskId:o(n(id)),linkedProjectId:o(n(id))};
const bankFees: Field = {schema:z.record(z.string().min(1).max(100),z.object({achRateBps:z.number().int().min(0).max(10000),lbtrSurchargeMinor:z.number().int().min(0).max(1_000_000_000)}).strict()).refine((v)=>Object.keys(v).length<=20),json:{type:"object",maxProperties:20,propertyNames:{maxLength:100,minLength:1},additionalProperties:{type:"object",properties:{achRateBps:{type:"integer",minimum:0,maximum:10000},lbtrSurchargeMinor:{type:"integer",minimum:0,maximum:1_000_000_000}},required:["achRateBps","lbtrSurchargeMinor"],additionalProperties:false}}};
export const financialActions: readonly ActionDefinition[] = [
 fin("finance.account.create","finance_accounts",{...account,openingBalanceMinor:integer(),openingBalanceDate:date}),
 fin("finance.account.update","finance_accounts",{id,...account}),fin("finance.account.archive","finance_accounts",{id}),
 fin("finance.category.create","finance_categories",category),fin("finance.category.update","finance_categories",{id,...category}),fin("finance.category.delete","finance_categories",{id}),
 fin("finance.transaction.create","finance_transactions",{type:enumeration(["income","expense","transfer","adjustment"]),accountId:id,destinationAccountId:o(n(id)),amountMinor:integer(1),occurredOn:date,categoryId:o(n(id)),description:string(500,1),taskId:o(n(id)),projectId:o(n(id)),goalId:o(n(id)),...payment}),
 fin("finance.transaction.update_amount","finance_transactions",{id,amountMinor:integer(1),accountId:o(id),description:o(string(500,1)),categoryId:o(n(id)),...payment}),
 fin("finance.transaction.void","finance_transactions",{id,reason:string(500,1)}),
 fin("finance.budget.set","finance_budgets",budget),fin("finance.budget.update","finance_budgets",{id,...budget,allocationType:enumeration(["base","additional"])}),
 fin("finance.budget.addition.create","finance_budgets",{...budget,concept:string(500,1),assignedMinor:integer(1)}),fin("finance.budget.delete","finance_budgets",{id}),
 fin("finance.obligation.create","finance_obligations",obligation),fin("finance.obligation.update","finance_obligations",{id,...obligation}),
 fin("finance.obligation.pay","finance_transactions",{occurrenceId:id,accountId:o(id),occurredOn:o(date),amountMinor:integer(1),description:o(string(500,1)),taskId:o(n(id)),projectId:o(n(id)),...payment}),
 fin("finance.goal.create","finance_goals",goal),fin("finance.goal.update","finance_goals",{id,...goal}),
 fin("finance.goal.contribute","finance_goal_entries",{goalId:id,amountMinor:integer(1),occurredOn:o(date),note:o(string(2000))}),
 fin("finance.goal.entry.update","finance_goal_entries",{id,amountMinor:integer(1)}),fin("finance.goal.entry.revert","finance_goal_entries",{id}),
 fin("finance.settings.update","finance_settings",{timezone,safetyBufferMinor:integer(),transferSameBankRateBps:integer(0,10000),transferAchRateBps:integer(0,10000),transferLbtrSurchargeMinor:integer(0,1_000_000_000),transferBankFees:bankFees}),
 actionDefinition({kind:"task.movement.create",phase:5,risk:"R2",targetTable:"home_movements",execute:(actor,input)=>action(actor.userId,actor.fullName||actor.email,{action:"addMovement",taskId:input.taskId,description:input.description,date:input.date,amount:Number(input.amountMinor)/100})},{taskId:id,amountMinor:integer(),description:o(string(500)),date:o(date)}),
 actionDefinition({kind:"task.movement.delete",phase:5,risk:"R2",targetTable:"home_movements",execute:(actor,input)=>action(actor.userId,actor.fullName||actor.email,{action:"deleteMovement",...input})},{id}),
];
