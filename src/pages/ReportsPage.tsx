import { useCallback, useState } from "react";

import {
  MonthlyReportDetailToolbar,
  MonthlyReportDetailView,
  MonthlyReportListPanel,
} from "@/features/reports/components";
import { useMonthlyPeriods } from "@/features/reports/hooks/useMonthlyPeriods";
import { useMonthlyReport } from "@/features/reports/hooks/useMonthlyReport";
import type { MonthlyPeriodListItem } from "@/features/reports/types";

import { useBillingCycles } from "@/features/billing-cycles/hooks/useBillingCycles";
import { PageHeader } from "@/shared/components/layouts/PageHeader";

export function ReportsPage() {
  const [selected, setSelected] = useState<MonthlyPeriodListItem | null>(null);

  const periodsQ = useMonthlyPeriods();
  const reportQ = useMonthlyReport(
    selected?.year ?? 0,
    selected?.month ?? 0,
    Boolean(selected),
  );
  const cyclesQ = useBillingCycles();

  const report = reportQ.data;
  const isLoadingDetail = Boolean(selected) && reportQ.isLoading;

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
    <div className="w-full pb-8 font-sans">
      <PageHeader
        title="Báo cáo tháng"
        description={
          selected
            ? "Theo dõi chi tiêu, trả góp và dòng tiền — cập nhật khi cần, chốt khi đã kiểm tra xong."
            : "Tổng hợp chi tiêu theo tháng: giao dịch trực tiếp, quẹt thẻ và trả góp trong kỳ sao kê."
        }
      />

      {!selected ? (
        <MonthlyReportListPanel
          items={periodsQ.data}
          isLoading={periodsQ.isLoading}
          onOpen={handleOpenReport}
        />
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          <MonthlyReportDetailToolbar
            year={selected.year}
            month={selected.month}
            status={report?.status ?? selected.status}
            lastRefreshedAt={lastRefreshedAt}
            onBack={handleBack}
            onDeleted={handleBack}
          />

          {reportQ.isError ? (
            <div className="rounded-lg border border-danger/35 bg-danger/5 px-4 py-3 text-sm text-danger">
              Không tải được báo cáo. Thử cập nhật lại hoặc quay về danh sách.
            </div>
          ) : null}

          <MonthlyReportDetailView
            report={report}
            isLoading={isLoadingDetail}
            year={selected.year}
            month={selected.month}
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
        </div>
      )}
    </div>
  );
}
