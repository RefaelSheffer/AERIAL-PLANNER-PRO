import { describe, it, expect, vi, afterEach } from "vitest";
import {
  DEFAULT_CRITERIA,
  slotIsFlyable,
  calculateSlotRisk,
  normalizeCriteria,
  normalizeBasePath,
  shouldSkipCheck,
} from "@shared/weather-logic.ts";

const baseCriteria = { ...DEFAULT_CRITERIA };

// ── slotIsFlyable ──────────────────────────────────────────────────

describe("slotIsFlyable", () => {
  it("returns true when all values are within thresholds", () => {
    const slot = { wind: 10, gust: 15, clouds: 50, rainProb: 20, sunAlt: 30 };
    expect(slotIsFlyable(slot, baseCriteria)).toBe(true);
  });

  it("returns false when wind exceeds maxWind", () => {
    const slot = { wind: 25, gust: 15, clouds: 50, rainProb: 20, sunAlt: 30 };
    expect(slotIsFlyable(slot, baseCriteria)).toBe(false);
  });

  it("returns false when gust exceeds maxGust", () => {
    const slot = { wind: 10, gust: 30, clouds: 50, rainProb: 20, sunAlt: 30 };
    expect(slotIsFlyable(slot, baseCriteria)).toBe(false);
  });

  it("returns false when rain exceeds maxRainProb", () => {
    const slot = { wind: 10, gust: 15, clouds: 50, rainProb: 80, sunAlt: 30 };
    expect(slotIsFlyable(slot, baseCriteria)).toBe(false);
  });

  it("returns false when clouds outside min/max range", () => {
    const criteria = { ...baseCriteria, minCloudCover: 20, maxCloudCover: 80 };
    const slot = { wind: 10, gust: 15, clouds: 90, rainProb: 20, sunAlt: 30 };
    expect(slotIsFlyable(slot, criteria)).toBe(false);
  });

  it("returns false when sun below minSunAltitude and includeNightFlights=false", () => {
    const slot = { wind: 10, gust: 15, clouds: 50, rainProb: 20, sunAlt: 2 };
    expect(slotIsFlyable(slot, baseCriteria)).toBe(false);
  });

  it("returns true when sun below minSunAltitude and includeNightFlights=true", () => {
    const criteria = { ...baseCriteria, includeNightFlights: true };
    const slot = { wind: 10, gust: 15, clouds: 50, rainProb: 20, sunAlt: -5 };
    expect(slotIsFlyable(slot, criteria)).toBe(true);
  });

  it("treats null values as safe (flyable)", () => {
    const slot = { wind: null, gust: null, clouds: null, rainProb: null, sunAlt: null };
    expect(slotIsFlyable(slot, baseCriteria)).toBe(true);
  });
});

// ── calculateSlotRisk ──────────────────────────────────────────────

describe("calculateSlotRisk", () => {
  it("returns ~0 for perfect conditions", () => {
    const slot = { wind: 5, gust: 10, rainProb: 5, sunAlt: 30 };
    const risk = calculateSlotRisk(slot, baseCriteria);
    expect(risk).toBeCloseTo(0, 5);
  });

  it("returns > 0 when all values exceed thresholds", () => {
    const slot = { wind: 30, gust: 40, rainProb: 90, sunAlt: 2 };
    const risk = calculateSlotRisk(slot, baseCriteria);
    expect(risk).toBeGreaterThan(0);
  });

  it("returns partial risk when only wind exceeds", () => {
    const slot = { wind: 25, gust: 20, rainProb: 10, sunAlt: 30 };
    const risk = calculateSlotRisk(slot, baseCriteria);
    expect(risk).toBeGreaterThan(0);
    expect(risk).toBeLessThan(1);
  });

  it("returns 0 risk contribution for null values", () => {
    const slot = { wind: null, gust: null, rainProb: null, sunAlt: null };
    const risk = calculateSlotRisk(slot, baseCriteria);
    expect(risk).toBe(0);
  });

  it("returns sunRisk=1 for low sun with includeNightFlights=false", () => {
    const slot = { wind: 5, gust: 10, rainProb: 5, sunAlt: 1 };
    const risk = calculateSlotRisk(slot, baseCriteria);
    // sunRisk = 1, others ≈ 0, so total ≈ 1/4 = 0.25
    expect(risk).toBeCloseTo(0.25, 1);
  });
});

