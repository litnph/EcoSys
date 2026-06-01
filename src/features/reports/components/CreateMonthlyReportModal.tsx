import { useMemo, useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";

import { useCreateMonthlyReport } from "../hooks/useCreateMonthlyReport";

import { MonthSelector } from "./MonthSelector";

export interface CreateMonthlyReportModalProps {
  open: boolean;
  onClose: () => void;
  existingKeys: Set<string>;
  defaultYear: number;
  defaultMonth: number;
  onCreated: (year: number, month: number) => void;
}

export function CreateMonthlyReportModal({
  open,
  onClose,
  existingKeys,
  defaultYear,
  defaultMonth,
  onCreated,
}: CreateMonthlyReportModalProps) {
  const [ym, setYm] = useState({ year: defaultYear, month: defaultMonth });
  const createM = useCreateMonthlyReport();

  const key = `${ym.year}-${ym.month}`;
  const alreadyExists = useMemo(() => existingKeys.has(key), [existingKeys, key]);

  const handleCreate = async () => {
    try {
      await createM.mutateAsync({ year: ym.year, month: ym.month });
      onCreated(ym.year, ym.month);
    } catch {
      /* toast in hook */
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Tạo báo cáo tháng"
      description="Tổng hợp chi tiêu giao dịch, trả góp và kỳ sao kê phát hành trong tháng đã chọn."
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <MonthSelector year={ym.year} month={ym.month} onChange={setYm} />

        {alreadyExists ? (
          <p className="text-sm text-danger">
            Báo cáo tháng này đã tồn tại. Hãy mở từ danh sách.
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            isLoading={createM.isPending}
            disabled={alreadyExists}
            onClick={() => void handleCreate()}
          >
            Tạo báo cáo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
