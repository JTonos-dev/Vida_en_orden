import { z, type ZodTypeAny } from "zod";
import type { ActionDefinition } from "./types.ts";

export type Field = { schema: ZodTypeAny; json: Record<string, unknown>; optional?: boolean };
export const string = (max = 2000, min = 0): Field => ({ schema: z.string().min(min).max(max), json: { type: "string", minLength: min, maxLength: max } });
export const enumeration = (values: readonly [string, ...string[]]): Field => ({ schema: z.enum(values), json: { type: "string", enum: values } });
export const integer = (min = 0, max = 1_000_000_000_000): Field => ({ schema: z.number().int().min(min).max(max), json: { type: "integer", minimum: min, maximum: max } });
export const bool: Field = { schema: z.boolean(), json: { type: "boolean" } };
export const id: Field = { schema: z.string().min(1).max(160), json: { anyOf: [{ type: "string", minLength: 1, maxLength: 160 }, { type: "object", properties: { $ref: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_-]{0,63}$" } }, required: ["$ref"], additionalProperties: false }] } };
export const optional = (field: Field): Field => ({ ...field, optional: true, schema: field.schema.optional() });
export const nullable = (field: Field): Field => ({ ...field, schema: field.schema.nullable(), json: { anyOf: [field.json, { type: "null" }] } });
export const array = (field: Field, max = 50): Field => ({ schema: z.array(field.schema).max(max), json: { type: "array", items: field.json, maxItems: max } });
export const date: Field = { schema: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s), json: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" } };
export const emptyDate: Field = { schema: z.union([date.schema, z.literal("")]), json: { anyOf: [date.json, { const: "" }] } };
export const time: Field = { schema: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$|^$/), json: { type: "string", pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$|^$" } };
export const color: Field = { schema: z.string().regex(/^#[0-9a-fA-F]{6}$/), json: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" } };
export const timezone: Field = { schema: z.string().max(100).refine((s) => { try { new Intl.DateTimeFormat("en", { timeZone: s }); return true; } catch { return false; } }), json: { type: "string", maxLength: 100 } };
export function actionDefinition(base: Omit<ActionDefinition, "schema" | "inputSchema">, fields: Record<string, Field>): ActionDefinition {
  return { ...base, schema: z.object(Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.schema]))).strict(),
    inputSchema: { type: "object", properties: Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.json])), required: Object.entries(fields).filter(([,field]) => !field.optional).map(([key]) => key), additionalProperties: false } };
}
