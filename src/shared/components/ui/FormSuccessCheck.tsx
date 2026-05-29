import { motion } from "framer-motion";

import { cn } from "@/shared/lib/utils";

type FormSuccessCheckProps = {
  className?: string;
  "aria-label"?: string;
};

/** Drawn checkmark for inline form success feedback. */
export function FormSuccessCheck({
  className,
  "aria-label": ariaLabel = "Thành công",
}: FormSuccessCheckProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0 text-success", className)}
      aria-label={ariaLabel}
      role="img"
      fill="none"
    >
      <motion.path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.12 },
        }}
      />
    </svg>
  );
}
