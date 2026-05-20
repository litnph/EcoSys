"use client";

import { useMediaMd } from "@/shared/hooks/useMediaMd";

import { TransactionFormDrawer } from "./TransactionFormDrawer";
import { TransactionFormModal } from "./TransactionFormModal";

export interface ResponsiveTransactionFormShellProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Desktop → modal; nhỏ hơn md → drawer bottom/right. */
export function ResponsiveTransactionFormShell({
  isOpen,
  onClose,
}: ResponsiveTransactionFormShellProps) {
  const mdUp = useMediaMd();
  return mdUp ? (
    <TransactionFormModal
      
      isOpen={isOpen}
      onClose={onClose}
    />
  ) : (
    <TransactionFormDrawer
      
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}
