import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import SunCalc from "https://esm.sh/suncalc@1.9.0?target=deno";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate_limit.ts";
import { getAllowedOrigin, getClientIp } from "../_shared/security.ts";
import {
  slotIsFlyable,
  normalizeCriteria,
} from "../_shared/weather-logic.ts";
import type { WeatherSlot } from "../_shared/weather-logic.ts";

type ManagePayload = {
  action?: string;
  subscription_id?: string;
  rule_id?: string;
};

const fetchWeatherSlots = async (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  hourFrom: number,
  hourTo: number,
): Promise<WeatherSlot[]> => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "hourly",
    "temperature_2m,cloud_cover,wind_speed_10m,wind_gusts_10m,precipitation_probability",
  );
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("timeformat", "iso8601");
  url.searchParams.set("timezone", "UTC");
  url.searchParams.set("windspeed_unit", "kmh");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Weather API error ${res.status}`);
  const data = await res.json();
  const hourly = data?.hourly;
  if (!hourly?.time?.length) return [];

  return hourly.time
    .map((time: string, index: number) => {
      const hour = Number(time.slice(11, 13));
      if (Number.isNaN(hour) || hour < hourFrom || hour > hourTo) return null;
      const trimmed = time.trim();
      const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(trimmed);
      const slotDate = new Date(hasTimezone ? trimmed : `${trimmed}Z`);
      if (Number.isNaN(slotDate.getTime())) return null;
      const sunAlt = SunCalc
        ? (SunCalc.getPosition(slotDate, lat, lon)?.altitude ?? null) * (180 / Math.PI)
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

const parseJson = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return null;
  }
};

Deno.serve(async (req) => {
  const origin = getAllowedOrigin(req);
  if (!origin) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const originCorsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: originCorsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp, 30, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        ...originCorsHeaders,
        "Content-Type": "application/json",
        "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString(),
      },
    });
  }

  const body = (await parseJson(req)) as ManagePayload | null;
  const action = body?.action?.trim();
  const subscriptionId = body?.subscription_id?.trim();

  if (!subscriptionId) {
    return new Response(JSON.stringify({ error: "Missing subscription_id" }), {
      status: 400,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!action || !["list", "delete", "refresh"].includes(action)) {
    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SB_URL");
  const serviceKey = Deno.env.get("SB_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
      status: 500,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  if (action === "list") {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("rules")
      .select("id, lat, lon, start_date, end_date, hour_from, hour_to, criteria, notify_on, expires_at, last_checked_at, created_at, weather_summary")
      .eq("subscription_id", subscriptionId)
      .gt("expires_at", now)
      .order("start_date", { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: "Failed to list rules" }), {
        status: 500,
        headers: { ...originCorsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, rules: data || [] }), {
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "delete") {
    const ruleId = body?.rule_id?.trim();
    if (!ruleId) {
      return new Response(JSON.stringify({ error: "Missing rule_id" }), {
        status: 400,
        headers: { ...originCorsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("rules")
      .delete()
      .eq("id", ruleId)
      .eq("subscription_id", subscriptionId);

    if (error) {
      return new Response(JSON.stringify({ error: "Failed to delete rule" }), {
        status: 500,
        headers: { ...originCorsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "refresh") {
    const now = new Date().toISOString();
    const { data: rules, error } = await supabase
      .from("rules")
      .select("id, lat, lon, start_date, end_date, hour_from, hour_to, criteria, notify_on, expires_at, last_checked_at, created_at, weather_summary")
      .eq("subscription_id", subscriptionId)
      .gt("expires_at", now)
      .order("start_date", { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: "Failed to list rules" }), {
        status: 500,
        headers: { ...originCorsHeaders, "Content-Type": "application/json" },
      });
    }

    const weatherCache = new Map<string, Promise<WeatherSlot[]>>();
    const updates: Promise<unknown>[] = [];

    for (const rule of (rules || [])) {
      const criteriaRaw = rule.criteria ?? {};
      const criteria = normalizeCriteria(criteriaRaw);
      const ruleType = (criteriaRaw as { ruleType?: string }).ruleType === "future" ? "future" : "standard";
      const hourFrom = rule.hour_from ?? 0;
      const hourTo = rule.hour_to ?? 23;
      const prevFlyable = typeof rule.weather_summary?.flyableCount === "number"
        ? rule.weather_summary.flyableCount as number
        : null;

      let status = "no-fly";
      let percent = 0;
      let flyableCount = 0;
      let totalCount = 0;

      try {
        const cacheKey = [rule.lat, rule.lon, rule.start_date, rule.end_date, hourFrom, hourTo].join("|");
        let slotsPromise = weatherCache.get(cacheKey);
        if (!slotsPromise) {
          slotsPromise = fetchWeatherSlots(rule.lat, rule.lon, rule.start_date, rule.end_date, hourFrom, hourTo);
          weatherCache.set(cacheKey, slotsPromise);
        }
        const slots = await slotsPromise;

        const relevantSlots = slots.filter((slot) => {
          if (criteria.includeNightFlights) return true;
          if (slot.sunAlt === null || slot.sunAlt === undefined) return true;
          return slot.sunAlt >= criteria.minSunAltitude && slot.sunAlt <= criteria.maxSunAltitude;
        });
        const flyableSlots = relevantSlots.filter((slot) => slotIsFlyable(slot, criteria));

        flyableCount = flyableSlots.length;
        totalCount = relevantSlots.length;
        percent = totalCount > 0 ? Math.round((flyableCount / totalCount) * 100) : 0;

        if (ruleType === "future" && totalCount === 0) {
          status = "awaiting-forecast";
        } else if (flyableCount === 0) {
          status = "no-fly";
        } else if (flyableCount === totalCount) {
          status = "fly";
        } else {
          status = "risk";
        }
      } catch {
        status = "no-data";
      }

      const weatherSummary = { status, percent, flyableCount, totalCount, prevFlyableCount: prevFlyable };
      rule.weather_summary = weatherSummary;

      updates.push(
        supabase
          .from("rules")
          .update({ weather_summary: weatherSummary })
          .eq("id", rule.id),
      );
    }

    await Promise.all(updates);

    return new Response(JSON.stringify({ ok: true, rules: rules || [] }), {
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { ...originCorsHeaders, "Content-Type": "application/json" },
  });
});
