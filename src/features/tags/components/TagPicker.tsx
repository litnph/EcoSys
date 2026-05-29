import { useTags } from "@/features/tags/hooks/useTags";
import { cn } from "@/shared/lib/utils";

export interface TagPickerProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function TagPicker({
  value,
  onChange,
  disabled,
  className,
}: TagPickerProps) {
  const { data: tags, isLoading } = useTags();
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
    return <p className="text-sm text-warm-500">Đang tải thẻ…</p>;
  }

  if (!tags?.length) {
    return (
      <p className="text-sm text-warm-500">
        Chưa có thẻ nào. Tạo thẻ trong mục Thẻ trước khi gán cho giao dịch.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => {
        const active = selected.has(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(tag.id)}
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
