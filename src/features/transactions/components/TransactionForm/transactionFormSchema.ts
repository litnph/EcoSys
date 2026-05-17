import { format } from "date-fns";
import { z } from "zod";

import type { TransactionType } from "../../types";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const txnDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ");

function uuidField(msg: string): z.ZodString {
  return z
    .string()
    .trim()
    .min(1, msg)
    .refine((s) => UUID.test(s), msg);
}

/** Các loại giao dịch trong form tạo (không gồm reversal). */
export const TRANSACTION_CREATE_TYPES = [
  "direct",
  "income",
  "transfer",
  "deferred",
  "split",
  "debt_borrow",
  "debt_repay",
  "loan_give",
  "loan_collect",
] as const satisfies readonly Exclude<TransactionType, "reversal">[];

export type TransactionCreateFormType =
  (typeof TRANSACTION_CREATE_TYPES)[number];

const splitItemSchema = z.object({
  personName: z.string().trim().min(1, "Nhập tên người"),
  amount: z.number().positive("Số tiền phải > 0"),
});

export interface TransactionFormValues {
  type: TransactionCreateFormType;
  amount: number;
  sourceId: string;
  txnDate: string;
  note?: string;
  categoryId?: string;
  toSourceId?: string;
  splits?: { personName: string; amount: number }[];
  personName?: string;
  personContact?: string;
  /** yyyy-MM-dd rỗng = không có hạn */
  dueDate?: string;
  debtRecordId?: string;
}

function needsCategory(t: TransactionCreateFormType) {
  return t === "direct" || t === "income" || t === "deferred";
}

export function categoryKindFor(t: TransactionCreateFormType): "expense" | "income" {
  return t === "income" ? "income" : "expense";
}

/** Schema động theo loại giao dịch (resolver gọi theo giá trị `type` hiện tại). */
export function buildTransactionSchema(
  type: TransactionCreateFormType,
): z.ZodType<TransactionFormValues> {
  return z
    .object({
      type: z.literal(type),
      amount: z
        .number({ message: "Nhập số tiền" })
        .positive("Số tiền phải > 0"),
      sourceId: uuidField("Chọn nguồn"),
      txnDate: txnDateString,
      note: z.string().max(500, "Ghi chú tối đa 500 ký tự").optional(),
      categoryId: z.string().optional(),
      toSourceId: z.string().optional(),
      splits: z.array(splitItemSchema).optional(),
      personName: z.string().optional(),
      personContact: z.string().optional(),
      dueDate: z.string().optional(),
      debtRecordId: z.string().optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
      if (needsCategory(type)) {
        const cid = data.categoryId?.trim() ?? "";
        if (!cid) {
          ctx.addIssue({
            code: "custom",
            message: "Chọn danh mục",
            path: ["categoryId"],
          });
        } else if (!UUID.test(cid)) {
          ctx.addIssue({
            code: "custom",
            message: "Danh mục không hợp lệ",
            path: ["categoryId"],
          });
        }
      }

      if (type === "transfer") {
        const tid = data.toSourceId?.trim() ?? "";
        if (!tid) {
          ctx.addIssue({
            code: "custom",
            message: "Chọn nguồn đích",
            path: ["toSourceId"],
          });
        } else if (!UUID.test(tid)) {
          ctx.addIssue({
            code: "custom",
            message: "Nguồn đích không hợp lệ",
            path: ["toSourceId"],
          });
        } else if (tid === data.sourceId) {
          ctx.addIssue({
            code: "custom",
            message: "Khác nguồn gửi",
            path: ["toSourceId"],
          });
        }
      }

      if (type === "split") {
        const rows = data.splits ?? [];
        if (rows.length < 1) {
          ctx.addIssue({
            code: "custom",
            message: "Thêm ít nhất một người chia",
            path: ["splits"],
          });
          return;
        }
        const sum = rows.reduce((acc, row) => acc + row.amount, 0);
        if (Math.abs(sum - data.amount) > 0.005) {
          ctx.addIssue({
            code: "custom",
            message: "Tổng chia phải bằng số tiền giao dịch",
            path: ["splits"],
          });
        }
      }

      if (type === "debt_borrow" || type === "loan_give") {
        const n = data.personName?.trim() ?? "";
        if (!n) {
          ctx.addIssue({
            code: "custom",
            message: "Nhập tên đối tác",
            path: ["personName"],
          });
        }
      }

      if (type === "debt_repay" || type === "loan_collect") {
        const id = data.debtRecordId?.trim() ?? "";
        if (!id) {
          ctx.addIssue({
            code: "custom",
            message: "Chọn khoản nợ",
            path: ["debtRecordId"],
          });
        } else if (!UUID.test(id)) {
          ctx.addIssue({
            code: "custom",
            message: "Khoản nợ không hợp lệ",
            path: ["debtRecordId"],
          });
        }
      }

      if (
        (type === "debt_borrow" || type === "loan_give") &&
        data.dueDate?.trim()
      ) {
        const parsed = txnDateString.safeParse(data.dueDate.trim());
        if (!parsed.success) {
          ctx.addIssue({
            code: "custom",
            message: "Ngày đến hạn không hợp lệ",
            path: ["dueDate"],
          });
        }
      }
    });
}

export function defaultsForTxnForm(
  type: TransactionCreateFormType,
  preserve?: Partial<Pick<TransactionFormValues, "amount" | "txnDate">>,
): TransactionFormValues {
  const today = format(new Date(), "yyyy-MM-dd");
  return {
    type,
    amount: preserve?.amount ?? 0,
    txnDate: preserve?.txnDate ?? today,
    sourceId: "",
    note: "",
    categoryId: undefined,
    toSourceId: undefined,
    splits: [{ personName: "", amount: 0 }],
    personName: "",
    personContact: "",
    dueDate: "",
    debtRecordId: "",
  };
}
