"use client";

import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";

import {
  useCreateCategory,
  useUpdateCategory,
} from "../hooks/useCategoryMutations";
import type { CategoryKind, FinCategory } from "../types";

const KINDS: { value: CategoryKind; label: string }[] = [
  { value: "expense", label: "Chi tiêu" },
  { value: "income", label: "Thu nhập" },
  { value: "transfer", label: "Chuyển khoản" },
];

export function CategoryFormModal({
  smoduleId,
  isOpen,
  onClose,
  initial,
  defaultKind,
}: {
  smoduleId: string;
  isOpen: boolean;
  onClose: () => void;
  initial?: FinCategory | null;
  defaultKind: CategoryKind;
}) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryKind>(defaultKind);
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setKind(initial.kind);
      setIcon(initial.icon ?? "");
      setColor(initial.color ?? "");
    } else {
      setName("");
      setKind(defaultKind);
      setIcon("");
      setColor("");
    }
  }, [initial, defaultKind, isOpen]);

  const pending = create.isPending || update.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? "Sửa danh mục" : "Thêm danh mục"}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const payload = {
            name: name.trim(),
            kind,
            icon: icon.trim() || null,
            color: color.trim() || null,
          };
          if (initial) {
            update.mutate(
              { id: initial.id, data: payload },
              { onSuccess: onClose },
            );
          } else {
            create.mutate(
              { smoduleId, ...payload, parentId: null },
              { onSuccess: onClose },
            );
          }
        }}
      >
        <Input label="Tên" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="block text-sm font-medium text-warm-800">
          Loại
          <select
            className="mt-1 w-full rounded-input border border-warm-200 px-3 py-2"
            value={kind}
            disabled={Boolean(initial)}
            onChange={(e) => setKind(e.target.value as CategoryKind)}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <Input label="Icon (emoji)" value={icon} onChange={(e) => setIcon(e.target.value)} />
        <Input label="Màu" value={color} onChange={(e) => setColor(e.target.value)} />
        <Button type="submit" disabled={pending}>
          {initial ? "Lưu" : "Tạo"}
        </Button>
      </form>
    </Modal>
  );
}
