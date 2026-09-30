import { afterEach, describe, expect, it, vi } from "vitest";

import { buildReportingPeriodPreview } from "../../../src/features/settings/utils/reportingPeriodPreview";

describe("buildReportingPeriodPreview", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("labels the active cycle with the ending month in lower-boundary mode", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-29T05:00:00Z"));

    const preview = buildReportingPeriodPreview(1, "lowerBoundary", "vi");

    expect(preview).toEqual({
      year: 2026,
      month: 10,
      start: "01/09/2026",
      end: "01/10/2026",
    });
  });

  it("labels the same active cycle with the starting month in upper-boundary mode", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-29T05:00:00Z"));

    const preview = buildReportingPeriodPreview(1, "upperBoundary", "vi");

    expect(preview).toEqual({
      year: 2026,
      month: 9,
      start: "01/09/2026",
      end: "01/10/2026",
    });
  });
});
