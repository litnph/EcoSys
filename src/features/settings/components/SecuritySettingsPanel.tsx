"use client";

import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { Laptop, Monitor, Smartphone, Tablet } from "lucide-react";
import { useLocale } from "next-intl";

import { TOKEN_KEY } from "@/config/constants";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { getLocalStorageItem } from "@/shared/lib/auth-session";
import { getSessionIdFromAccessToken } from "@/shared/lib/jwt";
import { cn } from "@/shared/lib/utils";

import type { UserSessionDto } from "../types";
import {
  useLoginHistoryQuery,
  useRevokeOthersMutation,
  useRevokeSessionMutation,
  useSessionsQuery,
} from "../hooks/useSettingsQueries";
import { formatBrowserLabel, formatLocation } from "../lib/sessionDisplay";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";

function DeviceIcon({ type }: { type: string | null | undefined }) {
  const t = (type ?? "").toLowerCase();
  const cls = "size-5 text-warm-600";
  if (t === "mobile") {
    return <Smartphone className={cls} aria-hidden />;
  }
  if (t === "tablet") {
    return <Tablet className={cls} aria-hidden />;
  }
  if (t === "desktop") {
    return <Monitor className={cls} aria-hidden />;
  }
  return <Laptop className={cls} aria-hidden />;
}

function SessionCard({
  row,
  currentId,
  onRevoke,
  busyId,
}: {
  row: UserSessionDto;
  currentId: string | null;
  onRevoke: (id: string) => void;
  busyId: string | null;
}) {
  const locale = useLocale();
  const dfLocale = locale === "vi" ? vi : enUS;
  const isCurrent =
    row.isCurrent === true || (currentId !== null && row.id === currentId);
  const when = formatDistanceToNow(new Date(row.lastActiveAt), {
    locale: dfLocale,
    addSuffix: true,
  });

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-card border border-warm-200 bg-surface p-4 md:flex-row md:items-center md:justify-between",
      )}
    >
      <div className="flex gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warm-100">
          <DeviceIcon type={row.deviceType} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-warm-900">
              {row.deviceName?.trim() || "Thiết bị không xác định"}
            </span>
            {isCurrent ? (
              <Badge variant="info" size="sm">
                Thiết bị này
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-warm-600">
            {formatBrowserLabel(row.browser, row.userAgent)} ·{" "}
            {formatLocation(row.location)}
          </p>
          <p className="mt-0.5 text-xs text-warm-500">Hoạt động gần nhất: {when}</p>
        </div>
      </div>
      {!isCurrent ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 self-start md:self-center"
          isLoading={busyId === row.id}
          onClick={() => onRevoke(row.id)}
        >
          Đăng xuất
        </Button>
      ) : null}
    </li>
  );
}

export function SecuritySettingsPanel() {
  const sessionsQ = useSessionsQuery();
  const historyQ = useLoginHistoryQuery();
  const revokeOne = useRevokeSessionMutation();
  const revokeOthers = useRevokeOthersMutation();

  const access = typeof window !== "undefined" ? getLocalStorageItem(TOKEN_KEY) : null;
  const currentSid = getSessionIdFromAccessToken(access);

  const busyId = revokeOne.isPending
    ? revokeOne.variables ?? null
    : null;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-lg font-semibold text-warm-900">
          Phiên đăng nhập
        </h2>
        <p className="mt-1 text-sm text-warm-600">
          Quản lý các thiết bị đang kết nối với tài khoản.
        </p>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={revokeOthers.isPending}
            disabled={sessionsQ.isFetching}
            onClick={() => revokeOthers.mutate()}
          >
            Đăng xuất tất cả thiết bị khác
          </Button>
        </div>

        {sessionsQ.isLoading ? (
          <SkeletonCard className="mt-4" />
        ) : sessionsQ.isError ? (
          <p className="mt-4 text-sm text-danger">
            Không tải được danh sách phiên. Kiểm tra API `/user/sessions`.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {(sessionsQ.data ?? []).map((s) => (
              <SessionCard
                key={s.id}
                row={s}
                currentId={currentSid}
                onRevoke={(id) => revokeOne.mutate(id)}
                busyId={busyId}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-warm-900">
          Lịch sử đăng nhập
        </h2>
        <p className="mt-1 text-sm text-warm-600">30 lần đăng nhập gần nhất.</p>

        <div className="mt-4 overflow-x-auto rounded-card border border-warm-200 bg-surface">
          {historyQ.isLoading ? (
            <div className="p-6">
              <SkeletonCard />
            </div>
          ) : historyQ.isError ? (
            <p className="p-4 text-sm text-danger">
              Không tải được lịch sử. Kiểm tra API `/user/login-history`.
            </p>
          ) : (
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="border-b border-warm-200 bg-warm-50 text-warm-700">
                <tr>
                  <th className="px-3 py-2 font-medium">Thời gian</th>
                  <th className="px-3 py-2 font-medium">IP</th>
                  <th className="px-3 py-2 font-medium">Thiết bị</th>
                  <th className="px-3 py-2 font-medium">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {(historyQ.data ?? []).map((row) => (
                  <tr key={row.id} className="border-b border-warm-100 last:border-0">
                    <td className="px-3 py-2 text-warm-800 tabular-nums">
                      {new Date(row.occurredAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-warm-700">{row.ipAddress ?? "—"}</td>
                    <td className="px-3 py-2 text-warm-700">
                      {row.device?.trim() || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={row.success ? "success" : "danger"} size="sm">
                        {row.success ? "Thành công" : "Thất bại"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
