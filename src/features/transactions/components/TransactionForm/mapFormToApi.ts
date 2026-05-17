import type { CreateTransactionBody } from "../../api/transactionsApi";

import type { TransactionCreateFormType, TransactionFormValues } from "./transactionFormSchema";

function apiTypeFromForm(t: TransactionCreateFormType): CreateTransactionBody["type"] {
  const m = {
    direct: "direct",
    income: "income",
    transfer: "transfer",
    deferred: "deferred",
    split: "split",
    debt_borrow: "debtBorrow",
    debt_repay: "debtRepay",
    loan_give: "loanGive",
    loan_collect: "loanCollect",
  } satisfies Record<
    TransactionCreateFormType,
    NonNullable<CreateTransactionBody["type"]>
  >;
  return m[t];
}

function cleanNote(v: string | undefined): string | null {
  const t = v?.trim() ?? "";
  return t.length ? t : null;
}

/** Map form → POST /finance/transactions (camelCase trong OpenAPI). */
export function mapFormValuesToCreateBody(
  smoduleId: string,
  v: TransactionFormValues,
): CreateTransactionBody {
  const base: CreateTransactionBody = {
    smoduleId,
    type: apiTypeFromForm(v.type),
    amount: v.amount,
    sourceId: v.sourceId.trim(),
    txnDate: v.txnDate.trim(),
    note: cleanNote(v.note),
  };

  switch (v.type) {
    case "direct":
    case "income":
    case "deferred":
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
        categoryId: null,
        splits: (v.splits ?? []).map((r) => ({
          personName: r.personName.trim(),
          amount: r.amount,
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
