"use client";

import { useQuery } from "@tanstack/react-query";

import { debtKeys } from "../api/debtKeys";
import { getDebtRecordDetail } from "../api/debtApi";

export function useDebtRecordDetail(
  recordId: string | undefined,
  opts?: { enabled?: boolean }) {
  const enabled =
    Boolean(recordId && recordId.length > 0) && opts?.enabled !== false;

  return useQuery({
    queryKey: debtKeys.detail(recordId ?? ""),
    queryFn: () => getDebtRecordDetail(recordId!),
    enabled,
    staleTime: 15_000,
  });
}
