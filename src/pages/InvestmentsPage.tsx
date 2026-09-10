import { Plus, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { useState } from "react";

import { useCreateInvestment, useDeleteInvestment, useInvestments } from "@/features/investments";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { AsyncStateError } from "@/shared/components/ui/AsyncStateError";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { SkeletonTable } from "@/shared/components/ui/Skeleton";
import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

export function InvestmentsPage() {
  const { data: items, isLoading, isError, refetch } = useInvestments();
  const create = useCreateInvestment();
  const del = useDeleteInvestment();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"stock" | "fund" | "realEstate" | "crypto" | "other">("fund");
  const [currency, setCurrency] = useState("VND");
  const [note, setNote] = useState("");

  function closeCreate() {
    setCreateOpen(false);
    setName("");
    setType("fund");
    setCurrency("VND");
    setNote("");
  }

  return (
    <div className="w-full max-w-4xl">
      <PageHeader
        title="Đầu tư"
        description="Theo dõi giá trị hiện tại và lãi/lỗ của từng khoản đầu tư mà không cộng gộp sai tiền tệ."
        actions={(
          <Button type="button" leftIcon={<Plus className="size-4" aria-hidden />} onClick={() => setCreateOpen(true)}>
            Thêm khoản đầu tư
          </Button>
        )}
      />
      {isError ? (
        <AsyncStateError title="Không tải được danh sách đầu tư" onRetry={() => void refetch()} />
      ) : isLoading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : !items?.length ? (
        <EmptyState
          icon={<TrendingUp aria-hidden />}
          title="Chưa có khoản đầu tư"
          description="Thêm khoản đầu tư đầu tiên để theo dõi giá trị và lãi/lỗ theo đúng tiền tệ."
          action={{ label: "Thêm khoản đầu tư", onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <ul className="divide-y divide-warm-200 overflow-hidden rounded-card border border-warm-200 bg-surface">
          {(items ?? []).map((row) => (
            <li
              key={row.id}
              className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
            >
              <div>
                <p className="font-medium text-warm-900">{row.name}</p>
                <p className="text-xs text-warm-500">{row.type}</p>
              </div>
              <div className="sm:text-right">
                <span className="font-amount text-sm font-semibold text-warm-900">
                  {formatCurrency(row.currentValue, row.currency)}
                </span>
                <span className={cn("mt-1 flex items-center gap-1 text-xs font-medium sm:justify-end", row.profitLoss >= 0 ? "text-success" : "text-danger")}>
                  {row.profitLoss >= 0 ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
                  {row.profitLoss >= 0 ? "Lãi" : "Lỗ"} {formatCurrency(Math.abs(row.profitLoss), row.currency)}
                </span>
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="flex size-10 items-center justify-center rounded-button text-warm-500 hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-danger"
                  aria-label={`Xóa khoản đầu tư ${row.name}`}
                  onClick={() => del.mutate(row.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={createOpen} onClose={closeCreate} title="Thêm khoản đầu tư" description="Tạo hồ sơ đầu tư; giá trị và dòng tiền được cập nhật qua các nghiệp vụ hiện có.">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim() || !currency.trim()) return;
            create.mutate(
              { name: name.trim(), type, currency: currency.trim().toUpperCase(), note: note.trim() || null },
              { onSuccess: closeCreate },
            );
          }}
        >
          <Input name="name" label="Tên khoản đầu tư" value={name} onChange={(event) => setName(event.target.value)} required />
          <label className="block text-[13px] font-semibold text-warm-700">
            Loại
            <select name="type" className="mt-1.5 h-11 w-full rounded-input border border-warm-300 bg-surface px-3 text-sm text-warm-900" value={type} onChange={(event) => setType(event.target.value as typeof type)}>
              <option value="stock">Cổ phiếu</option>
              <option value="fund">Quỹ</option>
              <option value="realEstate">Bất động sản</option>
              <option value="crypto">Tài sản số</option>
              <option value="other">Khác</option>
            </select>
          </label>
          <Input name="currency" label="Tiền tệ" value={currency} onChange={(event) => setCurrency(event.target.value)} maxLength={3} required />
          <Input name="note" label="Ghi chú" value={note} onChange={(event) => setNote(event.target.value)} />
          <div className="flex justify-end gap-2 border-t border-warm-200 pt-4">
            <Button type="button" variant="secondary" onClick={closeCreate}>Hủy</Button>
            <Button type="submit" isLoading={create.isPending}>Tạo khoản đầu tư</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
