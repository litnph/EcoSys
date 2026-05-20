"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import {
  useDeleteSaving,
  useDepositSaving,
  useSavings,
  useWithdrawSaving,
} from "@/features/savings";
import { useSources } from "@/features/sources/hooks";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { Drawer } from "@/shared/components/ui/Drawer";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { formatCurrency } from "@/shared/lib/formatters";

export default function SavingsPage() {
  const { data: items, isLoading, isError } = useSavings();
  const { data: sources } = useSources();
  const del = useDeleteSaving();
  const deposit = useDepositSaving();
  const withdraw = useWithdrawSaving();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const selected = items?.find((s) => s.id === selectedId);
  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Tiết kiệm" description="Quản lý sổ tiết kiệm và mục tiêu." />
        <Button
          type="button"
          leftIcon={<Plus className="size-4" />}
          
          onClick={() => setCreateOpen(true)}
        >
          Thêm sổ
        </Button>
      </div>

      {isError ? (
        <p className="mt-8 text-sm text-danger">Không tải được danh sách.</p>
      ) : isLoading ? (
        <p className="mt-8 text-sm text-warm-500">Đang tải…</p>
      ) : (
        <ul className="mt-8 space-y-2">
          {(items ?? []).map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-card border border-warm-200 bg-surface px-4 py-3 text-left shadow-sm hover:border-accent/40"
                onClick={() => setSelectedId(s.id)}
              >
                <span>
                  <span className="font-medium text-warm-900">{s.name}</span>
                  <span className="mt-0.5 block text-xs text-warm-500">
                    {s.sourceName} · {s.status}
                  </span>
                </span>
                <span className="font-mono text-sm font-semibold text-warm-900">
                  {formatCurrency(s.currentAmount, "VND")}
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

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Thêm sổ tiết kiệm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            // minimal create — user can refine later
          }}
        >
          <Input label="Tên" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="block text-sm font-medium text-warm-800">
            Nguồn
            <select
              className="mt-1 w-full rounded-input border border-warm-200 px-3 py-2"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              <option value="">Chọn nguồn</option>
              {(sources ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" disabled>
            Tạo (cần đủ trường API)
          </Button>
        </form>
      </Modal>
    </div>
  );
}
