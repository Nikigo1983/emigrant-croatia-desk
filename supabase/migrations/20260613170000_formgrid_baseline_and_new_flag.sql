-- Учёт строк Google Sheets: baseline (уже были) vs imported (создан клиент).
-- Флаг «новый клиент из Formgrid» для админки.

alter table public.cases
  add column if not exists is_new_from_formgrid boolean not null default false;

create table if not exists public.formgrid_row_log (
  row_key text primary key,
  status text not null check (status in ('baseline', 'imported')),
  client_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists formgrid_row_log_status_idx
  on public.formgrid_row_log (status);

comment on table public.formgrid_row_log is
  'Строки Formgrid/Google Sheets: baseline — уже были до подключения, imported — создан клиент.';
comment on column public.cases.is_new_from_formgrid is
  'Новый клиент из Formgrid; админ снимает после обработки.';

alter table public.formgrid_row_log enable row level security;

-- Только service role (admin API) работает с логом; клиентам доступ закрыт.
drop policy if exists "No direct access to formgrid_row_log" on public.formgrid_row_log;
create policy "No direct access to formgrid_row_log"
  on public.formgrid_row_log
  for all
  to authenticated
  using (false);
