import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import webPush from "npm:web-push@3.6.7";
import SunCalc from "https://esm.sh/suncalc@1.9.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";
import {
  DEFAULT_CRITERIA,
  slotIsFlyable,
  calculateSlotRisk,
  normalizeCriteria,
  normalizeBasePath,
  shouldSkipCheck,
} from "../_shared/weather-logic.ts";
import type { WeatherSlot } from "../_shared/weather-logic.ts";

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
  last_checked_at: string | null;
  weather_summary?: Record<string, unknown> | null;
  subscriptions?: {
    endpoint: string;
    p256dh: string;
    auth: string;
    disabled_at: string | null;
  } | null;
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





const createLimiter = (maxConcurrency: number) => {
  let active = 0;
  const queue: Array<() => void> = [];
  const next = () => {
    if (active >= maxConcurrency || queue.length === 0) return;
    const task = queue.shift();
    if (task) task();
  };
  return async <T>(task: () => Promise<T>) => {
    return await new Promise<T>((resolve, reject) => {
      const run = () => {
        active += 1;
        task()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            active -= 1;
            next();
          });
      };
      queue.push(run);
      next();
    });
  };
};

const fetchWeatherSlots = async (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  hourFrom: number,
  hourTo: number,
): Promise<WeatherSlot[]> => {
  const parseOpenMeteoTime = (time: string): Date | null => {
    const trimmed = time.trim();
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) return null;
    const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(trimmed);
    const date = new Date(hasTimezone ? trimmed : `${trimmed}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const openMeteoModels = Deno.env.get("OPEN_METEO_MODELS") ?? "best_match";
  const timezone = "UTC";
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
  url.searchParams.set("timeformat", "iso8601");
  url.searchParams.set("timezone", timezone);
  url.searchParams.set("windspeed_unit", "kmh");
  url.searchParams.set("models", openMeteoModels);

  console.info(
    JSON.stringify({
      provider: "open-meteo",
      endpoint: "/v1/forecast",
      models: openMeteoModels,
      latitude: lat,
      longitude: lon,
      start_date: startDate,
      end_date: endDate,
      timezone,
    }),
  );
  console.info(
    JSON.stringify({
      provider: "open-meteo",
      event: "request_url",
      url: url.toString(),
    }),
  );

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Weather API error ${res.status}`);
  const data = await res.json();
  if (data?.timezone || data?.hourly_units || data?.generationtime_ms) {
    console.info(
      JSON.stringify({
        provider: "open-meteo",
        event: "response_metadata",
        timezone: data?.timezone,
        hourly_units: data?.hourly_units,
        generationtime_ms: data?.generationtime_ms,
      }),
    );
  }
  const hourly = data?.hourly;
  if (!hourly?.time?.length) return [];

  return hourly.time
    .map((time: string, index: number) => {
      const hour = Number(time.slice(11, 13));
      if (Number.isNaN(hour) || hour < hourFrom || hour > hourTo) return null;
      const slotDate = parseOpenMeteoTime(time);
      if (!slotDate) return null;
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
    .filter((slot: WeatherSlot | null): slot is WeatherSlot => slot !== null);
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
  const weatherLimiter = createLimiter(4);
  const ruleLimiter = createLimiter(5);
  const weatherCache = new Map<string, Promise<WeatherSlot[]>>();
  const getWeatherSlots = (
    lat: number,
    lon: number,
    startDate: string,
    endDate: string,
    hourFrom: number,
    hourTo: number,
  ) => {
    const key = [lat, lon, startDate, endDate, hourFrom, hourTo].join("|");
    const cached = weatherCache.get(key);
    if (cached) return cached;
    const request = weatherLimiter(() =>
      fetchWeatherSlots(lat, lon, startDate, endDate, hourFrom, hourTo),
    );
    weatherCache.set(key, request);
    return request;
  };

  // Auto-cleanup: delete all expired rules
  const { error: cleanupError } = await supabase
    .from("rules")
    .delete()
    .lt("expires_at", nowIso);
  if (cleanupError) {
    console.warn("Cleanup of expired rules failed", cleanupError);
  }

  const { data: rules, error } = await supabase
    .from("rules")
    .select(
      "id, subscription_id, lat, lon, start_date, end_date, hour_from, hour_to, criteria, notify_on, expires_at, last_state_hash, last_checked_at, weather_summary, subscriptions (endpoint, p256dh, auth, disabled_at)",
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

  const processRule = async (rule: RuleRecord) => {
    const subscription = rule.subscriptions;
    if (!subscription || subscription.disabled_at) return;
    if (rule.notify_on === "disabled") return;

    if (shouldSkipCheck(rule.last_checked_at, rule.start_date)) {
      return; // Skip — checked recently enough for this date proximity
    }

    const criteriaRaw = rule.criteria ?? {};
    const criteria = normalizeCriteria(criteriaRaw);
    const appBasePath = normalizeBasePath(
      (criteriaRaw as { appBasePath?: unknown }).appBasePath,
    );
    const locationName =
      typeof (criteriaRaw as { locationName?: unknown }).locationName === "string"
        ? ((criteriaRaw as { locationName: string }).locationName).trim()
        : "";
    const ruleType =
      (criteriaRaw as { ruleType?: string }).ruleType === "future" ? "future" : "standard";
    const hourFrom = rule.hour_from ?? 0;
    const hourTo = rule.hour_to ?? 23;

    let status = "no-fly";
    let percent = 0;
    let riskScore = 0;
    let relevantSlots: WeatherSlot[] = [];
    let flyableSlots: WeatherSlot[] = [];

    try {
      const slots = await getWeatherSlots(
        rule.lat,
        rule.lon,
        rule.start_date,
        rule.end_date,
        hourFrom,
        hourTo,
      );
      relevantSlots = slots.filter((slot) => {
        if (criteria.includeNightFlights) return true;
        if (slot.sunAlt === null || slot.sunAlt === undefined) return true;
        return (
          slot.sunAlt >= criteria.minSunAltitude &&
          slot.sunAlt <= criteria.maxSunAltitude
        );
      });
      flyableSlots = relevantSlots.filter((slot) =>
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

    // Guard clause: future rules with no forecast data yet — skip notification, just update check time
    if (ruleType === "future" && relevantSlots.length === 0 && status !== "no-data") {
      updates.push(
        supabase
          .from("rules")
          .update({
            last_checked_at: new Date().toISOString(),
            weather_summary: { status: "awaiting-forecast", percent: 0, flyableCount: 0, totalCount: 0, prevFlyableCount: null },
          })
          .eq("id", rule.id),
      );
      results.push({
        rule_id: rule.id,
        status: "awaiting-forecast",
        percent: 0,
        state_changed: false,
      });
      return;
    }

    // Hash is based on which specific hours are flyable/not-flyable.
    // This ensures notifications only fire when hours actually open or close,
    // not on minor weather value fluctuations within thresholds.
    const stateHash = await toHash(
      JSON.stringify(
        relevantSlots.map((slot) => ({
          t: slot.time,
          f: slotIsFlyable(slot, criteria),
        })),
      ),
    );

    // Detect "entered forecast range" — future rule that just got its first real data
    const isEnteringForecast =
      rule.last_state_hash === "__awaiting_forecast__" && relevantSlots.length > 0;

    const stateChanged = stateHash !== rule.last_state_hash;
    const shouldNotify =
      isEnteringForecast ||
      rule.notify_on === "always" ||
      (stateChanged && rule.notify_on !== "disabled");

    if (shouldNotify && subscription?.endpoint) {
      const dayQuery = encodeURIComponent(rule.start_date);
      const url = `${appBasePath}/?${DAY_QUERY_PARAM}=${dayQuery}`;

      const formatDate = (d: string) => {
        const [y, m, dd] = d.split("-");
        return `${dd}/${m}`;
      };
      const dateLabel = rule.start_date === rule.end_date
        ? formatDate(rule.start_date)
        : `${formatDate(rule.start_date)}–${formatDate(rule.end_date)}`;

      // Build flyable hours string from actual slot times
      const flyableHours = flyableSlots
        .map((s) => s.time.slice(11, 16))
        .filter(Boolean);
      const flyableRange = flyableHours.length > 0
        ? `${flyableHours[0]}–${flyableHours[flyableHours.length - 1]}`
        : "";

      const locationPrefix = locationName ? `${locationName} — ` : "";
      let title: string;
      let body: string;

      if (isEnteringForecast) {
        // Special "forecast now available" notification
        if (flyableSlots.length > 0) {
          title = `🟢 ${locationPrefix}תחזית זמינה — ${dateLabel}`;
          body = `התאריך נכנס לטווח התחזית! שעות מתאימות: ${flyableRange}`;
        } else {
          title = `🔴 ${locationPrefix}תחזית זמינה — ${dateLabel}`;
          body = "התאריך נכנס לטווח התחזית. אין שעות מתאימות.";
        }
      } else if (status === "fly") {
        title = `🟢 ${locationPrefix}מתאים לטיסה — ${dateLabel}`;
        body = `התחזית השתנתה. שעות טיסה מתאימות: ${flyableRange}`;
      } else if (status === "risk") {
        title = `🟠 ${locationPrefix}שינוי בתחזית — ${dateLabel}`;
        body = `חלק מהשעות מתאימות לטיסה: ${flyableRange}`;
      } else if (status === "no-fly") {
        title = `🔴 ${locationPrefix}לא מתאים לטיסה — ${dateLabel}`;
        body = "התחזית השתנתה. אין שעות מתאימות לטיסה ביום זה.";
      } else {
        title = `${locationPrefix}עדכון תחזית — ${dateLabel}`;
        body = "לא הצלחנו לקבל תחזית עדכנית. נסה שוב מאוחר יותר.";
      }

      const tag = `rule-${rule.id}`;
      const payload = { title, body, tag, url, icon: "icons/notification-icon.png" };
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

    // Transition future rule to standard after first real data check
    const updatedCriteria = isEnteringForecast
      ? { ...criteriaRaw, ruleType: "standard" }
      : undefined;

    const prevFlyable = typeof rule.weather_summary?.flyableCount === "number"
      ? rule.weather_summary.flyableCount as number
      : null;

    const weatherSummary = {
      status,
      percent,
      flyableCount: flyableSlots.length,
      totalCount: relevantSlots.length,
      prevFlyableCount: prevFlyable,
    };

    updates.push(
      supabase
        .from("rules")
        .update({
          last_state_hash: stateHash,
          last_checked_at: new Date().toISOString(),
          weather_summary: weatherSummary,
          ...(updatedCriteria ? { criteria: updatedCriteria } : {}),
        })
        .eq("id", rule.id),
    );

    results.push({
      rule_id: rule.id,
      status,
      percent,
      state_changed: stateChanged,
    });
  };

  await Promise.all(
    ((rules || []) as RuleRecord[]).map((rule) => ruleLimiter(() => processRule(rule))),
  );

  if (updates.length) {
    await Promise.all(updates);
  }

  return new Response(JSON.stringify({ ok: true, checked_at: nowIso, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
