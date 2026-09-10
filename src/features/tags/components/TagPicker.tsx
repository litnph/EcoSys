import { useTags } from "@/features/tags/hooks/useTags";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/shared/lib/utils";

export interface TagPickerProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function TagPicker({
  value,
  onChange,
  disabled,
  className,
  label,
}: TagPickerProps) {
  const t = useTranslations("tagPicker");
  const { data: tags, isLoading, isError, refetch } = useTags();
  const selected = new Set(value);

  const toggle = (id: string) => {
    if (disabled) return;
    if (selected.has(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-warm-500" aria-live="polite">{t("loading")}</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-danger" role="alert">
        {t("loadError")} {" "}
        <button type="button" className="font-medium underline underline-offset-2" onClick={() => void refetch()}>
          {t("retry")}
        </button>
      </p>
    );
  }

  if (!tags?.length) {
    return (
      <p className="text-sm text-warm-500">
        {t("empty")}
      </p>
    );
  }

  return (
    <div role="group" aria-label={label ?? t("label")} className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => {
        const active = selected.has(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(tag.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition",
              active
                ? "border-transparent text-warm-900 shadow-sm"
                : "border-warm-200 bg-surface text-warm-600 hover:border-warm-300 hover:bg-warm-50",
              disabled && "cursor-not-allowed opacity-60",
            )}
            style={
              active
                ? {
                    backgroundColor: `${tag.color}22`,
                    borderColor: `${tag.color}66`,
                  }
                : undefined
            }
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: tag.color }}
              aria-hidden
            />
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
