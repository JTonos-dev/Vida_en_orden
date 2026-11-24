import type { FinanceTransaction } from "@/lib/app-types";

export type MovementDirection = "all" | "debit" | "credit";

export type MovementFilters = {
  query: string;
  dateFrom: string;
  dateTo: string;
  accountId: string;
  direction: MovementDirection;
};

export type MovementSearchContext = Record<string, unknown>;

const normalizeSearch = (value: string) => value
  .toLocaleLowerCase("es-DO")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

export function movementDirections(transaction: FinanceTransaction, accountId = ""): MovementDirection[] {
  if (transaction.type === "income") return ["credit"];
  if (transaction.type === "expense") return ["debit"];
  if (transaction.type === "transfer") {
    if (accountId) {
      return [
        ...(transaction.accountId === accountId ? ["debit" as const] : []),
        ...(transaction.destinationAccountId === accountId ? ["credit" as const] : []),
      ];
    }
    return ["debit", "credit"];
  }
  return ["debit", "credit"];
}

export function movementSearchText(transaction: FinanceTransaction, context: MovementSearchContext = {}) {
  return normalizeSearch(JSON.stringify({ transaction, context }));
}

export function matchesMovementFilters(
  transaction: FinanceTransaction,
  filters: MovementFilters,
  context: MovementSearchContext = {},
) {
  const query = normalizeSearch(filters.query.trim());
  if (query && !movementSearchText(transaction, context).includes(query)) return false;

  if (filters.dateFrom || filters.dateTo) {
    if (filters.dateFrom && filters.dateTo) {
      const start = filters.dateFrom <= filters.dateTo ? filters.dateFrom : filters.dateTo;
      const end = filters.dateFrom <= filters.dateTo ? filters.dateTo : filters.dateFrom;
      if (transaction.occurredOn < start || transaction.occurredOn > end) return false;
    } else if (transaction.occurredOn !== (filters.dateFrom || filters.dateTo)) {
      return false;
    }
  }

  if (filters.accountId && transaction.accountId !== filters.accountId && transaction.destinationAccountId !== filters.accountId) return false;
  if (filters.direction !== "all" && !movementDirections(transaction, filters.accountId).includes(filters.direction)) return false;
  return true;
}
