import * as React from "react";

import { cn } from "@/shared/lib/utils";

export interface DataTableScrollRegionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
}

export const DataTableScrollRegion = React.forwardRef<
  HTMLDivElement,
  DataTableScrollRegionProps
>(function DataTableScrollRegion(
  { label, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
