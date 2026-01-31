"use strict";

// Public runtime configuration for the client (safe to commit).
window.APP_ENV = window.APP_ENV || {
  SUPABASE_URL: "https://wpmxaadzsxxyyhhpsywf.supabase.co",
  SUPABASE_FUNCTIONS_URL:
    "https://wpmxaadzsxxyyhhpsywf.supabase.co/functions/v1",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbXhhYWR6c3h4eXloaHBzeXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5ODQxNDcsImV4cCI6MjA4MjU2MDE0N30.6zeMfb6g88E1FYishNZZADrKKAZ8JO2cocrCKynU7XE",
  VAPID_PUBLIC_KEY:
    "BHjXjqBNEHddW4Jx253akku2RLXvaJd9lP0Wz5BDlIA8t4C_XY-0OrrKZDm-Mq6kh2Y9qYLo8n7ivP4tPU-xaO4",
  APP_BASE_PATH: "/AERIAL-PLANNER-PRO",
  APP_ORIGIN: "https://refaelsheffer.github.io",
};

// Backward compatibility for existing config readers.
window.AERIAL_PLANNER_ENV = window.AERIAL_PLANNER_ENV || window.APP_ENV;
window.SUPABASE_URL = window.APP_ENV.SUPABASE_URL;
window.SUPABASE_FUNCTIONS_URL = window.APP_ENV.SUPABASE_FUNCTIONS_URL;
window.SUPABASE_ANON_KEY = window.APP_ENV.SUPABASE_ANON_KEY;
window.VAPID_PUBLIC_KEY = window.APP_ENV.VAPID_PUBLIC_KEY;
window.APP_BASE_PATH = window.APP_ENV.APP_BASE_PATH;
window.APP_ORIGIN = window.APP_ENV.APP_ORIGIN;
