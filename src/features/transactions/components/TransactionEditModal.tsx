import * as React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { CategorySelector } from "@/features/categories/components/CategorySelector";
import { TagPicker } from "@/features/tags/components/TagPicker";
import { Button } from "@/shared/components/ui/Button";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";

import { useUpdateTransaction } from "../hooks/useUpdateTransaction";
import type { TransactionDetail } from "../types";
import { syncTransactionTags } from "../utils/syncTransactionTags";

type FormValues = {
  description: string;
  note: string;
  txnDate: string;
  categoryId: string;
  amount: number;
};

export function TransactionEditModal({
  transaction,
  isOpen,
  onClose,
}: {
  transaction: TransactionDetail;
  isOpen: boolean;
  onClose: () => void;
}) {
  const update = useUpdateTransaction();
  const [tagIds, setTagIds] = React.useState<string[]>([]);
  const initialTagIdsRef = React.useRef<string[]>([]);
  const canEditAmount = transaction.canEditAmount !== false;
  const isBalanceAdjustment = transaction.type === "balance_adjustment";
  const isTransfer = transaction.type === "transfer";
  const [adjDirection, setAdjDirection] = React.useState<"up" | "down">(
    transaction.amount < 0 ? "down" : "up",
  );
  const displayAmount = isBalanceAdjustment
    ? Math.abs(transaction.amount)
    : Math.abs(transaction.amount);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      description: transaction.description ?? "",
      note: transaction.note ?? "",
      txnDate: transaction.txnDate.slice(0, 10),
      categoryId: transaction.categoryId ?? "",
      amount: displayAmount,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        description: transaction.description ?? "",
        note: transaction.note ?? "",
        txnDate: transaction.txnDate.slice(0, 10),
        categoryId: transaction.categoryId ?? "",
        amount: displayAmount,
      });
      setAdjDirection(transaction.amount < 0 ? "down" : "up");
      const ids = transaction.tags?.map((t) => t.id) ?? [];
      initialTagIdsRef.current = ids;
      setTagIds(ids);
    }
  }, [isOpen, transaction, reset, displayAmount]);

  const categoryId = watch("categoryId");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sửa giao dịch">
      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit(async (vals) => {
          const signedAdj =
            adjDirection === "down" ? -Math.abs(vals.amount) : Math.abs(vals.amount);
          const amountChanged = isBalanceAdjustment
            ? signedAdj !== transaction.amount
            : vals.amount !== displayAmount;
          let amountPayload: number | null = null;
          if (amountChanged && canEditAmount) {
            amountPayload = isBalanceAdjustment
              ? signedAdj
              : Math.abs(vals.amount);
          }

          try {
            await update.mutateAsync({
              id: transaction.id,
              payload: {
                description: vals.description.trim(),
                note: vals.note.trim() || null,
                txnDate: vals.txnDate,
                categoryId: vals.categoryId || null,
                monthlyPeriodId: transaction.monthlyPeriodId ?? null,
                amount: amountPayload,
                expectedVersion: transaction.version,
              },
            });
            await syncTransactionTags(
              transaction.id,
              initialTagIdsRef.current,
              tagIds,
            );
            onClose();
          } catch {
            /* toast in hook */
          }
        })}
      >
        <Input
          label="Mô tả (không bắt buộc)"
          error={errors.description?.message}
          {...register("description", {
            maxLength: {
              value: 512,
              message: "Mô tả tối đa 512 ký tự",
            },
          })}
        />
        <Input label="Ghi chú" {...register("note")} />
        <div>
          <label className="mb-2 block text-sm font-medium text-warm-700">
            Thẻ <span className="font-normal text-warm-500">(không bắt buộc)</span>
          </label>
          <TagPicker value={tagIds} onChange={setTagIds} disabled={update.isPending} />
        </div>
        <Input
          label="Ngày"
          type="date"
          error={errors.txnDate?.message}
          {...register("txnDate", { required: "Vui lòng chọn ngày" })}
        />
        {transaction.type !== "reversal" && canEditAmount ? (
          <CurrencyInput
            label="Số tiền"
            value={watch("amount")}
            onChange={(v) => setValue("amount", v, { shouldDirty: true })}
            currency={transaction.currency}
            error={errors.amount?.message}
          />
        ) : transaction.type !== "reversal" ? (
          <p className="text-sm text-warm-500">
            Không thể sửa số tiền: giao dịch đã nằm trong kỳ sao kê hoặc đã chuyển trả góp.
          </p>
        ) : null}
        {isBalanceAdjustment ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={adjDirection === "up" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setAdjDirection("up")}
              >
                Tăng
              </Button>
              <Button
                type="button"
                variant={adjDirection === "down" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setAdjDirection("down")}
              >
                Giảm
              </Button>
            </div>
          </div>
        ) : isTransfer ? (
          <p className="text-xs text-warm-500">
            Chuyển khoản: nhập số tiền chuyển (dương); hai chân sẽ được cập nhật.
          </p>
        ) : null}
        <CategorySelector
          
          kind={
            transaction.type === "income"
              ? "income"
              : transaction.type === "transfer"
                ? "transfer"
                : "expense"
          }
          value={categoryId}
          onChange={(id) => setValue("categoryId", id ?? "")}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            isLoading={update.isPending}
            disabled={update.isPending}
          >
            Lưu
          </Button>
        </div>
      </form>
    </Modal>
  );
}
