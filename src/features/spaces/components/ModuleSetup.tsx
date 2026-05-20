"use client";

import { motion } from "framer-motion";
import { Sparkles, Wallet } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import { slideUp } from "@/shared/lib/animations";

export type ModuleSetupProps = {
  /** Callback gọi enable finance — hook `useWorkspaceInit.enableFinance`. */
  onEnable: () => Promise<void> | void;
  /** Tên space hiện tại để hiển thị (tuỳ chọn). */
  spaceName?: string;
};

/**
 * Màn kích hoạt module Finance trên space đang chọn.
 * Gọi `onEnable` (chính là `enableModule(spaceId, "finance")`).
 */
export function ModuleSetup({ onEnable, spaceName }: ModuleSetupProps) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    setErr(null);
    setBusy(true);
    try {
      await onEnable();
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : "Không thể kích hoạt module, vui lòng thử lại",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      variants={slideUp}
      initial="initial"
      animate="animate"
      className="w-full max-w-md text-center"
    >
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Wallet className="size-8" aria-hidden />
      </div>
      <h1 className="font-display text-2xl font-semibold text-warm-900 sm:text-3xl">
        Kích hoạt module Tài chính
      </h1>
      <p className="mt-3 text-sm text-warm-600">
        Bật module Tài chính trên{" "}
        {spaceName ? (
          <strong className="font-semibold text-warm-900">{spaceName}</strong>
        ) : (
          "không gian hiện tại"
        )}{" "}
        để bắt đầu theo dõi thu chi, nguồn tiền, kỳ sao kê thẻ tín dụng, trả góp,
        nợ, tiết kiệm và đầu tư.
      </p>

      <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-2 text-left text-sm text-warm-600">
        <li className="flex items-start gap-2">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          Báo cáo thu chi theo tháng & danh mục
        </li>
        <li className="flex items-start gap-2">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          Theo dõi thẻ tín dụng, billing cycle, trả góp
        </li>
        <li className="flex items-start gap-2">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          Quản lý nợ vay, cho vay & dashboard tổng quan
        </li>
      </ul>

      {err ? (
        <p className="mt-4 rounded-button border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {err}
        </p>
      ) : null}

      <div className="mt-6 flex justify-center">
        <Button
          type="button"
          size="lg"
          onClick={() => {
            void handleClick();
          }}
          isLoading={busy}
        >
          Kích hoạt ngay
        </Button>
      </div>
    </motion.div>
  );
}
