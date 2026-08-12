import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { UserRole } from "@/features/auth/types";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";

import type { Member } from "../types";

const schema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  fullName: z.string().trim().min(1, "Họ tên bắt buộc"),
  password: z.string().optional(),
  role: z.enum(["admin", "member"]),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export type MemberFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  member: Member | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: {
    email: string;
    fullName: string;
    password?: string;
    role: UserRole;
    isActive: boolean;
  }) => void;
};

export function MemberFormModal({
  isOpen,
  mode,
  member,
  isPending,
  onClose,
  onSubmit,
}: MemberFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      role: "member",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && member) {
      reset({
        email: member.email,
        fullName: member.fullName,
        password: "",
        role: member.role,
        isActive: member.isActive,
      });
    } else {
      reset({
        email: "",
        fullName: "",
        password: "",
        role: "member",
        isActive: true,
      });
    }
  }, [isOpen, mode, member, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Thêm thành viên" : "Sửa thành viên"}
      size="md"
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => {
          if (mode === "create" && (!values.password || values.password.length < 6)) {
            return;
          }
          onSubmit({
            email: values.email,
            fullName: values.fullName,
            password: values.password,
            role: values.role,
            isActive: values.isActive,
          });
        })}
      >
        <Input
          label="Email"
          type="email"
          disabled={mode === "edit"}
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Họ tên"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Input
          label={mode === "create" ? "Mật khẩu" : "Mật khẩu mới (tùy chọn)"}
          type="password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div>
          <label
            htmlFor="member-role"
            className="mb-1 block text-sm font-medium text-warm-700"
          >
            Vai trò
          </label>
          <select
            id="member-role"
            className="h-10 w-full rounded-input border border-warm-300 bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            {...register("role")}
          >
            <option value="member">Thành viên</option>
            <option value="admin">Quản trị</option>
          </select>
        </div>
        {mode === "edit" ? (
          <label className="inline-flex min-h-11 items-center gap-2 text-sm text-warm-700">
            <input
              type="checkbox"
              className="size-5 rounded border-warm-300 text-accent focus:ring-accent"
              {...register("isActive")}
            />
            Đang hoạt động
          </label>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isPending}>
            {mode === "create" ? "Tạo" : "Lưu"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
