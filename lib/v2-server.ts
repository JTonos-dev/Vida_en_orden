import { env } from "cloudflare:workers";
import { runWithDomainDatabase } from "./domain/context";
import * as service from "./domain/v2-service";
export const v2StateFor = (...args: Parameters<typeof service.v2StateFor>) => runWithDomainDatabase(env.DB, () => service.v2StateFor(...args));
export const v2Action = (...args: Parameters<typeof service.v2Action>) => runWithDomainDatabase(env.DB, () => service.v2Action(...args));
