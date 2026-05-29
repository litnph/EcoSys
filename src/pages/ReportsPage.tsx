import { useCallback, useState } from "react";

import {
  BillingCyclesReportSection,
  CategoryBreakdownChart,
  CloseMonthSection,
  DailyBreakdownChart,
  DirectExpensesSection,
  MonthlyReportDetailToolbar,
  MonthlyReportListPanel,
  ReportSummaryCards,
} from "@/features/reports/components";
import { useMonthlyPeriods } from "@/features/reports/hooks/useMonthlyPeriods";
import { useMonthlyReport } from "@/features/reports/hooks/useMonthlyReport";
import type { MonthlyPeriodListItem } from "@/features/reports/types";

import { useBillingCycles } from "@/features/billing-cycles/hooks/useBillingCycles";
import { ROUTES } from "@/config/routes";
import { useRouter } from "@/i18n/navigation";
import { PageHeader } from "@/shared/components/layouts/PageHeader";

export function ReportsPage() {
  const [selected, setSelected] = useState<MonthlyPeriodListItem | null>(null);
  const router = useRouter();

  const periodsQ = useMonthlyPeriods();
  const reportQ = useMonthlyReport(
    selected?.year ?? 0,
    selected?.month ?? 0,
    Boolean(selected),
  );
  const cyclesQ = useBillingCycles();

  const report = reportQ.data;
  const isLoadingDetail = Boolean(selected) && reportQ.isLoading;

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

  const handleOpenReport = useCallback((item: MonthlyPeriodListItem) => {
    setSelected(item);
  }, []);

  const handleBack = useCallback(() => {
    setSelected(null);
    void periodsQ.refetch();
  }, [periodsQ]);

  const lastRefreshedAt =
    periodsQ.data?.find(
      (p) => p.year === selected?.year && p.month === selected?.month,
    )?.lastRefreshedAt ?? selected?.lastRefreshedAt ?? null;

  return (
    <div className="w-full max-w-[1400px] pb-8">
      <PageHeader
        title="Báo cáo tháng"
        description={
          selected
            ? "Xem chi tiết, cập nhật dữ liệu hoặc chốt báo cáo khi số liệu đã đủ."
            : "Tạo và quản lý báo cáo tháng — chi trả trực tiếp và kỳ sao kê thẻ."
        }
      />

      {!selected ? (
        <MonthlyReportListPanel
          items={periodsQ.data}
          isLoading={periodsQ.isLoading}
          onOpen={handleOpenReport}
        />
      ) : (
        <div className="flex flex-col gap-10">
          <MonthlyReportDetailToolbar
            year={selected.year}
            month={selected.month}
            status={report?.status ?? selected.status}
            lastRefreshedAt={lastRefreshedAt}
            onBack={handleBack}
            onDeleted={handleBack}
          />

          {reportQ.isError ? (
            <div className="rounded-card border border-danger/35 bg-danger/5 px-4 py-3 text-sm text-danger">
              Không tải được báo cáo. Thử cập nhật lại hoặc quay về danh sách.
            </div>
          ) : null}

            <ReportSummaryCards report={report} />

            <p className="-mt-4 text-xs text-warm-500">
              Chi tiêu = chi trả trực tiếp + tổng các kỳ sao kê phát hành trong tháng báo cáo.
            </p>

          <div className="grid gap-6 xl:grid-cols-2">
            <DirectExpensesSection
              section={report?.directExpenses}
              isLoading={isLoadingDetail}
            />
            <BillingCyclesReportSection
              section={report?.billingCycles}
              isLoading={isLoadingDetail}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryBreakdownChart
              report={report}
              isLoading={isLoadingDetail}
              year={selected.year}
              month={selected.month}
              onCategorySelect={navigateCategoryFiltered}
            />
            <DailyBreakdownChart
              data={report?.dailyBreakdown}
              isLoading={isLoadingDetail}
            />
          </div>

          {report ? (
            <CloseMonthSection
              year={selected.year}
              month={selected.month}
              status={report.status}
              billingCycles={cyclesQ.data}
              isCyclesLoading={cyclesQ.isLoading}
              onClosed={() => {
                void periodsQ.refetch();
                void reportQ.refetch();
                setSelected((prev) =>
                  prev ? { ...prev, status: "closed" } : null,
                );
              }}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
