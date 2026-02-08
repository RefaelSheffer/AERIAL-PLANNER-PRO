import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate_limit.ts";
import { getAllowedOrigin, getClientIp } from "../_shared/security.ts";

type RulePayload = {
  lat?: number;
  lon?: number;
  start_date?: string;
  end_date?: string;
  hour_from?: number;
  hour_to?: number;
  criteria?: Record<string, unknown>;
  notify_on?: string;
};

type UpsertPayload = {
  subscription_id?: string;
  rule?: RulePayload;
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

const parseJson = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return null;
  }
};

const parseDateOnly = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const clampNumber = (value: unknown, fallback: number) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
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
  const rateLimit = checkRateLimit(clientIp, 40, 5 * 60 * 1000);
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

  const body = (await parseJson(req)) as UpsertPayload | null;
  const subscriptionId = body?.subscription_id?.trim();
  const rule = body?.rule;

  if (!subscriptionId || !rule) {
    return new Response(JSON.stringify({ error: "Missing rule payload" }), {
      status: 400,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const lat = clampNumber(rule.lat, NaN);
  const lon = clampNumber(rule.lon, NaN);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return new Response(JSON.stringify({ error: "Invalid latitude" }), {
      status: 400,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return new Response(JSON.stringify({ error: "Invalid longitude" }), {
      status: 400,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const startDate = parseDateOnly(rule.start_date);
  const endDate = parseDateOnly(rule.end_date);
  if (!startDate || !endDate) {
    return new Response(JSON.stringify({ error: "Invalid date range" }), {
      status: 400,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }
  const dayDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (dayDiff < 0 || dayDiff > 7) {
    return new Response(JSON.stringify({ error: "Date range too large" }), {
      status: 400,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const hourFrom = Math.max(0, Math.min(23, clampNumber(rule.hour_from, 0)));
  const hourTo = Math.max(0, Math.min(23, clampNumber(rule.hour_to, 23)));
  if (hourFrom > hourTo) {
    return new Response(JSON.stringify({ error: "Invalid hour range" }), {
      status: 400,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const criteriaRaw =
    (rule.criteria && typeof rule.criteria === "object"
      ? rule.criteria
      : {}) as Record<string, unknown>;
  const appBasePathRaw =
    typeof criteriaRaw.appBasePath === "string" ? criteriaRaw.appBasePath.trim() : "";
  const appBasePath =
    appBasePathRaw && appBasePathRaw.startsWith("/")
      ? appBasePathRaw.replace(/\/$/, "")
      : "";
  const locationNameRaw =
    typeof criteriaRaw.locationName === "string"
      ? criteriaRaw.locationName.trim().slice(0, 120)
      : "";
  const ruleTypeRaw =
    typeof criteriaRaw.ruleType === "string" ? criteriaRaw.ruleType : "standard";
  const ruleType = ruleTypeRaw === "future" ? "future" : "standard";

  // Validate future date distance (max 365 days from today)
  if (ruleType === "future") {
    const todayMs = Date.now();
    const startDateMs = startDate.getTime();
    const daysFromNow = Math.floor((startDateMs - todayMs) / (24 * 60 * 60 * 1000));
    if (daysFromNow > 365) {
      return new Response(
        JSON.stringify({ error: "Future date tracking is limited to 365 days from today." }),
        {
          status: 400,
          headers: { ...originCorsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  }

  const criteria = {
    maxWind: clampNumber(criteriaRaw.maxWind, DEFAULT_CRITERIA.maxWind),
    maxGust: clampNumber(criteriaRaw.maxGust, DEFAULT_CRITERIA.maxGust),
    minCloudCover: clampNumber(
      criteriaRaw.minCloudCover,
      DEFAULT_CRITERIA.minCloudCover,
    ),
    maxCloudCover: clampNumber(
      criteriaRaw.maxCloudCover,
      DEFAULT_CRITERIA.maxCloudCover,
    ),
    maxRainProb: clampNumber(
      criteriaRaw.maxRainProb,
      DEFAULT_CRITERIA.maxRainProb,
    ),
    minSunAltitude: clampNumber(
      criteriaRaw.minSunAltitude,
      DEFAULT_CRITERIA.minSunAltitude,
    ),
    maxSunAltitude: clampNumber(
      criteriaRaw.maxSunAltitude,
      DEFAULT_CRITERIA.maxSunAltitude,
    ),
    includeNightFlights: Boolean(criteriaRaw.includeNightFlights),
    appBasePath,
    ...(locationNameRaw ? { locationName: locationNameRaw } : {}),
    ...(ruleType === "future" ? { ruleType: "future" } : {}),
  };

  const notifyOn = typeof rule.notify_on === "string"
    ? rule.notify_on
    : "status_change";
  const allowedNotify = new Set(["status_change", "always", "disabled"]);
  if (!allowedNotify.has(notifyOn)) {
    return new Response(JSON.stringify({ error: "Invalid notify_on value" }), {
      status: 400,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const endDateUtc = parseDateOnly(rule.end_date);
  const expiresAt = endDateUtc
    ? new Date(
        Date.UTC(
          endDateUtc.getUTCFullYear(),
          endDateUtc.getUTCMonth(),
          endDateUtc.getUTCDate(),
          23,
          59,
          59,
        ),
      )
    : null;

  const supabaseUrl = Deno.env.get("SB_URL");
  const serviceKey = Deno.env.get("SB_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
      status: 500,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Enforce max 20 non-expired rules per subscription
  const now = new Date().toISOString();
  const { count: existingCount, error: countError } = await supabase
    .from("rules")
    .select("id", { count: "exact", head: true })
    .eq("subscription_id", subscriptionId)
    .gt("expires_at", now);

  if (!countError && typeof existingCount === "number" && existingCount >= 20) {
    return new Response(
      JSON.stringify({ error: "Maximum of 20 active rules reached. Delete existing rules before adding new ones." }),
      {
        status: 400,
        headers: { ...originCorsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const upsertRow: Record<string, unknown> = {
    subscription_id: subscriptionId,
    lat,
    lon,
    start_date: rule.start_date,
    end_date: rule.end_date,
    hour_from: hourFrom,
    hour_to: hourTo,
    criteria,
    notify_on: notifyOn,
    expires_at: expiresAt?.toISOString(),
  };

  // For future rules, set sentinel hash to prevent premature notifications
  if (ruleType === "future") {
    upsertRow.last_state_hash = "__awaiting_forecast__";
  }

  const { data, error } = await supabase
    .from("rules")
    .upsert(
      upsertRow,
      { onConflict: "subscription_id,lat,lon,start_date,end_date,hour_from,hour_to" },
    )
    .select("id")
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: "Failed to upsert rule" }), {
      status: 500,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, rule_id: data.id }), {
    headers: { ...originCorsHeaders, "Content-Type": "application/json" },
  });
});
