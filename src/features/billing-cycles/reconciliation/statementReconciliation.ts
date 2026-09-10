import type { BillingCycleInstallmentDue } from "../types";
import type { Transaction } from "@/features/transactions/types";

export type StatementLineKind = "deferred" | "installment";
export type ReconciliationStatus =
  | "matched"
  | "missingInSystem"
  | "missingInStatement";

export interface PdfTextCell {
  text: string;
  x: number;
}

export interface PdfTextRow {
  page: number;
  y: number;
  cells: PdfTextCell[];
}

export interface StatementFileLine {
  id: string;
  kind: StatementLineKind;
  transactionDate: string;
  postDate: string | null;
  amount: number;
  description: string;
  page: number;
}

export interface ParsedStatement {
  statementDate: string | null;
  deferred: StatementFileLine[];
  installments: StatementFileLine[];
  warnings: string[];
}

export interface SystemStatementLine {
  id: string;
  kind: StatementLineKind;
  transactionDate: string;
  amount: number;
  description: string;
}

export interface ComparedStatementLine extends StatementFileLine {
  status: Exclude<ReconciliationStatus, "missingInStatement">;
  matchedSystemId: string | null;
}

export interface ComparedSystemLine extends SystemStatementLine {
  status: Exclude<ReconciliationStatus, "missingInSystem">;
  matchedStatementId: string | null;
}

export interface DailyReconciliation {
  date: string;
  statementCount: number;
  systemCount: number;
  statementTotal: number;
  systemTotal: number;
  difference: number;
  unmatchedStatementCount: number;
  unmatchedSystemCount: number;
  hasMismatch: boolean;
}

export interface StatementReconciliationResult {
  fileLines: ComparedStatementLine[];
  systemLines: ComparedSystemLine[];
  daily: DailyReconciliation[];
  mismatchDates: string[];
  mismatchFrom: string | null;
  mismatchTo: string | null;
  matchedDateCount: number;
}

const DATE_PATTERN = /^([0-3]\d)\/([01]\d)\/(\d{4})$/;
const AMOUNT_PATTERN = /^-?\d{1,3}(?:,\d{3})*$/;

function toIsoDate(value: string): string | null {
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(/ /g, "");
  if (!AMOUNT_PATTERN.test(normalized)) return null;
  const amount = Number(normalized.replace(/,/g, ""));
  return Number.isFinite(amount) ? Math.abs(amount) : null;
}

