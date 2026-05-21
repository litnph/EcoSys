"use client";

import type { ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
};

/** Lightweight route shell — no blocking exit animations. */
export function PageTransition({ children }: PageTransitionProps) {
  return <>{children}</>;
}
