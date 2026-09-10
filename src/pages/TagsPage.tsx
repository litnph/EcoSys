import { Plus, Tag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useCreateTag, useDeleteTag, useTags } from "@/features/tags";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { AsyncStateError } from "@/shared/components/ui/AsyncStateError";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ColorPicker } from "@/shared/components/ui/IconColorPickers";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { COLOR_PRESETS } from "@/shared/lib/iconColorPresets";

export function TagsPage() {
  const { data: items, isLoading, isError, refetch } = useTags();
  const create = useCreateTag();
  const del = useDeleteTag();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(COLOR_PRESETS[2] ?? "#725a3a");

  const colorPresets = useMemo(() => {
    const set = new Set<string>(COLOR_PRESETS);
    if (/^#[0-9a-fA-F]{6}$/.test(color)) set.add(color);
    return Array.from(set);
  }, [color]);

  return (
    <div className="w-full max-w-4xl">
      <PageHeader
        title="Thẻ"
        description="Nhãn phân loại giao dịch và bản ghi. Màu sắc luôn đi cùng tên nhãn và số lần sử dụng."
        actions={(
          <Button type="button" leftIcon={<Plus className="size-4" aria-hidden />} onClick={() => setOpen(true)}>
            Thêm thẻ
          </Button>
        )}
      />
      {isError ? (
        <AsyncStateError title="Không tải được danh sách thẻ" onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="flex flex-wrap gap-2" aria-busy="true">
          {[96, 132, 112, 148, 104].map((width) => <SkeletonText key={width} style={{ width }} className="h-10 rounded-badge" />)}
        </div>
      ) : !items?.length ? (
        <EmptyState
          icon={<Tag aria-hidden />}
          title="Chưa có thẻ"
          description="Tạo thẻ đầu tiên để đánh dấu và tìm lại các giao dịch liên quan."
          action={{ label: "Thêm thẻ", onClick: () => setOpen(true) }}
        />
      ) : (
        <ul className="flex flex-wrap gap-2">
          {(items ?? []).map((t) => (
            <li
              key={t.id}
              className="inline-flex min-h-10 items-center gap-2 rounded-badge border border-warm-200 bg-surface pl-3 pr-1 text-sm"
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
                className="flex size-9 items-center justify-center rounded-full text-warm-400 hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-danger"
                aria-label={`Xóa thẻ ${t.name}`}
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
            if (!name.trim()) return;
            create.mutate(
              { name: name.trim(), color },
              {
                onSuccess: () => {
                  setOpen(false);
                  setName("");
                  setColor(COLOR_PRESETS[2] ?? "#725a3a");
                },
              },
            );
          }}
        >
          <Input label="Tên" value={name} onChange={(e) => setName(e.target.value)} />
          <ColorPicker
            label="Màu"
            value={color}
            onChange={setColor}
            presets={colorPresets}
          />
          <Button type="submit" disabled={create.isPending}>
            Tạo
          </Button>
        </form>
      </Modal>
    </div>
  );
}
