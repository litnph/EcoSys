import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist";
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

import {
  parseCreditCardStatementRows,
  type ParsedStatement,
  type PdfTextRow,
} from "./statementReconciliation";

let worker: Worker | null = null;

function ensurePdfWorker(): void {
  if (!worker) worker = new PdfWorker();
  GlobalWorkerOptions.workerPort = worker;
}

function groupPageRows(
  page: number,
  items: TextItem[],
): PdfTextRow[] {
  const rows: PdfTextRow[] = [];
  const sorted = [...items].sort(
    (a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4],
  );

  for (const item of sorted) {
    const text = item.str.trim();
    if (!text) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    let row = rows.find((candidate) => Math.abs(candidate.y - y) <= 1.25);
    if (!row) {
      row = { page, y, cells: [] };
      rows.push(row);
    }
    row.cells.push({ text, x });
  }

  for (const row of rows) row.cells.sort((a, b) => a.x - b.x);
  return rows;
}

export async function extractCreditCardStatementPdf(
  file: File,
): Promise<ParsedStatement> {
  ensurePdfWorker();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data: bytes });
  const document = await loadingTask.promise;
  const rows: PdfTextRow[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const textItems = content.items.filter(
        (item): item is TextItem => "str" in item,
      );
      rows.push(...groupPageRows(pageNumber, textItems));
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }

  return parseCreditCardStatementRows(rows);
}
