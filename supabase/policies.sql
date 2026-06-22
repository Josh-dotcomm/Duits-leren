-- Run this once in the Supabase SQL editor if the seeded base word list does
-- not show up in the app. The base rows have created_by = null, so a SELECT
-- policy keyed on created_by would hide them. This adds a permissive SELECT so
-- every signed-in user can read the whole shared dictionary (base rows plus
-- team additions). Insert/update/delete-own policies are left untouched.

alter table public.dictionary_entries enable row level security;

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
end $$;
