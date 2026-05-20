"use client";

import dynamic from "next/dynamic";

import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { Modal } from "@/shared/components/ui/Modal";

function TransactionFormSkeleton() {
  return (
    <div className="space-y-4 py-1" aria-hidden>
      <SkeletonText className="h-10 w-full rounded-input" />
      <SkeletonText className="h-10 w-full rounded-input" />
      <SkeletonText className="h-10 w-full rounded-input" />
      <SkeletonText className="min-h-[140px] w-full rounded-input" />
      <SkeletonText className="h-10 w-32 rounded-button" />
    </div>
  );
}

const TransactionForm = dynamic(
  () =>
    import("@/features/transactions/components/TransactionForm").then(
      (m) => m.TransactionForm),
  {
    loading: () => <TransactionFormSkeleton />,
    ssr: false,
  });

export interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionFormModal({
  isOpen,
  onClose,
}: TransactionFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm giao dịch"
      description="Điền số tiền, loại và thông tin bổ sung theo loại."
      size="lg"
    >
      <TransactionForm  onSucceeded={onClose} />
    </Modal>
  );
}
