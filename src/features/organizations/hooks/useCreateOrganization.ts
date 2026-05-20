"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToastStore } from "@/shared/stores/toastStore";

import {
  createOrganization,
  type CreateOrganizationRequest,
} from "../api/organizationsApi";
import { MY_ORGANIZATIONS_QUERY_KEY } from "./useMyOrganizations";

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (payload: CreateOrganizationRequest) => createOrganization(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_ORGANIZATIONS_QUERY_KEY });
      addToast({
        type: "success",
        title: "Đã tạo tổ chức",
      });
    },
    onError: (error: Error) => {
      addToast({
        type: "error",
        title: "Không thể tạo tổ chức",
        message: error.message,
      });
    },
  });
}
