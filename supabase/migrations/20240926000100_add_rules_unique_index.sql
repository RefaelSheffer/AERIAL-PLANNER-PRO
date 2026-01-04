create unique index if not exists rules_subscription_window_unique
  on public.rules (
    subscription_id,
    lat,
    lon,
    start_date,
    end_date,
    hour_from,
    hour_to
  );
