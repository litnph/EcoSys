"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import * as React from "react";

import { useMediaMd } from "@/shared/hooks/useMediaMd";
import { cn } from "@/shared/lib/utils";

export interface DrawerSide {
  side: "bottom" | "right";
}

export type DrawerSideProp = DrawerSide["side"];

export interface DrawerProps extends DrawerSide {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "full";
  children: React.ReactNode;
}

const sizeClassDesktop: Record<NonNullable<DrawerProps["size"]>, string> = {
  sm: "w-full max-w-sm",
  md: "w-full max-w-md",
  lg: "w-full max-w-2xl",
  full: "w-[95vw] max-w-4xl",
};

/** `side="right"` → bottom sheet on narrow viewports; right pane from md up. `side="bottom"` → always bottom. */
export function Drawer({
  side,
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
}: DrawerProps) {
  const mdUp = useMediaMd();
  const effectiveSide: "bottom" | "right" =
    side === "bottom" ? "bottom" : mdUp ? "right" : "bottom";

  const [presence, setPresence] = React.useState(isOpen);

  React.useEffect(() => {
    if (isOpen) setPresence(true);
  }, [isOpen]);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  const bottomMotion =
    effectiveSide === "bottom"
      ? {
          initial: { y: "100%" },
          animate: { y: 0 },
          exit: { y: "100%" },
          transition: { type: "spring" as const, damping: 32, stiffness: 360 },
        }
      : {};

  const rightMotion =
    effectiveSide === "right"
      ? {
          initial: { x: "100%" },
          animate: { x: 0 },
          exit: { x: "100%" },
          transition: { type: "spring" as const, damping: 32, stiffness: 360 },
        }
      : {};

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
              <Dialog.Overlay key="drawer-overlay" asChild forceMount>
                <motion.div
                  aria-hidden="true"
                  className={cn(
                    "fixed inset-0 z-[100] bg-warm-900/40 backdrop-blur-sm",
                  )}
                  role="presentation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              </Dialog.Overlay>

              <Dialog.Content key="drawer-panel" asChild forceMount>
                <motion.div
                  className={cn(
                    "fixed z-[101] bg-surface shadow-lg outline-none focus:outline-none",
                    "flex flex-col overflow-hidden border border-warm-200",
                    effectiveSide === "bottom" &&
                      cn(
                        "inset-x-0 bottom-0 max-h-[min(92vh,900px)] w-full rounded-t-card",
                        "pb-[max(1rem,env(safe-area-inset-bottom))] pt-0",
                      ),
                    effectiveSide === "right" &&
                      cn(
                        "inset-y-0 right-0 rounded-l-card",
                        "h-full max-h-none max-w-none",
                        sizeClassDesktop[size],
                      ),
                  )}
                  {...bottomMotion}
                  {...rightMotion}
                >
                  <div className="flex shrink-0 items-start justify-between gap-3 border-b border-warm-200 px-5 py-4">
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
                          "absolute right-3 top-4 rounded-button p-1.5 text-warm-600 md:right-5",
                          "outline-none hover:bg-warm-100 hover:text-warm-900",
                          "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                          "disabled:pointer-events-none",
                        )}
                        aria-label="Đóng"
                      >
                        <X className="size-5" aria-hidden />
                      </button>
                    </Dialog.Close>
                  </div>
                  <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {children}
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
