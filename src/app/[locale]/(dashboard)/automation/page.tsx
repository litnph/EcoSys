"use client";

import { Plus, Power, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  useAutomationRules,
  useCreateAutomationRule,
  useDeleteAutomationRule,
  useToggleAutomationRule,
} from "@/features/automation";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { MissingFinanceModule } from "@/shared/components/finance/MissingFinanceModule";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";
import { useFinanceSmoduleId } from "@/shared/hooks/useFinanceSmoduleId";

export default function AutomationPage() {
  const smoduleId = useFinanceSmoduleId();
  const { data: items, isLoading, isError } = useAutomationRules(
    smoduleId || undefined,
  );
  const toggle = useToggleAutomationRule();
  const del = useDeleteAutomationRule();
  const create = useCreateAutomationRule();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const missing = !smoduleId;

  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Tự động hóa"
          description="Quy tắc chạy theo lịch hoặc sự kiện."
        />
        <Button
          type="button"
          leftIcon={<Plus className="size-4" />}
          disabled={missing}
          onClick={() => setOpen(true)}
        >
          Thêm quy tắc
        </Button>
      </div>
      {missing ? (
        <MissingFinanceModule />
      ) : isError ? (
        <p className="mt-8 text-sm text-danger">Không tải được danh sách.</p>
      ) : isLoading ? (
        <p className="mt-8 text-sm text-warm-500">Đang tải…</p>
      ) : (
        <ul className="mt-8 space-y-2">
          {(items ?? []).map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-card border border-warm-200 bg-surface px-4 py-3 shadow-sm"
            >
              <div>
                <p className="font-medium text-warm-900">{r.name}</p>
                <p className="text-xs text-warm-500">
                  {r.triggerType}
                  {r.lastRunAt ? ` · Lần chạy: ${r.lastRunAt}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-badge px-2 py-0.5 text-xs font-medium",
                    r.isActive
                      ? "bg-accent/15 text-accent"
                      : "bg-warm-100 text-warm-600",
                  )}
                >
                  {r.isActive ? "Bật" : "Tắt"}
                </span>
                <button
                  type="button"
                  className="rounded p-2 text-warm-600 hover:bg-warm-100"
                  aria-label="Bật/tắt"
                  onClick={() => toggle.mutate(r.id)}
                >
                  <Power className="size-4" />
                </button>
                <button
                  type="button"
                  className="rounded p-2 text-warm-500 hover:text-danger"
                  aria-label="Xóa"
                  onClick={() => del.mutate(r.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Quy tắc mới">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!smoduleId || !name.trim()) return;
            create.mutate(
              {
                smoduleId,
                name: name.trim(),
                triggerType: 3,
                triggerValue: new Date().toISOString().slice(0, 10),
                conditions: "[]",
                actions: "[]",
              },
              {
                onSuccess: () => {
                  setOpen(false);
                  setName("");
                },
              },
            );
          }}
        >
          <Input label="Tên" value={name} onChange={(e) => setName(e.target.value)} />
          <p className="text-xs text-warm-500">
            Mặc định: lịch 8h sáng hàng ngày, điều kiện/hành động JSON rỗng.
          </p>
          <Button type="submit" disabled={create.isPending}>
            Tạo
          </Button>
        </form>
      </Modal>
    </div>
  );
}
