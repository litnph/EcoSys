import {
  AlertCircle,
  CalendarClock,
  CalendarRange,
  CreditCard,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { formatCurrency } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import type { InstallmentDashboard } from "../types";

export interface InstallmentsOverviewProps {
  data: InstallmentDashboard | undefined;
  currency?: string;
  isLoading?: boolean;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof CreditCard;
  tone?: "default" | "warning" | "accent" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "border-warning/30 bg-warning/5"
      : tone === "accent"
        ? "border-accent/30 bg-accent/5"
        : tone === "success"
          ? "border-success/30 bg-success/5"
          : "border-warm-200 bg-surface";

  return (
    <div
      className={cn(
        "flex gap-3 bg-surface p-4",
        toneClass)}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-button bg-warm-50 ring-1 ring-warm-200">
        <Icon className="size-5 text-warm-600" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-warm-500">
          {label}
        </p>
        <p className="font-mono text-lg font-semibold tabular-nums text-warm-900">
          {value}
        </p>
        {sub ? <p className="mt-0.5 text-xs text-warm-600">{sub}</p> : null}
      </div>
    </div>
  );
}

function SourceBreakdownRow({
  source,
  currency,
}: {
  source: InstallmentDashboard["bySource"][number];
  currency: string;
}) {
  const overdueShare =
    source.remainingAmount > 0
      ? (source.overdueAmount / source.remainingAmount) * 100
      : 0;
  const thisMonthShare =
    source.remainingAmount > 0
      ? (source.thisMonthDueAmount / source.remainingAmount) * 100
      : 0;
  const nextMonthShare =
    source.remainingAmount > 0
      ? (source.nextMonthDueAmount / source.remainingAmount) * 100
      : 0;
  const laterShare = Math.max(
    0,
    100 - overdueShare - thisMonthShare - nextMonthShare);

  return (
    <div className="border-b border-warm-200 px-1 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-warm-900">
            {source.sourceIcon ? (
              <span aria-hidden>{source.sourceIcon}</span>
            ) : null}
            {source.sourceName}
          </p>
          <p className="text-[11px] text-warm-500">
            {source.activePlanCount} kế hoạch
          </p>
        </div>
        <p className="shrink-0 font-mono text-sm font-semibold tabular-nums text-warm-900">
          {formatCurrency(source.remainingAmount, currency)}
        </p>
      </div>

      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-warm-100" aria-hidden>
        {overdueShare > 0 ? (
          <div
            className="h-full bg-danger"
            style={{ width: `${String(overdueShare)}%` }}
          />
        ) : null}
        {thisMonthShare > 0 ? (
          <div
            className="h-full bg-accent"
            style={{ width: `${String(thisMonthShare)}%` }}
          />
        ) : null}
        {nextMonthShare > 0 ? (
          <div
            className="h-full bg-warning"
            style={{ width: `${String(nextMonthShare)}%` }}
          />
        ) : null}
        {laterShare > 0 ? (
          <div
            className="h-full bg-warm-300"
            style={{ width: `${String(laterShare)}%` }}
          />
        ) : null}
      </div>

      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-warm-500">
        {source.overdueAmount > 0 ? (
          <span className="text-danger">
            Quá hạn {formatCurrency(source.overdueAmount, currency)}
          </span>
        ) : null}
        {source.thisMonthDueAmount > 0 ? (
          <span>
            Tháng này {formatCurrency(source.thisMonthDueAmount, currency)}
          </span>
        ) : null}
        {source.nextMonthDueAmount > 0 ? (
          <span className="text-warning">
            Tháng sau {formatCurrency(source.nextMonthDueAmount, currency)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function InstallmentsOverview({
  data,
  currency = "VND",
  isLoading,
}: InstallmentsOverviewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-warm-200 bg-warm-200 lg:grid-cols-3 2xl:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={String(i)}
              className="h-[104px] animate-pulse bg-warm-50"
            />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-card border border-warm-200 bg-warm-50" />
          <div className="h-48 animate-pulse rounded-card border border-warm-200 bg-warm-50" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-warm-200 bg-warm-200 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Kế hoạch đang trả"
          value={String(data.activePlanCount)}
          sub="Đang theo dõi"
          icon={CreditCard}
          tone="accent"
        />
        <StatCard
          label="Còn phải trả"
          value={formatCurrency(data.totalRemainingAmount, currency)}
          sub={`Đã trả ${String(data.completionPercent)}%`}
          icon={Wallet}
        />
        <StatCard
          label="Đến hạn hôm nay"
          value={String(data.dueCount)}
          sub={
            data.dueAmount > 0
              ? formatCurrency(data.dueAmount, currency)
              : "Không có kỳ"
          }
          icon={CalendarClock}
        />
        <StatCard
          label="Còn lại tháng này"
          value={String(data.thisMonthDueCount)}
          sub={
            data.thisMonthDueAmount > 0
              ? formatCurrency(data.thisMonthDueAmount, currency)
              : "Không có kỳ"
          }
          icon={CalendarRange}
        />
        <StatCard
          label="Tháng tiếp theo"
          value={String(data.nextMonthDueCount)}
          sub={
            data.nextMonthDueAmount > 0
              ? formatCurrency(data.nextMonthDueAmount, currency)
              : "Chưa có lịch"
          }
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Quá hạn"
          value={String(data.overdueCount)}
          sub={
            data.overdueAmount > 0
              ? formatCurrency(data.overdueAmount, currency)
              : undefined
          }
          icon={AlertCircle}
          tone={data.overdueCount > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-card border border-warm-200 bg-surface p-4 lg:col-span-3">
          <h3 className="font-display text-sm font-semibold text-warm-900">
            Theo từng thẻ
          </h3>
          <p className="mt-0.5 text-xs text-warm-500">
            Dư nợ trả góp, phân bổ theo quá hạn / tháng này / tháng sau
          </p>
          {data.bySource.length === 0 ? (
            <p className="mt-6 text-center text-sm text-warm-400">
              Chưa có kế hoạch trả góp
            </p>
          ) : (
            <div className="mt-3">
              {data.bySource.map((s) => (
                <SourceBreakdownRow
                  key={s.sourceId}
                  source={s}
                  currency={currency}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-card border border-warm-200 bg-surface p-4 lg:col-span-2">
          <h3 className="font-display text-sm font-semibold text-warm-900">
            Tiến độ tổng thể
          </h3>
          <p className="mt-0.5 text-xs text-warm-500">
            Tỷ lệ đã trả trên tổng giá trị các kế hoạch đang active
          </p>
          <div className="mt-6">
            <div className="flex items-end justify-between gap-3">
              <span className="text-sm font-medium text-warm-600">Đã hoàn thành</span>
              <span className="font-amount text-2xl font-semibold tabular-nums text-warm-900">{data.completionPercent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-warm-100" role="progressbar" aria-label="Tiến độ trả góp" aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.completionPercent}>
              <div className="h-full bg-success" style={{ width: `${String(data.completionPercent)}%` }} />
            </div>
            <dl className="mt-5 w-full space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-warm-500">Còn phải trả</dt>
                <dd className="font-mono font-semibold text-warm-900">
                  {formatCurrency(data.totalRemainingAmount, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-warm-500">Kỳ sắp tới</dt>
                <dd className="font-mono text-warm-800">
                  {data.upcomingCount} kỳ ·{" "}
                  {formatCurrency(data.upcomingAmount, currency)}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
