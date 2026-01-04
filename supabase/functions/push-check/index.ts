import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import webPush from "https://esm.sh/web-push@3.6.7?target=deno";
import SunCalc from "https://esm.sh/suncalc@1.9.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";

type RuleRecord = {
  id: string;
  subscription_id: string;
  lat: number;
  lon: number;
  start_date: string;
  end_date: string;
  hour_from: number | null;
  hour_to: number | null;
  criteria: Record<string, unknown> | null;
  notify_on: string | null;
  expires_at: string | null;
  last_state_hash: string | null;
  subscriptions?: {
    endpoint: string;
    p256dh: string;
    auth: string;
    disabled_at: string | null;
  } | null;
};

const DEFAULT_CRITERIA = {
  maxWind: 20,
  maxGust: 25,
  minCloudCover: 0,
  maxCloudCover: 100,
  maxRainProb: 40,
  minSunAltitude: 5,
  maxSunAltitude: 85,
  includeNightFlights: false,
};
const DAY_QUERY_PARAM = "day";

const parseJson = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return null;
  }
};

const toHash = async (input: string) => {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const slotIsFlyable = (
  slot: {
    wind: number | null;
    gust: number | null;
    clouds: number | null;
    rainProb: number | null;
    sunAlt: number | null;
  },
  criteria: typeof DEFAULT_CRITERIA,
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

const calculateSlotRisk = (
  slot: {
    wind: number | null;
    gust: number | null;
    rainProb: number | null;
    sunAlt: number | null;
  },
  criteria: typeof DEFAULT_CRITERIA,
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

const normalizeCriteria = (criteria: Record<string, unknown> | null) => {
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

const normalizeBasePath = (value: unknown) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return "";
  return trimmed.replace(/\/$/, "");
};

const fetchWeatherSlots = async (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  hourFrom: number,
  hourTo: number,
) => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "cloud_cover",
      "wind_speed_10m",
      "wind_gusts_10m",
      "precipitation_probability",
    ].join(","),
  );
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("timezone", "UTC");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Weather API error ${res.status}`);
  const data = await res.json();
  const hourly = data?.hourly;
  if (!hourly?.time?.length) return [];

  return hourly.time
    .map((time: string, index: number) => {
      const hour = Number(time.slice(11, 13));
      if (Number.isNaN(hour) || hour < hourFrom || hour > hourTo) return null;
      const slotDate = new Date(`${time}Z`);
      const sunAlt =
        slotDate && SunCalc
          ? (SunCalc.getPosition(slotDate, lat, lon)?.altitude ?? null) *
            (180 / Math.PI)
          : null;
      return {
        time,
        wind: hourly.wind_speed_10m?.[index] ?? null,
        gust: hourly.wind_gusts_10m?.[index] ?? null,
        clouds: hourly.cloud_cover?.[index] ?? null,
        rainProb: hourly.precipitation_probability?.[index] ?? null,
        sunAlt: Number.isFinite(sunAlt) ? sunAlt : null,
      };
    })
    .filter((slot: unknown) => slot !== null);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const incomingSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== incomingSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await parseJson(req);

  const supabaseUrl = Deno.env.get("SB_URL");
  const serviceKey = Deno.env.get("SB_SERVICE_ROLE_KEY");
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!supabaseUrl || !serviceKey || !vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: "Missing configuration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  webPush.setVapidDetails(
    "mailto:ops@aerialplanner.local",
    vapidPublicKey,
    vapidPrivateKey,
  );

  const supabase = createClient(supabaseUrl, serviceKey);
  const nowIso = new Date().toISOString();

  const { data: rules, error } = await supabase
    .from("rules")
    .select(
      "id, subscription_id, lat, lon, start_date, end_date, hour_from, hour_to, criteria, notify_on, expires_at, last_state_hash, subscriptions (endpoint, p256dh, auth, disabled_at)",
    )
    .gt("expires_at", nowIso);

  if (error) {
    return new Response(JSON.stringify({ error: "Failed to load rules" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const updates: Promise<unknown>[] = [];
  const results = [];

  for (const rule of (rules || []) as RuleRecord[]) {
    const subscription = rule.subscriptions;
    if (!subscription || subscription.disabled_at) continue;
    if (rule.notify_on === "disabled") continue;

    const criteriaRaw = rule.criteria ?? {};
    const criteria = normalizeCriteria(criteriaRaw);
    const appBasePath = normalizeBasePath(
      (criteriaRaw as { appBasePath?: unknown }).appBasePath,
    );
    const hourFrom = rule.hour_from ?? 0;
    const hourTo = rule.hour_to ?? 23;

    let status = "no-fly";
    let percent = 0;
    let riskScore = 0;

    try {
      const slots = await fetchWeatherSlots(
        rule.lat,
        rule.lon,
        rule.start_date,
        rule.end_date,
        hourFrom,
        hourTo,
      );
      const relevantSlots = slots.filter((slot) => {
        if (criteria.includeNightFlights) return true;
        if (slot.sunAlt === null || slot.sunAlt === undefined) return true;
        return (
          slot.sunAlt >= criteria.minSunAltitude &&
          slot.sunAlt <= criteria.maxSunAltitude
        );
      });
      const flyableSlots = relevantSlots.filter((slot) =>
        slotIsFlyable(slot, criteria)
      );
      percent =
        relevantSlots.length > 0
          ? Math.round((flyableSlots.length / relevantSlots.length) * 100)
          : 0;
      riskScore =
        relevantSlots.length > 0
          ? relevantSlots.reduce(
              (total, slot) => total + calculateSlotRisk(slot, criteria),
              0,
            ) / relevantSlots.length
          : 0;

      if (flyableSlots.length === 0) {
        status = "no-fly";
      } else if (flyableSlots.length === relevantSlots.length) {
        status = "fly";
      } else {
        status = "risk";
      }
    } catch (err) {
      console.warn("Weather evaluation failed", err);
      status = "no-data";
    }

    const stateHash = await toHash(
      JSON.stringify({
        status,
        percent,
        riskScore: Number(riskScore.toFixed(2)),
        dateRange: `${rule.start_date}:${rule.end_date}`,
      }),
    );

    const stateChanged = stateHash !== rule.last_state_hash;
    const shouldNotify =
      rule.notify_on === "always" || (stateChanged && rule.notify_on !== "disabled");

    if (shouldNotify && subscription?.endpoint) {
      const dayQuery = encodeURIComponent(rule.start_date);
      const url = `${appBasePath}/?${DAY_QUERY_PARAM}=${dayQuery}`;
      const payload = {
        title: "עדכון תחזית לטיסה",
        body:
          status === "fly"
            ? "נפתח חלון טיסה יציב לתאריך שבחרת."
            : status === "risk"
              ? "יש שינוי בסיכון לטיסה בתאריך שבחרת."
              : status === "no-fly"
                ? "התנאים אינם מתאימים לטיסה בתאריך שבחרת."
                : "לא הצלחנו לחשב תחזית מדויקת כרגע.",
        url,
      };
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          updates.push(
            supabase
              .from("subscriptions")
              .update({
                disabled_at: new Date().toISOString(),
                last_error: `Push endpoint gone (${statusCode})`,
                updated_at: new Date().toISOString(),
              })
              .eq("endpoint", subscription.endpoint),
          );
        } else {
          updates.push(
            supabase
              .from("subscriptions")
              .update({
                last_error: `Push send failed: ${err}`,
                updated_at: new Date().toISOString(),
              })
              .eq("endpoint", subscription.endpoint),
          );
        }
      }
    }

    updates.push(
      supabase
        .from("rules")
        .update({
          last_state_hash: stateHash,
          last_checked_at: new Date().toISOString(),
        })
        .eq("id", rule.id),
    );

    results.push({
      rule_id: rule.id,
      status,
      percent,
      state_changed: stateChanged,
    });
  }

  if (updates.length) {
    await Promise.all(updates);
  }

  return new Response(JSON.stringify({ ok: true, checked_at: nowIso, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
