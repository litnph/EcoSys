"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { memberKeys } from "../api/memberKeys";
import {
  createMember,
  deleteMember,
  getMembers,
  updateMember,
} from "../api/membersApi";
import type { CreateMemberRequest, UpdateMemberRequest } from "../types";

export function useMembers() {
  return useQuery({
    queryKey: memberKeys.list(),
    queryFn: getMembers,
    staleTime: 30_000,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemberRequest) => createMember(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberRequest }) =>
      updateMember(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}
