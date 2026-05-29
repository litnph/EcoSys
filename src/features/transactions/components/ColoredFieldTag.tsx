import {
  categoryBorderColor,
  categoryTintColor,
} from "@/features/categories/lib/categoryVisuals";
import { cn } from "@/shared/lib/utils";

export interface ColoredFieldTagProps {
  label: string;
  color?: string | null;
  className?: string;
}

export function ColoredFieldTag({
  label,
  color,
  className,
}: ColoredFieldTagProps) {
  const hex =
    color && /^#[0-9a-fA-F]{6}$/.test(color.trim()) ? color.trim() : null;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-2 py-1 text-xs font-semibold leading-tight text-warm-800",
        className,
      )}
      style={{
        backgroundColor: categoryTintColor(hex),
        borderColor: categoryBorderColor(hex),
      }}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}
