import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SB_URL");
  const serviceKey = Deno.env.get("SB_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, subscription_id: data.id }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
