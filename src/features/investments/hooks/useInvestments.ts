"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { investmentKeys } from "../api/investmentKeys";
import {
  createInvestment,
  deleteInvestment,
  getInvestments,
  updateInvestment,
} from "../api/investmentsApi";

export function useInvestments(smoduleId: string | undefined) {
  return useQuery({
    queryKey: smoduleId ? investmentKeys.list(smoduleId) : ["investments", "__"],
    queryFn: () => getInvestments(smoduleId ?? ""),
    enabled: Boolean(smoduleId),
    staleTime: 30_000,
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createInvestment(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: investmentKeys.all });
      addToast({ type: "success", title: "Đã tạo khoản đầu tư" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không tạo được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}

export function useUpdateInvestment() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      updateInvestment(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: investmentKeys.all });
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

export function useDeleteInvestment() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => deleteInvestment(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: investmentKeys.all });
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
