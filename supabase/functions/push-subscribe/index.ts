import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate_limit.ts";
import { getAllowedOrigin, getClientIp } from "../_shared/security.ts";

type PushSubscriptionPayload = {
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
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
  const rateLimit = checkRateLimit(clientIp, 20, 5 * 60 * 1000);
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

  const body = (await parseJson(req)) as PushSubscriptionPayload | null;
  const subscription = body?.subscription;
  const endpoint = subscription?.endpoint?.trim();
  const p256dh = subscription?.keys?.p256dh?.trim();
  const auth = subscription?.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    return new Response(JSON.stringify({ error: "Invalid subscription data" }), {
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

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        endpoint,
        p256dh,
        auth,
        disabled_at: null,
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    )
    .select("id")
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: "Failed to save subscription" }), {
      status: 500,
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, subscription_id: data.id }),
    {
      headers: { ...originCorsHeaders, "Content-Type": "application/json" },
    },
  );
});
