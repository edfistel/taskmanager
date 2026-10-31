import { describe, expect, it } from "vitest";

import { formatApiDate, normalizeApiDate } from "./date";

describe("API date helpers", () => {
  it("keeps native date input values unchanged and clears empty values", () => {
    expect(normalizeApiDate("2026-11-02")).toBe("2026-11-02");
    expect(normalizeApiDate("")).toBeNull();
    expect(normalizeApiDate(null)).toBeNull();
  });

  it("formats the calendar day without local timezone conversion", () => {
    expect(formatApiDate("2026-11-02", "pt-BR")).toBe("02/11/2026");
    expect(formatApiDate("2026-11-02T00:00:00.000Z", "pt-BR")).toBe("02/11/2026");
  });

  it("rejects impossible calendar dates", () => {
    expect(normalizeApiDate("2026-02-30")).toBeNull();
  });
});
