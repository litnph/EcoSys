import { cn } from "@/shared/lib/utils";

import { categoryTintColor, hexToRgba } from "../lib/categoryVisuals";

export function CategoryIconBadge({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: string | null | undefined;
  color: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const emoji = icon?.trim() || "📁";
  const hex = color?.trim();
  const validHex = hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#64748b";

  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-base"
      : size === "lg"
        ? "h-12 w-12 text-2xl"
        : "h-10 w-10 text-lg";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
        sizeClass,
        className,
      )}
      style={{
        backgroundColor: categoryTintColor(validHex),
        boxShadow: `inset 0 0 0 1px ${hexToRgba(validHex, 0.2)}`,
      }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
