import { describe, expect, it } from "vitest";

import { applyClassificationMatches } from "../../src/features/transactions/imageImport/autoCategorizeDrafts";
import { parseBankTransactionListOcr } from "../../src/features/transactions/imageImport/parseBankTransactionListOcr";
import { parseImageImportOcr } from "../../src/features/transactions/imageImport/parseImageImportOcr";
import type { ImageOcrResult } from "../../src/features/transactions/imageImport/runImageOcr";
import type { ImageImportDraft } from "../../src/features/transactions/imageImport/types";
import { referenceBankListOcr } from "./bankTransactionListOcrFixture";

function textResult(text: string, numericText = ""): ImageOcrResult {
  return { text, numericText, lines: [], numericLines: [] };
}

describe("bank transaction list OCR parser", () => {
  it("parses the representative screenshot into separate income and expense rows", () => {
    const rows = parseBankTransactionListOcr(referenceBankListOcr, "image-1");

    expect(rows).toHaveLength(10);
    expect(rows.map((row) => row.txnDate)).toEqual([
      "2026-09-06", "2026-09-06", "2026-09-06", "2026-09-05", "2026-09-05",
      "2026-09-04", "2026-09-04", "2026-09-04", "2026-09-04", "2026-09-03",
    ]);
    expect(rows.map((row) => row.amount)).toEqual([
      132000, 76000, 15000, 46000, 1500000, 135000, 100000, 135000, 75000, 43795,
    ]);
    expect(rows.map((row) => row.direction)).toEqual([
      "expense", "expense", "expense", "expense", "expense",
      "income", "expense", "expense", "expense", "income",
    ]);
  });

  it("joins wrapped description lines without inventing truncated content", () => {
    const [row] = parseBankTransactionListOcr(textResult(
      "06/09/2026\nMBVCB.15925281463.6249BFTVGLA -132,000 VND\nAH9YN.NGO PHI LIT chuyen tien.C...",
    ));

    expect(row.description).toBe(
      "MBVCB.15925281463.6249BFTVGLA AH9YN.NGO PHI LIT chuyen tien.C...",
    );
    expect(row.amount).toBe(132000);
    expect(row.direction).toBe("expense");
  });

  it("parses plus as income for the bank-list source", () => {
    const [row] = parseBankTransactionListOcr(textResult(
      "04/09/2026\nEcom.MOMO.CashOut... +135,000 VND",
    ));

    expect(row.amount).toBe(135000);
    expect(row.direction).toBe("income");
    expect(row.isRefund).toBe(false);
    expect(row.selected).toBe(true);
  });

  it("normalizes OCR whitespace and VND thousands separators", () => {
    const [row] = parseBankTransactionListOcr(textResult(
      " 05 / 09 / 2026 \n  Cua hang   ABC     - 1,500,000   VND  ",
    ));

    expect(row.txnDate).toBe("2026-09-05");
    expect(row.description).toBe("Cua hang ABC");
    expect(row.amount).toBe(1500000);
  });

  it("keeps a visible partial transaction editable when amount is missing", () => {
    const [row] = parseBankTransactionListOcr(textResult(
      "03/09/2026\nPARTNER.DIRECT_DEBITS_VC\nPARTIAL CONTENT...",
    ));

    expect(row.description).toBe("PARTNER.DIRECT_DEBITS_VC PARTIAL CONTENT...");
    expect(row.amount).toBe(0);
    expect(row.reviewFields).toEqual(expect.arrayContaining(["amount", "direction"]));
  });

  it("leaves an invalid OCR date blank for review instead of guessing", () => {
    const [row] = parseBankTransactionListOcr(textResult(
      "31/02/2026\nVisible transfer -76,000 VND",
    ));

    expect(row.txnDate).toBe("");
    expect(row.reviewFields).toContain("txnDate");
  });

  it("inherits the group date for adjacent transaction rows", () => {
    const rows = parseBankTransactionListOcr(textResult(
      "06/09/2026\nFirst merchant -76,000 VND\nSecond merchant -15,000 VND",
    ));

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.description)).toEqual(["First merchant", "Second merchant"]);
    expect(rows.map((row) => row.txnDate)).toEqual(["2026-09-06", "2026-09-06"]);
    expect(rows.every((row) => !row.reviewFields.includes("txnDate"))).toBe(true);
  });

  it("applies each dated screenshot header to every row until the next header", () => {
    const rows = parseBankTransactionListOcr(textResult([
      "03/09/2026 - Thu Nam",
      "PHAN THI MINH THUONG -555,000 VND",
      "NGO THI NGOC MINH -100,000 VND",
      "01/09/2026 - Thu Ba",
      "NGUYEN TRUNG HIEU -8,000 VND",
      "NGUYEN DINH CHUONG -3,963,000 VND",
    ].join("\n")));

    expect(rows.map((row) => row.txnDate)).toEqual([
      "2026-09-03",
      "2026-09-03",
      "2026-09-01",
      "2026-09-01",
    ]);
    expect(rows.every((row) => !row.reviewFields.includes("txnDate"))).toBe(true);
  });

  it("does not create transactions from header text or unrelated numbers", () => {
    const rows = parseBankTransactionListOcr(textResult(
      "21:31\nTài khoản thanh toán\nSố tài khoản 02710010\nHotline +84901234567",
    ));
    expect(rows).toEqual([]);
  });

  it("routes only the new image kind to the bank-list parser", () => {
    const bankRows = parseImageImportOcr(
      textResult("04/09/2026\nIncoming +135,000 VND"),
      "bank",
      "bank_transaction_list",
    );
    const statementRows = parseImageImportOcr(
      textResult("04/09/2026\nIncoming +135,000"),
      "statement",
      "statement",
      new Date("2026-09-08T00:00:00Z"),
    );

    expect(bankRows[0]).toMatchObject({ direction: "income", isRefund: false, selected: true });
    expect(statementRows[0]).toMatchObject({ direction: "expense", isRefund: true, selected: false });
  });
});

describe("image import classification integration", () => {
  function draft(overrides: Partial<ImageImportDraft>): ImageImportDraft {
    return {
      id: "draft",
      imageId: "image",
      txnDate: "2026-09-06",
      description: "Merchant",
      amount: 1000,
      note: "",
      direction: "expense",
      isRefund: false,
      categoryId: "",
      tagIds: [],
      reviewFields: [],
      selected: true,
      ...overrides,
    };
  }

  it("applies the existing category and tag match to OCR expenses", () => {
    const [classified] = applyClassificationMatches(
      [draft({})],
      [{ key: "draft", ruleId: "rule", categoryId: "food", tagId: "daily" }],
    );
    expect(classified).toMatchObject({ categoryId: "food", tagIds: ["daily"] });
  });

  it("preserves user tags and does not apply expense rules to OCR income", () => {
    const [expense, income] = applyClassificationMatches(
      [draft({ tagIds: ["user"] }), draft({ id: "income", direction: "income" })],
      [
        { key: "draft", ruleId: "rule", categoryId: "food", tagId: "automatic" },
        { key: "income", ruleId: "rule", categoryId: "food", tagId: "automatic" },
      ],
    );
    expect(expense.tagIds).toEqual(["user"]);
    expect(income).toMatchObject({ categoryId: "", tagIds: [] });
  });
});
