import { describe, expect, it } from "vitest";
import {
  formatCount,
  formatDate,
  formatInstant,
  formatMoney,
  formatNumber,
  formatPersonDays,
  formatStatus,
} from "@/lib/format";

describe("date-only formatting", () => {
  it.each([
    ["2026-11-02", "2 Nov 2026"],
    ["2026-09-15", "15 Sep 2026"],
    ["2026-01-01", "1 Jan 2026"],
    ["2024-02-29", "29 Feb 2024"],
  ])("formats the UTC calendar date %s", (value, expected) => {
    expect(formatDate(value)).toBe(expected);
  });
});

describe("local instant formatting", () => {
  it("uses the viewer's local calendar and time", () => {
    const instant = new Date(2026, 10, 2, 14, 5, 59).toISOString();
    expect(formatInstant(instant)).toBe("2 Nov 2026, 14:05");
  });
  it("uses a 24-hour clock at local midnight", () => {
    const instant = new Date(2027, 0, 1, 0, 0).toISOString();
    expect(formatInstant(instant)).toBe("1 Jan 2027, 00:00");
  });
  it("interprets explicit offsets as an instant", () => {
    const offsetInstant = "2026-11-02T14:05:00+11:00";
    expect(formatInstant(offsetInstant)).toBe(
      formatInstant("2026-11-02T03:05:00Z"),
    );
  });
});

describe("money formatting", () => {
  it.each([
    [185000, "AUD", "AUD 185,000.00"],
    [0, "AUD", "AUD 0.00"],
    [1234.567, "USD", "USD 1,234.57"],
    [185000, "JPY", "JPY 185,000"],
  ])("formats %s %s with the currency code", (value, currency, expected) => {
    expect(formatMoney(value, currency).replace(/[\u00a0\u202f]/g, " ")).toBe(
      expected,
    );
  });
});

describe("person-days formatting", () => {
  it.each([
    [420, "420.0 person-days"],
    [0, "0.0 person-days"],
    [1234.56, "1,234.6 person-days"],
  ])("formats %s with one decimal place", (value, expected) => {
    expect(formatPersonDays(value)).toBe(expected);
  });
});

describe("count formatting", () => {
  it.each([
    [0, "0"],
    [1, "1"],
    [1234567, "1,234,567"],
    [1234.5, "1,234.5"],
  ])("formats %s in en-US", (value, expected) => {
    expect(formatCount(value)).toBe(expected);
    expect(formatNumber(value)).toBe(expected);
  });
});

describe("existing status labels", () => {
  it.each([
    ["pending", "Pending"],
    ["no-permission", "No permission"],
    ["role_retired", "Role retired"],
    ["", ""],
  ])("preserves the label for %s", (value, expected) => {
    expect(formatStatus(value)).toBe(expected);
  });
});

describe("missing records", () => {
  it.each([
    ["date", () => formatDate(null)],
    ["instant", () => formatInstant(null)],
    ["money amount", () => formatMoney(null, "AUD")],
    ["money currency", () => formatMoney(185000, null)],
    ["person-days", () => formatPersonDays(null)],
    ["count", () => formatCount(null)],
    ["legacy number", () => formatNumber(null)],
    ["status", () => formatStatus(null)],
  ] as const)("shows Not recorded for a null %s", (_name, format) => {
    expect(format()).toBe("Not recorded");
  });
});
