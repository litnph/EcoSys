"use client";

import { Plus, Wallet } from "lucide-react";

import {
  DeleteSourceConfirm,
  SourceCard,
  SourceForm,
} from "@/features/sources/components";
import { useSources } from "@/features/sources/hooks";
import type { FinSource } from "@/features/sources/types";

import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Modal } from "@/shared/components/ui/Modal";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";
import { staggerChildren, staggerItem } from "@/shared/lib/animations";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";

export default function SourcesPage() {  const { data: sources, isLoading, isError } = useSources();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<FinSource | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<FinSource | null>(null);
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
    <div className="w-full max-w-[1400px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Nguồn tài chính"
          description="Quản lý ví, tài khoản và thẻ trong không gian tài chính."
        />
        <Button
          type="button"
          leftIcon={<Plus className="size-4" aria-hidden />}
          onClick={openCreate}
          
          className="shrink-0"
        >
          Thêm nguồn
        </Button>
      </div>

      {isError ? (
        <div className="mt-8 rounded-card border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
          Không tải được danh sách nguồn. Kiểm tra kết nối API và quyền truy cập.
        </div>
      ) : isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={`sk-${String(i)}`} lines={2} />
          ))}
        </div>
      ) : sources && sources.length === 0 ? (
        <div className="mt-8 rounded-card border border-warm-200 bg-surface shadow-sm">
          <EmptyState
            icon={<Wallet aria-hidden />}
            title="Chưa có nguồn tài chính"
            description="Thêm tài khoản để bắt đầu theo dõi tài chính"
            action={{ label: "Thêm nguồn đầu tiên", onClick: openCreate }}
          />
        </div>
      ) : (
        <motion.div
          variants={staggerChildren}
          initial="initial"
          animate="animate"
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {sources?.map((s) => (
            <motion.div key={s.id} variants={staggerItem} className="h-full">
              <SourceCard
                source={s}
                onEdit={openEdit}
                onDelete={requestDelete}
              />
            </motion.div>
          ))}
        </motion.div>
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
    </div>
  );
}
