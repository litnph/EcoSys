"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import {
  cancelAccountDeletion,
  getDataExportStatus,
  requestAccountDeletion,
  requestDataExport,
} from "../api/gdprApi";

export const gdprKeys = {
  export: (id: string) => ["gdpr", "export", id] as const,
};

export function useDataExportStatus(exportId: string | null) {
  return useQuery({
    queryKey: exportId ? gdprKeys.export(exportId) : ["gdpr", "export", "__"],
    queryFn: () => getDataExportStatus(exportId!),
    enabled: Boolean(exportId),
    refetchInterval: (query) => {
      const status = query.state.data?.status?.toLowerCase();
      if (status === "ready" || status === "failed") return false;
      return 3000;
    },
  });
}

export function useRequestDataExport() {
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: requestDataExport,
    onSuccess: () => {
      addToast({ type: "success", title: "Đã yêu cầu xuất dữ liệu" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không yêu cầu được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}

export function useRequestAccountDeletion() {
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (reason?: string) => requestAccountDeletion(reason),
    onSuccess: () => {
      addToast({
        type: "success",
        title: "Đã gửi yêu cầu xóa tài khoản",
        message: "Kiểm tra email để xác nhận.",
      });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không gửi được yêu cầu",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}

export function useCancelAccountDeletion() {
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: cancelAccountDeletion,
    onSuccess: () => {
      addToast({ type: "success", title: "Đã hủy yêu cầu xóa tài khoản" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không hủy được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}
