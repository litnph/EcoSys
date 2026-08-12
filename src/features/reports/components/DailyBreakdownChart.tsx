import { motion } from "framer-motion";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SkeletonText } from "@/shared/components/ui/Skeleton";
import { DataTableScrollRegion } from "@/shared/components/ui/DataTableScrollRegion";
import { formatCurrency } from "@/shared/lib/formatters";
import { cardSlideUpMotion } from "@/shared/lib/animations";

import type { DailyPoint } from "../types";

export interface DailyBreakdownChartProps {
  data: DailyPoint[] | undefined;
  isLoading: boolean;
}

type DtTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: DailyPoint }>;
};

function DtTooltip({ active, payload }: DtTooltipProps) {
  if (!active || !payload?.length) return null;
  const day = payload[0]?.payload;
  if (!day) return null;
  return (
    <div className="rounded-lg border border-warm-200 bg-surface px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium text-warm-900">Ngày {day.day}</p>
      <p className="font-mono text-xs text-success">Thu · {formatCurrency(day.income)}</p>
      <p className="font-mono text-xs text-danger">Chi · {formatCurrency(day.expense)}</p>
    </div>
  );
}

export function DailyBreakdownChart({
  data,
  isLoading,
}: DailyBreakdownChartProps) {
  if (isLoading || data === undefined) {
    return (
      <motion.article
        {...cardSlideUpMotion}
        className="flex flex-col rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
      >
        <SkeletonText className="mb-6 h-6 w-3/5" />
        <div className="h-[280px] w-full">
          <SkeletonText className="h-full rounded-card" />
        </div>
      </motion.article>
    );
  }

  const rows = [...data].sort((a, b) => a.day - b.day);
  const hasFlow = rows.some((d) => d.income !== 0 || d.expense !== 0);

  const compactAxis = new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (
    <motion.article
      {...cardSlideUpMotion}
      className="flex flex-col rounded-card border border-warm-200 bg-surface p-5 shadow-sm"
    >
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-warm-900">
            Dòng tiền theo ngày
          </h3>
          <p className="mt-1 text-xs text-warm-500">
            Bar: chi trực tiếp theo ngày · Line: thu. Chi quẹt thẻ xem ở kỳ sao kê.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-warm-500">
          <span className="inline-flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: "var(--color-danger)" }}
            />
            Chi
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-px w-3 bg-success" aria-hidden />
            Thu
          </span>
        </div>
      </header>

      {!hasFlow ? (
        <p className="py-20 text-center text-sm text-warm-400">
          Không có thu chi trong các ngày này
        </p>
      ) : (
        <>
        <div
          className="h-[300px] w-full"
          role="img"
          aria-label="Biểu đồ thu và chi trực tiếp theo ngày, đơn vị VND"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              accessibilityLayer
              data={rows}
              margin={{ top: 8, bottom: 0, left: -8, right: 8 }}
            >
              <CartesianGrid
                stroke="var(--color-warm-200)"
                strokeDasharray="6 10"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="var(--color-warm-400)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--color-warm-400)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => compactAxis.format(v)}
                width={72}
              />
              <Tooltip content={<DtTooltip />} cursor={{ stroke: "var(--color-warm-200)" }} />
              <Bar
                dataKey="expense"
                name="Chi"
                fill="var(--color-danger)"
                maxBarSize={16}
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Thu"
                stroke="var(--color-success)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3 text-sm text-warm-600">
          <summary className="cursor-pointer font-medium text-warm-700">
            Xem dữ liệu biểu đồ
          </summary>
          <DataTableScrollRegion
            label="Dữ liệu dòng tiền theo ngày"
            className="mt-2 rounded-input border border-warm-200"
          >
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Dữ liệu dòng tiền theo ngày</caption>
              <thead className="bg-warm-50 text-warm-600">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Ngày</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Thu</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Chi trực tiếp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {rows.map((row) => (
                  <tr key={row.day}>
                    <td className="px-3 py-2 tabular-nums">{row.day}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {formatCurrency(row.income)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {formatCurrency(row.expense)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableScrollRegion>
        </details>
        </>
      )}
    </motion.article>
  );
}
