"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

export type ModalSize = "sm" | "md" | "lg" | "full";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  children: React.ReactNode;
}

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  full: "max-w-[95vw]",
};

/** Radix `open` stays true until Framer Motion exit completes (AnimatePresence). */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
}: ModalProps) {
  const [presence, setPresence] = React.useState(isOpen);

  React.useEffect(() => {
    if (isOpen) setPresence(true);
  }, [isOpen]);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose]);

  return (
    <Dialog.Root open={presence} onOpenChange={handleOpenChange}>
      <Dialog.Portal forceMount>
        <AnimatePresence
          mode="sync"
          onExitComplete={() => {
            if (!isOpen) setPresence(false);
          }}
        >
          {isOpen && (
            <>
              <Dialog.Overlay key="modal-overlay" asChild forceMount>
                <motion.div
                  aria-hidden="true"
                  className={cn(
                    "fixed inset-0 z-[100] bg-warm-900/40 backdrop-blur-sm")}
                  role="presentation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              </Dialog.Overlay>
              <Dialog.Content key="modal-content" asChild forceMount>
                <div
                  className={cn(
                    "fixed top-0 right-0 bottom-0 z-[101] flex items-center justify-center p-4",
                    "outline-none focus:outline-none")}
                  style={{ left: "var(--dashboard-sidebar, 0px)" }}
                >
                  <motion.div
                    className={cn(
                      "flex w-full flex-col",
                      sizeClass[size],
                      "rounded-card border border-warm-200 bg-surface shadow-lg",
                      "max-h-[min(90vh,700px)]")}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  >
                    <div className="relative flex shrink-0 items-start justify-between gap-3 border-b border-warm-200 px-6 py-4">
                      <div className="min-w-0 space-y-1 pr-10">
                        <Dialog.Title className="font-display text-lg font-semibold text-warm-900">
                          {title}
                        </Dialog.Title>
                        {description !== undefined && description.length > 0 ? (
                          <Dialog.Description className="text-sm text-warm-600">
                            {description}
                          </Dialog.Description>
                        ) : (
                          <Dialog.Description className="sr-only">
                            {title}
                          </Dialog.Description>
                        )}
                      </div>
                      <Dialog.Close asChild>
                        <button
                          type="button"
                          className={cn(
                            "absolute right-4 top-4 rounded-button p-1.5 text-warm-600",
                            "outline-none hover:bg-warm-100 hover:text-warm-900",
                            "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                            "disabled:pointer-events-none")}
                          aria-label="Đóng"
                        >
                          <X className="size-5" aria-hidden />
                        </button>
                      </Dialog.Close>
                    </div>
                    <div className="relative min-h-0 flex-1 overflow-y-auto px-6 py-4">
                      {children}
                    </div>
                  </motion.div>
                </div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
