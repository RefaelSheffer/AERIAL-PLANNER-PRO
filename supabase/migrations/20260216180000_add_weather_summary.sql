ALTER TABLE public.rules
  ADD COLUMN IF NOT EXISTS weather_summary jsonb NULL;
