import { describe, expect, it } from "vitest";

import { parseImageImportOcr } from "../../../../src/features/transactions/imageImport/parseImageImportOcr";
import type { ImageOcrResult } from "../../../../src/features/transactions/imageImport/runImageOcr";
import {
  applyImageImportDescriptionPreference,
  IMAGE_IMPORT_KINDS,
  resolveImageImportTypeSettings,
} from "../../../../src/features/transactions/imageImport/types";

describe("image-import type configuration", () => {
  it("keeps all supported types, including TP, when workspace settings are empty", () => {
    const settings = resolveImageImportTypeSettings(undefined, (key) => `default:${key}`);

    expect(settings.map((setting) => setting.type)).toEqual(IMAGE_IMPORT_KINDS);
    expect(settings.find((setting) => setting.type === "tp")).toEqual({
      type: "tp",
      displayName: "default:tpKind",
      sourceId: null,
    });
  });

  it("uses the configured display name and optional money source", () => {
    const settings = resolveImageImportTypeSettings(
      [{ type: "statement", displayName: "Sao kê Visa", sourceId: "source-1" }],
      (key) => `default:${key}`,
    );

    expect(settings[0]).toEqual({
      type: "statement",
      displayName: "Sao kê Visa",
      sourceId: "source-1",
    });
    expect(settings[1].sourceId).toBeNull();
  });
});

describe("TP image parsing", () => {
  it("accepts mobile-bank date headings that include a weekday", () => {
    const result: ImageOcrResult = {
      text: "03/09/2026 - Thứ Năm\nTới: PHAN THI MINH THUONG -555,000 VND",
      numericText: "-555,000",
      lines: [
        {
          text: "03/09/2026 - Thứ Năm",
          confidence: 98,
          bbox: { x0: 0, y0: 0, x1: 300, y1: 20 },
        },
        {
          text: "Tới: PHAN THI MINH THUONG -555,000 VND",
          confidence: 96,
          bbox: { x0: 0, y0: 30, x1: 500, y1: 50 },
        },
      ],
      numericLines: [
        {
          text: "-555,000",
          confidence: 99,
          bbox: { x0: 350, y0: 30, x1: 500, y1: 50 },
        },
      ],
    };

    const drafts = parseImageImportOcr(result, "tp-image", "tp");

    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      imageId: "tp-image",
      txnDate: "2026-09-03",
      amount: 555_000,
      direction: "expense",
    });
  });
});

describe("image-import description preference", () => {
  it("clears OCR descriptions and their review marker when disabled", () => {
    const drafts = parseImageImportOcr({
      text: "03/09/2026 - Thứ Năm\nTới: A -100,000 VND",
      numericText: "-100,000",
      lines: [],
      numericLines: [],
    }, "image-1", "tp");

    const withoutDescriptions = applyImageImportDescriptionPreference(drafts, false);

    expect(withoutDescriptions[0].description).toBe("");
    expect(withoutDescriptions[0].reviewFields).not.toContain("description");
  });
});
