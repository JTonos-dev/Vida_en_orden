import { nonFinancialActions } from "./non-financial.ts";
import { financialActions } from "./financial.ts";
import type { ActionRegistry } from "./types.ts";
export const actionRegistry: ActionRegistry = new Map([...nonFinancialActions,...financialActions].map((entry) => [entry.kind, entry]));
