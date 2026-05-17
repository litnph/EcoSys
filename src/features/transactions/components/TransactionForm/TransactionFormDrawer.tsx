"use client";

import dynamic from "next/dynamic";

import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { Drawer } from "@/shared/components/ui/Drawer";

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
      (m) => m.TransactionForm,
    ),
  {
    loading: () => <TransactionFormSkeleton />,
    ssr: false,
  },
);

export interface TransactionFormDrawerProps {
  smoduleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionFormDrawer({
  smoduleId,
  isOpen,
  onClose,
}: TransactionFormDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      title="Thêm giao dịch"
      description="Nhập nhanh giao dịch trên thiết bị nhỏ."
      size="lg"
    >
      <TransactionForm smoduleId={smoduleId} onSucceeded={onClose} />
    </Drawer>
  );
}
