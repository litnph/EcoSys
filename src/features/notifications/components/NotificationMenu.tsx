import * as Popover from "@radix-ui/react-popover";
import { Bell, CheckCheck, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { useTranslations } from "@/i18n/hooks";
import { formatCurrency, formatRelativeTime } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../hooks/useNotifications";
import type { AppNotification } from "../types";

function notificationMessage(
  row: AppNotification,
  t: ReturnType<typeof useTranslations>,
): string {
  const params = {
    category: row.categoryName ?? t("unknownCategory"),
    percent: row.utilizationPercent?.toFixed(1) ?? "0",
    spent: formatCurrency(row.spentAmount ?? 0, row.currency ?? "VND"),
    budget: formatCurrency(row.budgetAmount ?? 0, row.currency ?? "VND"),
    threshold: row.thresholdPercent?.toFixed(2) ?? "0",
  };
  return t(`message.${row.kind}`, params);
}

export function NotificationMenu() {
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const unread = useUnreadNotificationCount();
  const list = useNotifications(open);
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unreadCount = list.data?.unreadCount ?? unread.data ?? 0;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="relative flex size-10 items-center justify-center rounded-button text-warm-700 outline-none transition-colors hover:bg-warm-100 hover:text-warm-900 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label={t("open", { count: unreadCount })}
        >
          <Bell className="size-5" aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-[200] flex max-h-[min(36rem,calc(100dvh-5rem))] w-[min(24rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-card border border-warm-200 bg-surface shadow-xl outline-none"
          aria-label={t("title")}
        >
          <header className="flex items-center justify-between gap-3 border-b border-warm-200 px-4 py-3">
            <div>
              <h2 className="font-display text-base font-semibold text-warm-900">{t("title")}</h2>
              <p className="text-xs text-warm-500">{t("unreadCount", { count: unreadCount })}</p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-button px-2 text-xs font-medium text-accent outline-none hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
              >
                <CheckCheck className="size-4" aria-hidden />
                {t("markAllRead")}
              </button>
            ) : null}
          </header>

          <div className="min-h-28 overflow-y-auto" aria-live="polite">
            {list.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-warm-500">
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                {t("loading")}
              </div>
            ) : list.isError ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-danger">{t("loadError")}</p>
                <button
                  type="button"
                  className="mt-2 rounded-button px-3 py-2 text-sm font-medium text-accent focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={() => void list.refetch()}
                >
                  {t("retry")}
                </button>
              </div>
            ) : !list.data?.items.length ? (
              <div className="px-6 py-12 text-center">
                <Bell className="mx-auto size-7 text-warm-300" aria-hidden />
                <p className="mt-3 text-sm font-medium text-warm-800">{t("empty")}</p>
                <p className="mt-1 text-xs text-warm-500">{t("emptyHint")}</p>
              </div>
            ) : (
              <ul className="divide-y divide-warm-100">
                {list.data.items.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full px-4 py-3 text-left outline-none transition-colors hover:bg-warm-50 focus-visible:bg-warm-50",
                        !row.isRead && "border-l-2 border-accent bg-accent/[0.04]",
                      )}
                      onClick={() => !row.isRead && markOne.mutate(row.id)}
                      aria-label={`${notificationMessage(row, t)}. ${row.isRead ? t("read") : t("unread")}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className={cn("text-sm leading-5 text-warm-800", !row.isRead && "font-semibold text-warm-900")}>
                          {notificationMessage(row, t)}
                        </p>
                        {!row.isRead ? <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" aria-hidden /> : null}
                      </div>
                      {row.cycleStart && row.cycleEnd ? (
                        <p className="mt-1 text-xs text-warm-500">
                          {t("period", { start: row.cycleStart, end: row.cycleEnd })}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-warm-400">{formatRelativeTime(row.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Popover.Arrow className="fill-surface" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
