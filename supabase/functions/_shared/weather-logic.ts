export const DEFAULT_CRITERIA = {
  maxWind: 20,
  maxGust: 25,
  minCloudCover: 0,
  maxCloudCover: 100,
  maxRainProb: 40,
  minSunAltitude: 5,
  maxSunAltitude: 85,
  includeNightFlights: false,
};

export type WeatherSlot = {
  time: string;
  wind: number | null;
  gust: number | null;
  clouds: number | null;
  rainProb: number | null;
  sunAlt: number | null;
};

export type Criteria = typeof DEFAULT_CRITERIA;

export const slotIsFlyable = (
  slot: {
    wind: number | null;
    gust: number | null;
    clouds: number | null;
    rainProb: number | null;
    sunAlt: number | null;
  },
  criteria: Criteria,
) => {
  const {
    maxWind,
    maxGust,
    minCloudCover,
    maxCloudCover,
    maxRainProb,
    minSunAltitude,
    maxSunAltitude,
    includeNightFlights,
  } = criteria;
  const safeWind = slot.wind === null ? true : slot.wind <= maxWind;
  const safeGust =
    slot.gust === null
      ? slot.wind === null
        ? true
        : slot.wind <= maxGust
      : slot.gust <= maxGust;
  const safeCloud =
    slot.clouds === null
      ? true
      : slot.clouds >= minCloudCover && slot.clouds <= maxCloudCover;
  const safeRain = slot.rainProb === null ? true : slot.rainProb <= maxRainProb;
  const sunOk = includeNightFlights
    ? true
    : slot.sunAlt === null
      ? true
      : slot.sunAlt >= minSunAltitude && slot.sunAlt <= maxSunAltitude;
  return safeWind && safeGust && safeCloud && safeRain && sunOk;
};

export const calculateSlotRisk = (
  slot: {
    wind: number | null;
    gust: number | null;
    rainProb: number | null;
    sunAlt: number | null;
  },
  criteria: Criteria,
) => {
  const {
    maxWind,
    maxGust,
    maxRainProb,
    minSunAltitude,
    maxSunAltitude,
    includeNightFlights,
  } = criteria;
  const safeDivisor = (value: number, fallback = 1) =>
    typeof value === "number" && value > 0 ? value : fallback;
  const windRisk =
    slot.wind === null ? 0 : Math.max(0, (slot.wind - maxWind) / safeDivisor(maxWind));
  const gust = slot.gust ?? slot.wind;
  const gustRisk =
    gust === null ? 0 : Math.max(0, (gust - maxGust) / safeDivisor(maxGust));
  const rainDenominator = Math.max(1, 100 - maxRainProb);
  const rainRisk =
    slot.rainProb === null
      ? 0
      : Math.max(0, (slot.rainProb - maxRainProb) / rainDenominator);
  const sunRisk = includeNightFlights
    ? 0
    : slot.sunAlt === null
      ? 0
      : slot.sunAlt < minSunAltitude || slot.sunAlt > maxSunAltitude
        ? 1
        : 0;
  return (windRisk + gustRisk + rainRisk + sunRisk) / 4;
};

export const normalizeCriteria = (criteria: Record<string, unknown> | null): Criteria => {
  const toNumber = (value: unknown, fallback: number) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };
  return {
    maxWind: toNumber(criteria?.maxWind, DEFAULT_CRITERIA.maxWind),
    maxGust: toNumber(criteria?.maxGust, DEFAULT_CRITERIA.maxGust),
    minCloudCover: toNumber(
      criteria?.minCloudCover,
      DEFAULT_CRITERIA.minCloudCover,
    ),
    maxCloudCover: toNumber(
      criteria?.maxCloudCover,
      DEFAULT_CRITERIA.maxCloudCover,
    ),
    maxRainProb: toNumber(criteria?.maxRainProb, DEFAULT_CRITERIA.maxRainProb),
    minSunAltitude: toNumber(
      criteria?.minSunAltitude,
      DEFAULT_CRITERIA.minSunAltitude,
    ),
    maxSunAltitude: toNumber(
      criteria?.maxSunAltitude,
      DEFAULT_CRITERIA.maxSunAltitude,
    ),
    includeNightFlights: Boolean(
      criteria?.includeNightFlights ?? DEFAULT_CRITERIA.includeNightFlights,
    ),
  };
};

export const normalizeBasePath = (value: unknown) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return "";
  return trimmed.replace(/\/$/, "");
};

export const shouldSkipCheck = (
  lastCheckedAt: string | null,
  startDate: string,
): boolean => {
  if (!lastCheckedAt) return false;

  const msSinceLastCheck = Date.now() - new Date(lastCheckedAt).getTime();
  const hoursSinceLastCheck = msSinceLastCheck / (1000 * 60 * 60);
  const startDateMs = new Date(startDate + "T00:00:00Z").getTime();
  const daysUntilStart = Math.max(0, (startDateMs - Date.now()) / (1000 * 60 * 60 * 24));

  let minIntervalHours: number;
  if (daysUntilStart <= 1) {
    minIntervalHours = 6;
  } else if (daysUntilStart <= 4) {
    minIntervalHours = 12;
  } else if (daysUntilStart <= 16) {
    minIntervalHours = 24;
  } else {
    minIntervalHours = 48;
  }

  return hoursSinceLastCheck < minIntervalHours;
};
