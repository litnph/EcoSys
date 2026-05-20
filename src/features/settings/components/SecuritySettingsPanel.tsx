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
  useRevokeSessionMutation,
  useSessionsQuery,
} from "../hooks/useSettingsQueries";
import { formatBrowserLabel, formatLocation } from "../lib/sessionDisplay";

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
  const revokeOne = useRevokeSessionMutation();

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
            disabled
            title="Chưa hỗ trợ trên máy chủ"
          >
            Đăng xuất tất cả thiết bị khác
          </Button>
        </div>

        <p className="mt-4 rounded-lg border border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-700">
          Quản lý phiên đăng nhập trên nhiều thiết bị sẽ có trong bản cập nhật tiếp theo.
          Hiện bạn có thể đăng xuất tài khoản từ menu người dùng.
        </p>
        {(sessionsQ.data ?? []).length > 0 ? (
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
        ) : null}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-warm-900">
          Lịch sử đăng nhập
        </h2>
        <p className="mt-1 text-sm text-warm-600">30 lần đăng nhập gần nhất.</p>

        <p className="mt-4 rounded-lg border border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-700">
          Lịch sử đăng nhập sẽ có trong bản cập nhật tiếp theo.
        </p>
      </section>
    </div>
  );
}
