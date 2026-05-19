create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references auth.users(id) on delete cascade,
  current_stage text,
  current_status text,
  status_updated_at timestamptz not null default now(),
  submission_date date,
  submission_city text,
  case_number text,
  consulate text,
  internal_comment text,
  push_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cases enable row level security;

drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at
before update on public.cases
for each row
execute function public.set_updated_at();

drop policy if exists "Client can read own case" on public.cases;
create policy "Client can read own case"
on public.cases
for select
using (auth.uid() = client_id);

drop policy if exists "Admin can read all cases" on public.cases;
create policy "Admin can read all cases"
on public.cases
for select
using (
  exists (
    select 1
    from public.profiles as p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Admin can update all cases" on public.cases;
create policy "Admin can update all cases"
on public.cases
for update
using (
  exists (
    select 1
    from public.profiles as p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles as p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  )
);
