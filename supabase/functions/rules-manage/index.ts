import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate_limit.ts";
import { getAllowedOrigin, getClientIp } from "../_shared/security.ts";

type ManagePayload = {
  action?: string;
  subscription_id?: string;
  rule_id?: string;
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

  if (!action || !["list", "delete"].includes(action)) {
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
      .select("id, lat, lon, start_date, end_date, hour_from, hour_to, criteria, notify_on, expires_at, last_checked_at, created_at")
      .eq("subscription_id", subscriptionId)
      .gt("expires_at", now)
      .order("created_at", { ascending: false });

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

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { ...originCorsHeaders, "Content-Type": "application/json" },
  });
});
