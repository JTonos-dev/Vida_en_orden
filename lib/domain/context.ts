import { AsyncLocalStorage } from "node:async_hooks";

export type DomainDatabase = Pick<D1Database, "prepare" | "batch">;
type DomainContext = { database: DomainDatabase; now?: () => Date };
const contexts = new AsyncLocalStorage<DomainContext>();

export function runWithDomainDatabase<T>(database: DomainDatabase | undefined, run: () => T, now?: () => Date): T {
  if (!database) throw new Error("Base de datos no disponible");
  return contexts.run({ database, now }, run);
}

export function domainDatabase(): DomainDatabase {
  const context = contexts.getStore();
  if (!context) throw new Error("Contexto de dominio no disponible");
  return context.database;
}

export function domainNow(): string {
  return (contexts.getStore()?.now?.() ?? new Date()).toISOString();
}
