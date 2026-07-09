-- ============================================
-- Schema v2: reunions table
-- Run in the Supabase SQL Editor
-- ============================================

create table public.reunions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  created_by_uuid uuid not null references public.profiles(id) on delete cascade,
  reunion_start_date timestamptz,
  reunion_end_date timestamptz,
  -- Deadlines mark the start of the day they fall on, stored at the
  -- creator's local midnight (added in migration 006)
  nomination_deadline timestamptz,
  voting_deadline timestamptz
);

-- Row level security: signed-in users can see all reunions;
-- only the creator can update or delete their own reunion.
alter table public.reunions enable row level security;

create policy "reunions_read" on public.reunions
  for select to authenticated using (true);

create policy "reunions_insert" on public.reunions
  for insert to authenticated with check (auth.uid() = created_by_uuid);

-- WITH CHECK validates the new values too, so an update can't reassign
-- created_by_uuid (migration 005)
create policy "reunions_update_own" on public.reunions
  for update to authenticated
  using (auth.uid() = created_by_uuid)
  with check (auth.uid() = created_by_uuid);

create policy "reunions_delete_own" on public.reunions
  for delete to authenticated using (auth.uid() = created_by_uuid);

-- Junction table: many-to-many relationship between profiles and reunions
create table public.profile_reunions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reunion_id uuid not null references public.reunions(id) on delete cascade,
  unique(profile_id, reunion_id)
);

-- Row level security: users can see their own memberships and all members of reunions they're in;
-- only the user themselves can add/remove their own membership.
alter table public.profile_reunions enable row level security;

-- Membership check for policies on profile_reunions itself: a policy on
-- profile_reunions can't query profile_reunions directly (RLS would
-- recurse), so this security definer function bypasses RLS.
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

create policy "profile_reunions_read_members" on public.profile_reunions
  for select to authenticated
  using (auth.uid() = profile_id or public.is_reunion_member(reunion_id));

create policy "profile_reunions_insert_own" on public.profile_reunions
  for insert to authenticated with check (auth.uid() = profile_id);

create policy "profile_reunions_delete_own" on public.profile_reunions
  for delete to authenticated using (auth.uid() = profile_id);
