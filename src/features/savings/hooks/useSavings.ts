"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { savingsKeys } from "../api/savingsKeys";
import {
  createSaving,
  deleteSaving,
  depositToSaving,
  getSavingById,
  getSavings,
  updateSaving,
  withdrawFromSaving,
} from "../api/savingsApi";

export function useSavings() {
  return useQuery({
    queryKey: ["savings", "__"],
    queryFn: () => getSavings(),
    enabled: true,
    staleTime: 30_000,
  });
}

export function useSavingDetail(id: string | null) {
  return useQuery({
    queryKey: id ? savingsKeys.detail(id) : ["savings", "detail", "__"],
    queryFn: () => getSavingById(id!),
    enabled: Boolean(id),
  });
}

function useInvalidateSavings() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: savingsKeys.all });
}

export function useCreateSaving() {
  const invalidate = useInvalidateSavings();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createSaving(body),
    onSuccess: () => {
      invalidate();
      addToast({ type: "success", title: "Đã tạo sổ tiết kiệm" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không tạo được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}

export function useUpdateSaving() {
  const invalidate = useInvalidateSavings();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      updateSaving(id, body),
    onSuccess: () => {
      invalidate();
      addToast({ type: "success", title: "Đã cập nhật" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không cập nhật được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}

export function useDeleteSaving() {
  const invalidate = useInvalidateSavings();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => deleteSaving(id),
    onSuccess: () => {
      invalidate();
      addToast({ type: "success", title: "Đã xóa" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không xóa được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}

export function useDepositSaving() {
  const invalidate = useInvalidateSavings();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { amount: number; txnDate: string; note?: string | null };
    }) => depositToSaving(id, body),
    onSuccess: () => {
      invalidate();
      addToast({ type: "success", title: "Đã gửi tiền" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không gửi được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}

export function useWithdrawSaving() {
  const invalidate = useInvalidateSavings();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { amount: number; txnDate: string; note?: string | null };
    }) => withdrawFromSaving(id, body),
    onSuccess: () => {
      invalidate();
      addToast({ type: "success", title: "Đã rút tiền" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không rút được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}
