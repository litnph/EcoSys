import type { DebtDirection, DebtStatus } from "../types";

export const debtKeys = {
  all: ["debt"] as const,
  lists: () => [...debtKeys.all, "list"] as const,
  list: (smoduleId: string, direction?: DebtDirection, status?: DebtStatus) =>
    [...debtKeys.lists(), smoduleId, direction ?? "*", status ?? "*"] as const,
  summaries: () => [...debtKeys.all, "summary"] as const,
  summary: (smoduleId: string) => [...debtKeys.summaries(), smoduleId] as const,
  details: () => [...debtKeys.all, "detail"] as const,
  detail: (id: string) => [...debtKeys.details(), id] as const,
};
