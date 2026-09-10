import { Plus, RefreshCw, Wallet } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/config/routes";

import {
  DeleteSourceConfirm,
  RecalculateSourcesModal,
  SourceCard,
  SourceForm,
} from "@/features/sources/components";
import { useSources } from "@/features/sources/hooks";
import type { FinSource } from "@/features/sources/types";

import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { AsyncStateError } from "@/shared/components/ui/AsyncStateError";
import { Modal } from "@/shared/components/ui/Modal";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";
import { useCallback, useState } from "react";

export function SourcesPage() {
  const router = useRouter();
  const { data: sources, isLoading, isError, refetch } = useSources();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<FinSource | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<FinSource | null>(null);
  const [recalOpen, setRecalOpen] = useState(false);
  const openCreate = useCallback(() => {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((s: FinSource) => {
    setFormMode("edit");
    setEditing(s);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
  }, []);

  const requestDelete = useCallback((s: FinSource) => {
    setDeleteTarget(s);
  }, []);

  return (
    <div className="w-full">
      <PageHeader
        title="Nguồn tài chính"
        description="Quản lý ví, tài khoản và thẻ trong cùng một sổ tài chính gia đình."
        actions={<div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            leftIcon={<RefreshCw className="size-4" aria-hidden />}
            onClick={() => setRecalOpen(true)}
          >
            Đối soát
          </Button>
          <Button
            type="button"
            leftIcon={<Plus className="size-4" aria-hidden />}
            onClick={openCreate}
            className="shrink-0"
          >
            Thêm nguồn
          </Button>
        </div>}
      />

      {isError ? (
        <AsyncStateError
          title="Không tải được danh sách nguồn"
          description="Kiểm tra kết nối API và quyền truy cập, sau đó thử lại."
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <div className="mt-6 divide-y divide-warm-200 overflow-hidden rounded-card border border-warm-200 bg-surface">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={`sk-${String(i)}`} lines={2} className="rounded-none border-0 p-4" />
          ))}
        </div>
      ) : sources && sources.length === 0 ? (
        <div className="mt-6 rounded-card border border-warm-200 bg-surface">
          <EmptyState
            icon={<Wallet aria-hidden />}
            title="Chưa có nguồn tài chính"
            description="Thêm tài khoản để bắt đầu theo dõi tài chính"
            action={{ label: "Thêm nguồn đầu tiên", onClick: openCreate }}
          />
        </div>
      ) : (
        <div className="mt-6 divide-y divide-warm-200 overflow-hidden rounded-card border border-warm-200 bg-surface">
          {sources?.map((s) => (
            <div key={s.id}>
              <SourceCard
                source={s}
                onEdit={openEdit}
                onDelete={requestDelete}
                onViewLedger={(src) =>
                  router.push(ROUTES.dashboard.sourceLedger(src.id))}
              />
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={formMode === "create" ? "Thêm nguồn" : "Sửa nguồn"}
        size="lg"
      >
        <SourceForm
          key={formMode === "edit" ? editing?.id ?? "edit" : "create"}
          
          mode={formMode}
          initial={editing}
          onFinished={closeForm}
        />
      </Modal>

      <DeleteSourceConfirm
        source={deleteTarget}
        
        isOpen={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
      />

      <RecalculateSourcesModal
        isOpen={recalOpen}
        onClose={() => setRecalOpen(false)}
      />
    </div>
  );
}
