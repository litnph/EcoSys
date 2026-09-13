import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";

import { useTags } from "@/features/tags/hooks/useTags";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/shared/lib/utils";

export interface TagPickerProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  compact?: boolean;
}

export function TagPicker({
  value,
  onChange,
  disabled,
  className,
  label,
  compact = false,
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

  if (compact) {
    const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
    const selectedTags = value
      .map((id) => tagsById.get(id))
      .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined);
    const selectedText = selectedTags.map((tag) => tag.name).join(", ");

    return (
      <Popover.Root>
        <div className={cn("min-w-0", className)}>
          <Popover.Trigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label={label ?? t("label")}
              className={cn(
                "flex h-9 w-full min-w-0 items-center gap-1 overflow-hidden rounded-md border border-warm-200 bg-warm-50 px-2 text-left",
                "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {selectedTags.length === 0 ? (
                <span className="min-w-0 flex-1 truncate text-xs text-warm-400">
                  {t("choose")}
                </span>
              ) : (
                <span
                  className="min-w-0 flex-1 truncate text-xs font-medium text-warm-800"
                  title={selectedText}
                >
                  {selectedText}
                </span>
              )}
              <ChevronDown className="size-3.5 shrink-0 text-warm-500" aria-hidden />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={4}
              collisionPadding={12}
              className="z-[200] w-[min(18rem,calc(100vw-1.5rem))] rounded-button border border-warm-200 bg-surface p-1 elevation-menu outline-none"
            >
              <div
                role="group"
                aria-label={label ?? t("label")}
                className="max-h-60 overflow-y-auto"
              >
                {tags.map((tag) => {
                  const active = selected.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      aria-pressed={active}
                      className="flex min-h-10 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-sm text-warm-800 outline-none hover:bg-warm-100 focus-visible:bg-warm-100"
                      onClick={() => toggle(tag.id)}
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate" title={tag.name}>
                        {tag.name}
                      </span>
                      {active ? <Check className="size-4 shrink-0 text-accent" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </div>
      </Popover.Root>
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
