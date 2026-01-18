"use strict";

// Local-only overrides (copy to env.local.js and update as needed).
// Do not commit secrets (service role keys).
window.APP_ENV = {
  SUPABASE_URL: "https://wpmxaadzsxxyyhhpsywf.supabase.co",
  SUPABASE_FUNCTIONS_URL:
    "https://wpmxaadzsxxyyhhpsywf.supabase.co/functions/v1",
  SUPABASE_ANON_KEY: "REPLACE_WITH_PUBLIC_ANON_KEY",
  VAPID_PUBLIC_KEY: "REPLACE_WITH_PUBLIC_VAPID_KEY",
  APP_BASE_PATH: "",
  APP_ORIGIN: "http://localhost:8080",
};

window.AERIAL_PLANNER_ENV = window.APP_ENV;
window.SUPABASE_URL = window.APP_ENV.SUPABASE_URL;
window.SUPABASE_FUNCTIONS_URL = window.APP_ENV.SUPABASE_FUNCTIONS_URL;
window.SUPABASE_ANON_KEY = window.APP_ENV.SUPABASE_ANON_KEY;
window.VAPID_PUBLIC_KEY = window.APP_ENV.VAPID_PUBLIC_KEY;
window.APP_BASE_PATH = window.APP_ENV.APP_BASE_PATH;
window.APP_ORIGIN = window.APP_ENV.APP_ORIGIN;
