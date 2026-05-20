"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";

import { categoryKeys } from "../api/categoryKeys";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
} from "../api/categoriesApi";

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      addToast({ type: "success", title: "Đã tạo danh mục" });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không tạo được danh mục",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      updateCategory(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      addToast({ type: "success", title: "Đã cập nhật danh mục" });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không cập nhật được danh mục",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      addToast({ type: "success", title: "Đã xóa danh mục" });
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Không xóa được danh mục",
        message: getFinanceApiErrorMessage(error),
      });
    },
  });
}
