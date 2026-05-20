"use client";

import * as React from "react";

/** `true` when viewport is md (768px) or wider. SSR-safe: false until hydrated. */
export function useMediaMd(): boolean {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(min-width: 768px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false);
}
