"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import {
  CloseMonthSection,
  MonthSelector,
  ReportSummaryCards,
} from "@/features/reports/components";
import { useMonthlyReport } from "@/features/reports/hooks/useMonthlyReport";
import { currentUtcYearMonth } from "@/features/reports/utils/months";

import { useBillingCycles } from "@/features/billing-cycles/hooks/useBillingCycles";
import { NEXT_PUBLIC_FINANCE_SMODULE_ID } from "@/config/env";
import { ROUTES } from "@/config/routes";
import { useRouter } from "@/i18n/navigation";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { SkeletonText } from "@/shared/components/ui/Skeleton";

const CategoryBreakdownChart = dynamic(
  () =>
    import("@/features/reports/components/CategoryBreakdownChart").then(
      (m) => m.CategoryBreakdownChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center rounded-card border border-warm-200 bg-surface p-6 shadow-sm">
        <SkeletonText className="h-48 w-full rounded-lg" />
      </div>
    ),
  },
);

const DailyBreakdownChart = dynamic(
  () =>
    import("@/features/reports/components/DailyBreakdownChart").then(
      (m) => m.DailyBreakdownChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center rounded-card border border-warm-200 bg-surface p-6 shadow-sm">
        <SkeletonText className="h-48 w-full rounded-lg" />
      </div>
    ),
  },
);

export default function ReportsPage() {
  const smoduleIdRaw = NEXT_PUBLIC_FINANCE_SMODULE_ID.trim();
  const missingModule = smoduleIdRaw.length === 0;
  const start = currentUtcYearMonth();
  const [ym, setYm] = useState(start);

  const router = useRouter();

  const reportQ = useMonthlyReport(
    missingModule ? undefined : smoduleIdRaw,
    ym.year,
    ym.month,
  );

  const cyclesQ = useBillingCycles(
    missingModule ? undefined : smoduleIdRaw,
  );

  const report = reportQ.data;
  const isLoading = reportQ.isLoading;

  const navigateCategoryFiltered = useCallback(
    (slice: { categoryId: string | null; year: number; month: number }) => {
      if (!slice.categoryId) return;
      const qs = new URLSearchParams({
        categoryId: slice.categoryId,
        year: String(slice.year),
        month: String(slice.month),
      });
      router.push(`${ROUTES.dashboard.transactions}?${qs.toString()}`);
    },
    [router],
  );

  return (
    <div className="w-full max-w-[1400px] pb-24 md:pb-8">
      <PageHeader
        title="Báo cáo tháng"
        description="Tổng quan thu chi theo danh mục, dòng tiền hằng ngày và chốt sổ tháng."
      />

      {missingModule ? (
        <div className="mt-8 rounded-card border border-warm-200 bg-warm-25 p-8 text-center text-sm text-warm-600 shadow-sm">
          Thiết lập biến{" "}
          <code className="rounded px-1.5 py-0.5 font-mono text-warm-800">
            NEXT_PUBLIC_FINANCE_SMODULE_ID
          </code>{" "}
          trong <strong>.env.local</strong> để xem báo cáo.
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <MonthSelector year={ym.year} month={ym.month} onChange={setYm} />
              <p className="max-w-md text-xs text-warm-500 md:text-sm">
                Dữ liệu theo UTC; khi đổi tháng báo cáo được làm mới đầy đủ từ server.
              </p>
            </div>

            {reportQ.isError ? (
              <div className="rounded-card border border-danger/35 bg-danger/5 px-4 py-3 text-sm text-danger">
                Không tải được báo cáo cho tháng đã chọn. Kiểm tra API và phiên đăng nhập.
              </div>
            ) : null}

            <ReportSummaryCards report={report} />

            <div className="grid gap-6 lg:grid-cols-2">
              <CategoryBreakdownChart
                data={report?.categoryBreakdown}
                isLoading={isLoading}
                year={ym.year}
                month={ym.month}
                onCategorySelect={navigateCategoryFiltered}
              />
              <DailyBreakdownChart data={report?.dailyBreakdown} isLoading={isLoading} />
            </div>

            {report ? (
              <CloseMonthSection
                smoduleId={smoduleIdRaw}
                year={ym.year}
                month={ym.month}
                status={report.status}
                billingCycles={cyclesQ.data}
                isCyclesLoading={cyclesQ.isLoading}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
