import { CalendarRange } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";

import { useTranslations } from "@/i18n/hooks";

export interface PreferencesSaveConfirmModalProps {
  isOpen: boolean;
  isPending: boolean;
  periodLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function PreferencesSaveConfirmModal({
  isOpen,
  isPending,
  periodLabel,
  onClose,
  onConfirm,
}: PreferencesSaveConfirmModalProps) {
  const t = useTranslations("settings");

  return (
    <Modal
      isOpen={isOpen}
      onClose={isPending ? () => undefined : onClose}
      title={t("preferencesConfirmTitle")}
      description={t("preferencesConfirmDescription")}
      size="sm"
    >
      <div className="space-y-5">
        <div className="flex gap-3 rounded-button border border-warm-200 bg-warm-50 p-3 text-sm text-warm-800">
          <CalendarRange className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
          <p>{periodLabel}</p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={onClose}
          >
            {t("preferencesCancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={isPending}
            onClick={onConfirm}
          >
            {t("preferencesConfirmSave")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
