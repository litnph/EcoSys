import type { QueryClient } from "@tanstack/react-query";

import { notificationKeys } from "@/features/notifications/api/notificationKeys";
import { reportKeys } from "@/features/reports/api/reportKeys";

import { budgetKeys } from "../api/budgetKeys";

/** Refresh every surface derived from category spending after a financial mutation. */
export async function invalidateBudgetAwareness(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
    queryClient.invalidateQueries({ queryKey: reportKeys.all }),
    queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  ]);
}
