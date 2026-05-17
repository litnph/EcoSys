"use client";

import { useMediaMd } from "@/shared/hooks/useMediaMd";

import { TransactionFormDrawer } from "./TransactionFormDrawer";
import { TransactionFormModal } from "./TransactionFormModal";

export interface ResponsiveTransactionFormShellProps {
  smoduleId: string;
  isOpen: boolean;
  onClose: () => void;
}

/** Desktop → modal; nhỏ hơn md → drawer bottom/right. */
export function ResponsiveTransactionFormShell({
  smoduleId,
  isOpen,
  onClose,
}: ResponsiveTransactionFormShellProps) {
  const mdUp = useMediaMd();
  return mdUp ? (
    <TransactionFormModal
      smoduleId={smoduleId}
      isOpen={isOpen}
      onClose={onClose}
    />
  ) : (
    <TransactionFormDrawer
      smoduleId={smoduleId}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}
