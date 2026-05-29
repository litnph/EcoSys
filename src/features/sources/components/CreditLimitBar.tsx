import { cn } from "@/shared/lib/utils";

export interface CreditLimitBarProps {
  spentPct: number;
  installmentPct: number;
  availablePct: number;
  className?: string;
}

/** Thanh hạn mức: xám = đã chi, vàng = trả góp, xanh = khả dụng. */
export function CreditLimitBar({
  spentPct,
  installmentPct,
  availablePct,
  className,
}: CreditLimitBarProps) {
  return (
    <div
      className={cn(
        "flex h-2 overflow-hidden rounded-full bg-warm-100/90",
        className)}
      role="img"
      aria-hidden
    >
      {spentPct > 0 ? (
        <div
          className="h-full bg-warm-400 transition-all"
          style={{ width: `${String(spentPct)}%` }}
        />
      ) : null}
      {installmentPct > 0 ? (
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${String(installmentPct)}%` }}
        />
      ) : null}
      {availablePct > 0 ? (
        <div
          className="h-full bg-success transition-all"
          style={{ width: `${String(availablePct)}%` }}
        />
      ) : null}
    </div>
  );
}

function LegendRow({
  colorClass,
  label,
  value,
}: {
  colorClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="flex min-w-0 items-center gap-1.5 text-warm-600">
        <span
          className={cn("size-2 shrink-0 rounded-full", colorClass)}
          aria-hidden
        />
        {label}
      </span>
      <span className="shrink-0 font-mono font-medium tabular-nums text-warm-800">
        {value}
      </span>
    </div>
  );
}

export interface CreditLimitLegendProps {
  spentLabel: string;
  spentValue: string;
  installmentLabel: string;
  installmentValue: string;
  availableLabel: string;
  availableValue: string;
  className?: string;
}

export function CreditLimitLegend({
  spentLabel,
  spentValue,
  installmentLabel,
  installmentValue,
  availableLabel,
  availableValue,
  className,
}: CreditLimitLegendProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <LegendRow
        colorClass="bg-warm-400"
        label={spentLabel}
        value={spentValue}
      />
      <LegendRow
        colorClass="bg-amber-400"
        label={installmentLabel}
        value={installmentValue}
      />
      <LegendRow
        colorClass="bg-success"
        label={availableLabel}
        value={availableValue}
      />
    </div>
  );
}
