import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Transaction } from "@/features/transactions/types";
import { Button } from "@/shared/components/ui/Button";
import { formatCurrency, formatDate } from "@/shared/lib/formatters";
import { cn } from "@/shared/lib/utils";

import {
  buildSystemStatementLines,
  reconcileStatement,
  type ParsedStatement,
  type StatementReconciliationResult,
} from "../reconciliation/statementReconciliation";
import type { BillingCycle, BillingCycleInstallmentDue } from "../types";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export interface StatementReconciliationPanelProps {
  cycle: BillingCycle;
  transactions: Transaction[];
  installmentDues: BillingCycleInstallmentDue[];
  currency: string;
  onResultChange?: (result: StatementReconciliationResult | null) => void;
}

function mismatchRangeLabel(result: StatementReconciliationResult): string {
  if (!result.mismatchFrom) return "";
  if (result.mismatchFrom === result.mismatchTo) {
    return `Dữ liệu lệch trong ngày ${formatDate(result.mismatchFrom)}.`;
  }
  return `Khoảng lệch từ ${formatDate(result.mismatchFrom)} đến ${formatDate(
    result.mismatchTo ?? result.mismatchFrom,
  )}.`;
}

export function StatementReconciliationPanel({
  cycle,
  transactions,
  installmentDues,
  currency,
  onResultChange,
}: StatementReconciliationPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedStatement | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const systemLines = useMemo(
    () =>
      buildSystemStatementLines(
        transactions,
        installmentDues,
        cycle.statementDate,
      ),
    [cycle.statementDate, installmentDues, transactions],
  );
  const result = useMemo(
    () => (parsed ? reconcileStatement(parsed, systemLines) : null),
    [parsed, systemLines],
  );

  useEffect(() => {
    onResultChange?.(result);
  }, [onResultChange, result]);

  const clearFile = () => {
    setFileName(null);
    setParsed(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Chỉ hỗ trợ file sao kê định dạng PDF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File sao kê vượt quá giới hạn 20 MB.");
      return;
    }

    setIsParsing(true);
    setError(null);
    setParsed(null);
    setFileName(file.name);
    try {
      const { extractCreditCardStatementPdf } = await import(
        "../reconciliation/extractStatementPdf"
      );
      const next = await extractCreditCardStatementPdf(file);
      if (next.deferred.length === 0 && next.installments.length === 0) {
        throw new Error("empty-statement");
      }
      setParsed(next);
    } catch {
      setParsed(null);
      setError(
        "Không đọc được giao dịch trong file. Hãy kiểm tra PDF có lớp văn bản và đúng định dạng sao kê.",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const statementDateMismatch =
    parsed?.statementDate != null &&
    parsed.statementDate !== cycle.statementDate.slice(0, 10);
  const unmatchedFile =
    result?.fileLines.filter((line) => line.status === "missingInSystem") ?? [];
  const unmatchedSystem =
    result?.systemLines.filter((line) => line.status === "missingInStatement") ?? [];

  return (
    <section className="rounded-card border border-warm-200 bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileSearch className="size-5 text-accent" aria-hidden />
            <h2 className="font-display text-lg font-semibold text-warm-900">
              Đối chiếu file sao kê
            </h2>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-warm-500">
            Tổng hợp tổng giao dịch theo ngày ở file và hệ thống, xác định ngày
            có tổng bị lệch, sau đó mới tìm các giao dịch cần kiểm tra trong ngày
            đó. Không dùng ngày cập nhật hệ thống để đối chiếu.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={
              isParsing ? undefined : <Upload className="size-4" aria-hidden />
            }
            isLoading={isParsing}
            onClick={() => inputRef.current?.click()}
          >
            {fileName ? "Chọn file khác" : "Chọn file sao kê"}
          </Button>
          {fileName ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Bỏ file sao kê"
              onClick={clearFile}
            >
              <X className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>

      {fileName ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-warm-50 px-3 py-2 text-sm text-warm-700">
          {isParsing ? (
            <Loader2 className="size-4 animate-spin text-accent" aria-hidden />
          ) : (
            <FileSearch className="size-4 text-warm-500" aria-hidden />
          )}
          <span className="min-w-0 truncate">{fileName}</span>
          {isParsing ? <span className="text-warm-500">Đang đọc…</span> : null}
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {result && parsed ? (
        <div className="mt-5 space-y-5">
          {statementDateMismatch ? (
            <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warm-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <p>
                File thuộc ngày sao kê {formatDate(parsed.statementDate ?? "")},
                khác kỳ đang mở ({formatDate(cycle.statementDate)}).
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border border-warm-200 bg-warm-25 px-3 py-2.5">
              <p className="text-xs text-warm-500">Dòng trong file</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-warm-900">
                {result.fileLines.length}
              </p>
            </div>
            <div className="rounded-lg border border-warm-200 bg-warm-25 px-3 py-2.5">
              <p className="text-xs text-warm-500">Dòng hệ thống</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-warm-900">
                {result.systemLines.length}
              </p>
            </div>
            <div className="rounded-lg border border-warm-200 bg-warm-25 px-3 py-2.5">
              <p className="text-xs text-warm-500">Ngày đã khớp tổng</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-success">
                {result.matchedDateCount}
              </p>
            </div>
            <div
              className={cn(
                "rounded-lg border px-3 py-2.5",
                result.mismatchDates.length > 0
                  ? "border-danger/30 bg-danger/5"
                  : "border-success/25 bg-success/5",
              )}
            >
              <p className="text-xs text-warm-500">Ngày bị lệch</p>
              <p
                className={cn(
                  "mt-1 font-mono text-lg font-semibold tabular-nums",
                  result.mismatchDates.length > 0 ? "text-danger" : "text-success",
                )}
              >
                {result.mismatchDates.length}
              </p>
            </div>
          </div>

          {result.mismatchDates.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/5 px-3 py-3 text-sm font-medium text-success">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />
              Tổng giao dịch của từng ngày trên file và hệ thống đã khớp.
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-danger">
                      {mismatchRangeLabel(result)}
                    </p>
                    <p className="mt-1 text-xs text-warm-600">
                      Sau khi so sánh tổng theo ngày, hệ thống đã loại các dòng
                      khớp trong ngày lệch và highlight những giao dịch cần kiểm tra.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-warm-200">
                <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                  <thead className="bg-warm-50 text-xs font-medium text-warm-600">
                    <tr>
                      <th className="px-3 py-2.5">Ngày giao dịch</th>
                      <th className="px-3 py-2.5 text-right">File sao kê</th>
                      <th className="px-3 py-2.5 text-right">Hệ thống</th>
                      <th className="px-3 py-2.5 text-right">Chênh lệch</th>
                      <th className="px-3 py-2.5 text-right">Giao dịch cần kiểm tra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {result.daily
                      .filter((row) => row.hasMismatch)
                      .map((row) => (
                        <tr key={row.date} className="bg-warning/10">
                          <td className="px-3 py-2.5 font-semibold tabular-nums text-warm-900">
                            {formatDate(row.date)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-warm-700">
                            {formatCurrency(row.statementTotal, currency)}
                            <span className="ml-1 text-xs text-warm-400">
                              ({row.statementCount})
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-warm-700">
                            {formatCurrency(row.systemTotal, currency)}
                            <span className="ml-1 text-xs text-warm-400">
                              ({row.systemCount})
                            </span>
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2.5 text-right font-mono font-semibold tabular-nums",
                              row.difference === 0 ? "text-warm-500" : "text-danger",
                            )}
                          >
                            {formatCurrency(row.difference, currency)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-xs text-danger">
                            File {row.unmatchedStatementCount} · Hệ thống{" "}
                            {row.unmatchedSystemCount}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {(unmatchedFile.length > 0 || unmatchedSystem.length > 0) && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-warm-800">
                      Có trong file, thiếu trên hệ thống
                    </h3>
                    <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                      {unmatchedFile.length > 0 ? (
                        unmatchedFile.map((line) => (
                          <li
                            key={line.id}
                            className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2"
                          >
                            <div className="flex items-start justify-between gap-3 text-sm">
                              <div className="min-w-0">
                                <p className="truncate font-medium text-warm-900">
                                  {line.description ||
                                    (line.kind === "installment"
                                      ? "Trả góp hàng kỳ"
                                      : "Giao dịch trả sau")}
                                </p>
                                <p className="mt-0.5 text-xs text-warm-500">
                                  {formatDate(line.transactionDate)} · Trang {line.page}
                                </p>
                              </div>
                              <span className="shrink-0 font-mono font-semibold tabular-nums text-danger">
                                {formatCurrency(line.amount, currency)}
                              </span>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-warm-500">Không có.</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-warm-800">
                      Có trên hệ thống, thiếu trong file
                    </h3>
                    <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                      {unmatchedSystem.length > 0 ? (
                        unmatchedSystem.map((line) => (
                          <li
                            key={`${line.kind}-${line.id}`}
                            className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2"
                          >
                            <div className="flex items-start justify-between gap-3 text-sm">
                              <div className="min-w-0">
                                <p className="truncate font-medium text-warm-900">
                                  {line.description}
                                </p>
                                <p className="mt-0.5 text-xs text-warm-500">
                                  {formatDate(line.transactionDate)} ·{" "}
                                  {line.kind === "installment" ? "Trả góp" : "Trả sau"}
                                </p>
                              </div>
                              <span className="shrink-0 font-mono font-semibold tabular-nums text-danger">
                                {formatCurrency(line.amount, currency)}
                              </span>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-warm-500">Không có.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}

          {parsed.warnings.map((warning) => (
            <p key={warning} className="text-xs text-warning">
              {warning}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
