import type { BillingCycleStatus } from "../types";

export const billingCycleKeys = {
  all: ["billing-cycles"] as const,
  lists: () => [...billingCycleKeys.all, "list"] as const,
  list: (
    smoduleId: string,
    sourceId?: string,
    status?: BillingCycleStatus,
  ) =>
    [
      ...billingCycleKeys.lists(),
      smoduleId,
      sourceId ?? "__all__",
      status ?? "__all__",
    ] as const,
  details: () => [...billingCycleKeys.all, "detail"] as const,
  detail: (id: string) => [...billingCycleKeys.details(), id] as const,
};
