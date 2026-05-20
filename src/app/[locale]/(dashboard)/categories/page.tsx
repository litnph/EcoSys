"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { CategoryFormModal } from "@/features/categories/components/CategoryFormModal";
import { CategoryTree } from "@/features/categories/components/CategoryTree";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useDeleteCategory } from "@/features/categories/hooks/useCategoryMutations";
import type { CategoryKind, FinCategory } from "@/features/categories/types";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";

const KIND_TABS: { value: CategoryKind; label: string }[] = [
  { value: "expense", label: "Chi tiêu" },
  { value: "income", label: "Thu nhập" },
  { value: "transfer", label: "Chuyển khoản" },
];

export default function CategoriesPage() {  const [kind, setKind] = useState<CategoryKind>("expense");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinCategory | null>(null);
  const del = useDeleteCategory();
  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Danh mục"
          description="Cây danh mục thu/chi/chuyển khoản."
        />
        <Button
          type="button"
          leftIcon={<Plus className="size-4" />}
          
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Thêm danh mục
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {KIND_TABS.map((t) => (
          <Button
            key={t.value}
            type="button"
            size="sm"
            variant={kind === t.value ? "primary" : "secondary"}
            onClick={() => setKind(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="mt-6 rounded-card border border-warm-200 bg-surface p-4 shadow-sm">
          <CategoryTree  kind={kind} />
          <p className="mt-4 text-xs text-warm-500">
            Chọn danh mục trong cây bằng nút bên dưới (nếu có dữ liệu phẳng).
          </p>
          <CategoryActionsHint
            
            kind={kind}
            onEdit={(c) => {
              setEditing(c);
              setFormOpen(true);
            }}
            onDelete={setDeleteTarget}
          />
      </div>

      <CategoryFormModal
        
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        initial={editing}
        defaultKind={kind}
      />

      <Modal
        isOpen={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title="Xóa danh mục"
      >
        <p className="text-sm text-warm-700">
          Xóa &quot;{deleteTarget?.name}&quot;? Hành động không hoàn tác.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={del.isPending}
            onClick={() => {
              if (!deleteTarget) return;
              del.mutate(deleteTarget.id, {
                onSuccess: () => setDeleteTarget(null),
              });
            }}
          >
            Xóa
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function CategoryActionsHint({
  kind,
  onEdit,
  onDelete,
}: {
  kind: CategoryKind;
  onEdit: (c: FinCategory) => void;
  onDelete: (c: FinCategory) => void;
}) {
  const { data } = useCategories( kind);

  function flatten(nodes: FinCategory[]): FinCategory[] {
    return nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);
  }

  const flat = flatten(data ?? []);
  if (flat.length === 0) return null;

  return (
    <ul className="mt-4 space-y-1 border-t border-warm-100 pt-4">
      {flat.map((c) => (
        <li key={c.id} className="flex items-center justify-between text-sm">
          <span>{c.name}</span>
          <span className="flex gap-1">
            <button
              type="button"
              className="rounded p-1 text-warm-500 hover:bg-warm-100"
              aria-label="Sửa"
              onClick={() => onEdit(c)}
            >
              <Pencil className="size-3.5" />
            </button>
            {!c.isDefault ? (
              <button
                type="button"
                className="rounded p-1 text-warm-500 hover:text-danger"
                aria-label="Xóa"
                onClick={() => onDelete(c)}
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
