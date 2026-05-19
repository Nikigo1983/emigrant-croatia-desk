-- Общий доступ всех администраторов к клиентам: в данных нет «владельца»/создателя,
-- любой пользователь с role = 'admin' в profiles уже видит всех клиентов и дела (RLS is_admin()).
-- Дополнительно разрешаем любому админу обновлять строки клиентов в profiles (только role = 'client'),
-- чтобы правила БД совпадали с приложением и будущими формами редактирования профиля.

drop policy if exists "Admin can update client profiles" on public.profiles;
create policy "Admin can update client profiles"
on public.profiles
for update
using (public.is_admin() and role = 'client')
with check (public.is_admin() and role = 'client');

comment on policy "Admin can update client profiles" on public.profiles is
  'Любой админ может править данные клиентов; строки с role = admin не затрагиваются.';
