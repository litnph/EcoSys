"use client";

import type { ReactNode } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { usePathname } from "@/i18n/navigation";
import { fadeIn } from "@/shared/lib/animations";

type PageTransitionProps = {
  children: ReactNode;
};

/** Dashboard / auth route shells: fade page content on `pathname` change. */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={fadeIn}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
