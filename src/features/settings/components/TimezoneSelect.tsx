import { useMemo, useState } from "react";

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { getAllTimeZoneIds } from "../lib/timezones";

export type TimezoneSelectProps = {
  value: string;
  onChange: (tz: string) => void;
  disabled?: boolean;
  label?: string;
};

export function TimezoneSelect({
  value,
  onChange,
  disabled,
  label = "Múi giờ",
}: TimezoneSelectProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const zones = useMemo(() => {
    const all = getAllTimeZoneIds();
    const needle = q.trim().toLowerCase();
    if (!needle) {
      return all;
    }
    return all.filter((z) => z.toLowerCase().includes(needle));
  }, [q]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-input border border-warm-200 bg-surface px-3 text-left text-sm text-warm-900",
            "outline-none transition hover:border-warm-300",
            "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
            disabled && "cursor-not-allowed opacity-60")}
        >
          <span className="truncate">{value || "Chọn múi giờ"}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-warm-400" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="start"
          className={cn(
            "z-[120] w-[var(--radix-popover-trigger-width)] rounded-card border border-warm-200 bg-surface shadow-lg",
            "max-h-72 overflow-hidden")}
        >
          <div className="border-b border-warm-200 p-2">
            <input
              type="search"
              aria-label={`Tìm ${label.toLocaleLowerCase("vi")}`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm múi giờ…"
              className={cn(
                "h-9 w-full rounded-input border border-warm-200 bg-warm-50 px-3 text-sm text-warm-900",
                "outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25")}
            />
          </div>
          <ul
            className="max-h-52 overflow-y-auto py-1 text-sm"
            role="listbox"
          >
            {zones.slice(0, 400).map((z) => {
              const selected = z === value;
              return (
                <li key={z} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-warm-800",
                      "hover:bg-warm-100",
                      selected && "bg-accent/10 font-medium text-warm-900")}
                    onClick={() => {
                      onChange(z);
                      setOpen(false);
                      setQ("");
                    }}
                  >
                    <Check
                      className={cn("size-4 shrink-0", selected ? "opacity-100" : "opacity-0")}
                      aria-hidden
                    />
                    <span className="truncate">{z}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
