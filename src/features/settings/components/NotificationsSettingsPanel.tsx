"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import * as Switch from "@radix-ui/react-switch";

import { Button } from "@/shared/components/ui/Button";
import { FormSuccessCheck } from "@/shared/components/ui/FormSuccessCheck";
import { cn } from "@/shared/lib/utils";

import { NOTIFICATION_MATRIX_EVENTS } from "../lib/notificationEvents";
import type { NotificationChannelKey, NotificationPreferencesDto } from "../types";
import {
  useNotificationPrefsQuery,
  useSaveNotificationPrefs,
} from "../hooks/useSettingsQueries";

const CHANNELS: { key: NotificationChannelKey; label: string }[] = [
  { key: "inApp", label: "In-app" },
  { key: "email", label: "Email" },
];

function cellKey(eventType: string, ch: NotificationChannelKey) {
  return `${eventType}:${ch}`;
}

function buildMapFromPrefs(
  data: NotificationPreferencesDto | undefined): Record<string, boolean> {
  const m: Record<string, boolean> = {};
  for (const ev of NOTIFICATION_MATRIX_EVENTS) {
    for (const ch of CHANNELS) {
      m[cellKey(ev.eventType, ch.key)] = true;
    }
  }
  if (data?.cells) {
    for (const c of data.cells) {
      m[cellKey(c.eventType, c.channel)] = c.enabled;
    }
  }
  return m;
}

export function NotificationsSettingsPanel() {
  const q = useNotificationPrefsQuery();
  const save = useSaveNotificationPrefs();
  const [showSaved, setShowSaved] = useState(false);
  const savedTimer = useRef<number | null>(null);

  const serverMap = useMemo(() => buildMapFromPrefs(q.data), [q.data]);

  const [map, setMap] = useState<Record<string, boolean>>(serverMap);

  useEffect(() => {
    setMap(serverMap);
  }, [serverMap]);

  useEffect(() => {
    return () => {
      if (savedTimer.current != null) window.clearTimeout(savedTimer.current);
    };
  }, []);

  const setCell = (eventType: string, ch: NotificationChannelKey, enabled: boolean) => {
    const k = cellKey(eventType, ch);
    setMap((prev) => ({ ...prev, [k]: enabled }));
  };

  const onSave = () => {
    const cells = NOTIFICATION_MATRIX_EVENTS.flatMap((ev) =>
      CHANNELS.map((ch) => ({
        moduleCode: 1,
        eventType: ev.eventType,
        channel: ch.key,
        enabled: map[cellKey(ev.eventType, ch.key)] ?? true,
      })));
    save.mutate(
      { cells },
      {
        onSuccess: () => {
          setShowSaved(true);
          if (savedTimer.current != null) window.clearTimeout(savedTimer.current);
          savedTimer.current = window.setTimeout(() => {
            setShowSaved(false);
            savedTimer.current = null;
          }, 2200);
        },
      });
  };

  return (
    <div className="space-y-6">
      {q.isError ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warm-800">
          Không tải được tùy chọn thông báo. Ma trận hiển thị mặc định (bật hết).
        </p>
      ) : null}

      <section className="rounded-card border border-warm-200 bg-surface p-4 shadow-sm md:p-6">
        <h2 className="font-display text-lg font-semibold text-warm-900">Thông báo</h2>
        <p className="mt-1 text-sm text-warm-600">
          Chọn kênh nhận thông báo cho từng loại sự kiện.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[520px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-warm-200">
                <th className="pb-3 pr-4 font-medium text-warm-800">Sự kiện</th>
                {CHANNELS.map((c) => (
                  <th key={c.key} className="pb-3 px-2 text-center font-medium text-warm-800">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_MATRIX_EVENTS.map((ev) => (
                <tr key={ev.eventType} className="border-b border-warm-100 last:border-0">
                  <td className="py-3 pr-4 text-warm-900">{ev.label}</td>
                  {CHANNELS.map((ch) => {
                    const k = cellKey(ev.eventType, ch.key);
                    const on = map[k] ?? true;
                    return (
                      <td key={ch.key} className="py-2 px-2 text-center">
                        <div className="flex justify-center">
                          <Switch.Root
                            checked={on}
                            onCheckedChange={(v) =>
                              setCell(ev.eventType, ch.key, Boolean(v))
                            }
                            className={cn(
                              "relative h-6 w-11 cursor-pointer rounded-full border-2 border-transparent",
                              "bg-warm-200 transition-colors outline-none",
                              "data-[state=checked]:bg-accent",
                              "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2")}
                          >
                            <Switch.Thumb
                              className={cn(
                                "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform",
                                "data-[state=checked]:translate-x-[1.35rem]")}
                            />
                          </Switch.Root>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          {showSaved ? (
            <span className="flex items-center gap-2 text-sm font-medium text-success">
              <FormSuccessCheck className="size-5" />
              Đã lưu
            </span>
          ) : null}
          <Button type="button" onClick={onSave} isLoading={save.isPending}>
            Lưu thông báo
          </Button>
        </div>
      </section>
    </div>
  );
}
