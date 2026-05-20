"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useState } from "react";

import { ROUTES } from "@/config/routes";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/Button";

import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "../hooks/useNotifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unreadQ = useUnreadCount();
  const listQ = useNotifications(1, 8, null);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const del = useDeleteNotification();

  const unread = unreadQ.data ?? 0;
  const items = listQ.data?.items ?? [];

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex rounded-button p-2 text-warm-700 outline-none",
            "hover:bg-warm-100 hover:text-warm-900",
            "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          )}
          aria-label="Thông báo"
        >
          <Bell className="size-5" aria-hidden />
          {unread > 0 ? (
            <span className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[200] w-[min(100vw-2rem,360px)] rounded-card border border-warm-200 bg-surface p-0 shadow-lg outline-none"
        >
          <div className="flex items-center justify-between border-b border-warm-200 px-3 py-2">
            <span className="text-sm font-semibold text-warm-900">Thông báo</span>
            {unread > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<CheckCheck className="size-4" />}
                disabled={markAll.isPending}
                onClick={() => markAll.mutate()}
              >
                Đọc hết
              </Button>
            ) : null}
          </div>
          {listQ.isLoading ? (
            <div className="px-3 py-6 text-center text-sm text-warm-500">
              Đang tải…
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-warm-500">
              Không có thông báo
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "group flex gap-2 border-b border-warm-100 px-3 py-2 last:border-0",
                    !n.isRead && "bg-accent/5",
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      if (!n.isRead) markRead.mutate(n.id);
                    }}
                  >
                    <p className="truncate text-sm font-medium text-warm-900">
                      {n.title}
                    </p>
                    <p className="line-clamp-2 text-xs text-warm-600">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-warm-400">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </p>
                  </button>
                  <button
                    type="button"
                    className="shrink-0 rounded p-1 text-warm-400 opacity-0 transition hover:bg-warm-100 hover:text-danger group-hover:opacity-100"
                    aria-label="Xóa"
                    onClick={() => del.mutate(n.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-warm-200 p-2">
            <Link
              href={ROUTES.dashboard.notifications}
              className="block rounded-md px-2 py-2 text-center text-sm font-medium text-accent hover:bg-warm-100"
              onClick={() => setOpen(false)}
            >
              Xem tất cả
            </Link>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
