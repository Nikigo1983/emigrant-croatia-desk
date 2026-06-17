-- Поля для импорта из Google Sheets / Formgrid (только админка, не в cases_client_public).

alter table public.cases
  add column if not exists initial_password text,
  add column if not exists formgrid_row_key text;

create unique index if not exists cases_formgrid_row_key_unique
  on public.cases (formgrid_row_key)
  where formgrid_row_key is not null;

comment on column public.cases.initial_password is
  'Временный пароль для ручной передачи клиенту (видит только админ).';
comment on column public.cases.formgrid_row_key is
  'Ключ строки Google Sheets, чтобы не импортировать дважды.';