function rowText(row: PdfTextRow, minX = 0): string {
  return row.cells
    .filter((cell) => cell.x >= minX)
    .map((cell) => cell.text.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanDescription(value: string): string {
  return value
    .replace(
      /^Giao dịch thanh toán\/Purchase\s*-\s*Số Thẻ\/Card No:\s*\S+\s*/iu,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse các dòng đã được PDF.js định vị. Với giao dịch trả sau, ngày ở cột
 * đầu tiên (x < 65) luôn là ngày giao dịch; cột thứ hai chỉ được giữ làm
 * postDate và tuyệt đối không dùng để đối chiếu.
 */
export function parseCreditCardStatementRows(
  rows: PdfTextRow[],
): ParsedStatement {
  const ordered = [...rows].sort((a, b) => a.page - b.page || b.y - a.y);
  const installmentDetailPages = new Set(
    ordered
      .filter((row) => {
        const text = rowText(row);
        return /Ngày ghi nhận/iu.test(text) && /Ngày chuyển đổi sang/iu.test(text);
      })
      .map((row) => row.page),
  );
  const deferred: StatementFileLine[] = [];
  const installments: StatementFileLine[] = [];
  let active: StatementFileLine | null = null;
  let activeY = 0;
  let statementDate: string | null = null;

  for (let index = 0; index < ordered.length; index += 1) {
    const row = ordered[index];

    if (!statementDate && row.cells.some((cell) => /Ngày sao kê/iu.test(cell.text))) {
      const nearby = ordered.find(
        (candidate) =>
          candidate.page === row.page &&
          Math.abs(candidate.y - row.y) <= 4 &&
          candidate.cells.some(
            (cell) => cell.x > 450 && toIsoDate(cell.text) !== null,
          ),
      );
      const dateCell = nearby?.cells.find(
        (cell) => cell.x > 450 && toIsoDate(cell.text) !== null,
      );
      statementDate = dateCell ? toIsoDate(dateCell.text) : null;
    }

    // Bảng chi tiết kế hoạch trả góp lặp lại chính các khoản "Trả góp hàng kỳ"
    // ở phần giao dịch. Không đọc bảng này lần hai để tránh nhân đôi số tiền.
    if (installmentDetailPages.has(row.page)) {
      active = null;
      continue;
    }

    const firstDateCell = row.cells.find(
      (cell) => cell.x < 65 && toIsoDate(cell.text) !== null,
    );
    const postDateCell = row.cells.find(
      (cell) => cell.x >= 65 && cell.x < 150 && toIsoDate(cell.text) !== null,
    );
    const debitCell = row.cells.find(
      (cell) => cell.x >= 250 && cell.x < 345 && parseAmount(cell.text) !== null,
    );
    const amount = debitCell ? parseAmount(debitCell.text) : null;
    const description = rowText(row, 365);
    const isInstallment =
      !firstDateCell &&
      Boolean(postDateCell) &&
      amount !== null &&
      /Trả góp hàng kỳ|Installment repayment/iu.test(description);
    const isDeferred = Boolean(firstDateCell && postDateCell && amount !== null);

    if (isDeferred || isInstallment) {
      const transactionDate = isDeferred
        ? toIsoDate(firstDateCell?.text ?? "")
        : toIsoDate(postDateCell?.text ?? "");
      if (!transactionDate || amount === null) continue;

      const line: StatementFileLine = {
        id: `pdf-${String(row.page)}-${String(index)}`,
        kind: isInstallment ? "installment" : "deferred",
        transactionDate,
        postDate: postDateCell ? toIsoDate(postDateCell.text) : null,
        amount,
        description: cleanDescription(description),
        page: row.page,
      };
      if (line.kind === "installment") installments.push(line);
      else deferred.push(line);
      active = line;
      activeY = row.y;
      continue;
    }

    if (
      active &&
      row.page === active.page &&
      activeY - row.y > 0 &&
      activeY - row.y <= 11 &&
      row.cells.some((cell) => cell.x >= 365)
    ) {
      const continuation = rowText(row, 365);
      if (continuation) {
        active.description = cleanDescription(
          `${active.description} ${continuation}`,
        );
      }
    }
  }

  if (!statementDate && installments.length > 0) {
    statementDate = installments[0]?.transactionDate ?? null;
  }

  const warnings: string[] = [];
  if (deferred.length === 0 && installments.length === 0) {
    warnings.push("Không tìm thấy dòng giao dịch phù hợp trong file sao kê.");
  }
  if (!statementDate) {
    warnings.push("Không xác định được ngày sao kê trong file.");
  }

  return { statementDate, deferred, installments, warnings };
}

export function buildSystemStatementLines(
  transactions: Transaction[],
  installmentDues: BillingCycleInstallmentDue[],
  statementDate: string,
): SystemStatementLine[] {
  const deferred = transactions.map<SystemStatementLine>((transaction) => ({
    id: transaction.id,
    kind: "deferred",
    // txnDate is deliberate: createdAt/updatedAt are not statement transaction dates.
    transactionDate: transaction.txnDate.slice(0, 10),
    amount: Math.abs(transaction.amount),
    description:
      transaction.description?.trim() ||
      transaction.categoryName?.trim() ||
      "Giao dịch trả sau",
  }));
  const installments = installmentDues.map<SystemStatementLine>((due) => ({
    id: due.payId,
    kind: "installment",
    transactionDate: statementDate.slice(0, 10),
    amount: Math.abs(due.amount),
    description: due.planDescription?.trim() || "Trả góp hàng kỳ",
  }));
  return [...deferred, ...installments];
}

function matchKey(line: {
  kind: StatementLineKind;
  transactionDate: string;
  amount: number;
}): string {
  return `${line.kind}|${line.transactionDate}|${String(Math.round(line.amount))}`;
}

function groupLinesByDate<T extends { transactionDate: string }>(
  lines: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const line of lines) {
    const group = groups.get(line.transactionDate) ?? [];
    group.push(line);
    groups.set(line.transactionDate, group);
  }
  return groups;
}

export function reconcileStatement(
  parsed: ParsedStatement,
  systemLines: SystemStatementLine[],
): StatementReconciliationResult {
  const rawFileLines = [...parsed.deferred, ...parsed.installments];
  const statementByDate = groupLinesByDate(rawFileLines);
  const systemByDate = groupLinesByDate(systemLines);
  const dates = Array.from(
    new Set([...statementByDate.keys(), ...systemByDate.keys()]),
  ).sort();

  // Bước 1 + 2: gom tổng tiền theo ngày ở từng phía rồi so sánh tổng.
  // Việc tách giao dịch thành bao nhiêu dòng không làm một ngày bị báo lệch
  // nếu tổng tiền của ngày đó vẫn bằng nhau.
  const dailyTotals = dates.map((date) => {
    const statementForDate = statementByDate.get(date) ?? [];
    const systemForDate = systemByDate.get(date) ?? [];
    const statementTotal = statementForDate.reduce(
      (sum, line) => sum + line.amount,
      0,
    );
    const systemTotal = systemForDate.reduce(
      (sum, line) => sum + line.amount,
      0,
    );
    return {
      date,
      statementCount: statementForDate.length,
      systemCount: systemForDate.length,
      statementTotal,
      systemTotal,
      difference: systemTotal - statementTotal,
      hasMismatch: Math.round(systemTotal) !== Math.round(statementTotal),
    };
  });
  const mismatchDateSet = new Set(
    dailyTotals.filter((row) => row.hasMismatch).map((row) => row.date),
  );

  // Bước 3 + 4: chỉ sau khi biết ngày nào lệch mới ghép các dòng trong các
  // ngày đó để loại các giao dịch đã khớp và giữ lại phần thiếu/thừa.
  const systemQueues = new Map<string, SystemStatementLine[]>();
  for (const line of systemLines) {
    if (!mismatchDateSet.has(line.transactionDate)) continue;
    const key = matchKey(line);
    const queue = systemQueues.get(key) ?? [];
    queue.push(line);
    systemQueues.set(key, queue);
  }

  const matchedSystemIds = new Map<string, string>();
  const fileLines = rawFileLines.map<ComparedStatementLine>((line) => {
    if (!mismatchDateSet.has(line.transactionDate)) {
      return {
        ...line,
        status: "matched",
        matchedSystemId: null,
      };
    }
    const matched = systemQueues.get(matchKey(line))?.shift();
    if (matched) matchedSystemIds.set(matched.id, line.id);
    return {
      ...line,
      status: matched ? "matched" : "missingInSystem",
      matchedSystemId: matched?.id ?? null,
    };
  });
  const systemCompared = systemLines.map<ComparedSystemLine>((line) => {
    if (!mismatchDateSet.has(line.transactionDate)) {
      return {
        ...line,
        status: "matched",
        matchedStatementId: null,
      };
    }
    return {
      ...line,
      status: matchedSystemIds.has(line.id) ? "matched" : "missingInStatement",
      matchedStatementId: matchedSystemIds.get(line.id) ?? null,
    };
  });
  const comparedFileByDate = groupLinesByDate(fileLines);
  const comparedSystemByDate = groupLinesByDate(systemCompared);

  const daily = dailyTotals.map<DailyReconciliation>((totals) => {
    const { date } = totals;
    const fileForDate = comparedFileByDate.get(date) ?? [];
    const systemForDate = comparedSystemByDate.get(date) ?? [];
    const unmatchedStatementCount = fileForDate.filter(
      (line) => line.status !== "matched",
    ).length;
    const unmatchedSystemCount = systemForDate.filter(
      (line) => line.status !== "matched",
    ).length;
    return {
      ...totals,
      unmatchedStatementCount,
      unmatchedSystemCount,
    };
  });
  const mismatchDates = daily
    .filter((row) => row.hasMismatch)
    .map((row) => row.date);

  return {
    fileLines,
    systemLines: systemCompared,
    daily,
    mismatchDates,
    mismatchFrom: mismatchDates[0] ?? null,
    mismatchTo: mismatchDates.at(-1) ?? null,
    matchedDateCount: daily.filter((row) => !row.hasMismatch).length,
  };
}
