-- История диалога клиента с AI-ассистентом (один чат на пользователя).

create table if not exists public.client_assistant_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_assistant_chats enable row level security;

drop policy if exists "Client can manage own assistant chat" on public.client_assistant_chats;
create policy "Client can manage own assistant chat"
on public.client_assistant_chats
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists client_assistant_chats_set_updated_at on public.client_assistant_chats;
create trigger client_assistant_chats_set_updated_at
before update on public.client_assistant_chats
for each row
execute function public.set_updated_at();
