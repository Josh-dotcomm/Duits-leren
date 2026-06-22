-- Run this once in the Supabase SQL editor.
--
-- Fixes "permission denied for table dictionary_entries". That error is about
-- table-level privileges (GRANT), which are separate from row-level security:
-- a policy decides WHICH ROWS a role may see, but the role first needs SELECT
-- granted on the table at all. This grants those privileges and then makes sure
-- the read/own-row policies exist. Safe to run more than once.

-- Table privileges for the app roles (RLS still controls the rows).
grant usage on schema public to anon, authenticated;

-- Shared dictionary: signed-in users read all rows; authors manage their own.
grant select on table public.dictionary_entries to authenticated;
grant insert, update, delete on table public.dictionary_entries to authenticated;

-- Per-user learning progress.
grant select, insert, update, delete on table public.progress to authenticated;

-- Make sure RLS is on and the needed policies exist (idempotent).
alter table public.dictionary_entries enable row level security;
alter table public.progress enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'dictionary_entries'
      and policyname = 'dictionary_select_all'
  ) then
    create policy "dictionary_select_all"
      on public.dictionary_entries
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'progress'
      and policyname = 'progress_own_all'
  ) then
    create policy "progress_own_all"
      on public.progress
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
