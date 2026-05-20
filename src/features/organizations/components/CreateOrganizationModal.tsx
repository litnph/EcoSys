"use client";

import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";

import { useCreateOrganization } from "../hooks/useCreateOrganization";
import { suggestOrganizationSlug } from "../lib/slug";

export type CreateOrganizationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (orgId: string) => void;
};

export function CreateOrganizationModal({
  isOpen,
  onClose,
  onCreated,
}: CreateOrganizationModalProps) {
  const createOrg = useCreateOrganization();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setSlug("");
      setSlugTouched(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!slugTouched && name.trim()) {
      setSlug(suggestOrganizationSlug(name));
    }
  }, [name, slugTouched]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim().toLowerCase();
    if (!trimmedName || !trimmedSlug) return;

    const res = await createOrg.mutateAsync({
      name: trimmedName,
      slug: trimmedSlug,
      defaultCurrency: "VND",
    });
    onCreated?.(res.data.id);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo tổ chức mới" size="md">
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <Input
          label="Tên tổ chức"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Gia đình Nguyễn"
          required
          autoFocus
        />
        <Input
          label="Slug (URL)"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="gia-dinh-nguyen"
          required
        />
        <p className="text-xs text-warm-500">Chữ thường, số và dấu gạch ngang</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" disabled={createOrg.isPending}>
            {createOrg.isPending ? "Đang tạo…" : "Tạo tổ chức"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
