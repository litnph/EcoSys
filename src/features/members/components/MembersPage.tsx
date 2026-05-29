import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useCallback, useState } from "react";

import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Modal } from "@/shared/components/ui/Modal";
import { useToastStore } from "@/shared/stores/toastStore";

import {
  useCreateMember,
  useDeleteMember,
  useMembers,
  useUpdateMember,
} from "../hooks/useMembers";
import type { Member } from "../types";
import { MemberFormModal } from "./MemberFormModal";

export function MembersPage() {
  const { data: members, isLoading, isError } = useMembers();
  const createMutation = useCreateMember();
  const updateMutation = useUpdateMember();
  const deleteMutation = useDeleteMember();
  const addToast = useToastStore((s) => s.addToast);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const openCreate = useCallback(() => {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((member: Member) => {
    setFormMode("edit");
    setEditing(member);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
  }, []);

  const handleFormSubmit = useCallback(
    (values: {
      email: string;
      fullName: string;
      password?: string;
      role: "admin" | "member";
      isActive: boolean;
    }) => {
      if (formMode === "create") {
        if (!values.password || values.password.length < 6) {
          addToast({ type: "error", title: "Mật khẩu tối thiểu 6 ký tự" });
          return;
        }
        createMutation.mutate(
          {
            email: values.email,
            fullName: values.fullName,
            password: values.password,
            role: values.role,
          },
          {
            onSuccess: () => {
              addToast({ type: "success", title: "Đã tạo thành viên" });
              closeForm();
            },
            onError: (e) => {
              addToast({
                type: "error",
                title: "Không thể tạo thành viên",
                message: e instanceof Error ? e.message : undefined,
              });
            },
          });
        return;
      }
      if (!editing) return;
      updateMutation.mutate(
        {
          id: editing.id,
          data: {
            fullName: values.fullName,
            role: values.role,
            isActive: values.isActive,
            newPassword: values.password,
          },
        },
        {
          onSuccess: () => {
            addToast({ type: "success", title: "Đã cập nhật thành viên" });
            closeForm();
          },
          onError: (e) => {
            addToast({
              type: "error",
              title: "Không thể cập nhật",
              message: e instanceof Error ? e.message : undefined,
            });
          },
        });
    },
    [addToast, closeForm, createMutation, editing, formMode, updateMutation]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        addToast({ type: "success", title: "Đã xóa thành viên" });
        setDeleteTarget(null);
      },
      onError: (e) => {
        addToast({
          type: "error",
          title: "Không thể xóa",
          message: e instanceof Error ? e.message : undefined,
        });
      },
    });
  }, [addToast, deleteMutation, deleteTarget]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <MembersHeader openCreate={openCreate} />
      <MembersBody
        members={members}
        isLoading={isLoading}
        isError={isError}
        openEdit={openEdit}
        setDeleteTarget={setDeleteTarget}
      />
      <MemberFormModal
        isOpen={formOpen}
        mode={formMode}
        member={editing}
        isPending={createMutation.isPending || updateMutation.isPending}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
      />
      <MembersDeleteModal
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        confirmDelete={confirmDelete}
        deleteMutation={deleteMutation}
      />
    </div>
  );
}

function MembersHeader({ openCreate }: { openCreate: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <PageHeader
        title="Thành viên"
        description="Quản lý tài khoản thành viên trong hệ thống."
      />
      <Button
        type="button"
        leftIcon={<Plus className="size-4" aria-hidden />}
        onClick={openCreate}
      >
        Thêm thành viên
      </Button>
    </div>
  );
}

function MembersBody({
  members,
  isLoading,
  isError,
  openEdit,
  setDeleteTarget,
}: {
  members: Member[] | undefined;
  isLoading: boolean;
  isError: boolean;
  openEdit: (m: Member) => void;
  setDeleteTarget: (m: Member | null) => void;
}) {
  if (isError) {
    return <p className="mt-6 text-sm text-danger">Không tải được danh sách.</p>;
  }
  if (isLoading) {
    return <p className="mt-6 text-sm text-warm-600">Đang tải…</p>;
  }
  if (!members?.length) {
    return (
      <EmptyState
        className="mt-8"
        icon={<Users className="size-14" aria-hidden />}
        title="Chưa có thành viên"
        description="Tạo tài khoản cho thành viên mới."
      />
    );
  }
  return (
    <div className="mt-6 overflow-x-auto rounded-card border border-warm-200 bg-surface">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-warm-200 bg-warm-50 text-warm-600">
          <tr>
            <th className="px-4 py-3 font-medium">Họ tên</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Vai trò</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
            <th className="px-4 py-3 font-medium text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b border-warm-100 last:border-0">
              <td className="px-4 py-3 font-medium text-warm-900">{m.fullName}</td>
              <td className="px-4 py-3 text-warm-700">{m.email}</td>
              <td className="px-4 py-3 text-warm-700">
                {m.role === "admin" ? "Quản trị" : "Thành viên"}
              </td>
              <td className="px-4 py-3">
                {m.isActive ? (
                  <span className="text-success">Hoạt động</span>
                ) : (
                  <span className="text-warm-500">Vô hiệu</span>
                )}
              </td>
              <td className="px-4 py-3">
                <MembersRowActions
                  member={m}
                  openEdit={openEdit}
                  setDeleteTarget={setDeleteTarget}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MembersRowActions({
  member,
  openEdit,
  setDeleteTarget,
}: {
  member: Member;
  openEdit: (m: Member) => void;
  setDeleteTarget: (m: Member | null) => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Sửa"
        onClick={() => openEdit(member)}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Xóa"
        onClick={() => setDeleteTarget(member)}
      >
        <Trash2 className="size-4 text-danger" />
      </Button>
    </div>
  );
}

function MembersDeleteModal({
  deleteTarget,
  setDeleteTarget,
  confirmDelete,
  deleteMutation,
}: {
  deleteTarget: Member | null;
  setDeleteTarget: (m: Member | null) => void;
  confirmDelete: () => void;
  deleteMutation: ReturnType<typeof useDeleteMember>;
}) {
  return (
    <Modal
      isOpen={deleteTarget !== null}
      onClose={() => setDeleteTarget(null)}
      title="Xóa thành viên"
      size="sm"
    >
      <p className="text-sm text-warm-700">
        Xóa <strong>{deleteTarget?.fullName}</strong>? Hành động không hoàn tác.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
          Hủy
        </Button>
        <Button
          variant="danger"
          isLoading={deleteMutation.isPending}
          onClick={confirmDelete}
        >
          Xóa
        </Button>
      </div>
    </Modal>
  );
}
