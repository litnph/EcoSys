"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { CategorySelector } from "@/features/categories/components/CategorySelector";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";

import { useUpdateTransaction } from "../hooks/useUpdateTransaction";
import type { TransactionDetail } from "../types";

type FormValues = {
  description: string;
  note: string;
  txnDate: string;
  categoryId: string;
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
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        description: transaction.description ?? "",
        note: transaction.note ?? "",
        txnDate: transaction.txnDate.slice(0, 10),
        categoryId: transaction.categoryId ?? "",
      });
    }
  }, [isOpen, transaction, reset]);

  const categoryId = watch("categoryId");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sửa giao dịch">
      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit((vals) => {
          update.mutate(
            {
              id: transaction.id,
              payload: {
                description: vals.description.trim(),
                note: vals.note.trim() || null,
                txnDate: vals.txnDate,
                categoryId: vals.categoryId || null,
                monthlyPeriodId: transaction.monthlyPeriodId ?? null,
              },
            },
            { onSuccess: () => onClose() },
          );
        })}
      >
        <Input
          label="Mô tả"
          error={errors.description?.message}
          {...register("description", {
            required: "Vui lòng nhập mô tả",
            validate: (v) => v.trim().length > 0 || "Vui lòng nhập mô tả",
          })}
        />
        <Input label="Ghi chú" {...register("note")} />
        <Input
          label="Ngày"
          type="date"
          error={errors.txnDate?.message}
          {...register("txnDate", { required: "Vui lòng chọn ngày" })}
        />
        <CategorySelector
          smoduleId={transaction.smoduleId}
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
