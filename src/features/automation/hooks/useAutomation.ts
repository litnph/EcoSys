"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { automationKeys } from "../api/automationKeys";
import {
  createAutomationRule,
  deleteAutomationRule,
  getAutomationRules,
  toggleAutomationRule,
} from "../api/automationApi";

export function useAutomationRules() {
  return useQuery({
    queryKey: ["automation", "__"],
    queryFn: () => getAutomationRules(),
    enabled: true,
    staleTime: 30_000,
  });
}

export function useCreateAutomationRule() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createAutomationRule(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: automationKeys.all });
      addToast({ type: "success", title: "Đã tạo quy tắc" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không tạo được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}

export function useToggleAutomationRule() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => toggleAutomationRule(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: automationKeys.all });
      addToast({ type: "success", title: "Đã cập nhật trạng thái" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không bật/tắt được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}

export function useDeleteAutomationRule() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: deleteAutomationRule,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: automationKeys.all });
      addToast({ type: "success", title: "Đã xóa quy tắc" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không xóa được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}
