"use client";

import { useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";

import {
  useCancelAccountDeletion,
  useDataExportStatus,
  useRequestAccountDeletion,
  useRequestDataExport,
} from "../hooks/useGdpr";

export function GdprSettingsPanel() {
  const [exportId, setExportId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const requestExport = useRequestDataExport();
  const exportStatus = useDataExportStatus(exportId);
  const requestDeletion = useRequestAccountDeletion();
  const cancelDeletion = useCancelAccountDeletion();

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-warm-200 bg-surface p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-warm-900">
          Xuất dữ liệu cá nhân
        </h2>
        <p className="mt-1 text-sm text-warm-600">
          Tải bản sao dữ liệu tài chính và hồ sơ của bạn (GDPR).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={requestExport.isPending}
            onClick={() => {
              requestExport.mutate(undefined, {
                onSuccess: (id) => setExportId(id),
              });
            }}
          >
            Yêu cầu xuất dữ liệu
          </Button>
        </div>
        {exportId && exportStatus.data ? (
          <div className="mt-4 rounded-lg border border-warm-100 bg-warm-25 p-4 text-sm">
            <p>
              Trạng thái:{" "}
              <strong className="text-warm-900">{exportStatus.data.status}</strong>
            </p>
            {exportStatus.data.downloadUrl ? (
              <a
                href={exportStatus.data.downloadUrl}
                className="mt-2 inline-block font-medium text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Tải file xuất
              </a>
            ) : null}
            {exportStatus.data.errorMessage ? (
              <p className="mt-2 text-danger">{exportStatus.data.errorMessage}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-card border border-danger/30 bg-danger/5 p-6">
        <h2 className="font-display text-lg font-semibold text-warm-900">
          Xóa tài khoản
        </h2>
        <p className="mt-1 text-sm text-warm-600">
          Gửi yêu cầu xóa vĩnh viễn. Bạn sẽ nhận email xác nhận và có thời gian
          ân hạn để hủy.
        </p>
        <div className="mt-4 max-w-md">
          <Input
            label="Lý do (tuỳ chọn)"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="danger"
            disabled={requestDeletion.isPending}
            onClick={() => requestDeletion.mutate(deleteReason || undefined)}
          >
            Yêu cầu xóa tài khoản
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={cancelDeletion.isPending}
            onClick={() => cancelDeletion.mutate()}
          >
            Hủy yêu cầu xóa
          </Button>
        </div>
      </section>
    </div>
  );
}
