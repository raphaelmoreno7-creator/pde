-- Per-message and per-analysis consent for sending fictional content to the AI service.
alter table public.mailbox_messages
  add column if not exists ai_reply_enabled boolean not null default false;

alter table public.lab_analyses
  add column if not exists ai_report_enabled boolean not null default false;

grant update on public.mailbox_messages to authenticated;
grant update on public.lab_analyses to authenticated;

drop policy if exists "Update own mailbox messages" on public.mailbox_messages;
create policy "Update own mailbox messages" on public.mailbox_messages
  for update to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);
