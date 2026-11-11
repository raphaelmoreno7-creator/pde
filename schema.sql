-- Run this in the Supabase SQL Editor for the P.D.E. cloud project.
-- Every row belongs to its creator and is protected by Row Level Security.
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  case_number text not null,
  title text not null,
  people text not null default '',
  note text not null default '',
  status text not null default 'open' check (status in ('open','review','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.case_updates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.cases enable row level security;
alter table public.case_updates enable row level security;
create policy "Read own cases" on public.cases for select to authenticated using ((select auth.uid()) = created_by);
create policy "Create own cases" on public.cases for insert to authenticated with check ((select auth.uid()) = created_by);
create policy "Update own cases" on public.cases for update to authenticated using ((select auth.uid()) = created_by) with check ((select auth.uid()) = created_by);
create policy "Read own case updates" on public.case_updates for select to authenticated using ((select auth.uid()) = created_by);
create policy "Create own case updates" on public.case_updates for insert to authenticated with check ((select auth.uid()) = created_by and exists (select 1 from public.cases c where c.id = case_id and c.created_by = (select auth.uid())));
grant select, insert, update on public.cases to authenticated;
grant select, insert on public.case_updates to authenticated;
-- Enable Realtime updates for cross-device refresh while the app is open.
alter publication supabase_realtime add table public.cases;
