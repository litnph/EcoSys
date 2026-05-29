import { TransactionForm } from "@/features/transactions/components/TransactionForm";
import { Modal } from "@/shared/components/ui/Modal";

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
      {isOpen ? <TransactionForm onSucceeded={onClose} /> : null}
    </Modal>
  );
}
