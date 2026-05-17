"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { type ToastRecord, useToastStore } from "@/shared/stores/toastStore";

const typeIcon: Record<ToastRecord["type"], typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const surfaceByType: Record<ToastRecord["type"], string> = {
  success: "border-success/30 bg-surface shadow-md",
  error: "border-danger/35 bg-surface shadow-md",
  warning: "border-warning/45 bg-surface shadow-md",
  info: "border-info/35 bg-surface shadow-md",
};

const iconColor: Record<ToastRecord["type"], string> = {
  success: "text-success",
  error: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

function ToastItem({ toast }: { toast: ToastRecord }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const Icon = typeIcon[toast.type];

  React.useEffect(() => {
    if (toast.duration <= 0) return undefined;
    const id = window.setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);
    return () => window.clearTimeout(id);
  }, [removeToast, toast.duration, toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: "100%", scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: 16,
        scale: 0.97,
        transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
      }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 36,
      }}
      className={cn(
        "relative flex gap-3 rounded-card border p-4 pr-10 text-sm",
        surfaceByType[toast.type],
      )}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={cn("size-5 shrink-0", iconColor[toast.type])}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-warm-900">{toast.title}</div>
        {toast.message !== undefined && toast.message.length > 0 && (
          <p className="mt-1 text-xs text-warm-600">{toast.message}</p>
        )}
      </div>
      <button
        type="button"
        className={cn(
          "absolute right-2 top-2 rounded-button p-1 text-warm-500",
          "hover:bg-warm-100 hover:text-warm-900",
          "outline-none focus-visible:ring-2 focus-visible:ring-accent",
        )}
        aria-label="Đóng thông báo"
        onClick={() => removeToast(toast.id)}
      >
        <X className="size-4" aria-hidden />
      </button>
    </motion.div>
  );
}

/** Mount once near the root (e.g. layout) so toasts overlay the viewport. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:w-auto"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false} mode="sync">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** `{ success, error, warning, info }` shorthand on `toastStore`. */
export function useToast(): {
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
} {
  const addToast = useToastStore((s) => s.addToast);

  return React.useMemo(
    () => ({
      success: (title, message, duration) =>
        addToast({
          type: "success",
          title,
          message,
          ...(duration !== undefined ? { duration } : {}),
        }),
      error: (title, message, duration) =>
        addToast({
          type: "error",
          title,
          message,
          ...(duration !== undefined ? { duration } : {}),
        }),
      warning: (title, message, duration) =>
        addToast({
          type: "warning",
          title,
          message,
          ...(duration !== undefined ? { duration } : {}),
        }),
      info: (title, message, duration) =>
        addToast({
          type: "info",
          title,
          message,
          ...(duration !== undefined ? { duration } : {}),
        }),
    }),
    [addToast],
  );
}
