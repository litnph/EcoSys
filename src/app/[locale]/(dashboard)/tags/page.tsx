"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { useCreateTag, useDeleteTag, useTags } from "@/features/tags";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";

export default function TagsPage() {  const { data: items, isLoading, isError } = useTags();
  const create = useCreateTag();
  const del = useDeleteTag();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Thẻ" description="Nhãn phân loại giao dịch và bản ghi." />
        <Button
          type="button"
          leftIcon={<Plus className="size-4" />}
          
          onClick={() => setOpen(true)}
        >
          Thêm thẻ
        </Button>
      </div>
      {isError ? (
        <p className="mt-8 text-sm text-danger">Không tải được danh sách.</p>
      ) : isLoading ? (
        <p className="mt-8 text-sm text-warm-500">Đang tải…</p>
      ) : (
        <ul className="mt-8 flex flex-wrap gap-2">
          {(items ?? []).map((t) => (
            <li
              key={t.id}
              className="inline-flex items-center gap-2 rounded-full border border-warm-200 bg-surface px-3 py-1.5 text-sm shadow-sm"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: t.color }}
                aria-hidden
              />
              <span className="font-medium text-warm-900">{t.name}</span>
              <span className="text-xs text-warm-500">({t.usageCount})</span>
              <button
                type="button"
                className="text-warm-400 hover:text-danger"
                aria-label="Xóa"
                onClick={() => del.mutate(t.id)}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Thêm thẻ">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (! !name.trim()) return;
            create.mutate(
              { name: name.trim(), color },
              {
                onSuccess: () => {
                  setOpen(false);
                  setName("");
                },
              });
          }}
        >
          <Input label="Tên" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Màu (#hex)" value={color} onChange={(e) => setColor(e.target.value)} />
          <Button type="submit" disabled={create.isPending}>
            Tạo
          </Button>
        </form>
      </Modal>
    </div>
  );
}
