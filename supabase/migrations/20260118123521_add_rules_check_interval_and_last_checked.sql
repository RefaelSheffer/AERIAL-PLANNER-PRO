alter table public.rules
  add column if not exists check_interval_minutes int not null default 60,
  add column if not exists last_checked_at timestamptz null;
