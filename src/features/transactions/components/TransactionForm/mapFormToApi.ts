import type { FinSource } from "@/features/sources/types";
import { toApiWholeAmount } from "@/shared/lib/currencyUnits";

import type { CreateTransactionBody } from "../../api/transactionsApi";

import type { TransactionCreateFormType, TransactionFormValues } from "./transactionFormSchema";
import { resolveExpenseApiType } from "./resolveExpenseApiType";

function apiTypeFromForm(
  t: TransactionCreateFormType,
  values: TransactionFormValues,
  sources: FinSource[]): CreateTransactionBody["type"] {
  if (t === "direct") {
    return resolveExpenseApiType(values.sourceId, sources);
  }
  const m = {
    income: "income",
    transfer: "transfer",
    split: "split",
    debt_borrow: "debtBorrow",
    debt_repay: "debtRepay",
    loan_give: "loanGive",
    loan_collect: "loanCollect",
  } satisfies Record<
    Exclude<TransactionCreateFormType, "direct">,
    NonNullable<CreateTransactionBody["type"]>
  >;
  return m[t as Exclude<TransactionCreateFormType, "direct">];
}

function cleanNote(v: string | undefined): string | null {
  const t = v?.trim() ?? "";
  return t.length ? t : null;
}

/** Map form → POST /finance/transactions (camelCase trong OpenAPI). */
export function mapFormValuesToCreateBody(
  v: TransactionFormValues,
  sources: FinSource[]): CreateTransactionBody {
  const base: CreateTransactionBody = {
    type: apiTypeFromForm(v.type, v, sources),
    amount: toApiWholeAmount(v.amount),
    sourceId: v.sourceId.trim(),
    txnDate: v.txnDate.trim(),
    description: v.description?.trim() ?? "",
    note: cleanNote(v.note),
  };

  switch (v.type) {
    case "direct":
    case "income":
      return {
        ...base,
        categoryId: v.categoryId?.trim() ?? null,
      };
    case "transfer":
      return {
        ...base,
        categoryId: null,
        toSourceId: v.toSourceId?.trim(),
      };
    case "split":
      return {
        ...base,
        categoryId: v.categoryId?.trim() ?? null,
        splits: (v.splits ?? []).map((r) => ({
          personName: r.personName.trim(),
          amount: toApiWholeAmount(r.amount),
        })),
      };
    case "debt_borrow":
    case "loan_give": {
      const due = v.dueDate?.trim();
      return {
        ...base,
        categoryId: null,
        personName: v.personName?.trim() ?? null,
        personContact: cleanNote(v.personContact) ?? null,
        dueDate: due && due.length > 0 ? due : null,
      };
    }
    case "debt_repay":
    case "loan_collect":
      return {
        ...base,
        categoryId: null,
        debtRecordId: v.debtRecordId?.trim() ?? "",
      };
    default:
      throw new Error("Unsupported transaction create type");
  }
}