// ── normalizeCriteria ──────────────────────────────────────────────

describe("normalizeCriteria", () => {
  it("returns full DEFAULT_CRITERIA for null input", () => {
    expect(normalizeCriteria(null)).toEqual(DEFAULT_CRITERIA);
  });

  it("fills missing fields with defaults for partial input", () => {
    const result = normalizeCriteria({ maxWind: 15 });
    expect(result.maxWind).toBe(15);
    expect(result.maxGust).toBe(DEFAULT_CRITERIA.maxGust);
    expect(result.maxRainProb).toBe(DEFAULT_CRITERIA.maxRainProb);
  });

  it("preserves all values from valid full input", () => {
    const full = {
      maxWind: 10,
      maxGust: 12,
      minCloudCover: 5,
      maxCloudCover: 80,
      maxRainProb: 30,
      minSunAltitude: 10,
      maxSunAltitude: 70,
      includeNightFlights: true,
    };
    expect(normalizeCriteria(full)).toEqual(full);
  });

  it("falls back to defaults for non-numeric values", () => {
    const result = normalizeCriteria({ maxWind: "abc", maxGust: undefined });
    expect(result.maxWind).toBe(DEFAULT_CRITERIA.maxWind);
    expect(result.maxGust).toBe(DEFAULT_CRITERIA.maxGust);
  });
});

// ── normalizeBasePath ──────────────────────────────────────────────

describe("normalizeBasePath", () => {
  it('preserves valid path "/AERIAL-PLANNER-PRO"', () => {
    expect(normalizeBasePath("/AERIAL-PLANNER-PRO")).toBe("/AERIAL-PLANNER-PRO");
  });

  it("strips trailing slash", () => {
    expect(normalizeBasePath("/AERIAL-PLANNER-PRO/")).toBe("/AERIAL-PLANNER-PRO");
  });

  it('returns "" for non-string input', () => {
    expect(normalizeBasePath(42)).toBe("");
    expect(normalizeBasePath(null)).toBe("");
    expect(normalizeBasePath(undefined)).toBe("");
  });

  it('returns "" for path not starting with "/"', () => {
    expect(normalizeBasePath("no-leading-slash")).toBe("");
  });
});

// ── shouldSkipCheck ────────────────────────────────────────────────

describe("shouldSkipCheck", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should NOT skip when checked 3h ago and start_date is today (6h interval)", () => {
    vi.useFakeTimers();
    const now = new Date("2026-02-13T12:00:00Z");
    vi.setSystemTime(now);

    const threeHoursAgo = new Date("2026-02-13T09:00:00Z").toISOString();
    expect(shouldSkipCheck(threeHoursAgo, "2026-02-13")).toBe(true);
  });

  it("SHOULD skip when checked 3h ago and start_date is 3 days out (12h interval)", () => {
    vi.useFakeTimers();
    const now = new Date("2026-02-13T12:00:00Z");
    vi.setSystemTime(now);

    const threeHoursAgo = new Date("2026-02-13T09:00:00Z").toISOString();
    expect(shouldSkipCheck(threeHoursAgo, "2026-02-16")).toBe(true);
  });

  it("should NOT skip when checked 20h ago and start_date is 3 days out", () => {
    vi.useFakeTimers();
    const now = new Date("2026-02-13T12:00:00Z");
    vi.setSystemTime(now);

    const twentyHoursAgo = new Date("2026-02-12T16:00:00Z").toISOString();
    expect(shouldSkipCheck(twentyHoursAgo, "2026-02-16")).toBe(false);
  });

  it("should NOT skip when lastCheckedAt is null (never checked)", () => {
    expect(shouldSkipCheck(null, "2026-02-13")).toBe(false);
  });
});
