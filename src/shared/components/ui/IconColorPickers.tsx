import { cn } from "@/shared/lib/utils";

export interface IconPickerProps {
  label?: string;
  value: string;
  onChange: (icon: string) => void;
  presets: readonly string[];
  className?: string;
}

export function IconPicker({
  label = "Icon",
  value,
  onChange,
  presets,
  className,
}: IconPickerProps) {
  return (
    <div className={className}>
      <span className="mb-1 block text-sm font-medium text-warm-700">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              "flex size-10 items-center justify-center rounded-button border text-lg transition-colors",
              value === emoji
                ? "border-accent bg-accent/10"
                : "border-warm-200 bg-warm-50 hover:border-warm-300")}
            aria-label={emoji}
            aria-pressed={value === emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  presets: readonly string[];
  className?: string;
}

export function ColorPicker({
  label = "Màu",
  value,
  onChange,
  presets,
  className,
}: ColorPickerProps) {
  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="mb-1 text-sm font-medium text-warm-700">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {presets.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => onChange(hex)}
            className={cn(
              "size-8 rounded-full border-2 shadow-sm transition-transform",
              value === hex
                ? "scale-110 border-warm-900"
                : "border-transparent ring-1 ring-warm-200")}
            style={{ backgroundColor: hex }}
            aria-label={`Màu ${hex}`}
            aria-pressed={value === hex}
          />
        ))}
      </div>
    </fieldset>
  );
}
