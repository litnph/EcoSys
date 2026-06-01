/** Shared layout for transaction table header + rows. */

export const TXN_TABLE_CLASS =
  "w-full min-w-[960px] table-fixed border-collapse";

export const TXN_CELL_PAD = "px-[10px] pr-[30px]";
export const TXN_CELL_PAD_LAST = "pl-[10px] pr-[10px]";

export const TXN_TH = [
  TXN_CELL_PAD,
  "py-2 text-center align-middle text-[10px] font-semibold uppercase tracking-wide text-warm-500",
].join(" ");

export const TXN_TH_LAST = [
  TXN_CELL_PAD_LAST,
  "py-2 text-center align-middle text-[10px] font-semibold uppercase tracking-wide text-warm-500",
].join(" ");

export const TXN_TD = [TXN_CELL_PAD, "py-2.5 align-middle"].join(" ");
export const TXN_TD_LAST = [TXN_CELL_PAD_LAST, "py-2.5 align-middle"].join(" ");

export const TXN_TD_CENTER = `${TXN_TD} text-center`;
export const TXN_TD_RIGHT = `${TXN_TD} text-right tabular-nums whitespace-nowrap`;
export const TXN_TD_LEFT = `${TXN_TD} text-left`;
export const TXN_TD_LEFT_LAST = `${TXN_TD_LAST} text-left`;

export const TXN_ROW_HOVER =
  "cursor-pointer transition-colors hover:bg-warm-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent";

/** Column widths — fixed px for narrow cols, % for middle, last col fills remainder. */
export const TXN_TABLE_COLS = [
  "w-10",
  "w-[4.75rem]",
  "w-[160px]",
  "w-[8%]",
  "w-[9%]",
  "w-[9%]",
  "w-[10%]",
  "w-[9%]",
  "",
] as const;
