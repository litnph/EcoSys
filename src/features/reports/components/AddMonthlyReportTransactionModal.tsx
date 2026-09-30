import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BillingCycleTxnRow } from "@/features/billing-cycles/components/BillingCycleTxnRow";
import type { Transaction } from "@/features/transactions/types";
import { AsyncStateError } from "@/shared/components/ui/AsyncStateError";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { SkeletonText } from "@/shared/components/ui/Skeleton";

import { useAddMonthlyReportTransaction } from "../hooks/useAddMonthlyReportTransaction";
import { useMonthlyReportAddableTransactions } from "../hooks/useMonthlyReportAddableTransactions";

export interface AddMonthlyReportTransactionModalProps {
  year: number;
  month: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AddMonthlyReportTransactionModal({
  year,
  month,
  isOpen,
  onClose,
}: AddMonthlyReportTransactionModalProps) {
  const [query, setQuery] = useState("");
  const candidatesQ = useMonthlyReportAddableTransactions(
    year,
    month,
    isOpen,
  );
  const addM = useAddMonthlyReportTransaction(year, month);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return candidatesQ.data ?? [];

    return (candidatesQ.data ?? []).filter((transaction) =>
      [
        transaction.description,
        transaction.categoryName,
        transaction.note,
        transaction.sourceName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [candidatesQ.data, query]);

  const handleAdd = async (transaction: Transaction) => {
    try {
      await addM.mutateAsync(transaction.id);
    } catch {
      // The mutation hook displays the API error.
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm giao dịch vào báo cáo tháng"
      description={`Báo cáo tháng ${String(month)}/${String(year)} · giao dịch trực tiếp chưa thuộc báo cáo tháng nào`}
      size="lg"
    >
      <div className="mb-4 rounded-lg border border-warm-200 bg-warm-25/60 px-3 py-2 text-xs text-warm-600">
        Chỉ hiển thị giao dịch từ nguồn tiền trực tiếp và chưa có trong bất kỳ
        báo cáo tháng nào. Có thể thêm nhiều giao dịch liên tiếp.
      </div>

      <div className="relative mb-3">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-warm-400"
          aria-hidden
        />
        <input
          type="search"
          aria-label="Tìm giao dịch có thể thêm vào báo cáo tháng"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm theo mô tả, danh mục, nguồn tiền, ghi chú…"
          className="h-10 w-full rounded-button border border-warm-200 bg-warm-50 py-2 pl-9 pr-3 text-sm text-warm-900 placeholder:text-warm-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {candidatesQ.isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <SkeletonText className="h-[72px] w-full rounded-lg" />
          <SkeletonText className="h-[72px] w-full rounded-lg" />
        </div>
      ) : candidatesQ.isError ? (
        <AsyncStateError
          title="Không tải được danh sách giao dịch"
          description="Vui lòng thử lại để tiếp tục chọn giao dịch cho báo cáo tháng."
          onRetry={() => void candidatesQ.refetch()}
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-warm-200 px-4 py-8 text-center">
          <p className="text-sm text-warm-600">
            {query.trim()
              ? "Không có giao dịch khớp từ khóa tìm kiếm."
              : "Không còn giao dịch trực tiếp phù hợp để thêm vào báo cáo."}
          </p>
          <p className="mt-1 text-xs text-warm-500">
            Giao dịch đã thuộc một báo cáo tháng khác sẽ không xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-warm-500">
            {filtered.length} giao dịch có thể thêm
          </p>
          <ul className="flex max-h-[min(460px,58vh)] flex-col gap-2 overflow-y-auto pr-1">
            {filtered.map((transaction) => (
              <li key={transaction.id}>
                <BillingCycleTxnRow
                  transaction={transaction}
                  onAdd={handleAdd}
                  isAdding={
                    addM.isPending && addM.variables === transaction.id
                  }
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-4 flex justify-end border-t border-warm-100 pt-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  );
}
