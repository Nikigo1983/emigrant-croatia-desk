-- Сообщение куратора клиенту (личный кабинет); пустое = не показывать.
alter table public.cases
add column if not exists curator_comment_for_client text;

comment on column public.cases.curator_comment_for_client is
  'Текст для клиента в кабинете; null или пустая строка — блок не показывается.';
