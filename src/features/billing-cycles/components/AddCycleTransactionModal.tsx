import { Search } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import type { Transaction } from "@/features/transactions/types";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { formatDate } from "@/shared/lib/formatters";

import { useBillingCycleAddableTransactions } from "../hooks/useBillingCycleAddableTransactions";
import { useAddCycleItem } from "../hooks/useEditCycleItems";
import type { BillingCycle } from "../types";
import { billingCycleDisplayName } from "../utils/billingCycleDisplay";

import { BillingCycleTxnRow } from "./BillingCycleTxnRow";

export interface AddCycleTransactionModalProps {
  cycle: BillingCycle | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AddCycleTransactionModal({
  cycle,
  isOpen,
  onClose,
}: AddCycleTransactionModalProps) {
  const [query, setQuery] = useState("");
  const addM = useAddCycleItem(cycle?.id ?? "");

  const candidatesQ = useBillingCycleAddableTransactions(cycle?.id, isOpen);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const filtered = useMemo(() => {
    const rows = candidatesQ.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((tx) => {
      const haystack = [
        tx.description,
        tx.categoryName,
        tx.note,
        tx.sourceName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [candidatesQ.data, query]);

  const handleAdd = async (tx: Transaction) => {
    if (!cycle) return;
    try {
      await addM.mutateAsync(tx.id);
    } catch {
      /* toast in hook */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm giao dịch vào kỳ sao kê"
      description={
        cycle
          ? `${billingCycleDisplayName(cycle)} · ${cycle.sourceName} · giao dịch mới (trả sau), ngày ≤ ${formatDate(cycle.statementDate)}, chưa thuộc kỳ nào`
          : undefined
      }
      size="lg"
    >
      <div className="mb-4 rounded-lg border border-warm-200 bg-warm-25/60 px-3 py-2 text-xs text-warm-600">
        Chỉ hiển thị giao dịch{" "}
        <strong className="text-warm-800">trạng thái mới</strong> trên cùng{" "}
        <strong className="text-warm-800">nguồn thẻ</strong> với kỳ sao kê.
        Có thể thêm nhiều giao dịch liên tiếp.
      </div>

      <div className="relative mb-3">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-warm-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo mô tả, danh mục, ghi chú…"
          className="h-10 w-full rounded-button border border-warm-200 bg-warm-50 py-2 pl-9 pr-3 text-sm text-warm-900 placeholder:text-warm-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {candidatesQ.isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <SkeletonText className="h-[72px] w-full rounded-lg" />
          <SkeletonText className="h-[72px] w-full rounded-lg" />
        </div>
      ) : candidatesQ.isError ? (
        <p className="text-sm text-danger">Không tải được danh sách giao dịch.</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-warm-200 px-4 py-8 text-center">
          <p className="text-sm text-warm-600">
            {query.trim()
              ? "Không có giao dịch khớp từ khóa tìm kiếm."
              : "Không còn giao dịch mới phù hợp để thêm vào kỳ này."}
          </p>
          <p className="mt-1 text-xs text-warm-500">
            Giao dịch phải là quẹt thẻ (trả sau), trạng thái mới, cùng thẻ và
            chưa nằm trong kỳ sao kê khác.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-warm-500">
            {filtered.length} giao dịch có thể thêm
          </p>
          <ul className="flex max-h-[min(460px,58vh)] flex-col gap-2 overflow-y-auto pr-1">
            {filtered.map((tx) => (
              <li key={tx.id}>
                <BillingCycleTxnRow
                  transaction={tx}
                  onAdd={handleAdd}
                  isAdding={addM.isPending && addM.variables === tx.id}
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
