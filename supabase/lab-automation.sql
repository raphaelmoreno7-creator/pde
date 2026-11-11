-- Keep the automatic narrative report deadline with the analysis request.
alter table public.lab_analyses
  add column if not exists auto_result_at timestamptz;

create index if not exists lab_analyses_auto_result_at_idx
  on public.lab_analyses(auto_result_at)
  where auto_result_at is not null;
