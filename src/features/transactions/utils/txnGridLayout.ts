/** Shared grid for transaction table header + rows. */
export const TXN_TABLE_MIN_WIDTH = "min-w-[1180px]";

export const TXN_CELL_CENTER = "flex min-w-0 items-center justify-center";

export const TXN_HEADER_CENTER = "text-center";

export const TXN_ROW_GRID = [
  "grid w-full items-center gap-x-4 px-4",
  TXN_TABLE_MIN_WIDTH,
  "grid-cols-[minmax(2.25rem,auto)_minmax(4.5rem,auto)_minmax(5.5rem,auto)_minmax(5rem,1fr)_minmax(5.5rem,0.9fr)_minmax(5.5rem,0.9fr)_minmax(5.5rem,0.9fr)_minmax(5rem,0.75fr)_minmax(9rem,1.4fr)_minmax(5rem,1fr)]",
].join(" ");

export const TXN_HEADER_GRID = [
  TXN_ROW_GRID,
  "py-2 text-[10px] font-semibold uppercase tracking-wide text-warm-500",
].join(" ");

export const TXN_BODY_ROW_GRID = [
  TXN_ROW_GRID,
  "py-2.5 text-left transition hover:bg-warm-50",
].join(" ");
