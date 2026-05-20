"use client";

import { CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useState } from "react";

import { PageHeader } from "@/shared/components/layouts/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";

import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/useNotifications";

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<boolean | null>(null);
  const listQ = useNotifications(page, 20, filter);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const del = useDeleteNotification();

  const items = listQ.data?.items ?? [];
  const totalPages = listQ.data?.totalPages ?? 1;

  return (
    <div className="w-full max-w-3xl">
      <PageHeader
        title="Thông báo"
        description="Trung tâm thông báo trong ứng dụng."
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === null ? "primary" : "secondary"}
          onClick={() => setFilter(null)}
        >
          Tất cả
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === false ? "primary" : "secondary"}
          onClick={() => setFilter(false)}
        >
          Chưa đọc
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          leftIcon={<CheckCheck className="size-4" />}
          disabled={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Đánh dấu đã đọc
        </Button>
      </div>

      {listQ.isLoading ? (
        <p className="mt-8 text-sm text-warm-500">Đang tải…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 text-sm text-warm-500">Không có thông báo.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "flex gap-3 rounded-card border border-warm-200 bg-surface p-4 shadow-sm",
                !n.isRead && "border-accent/30 bg-accent/5",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-warm-900">{n.title}</p>
                <p className="mt-1 text-sm text-warm-600">{n.body}</p>
                <p className="mt-2 text-xs text-warm-400">
                  {formatDistanceToNow(new Date(n.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                {!n.isRead ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => markRead.mutate(n.id)}
                  >
                    Đã đọc
                  </Button>
                ) : null}
                <button
                  type="button"
                  className="rounded p-2 text-warm-500 hover:bg-warm-100 hover:text-danger"
                  aria-label="Xóa"
                  onClick={() => del.mutate(n.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </Button>
          <span className="flex items-center text-sm text-warm-600">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      ) : null}
    </div>
  );
}
