-- Политика "Admin can read all profiles" с EXISTS (SELECT ... FROM profiles)
-- вызывает бесконечную рекурсию RLS на таблице profiles.
-- Решение: проверка роли админа в SECURITY DEFINER-функции (обход RLS внутри функции).

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

drop policy if exists "Admin can read all profiles" on public.profiles;
create policy "Admin can read all profiles"
on public.profiles
for select
using (public.is_admin());

-- Те же EXISTS в policies на cases при чтении profiles снова триггерят RLS на profiles.
drop policy if exists "Admin can read all cases" on public.cases;
create policy "Admin can read all cases"
on public.cases
for select
using (public.is_admin());

drop policy if exists "Admin can update all cases" on public.cases;
create policy "Admin can update all cases"
on public.cases
for update
using (public.is_admin())
with check (public.is_admin());
