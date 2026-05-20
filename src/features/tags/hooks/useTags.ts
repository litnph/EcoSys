"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { tagKeys } from "../api/tagKeys";
import { createTag, deleteTag, getTags, updateTag } from "../api/tagsApi";

export function useTags() {
  return useQuery({
    queryKey: ["tags", "__"],
    queryFn: () => getTags(),
    enabled: true,
    staleTime: 30_000,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tagKeys.all });
      addToast({ type: "success", title: "Đã tạo thẻ" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không tạo được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string; color: string } }) =>
      updateTag(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tagKeys.all });
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

export function useDeleteTag() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tagKeys.all });
      addToast({ type: "success", title: "Đã xóa thẻ" });
    },
    onError: (e) =>
      addToast({
        type: "error",
        title: "Không xóa được",
        message: getFinanceApiErrorMessage(e),
      }),
  });
}
