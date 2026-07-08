-- ============================================
-- Migration 002: let reunion members see each other
-- Run in the Supabase SQL Editor
-- ============================================

-- The original profile_reunions_read_own policy only let users see their
-- own membership rows, so the members list on the reunion overview page
-- would only ever show yourself.

-- A policy on profile_reunions can't query profile_reunions directly
-- (Postgres RLS would recurse), so membership is checked through a
-- security definer function that bypasses RLS.
create or replace function public.is_reunion_member(rid uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profile_reunions
    where reunion_id = rid and profile_id = auth.uid()
  );
$$;

drop policy if exists "profile_reunions_read_own" on public.profile_reunions;
drop policy if exists "profile_reunions_read_members" on public.profile_reunions;

create policy "profile_reunions_read_members" on public.profile_reunions
  for select to authenticated
  using (auth.uid() = profile_id or public.is_reunion_member(reunion_id));
