-- Клиент видит только безопасные поля дела (без internal_comment и служебных данных).

drop policy if exists "Client can read own case" on public.cases;

create or replace view public.cases_client_public
with (security_invoker = false)
as
select
  client_id,
  current_status,
  status_updated_at,
  submission_date,
  submission_city,
  case_number,
  consulate,
  curator_comment_for_client,
  status_reached_at
from public.cases;

grant select on public.cases_client_public to authenticated;

alter view public.cases_client_public set (security_invoker = false);

drop policy if exists "Client reads own case via public view" on public.cases_client_public;
create policy "Client reads own case via public view"
on public.cases_client_public
for select
to authenticated
using (client_id = auth.uid());
