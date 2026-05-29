import { Modal } from "@/shared/components/ui/Modal";

import { BulkTransactionForm } from "./BulkTransactionForm";

export interface BulkTransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkTransactionFormModal({
  isOpen,
  onClose,
}: BulkTransactionFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nhập hàng loạt"
      description="Một loại giao dịch, nhiều ngày và số tiền khác nhau — các thông tin còn lại giống nhau."
      size="lg"
    >
      {isOpen ? <BulkTransactionForm onSucceeded={onClose} /> : null}
    </Modal>
  );
}
