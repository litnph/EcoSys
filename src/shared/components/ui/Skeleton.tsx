import * as React from "react";

import { cn } from "@/shared/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

function styleFromDim(
  w?: string | number,
  h?: string | number): React.CSSProperties | undefined {
  const style: React.CSSProperties = {};
  if (w !== undefined) style.width = typeof w === "number" ? `${w}px` : w;
  if (h !== undefined) style.height = typeof h === "number" ? `${h}px` : h;
  return Object.keys(style).length ? style : undefined;
}

/** Base shimmering block aligned với các token warm / rounded hiện tại. */
export function Skeleton({
  className,
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded bg-warm-200", className)}
      style={{ ...styleFromDim(width, height), ...style }}
      {...props}
    />
  );
}

export function SkeletonText({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton className={cn("h-4 w-full", className)} {...props} />
  );
}

export function SkeletonTitle({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton className={cn("h-6 w-[60%]", className)} {...props} />
  );
}

export function SkeletonAvatar({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn("size-11 shrink-0 rounded-full", className)}
      {...props}
    />
  );
}

/** Card-ish block + nội dung nhiều dòng như một card thực. */
export function SkeletonCard({
  lines = 3,
  showHeader = true,
  className,
}: {
  lines?: number;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-card border border-warm-200 bg-surface p-4 shadow-sm",
        className)}
    >
      {showHeader && (
        <div className="flex items-center gap-3">
          <SkeletonAvatar />
          <div className="flex flex-1 flex-col gap-2">
            <SkeletonTitle className="h-5" />
            <SkeletonText className="h-3 w-[40%]" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <SkeletonText
            key={`card-line-${String(i)}`}
            className={cn(i === lines - 1 ? "w-[75%]" : "w-full")}
          />
        ))}
      </div>
    </div>
  );
}

/** Bảng: header + `rows` × 4 ô (giố layout bảng chuẩn). */
export function SkeletonTable({
  rows = 5,
  cols = 4,
  showHeaderRow = true,
  className,
}: {
  rows?: number;
  cols?: number;
  showHeaderRow?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-card border border-warm-200 bg-surface",
        className)}
    >
      {showHeaderRow && (
        <div className="border-b border-warm-200 bg-warm-50 p-4 sm:p-5">
          <SkeletonRowSkeleton cols={cols} dense />
        </div>
      )}
      <div className="divide-y divide-warm-100">
        {Array.from({ length: rows }, (_, ri) => (
          <div key={`row-${String(ri)}`} className="p-4 sm:p-5">
            <SkeletonRowSkeleton cols={cols} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonRowSkeleton({
  cols,
  dense,
}: {
  cols: number;
  dense?: boolean;
}) {
  return (
    <div
      className="grid w-full gap-3 sm:gap-4"
      style={{
        gridTemplateColumns: `repeat(${String(cols)}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: cols }, (_, ci) => (
        <Skeleton
          key={`cell-${String(cols)}-${String(ci)}`}
          className={cn("w-full rounded-input", dense ? "h-3" : "h-5")}
        />
      ))}
    </div>
  );
}
