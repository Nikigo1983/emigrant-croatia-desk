-- Дата первого достижения каждого этапа (ключ = текст статуса из CASE_STATUSES).
alter table public.cases
add column if not exists status_reached_at jsonb not null default '{}'::jsonb;

comment on column public.cases.status_reached_at is
  'Объект { "<статус>": "<ISO>" }; пополняется при смене current_status.';

-- Одна запись для уже существующих дел: текущий этап ~ последнее известное время статуса.
update public.cases
set status_reached_at = jsonb_build_object(
  trim(current_status),
  to_jsonb(coalesce(status_updated_at, created_at))
)
where status_reached_at = '{}'::jsonb
  and current_status is not null
  and length(trim(current_status)) > 0;
