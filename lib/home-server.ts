import { env } from "cloudflare:workers";
import { runWithDomainDatabase } from "./domain/context";
import * as service from "./domain/home-service";
export type { Task, Note, Movement } from "./domain/home-service";
export { userId, userName } from "./domain/home-service";
export const ensureSeed = () => runWithDomainDatabase(env.DB, () => service.ensureSeed());
export const stateFor = () => runWithDomainDatabase(env.DB, () => service.stateFor());
export const action = (...args: Parameters<typeof service.action>) => runWithDomainDatabase(env.DB, () => service.action(...args));
