import { nonFinancialActions } from "./non-financial.ts";
import type { ActionRegistry } from "./types.ts";
export const actionRegistry: ActionRegistry = new Map(nonFinancialActions.map((entry) => [entry.kind, entry]));
