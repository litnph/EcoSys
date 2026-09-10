import { Plus } from "lucide-react";
import { useState } from "react";

import { CategoryFormModal } from "@/features/categories/components/CategoryFormModal";
import { CategoryManager } from "@/features/categories/components/CategoryManager";
import { useDeleteCategory } from "@/features/categories/hooks/useCategoryMutations";
import type { CategoryKind, FinCategory } from "@/features/categories/types";
import { CategoryBudgetEditorModal } from "@/features/budgets/components";
import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";

const KIND_TABS: { value: CategoryKind; label: string; hint: string }[] = [
  { value: "expense", label: "Chi tiêu", hint: "Phân loại khoản chi" },
  { value: "income", label: "Thu nhập", hint: "Phân loại khoản thu" },
  { value: "transfer", label: "Chuyển khoản", hint: "Phân loại chuyển tiền" },
];

export function CategoriesPage() {
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinCategory | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinCategory | null>(null);
  const [budgetTarget, setBudgetTarget] = useState<FinCategory | null>(null);
  const del = useDeleteCategory();

  const activeTab = KIND_TABS.find((tab) => tab.value === kind);

  return (
    <div className="w-full">
      <PageHeader
        title="Danh mục"
        description="Quản lý cây phân loại, mức độ cần thiết và ngân sách theo danh mục."
        actions={<Button
          type="button"
          leftIcon={<Plus className="size-4" />}
          className="shrink-0"
          onClick={() => {
            setEditing(null);
            setDefaultParentId(null);
            setFormOpen(true);
          }}
        >
          Thêm danh mục
        </Button>}
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {KIND_TABS.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            variant={kind === tab.value ? "primary" : "secondary"}
            onClick={() => setKind(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab ? (
        <p className="mt-2 text-sm text-warm-600">{activeTab.hint}</p>
      ) : null}

      <div
        className={cn(
          "mt-6 rounded-card border border-warm-200 bg-surface p-4 sm:p-6",
        )}
      >
        <CategoryManager
          kind={kind}
          onEdit={(category) => {
            setEditing(category);
            setDefaultParentId(null);
            setFormOpen(true);
          }}
          onAddChild={(category) => {
            setEditing(null);
            setDefaultParentId(category.id);
            setFormOpen(true);
          }}
          onDelete={setDeleteTarget}
          onConfigureBudget={setBudgetTarget}
        />
      </div>

      {budgetTarget ? (
        <CategoryBudgetEditorModal
          category={budgetTarget}
          isOpen
          onClose={() => setBudgetTarget(null)}
        />
      ) : null}

      <CategoryFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
          setDefaultParentId(null);
        }}
        initial={editing}
        defaultKind={kind}
        defaultParentId={defaultParentId}
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
