import { PiggyBank, Plus } from "lucide-react";
import { useState } from "react";

import {
  useDeleteSaving,
  useDepositSaving,
  useCreateSaving,
  useSavings,
  useWithdrawSaving,
} from "@/features/savings";
import { useSources } from "@/features/sources/hooks";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { AsyncStateError } from "@/shared/components/ui/AsyncStateError";
import { Badge } from "@/shared/components/ui/Badge";
import { CurrencyInput } from "@/shared/components/ui/CurrencyInput";
import { Drawer } from "@/shared/components/ui/Drawer";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { SkeletonTable } from "@/shared/components/ui/Skeleton";
import { formatCurrency } from "@/shared/lib/formatters";

export function SavingsPage() {
  const { data: items, isLoading, isError, refetch } = useSavings();
  const { data: sources } = useSources();
  const del = useDeleteSaving();
  const create = useCreateSaving();
  const deposit = useDepositSaving();
  const withdraw = useWithdrawSaving();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [targetAmount, setTargetAmount] = useState(0);
  const [interestRate, setInterestRate] = useState("0");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maturityDate, setMaturityDate] = useState("");
  const [savingType, setSavingType] = useState<"flexible" | "fixedTerm">("flexible");
  const [createNote, setCreateNote] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const selected = items?.find((s) => s.id === selectedId);

  function closeCreate() {
    setCreateOpen(false);
    setName("");
    setSourceId("");
    setTargetAmount(0);
    setInterestRate("0");
    setStartDate(new Date().toISOString().slice(0, 10));
    setMaturityDate("");
    setSavingType("flexible");
    setCreateNote("");
  }

  return (
    <div className="w-full max-w-4xl">
      <PageHeader
        title="Tiết kiệm"
        description="Quản lý sổ tiết kiệm, mục tiêu và các lần gửi/rút gắn với nguồn tiền."
        actions={(
          <Button type="button" leftIcon={<Plus className="size-4" aria-hidden />} onClick={() => setCreateOpen(true)}>
            Thêm sổ
          </Button>
        )}
      />

      {isError ? (
        <AsyncStateError title="Không tải được danh sách tiết kiệm" onRetry={() => void refetch()} />
      ) : isLoading ? (
        <SkeletonTable rows={4} cols={3} />
      ) : !items?.length ? (
        <EmptyState
          icon={<PiggyBank aria-hidden />}
          title="Chưa có sổ tiết kiệm"
          description="Tạo sổ đầu tiên và chọn nguồn tiền để bắt đầu theo dõi các lần gửi, rút và mục tiêu."
          action={{ label: "Thêm sổ tiết kiệm", onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <ul className="divide-y divide-warm-200 overflow-hidden rounded-card border border-warm-200 bg-surface">
          {(items ?? []).map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="grid min-h-16 w-full gap-2 px-4 py-3 text-left transition-colors hover:bg-warm-50 focus-visible:bg-accent-light sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                onClick={() => setSelectedId(s.id)}
              >
                <span>
                  <span className="flex flex-wrap items-center gap-2 font-semibold text-warm-900">
                    {s.name}
                    <Badge variant={s.status === "active" ? "success" : "default"}>{s.status}</Badge>
                  </span>
                  <span className="mt-1 block text-xs text-warm-500">
                    {s.sourceName} · {s.type === "fixedTerm" ? "Có kỳ hạn" : "Linh hoạt"}
                  </span>
                </span>
                <span className="sm:text-right">
                  <span className="block font-amount text-sm font-semibold text-warm-900">{formatCurrency(s.currentAmount, "VND")}</span>
                  {s.targetAmount ? <span className="mt-1 block text-xs text-warm-500">Mục tiêu {formatCurrency(s.targetAmount, "VND")}</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Drawer
        isOpen={selected != null}
        onClose={() => setSelectedId(null)}
        title={selected?.name ?? ""}
        side="right"
      >
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-warm-600">
              Số dư: {formatCurrency(selected.currentAmount, "VND")}
            </p>
            <Input
              label="Số tiền"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Ghi chú"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={deposit.isPending}
                onClick={() => {
                  const amt = Number(amount);
                  if (!amt) return;
                  deposit.mutate(
                    {
                      id: selected.id,
                      body: {
                        amount: amt,
                        txnDate: new Date().toISOString().slice(0, 10),
                        note: note || null,
                      },
                    },
                    { onSuccess: () => setAmount("") });
                }}
              >
                Gửi tiền
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={withdraw.isPending}
                onClick={() => {
                  const amt = Number(amount);
                  if (!amt) return;
                  withdraw.mutate(
                    {
                      id: selected.id,
                      body: {
                        amount: amt,
                        txnDate: new Date().toISOString().slice(0, 10),
                        note: note || null,
                      },
                    },
                    { onSuccess: () => setAmount("") });
                }}
              >
                Rút tiền
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  del.mutate(selected.id, {
                    onSuccess: () => setSelectedId(null),
                  });
                }}
              >
                Xóa
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal isOpen={createOpen} onClose={closeCreate} title="Thêm sổ tiết kiệm" description="Liên kết sổ với một nguồn tiền hiện có để các biến động có thể truy vết." size="lg">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !sourceId || !startDate) return;
            create.mutate(
              {
                sourceId,
                name: name.trim(),
                targetAmount: targetAmount > 0 ? targetAmount : null,
                interestRate: Number(interestRate) || 0,
                startDate,
                maturityDate: maturityDate || null,
                type: savingType,
                status: "active",
                note: createNote.trim() || null,
              },
              { onSuccess: closeCreate },
            );
          }}
        >
          <Input name="name" label="Tên sổ" value={name} onChange={(e) => setName(e.target.value)} required />
          <label className="block text-[13px] font-semibold text-warm-700">
            Nguồn
            <select
              name="sourceId"
              className="mt-1.5 h-11 w-full rounded-input border border-warm-300 bg-surface px-3 text-sm text-warm-900"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              required
            >
              <option value="">Chọn nguồn</option>
              {(sources ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <CurrencyInput name="targetAmount" label="Mục tiêu (không bắt buộc)" value={targetAmount} onChange={setTargetAmount} />
          <Input name="interestRate" label="Lãi suất (%)" type="number" min="0" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
          <Input name="startDate" label="Ngày bắt đầu" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <Input name="maturityDate" label="Ngày đáo hạn" type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} disabled={savingType === "flexible"} />
          <label className="block text-[13px] font-semibold text-warm-700">
            Loại sổ
            <select name="type" className="mt-1.5 h-11 w-full rounded-input border border-warm-300 bg-surface px-3 text-sm text-warm-900" value={savingType} onChange={(e) => setSavingType(e.target.value as typeof savingType)}>
              <option value="flexible">Linh hoạt</option>
              <option value="fixedTerm">Có kỳ hạn</option>
            </select>
          </label>
          <Input name="note" label="Ghi chú" value={createNote} onChange={(e) => setCreateNote(e.target.value)} />
          <div className="flex justify-end gap-2 border-t border-warm-200 pt-4 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={closeCreate}>Hủy</Button>
            <Button type="submit" isLoading={create.isPending} disabled={!name.trim() || !sourceId || !startDate}>Tạo sổ</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
