-- ============================================
-- Schema: reunion_nominations table
-- Run in the Supabase SQL Editor
-- ============================================

create table public.reunion_nominations (
  id uuid primary key default gen_random_uuid(),
  reunion_id uuid not null references public.reunions(id) on delete cascade,
  name text not null,
  description text not null,
  city text not null,
  state text not null,
  url text not null,
  created_by_uuid uuid not null references public.profiles(id) on delete cascade,
  bedrooms int,
  bathrooms int,
  capacity int,
  units int,
  price int,
  -- Geocoded from city/state at write time (migration 003)
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row level security: signed-in users can see nominations for reunions they're members of;
-- only the creator can update or delete their own nomination.
alter table public.reunion_nominations enable row level security;

create policy "nomination_read" on public.reunion_nominations
  for select to authenticated using (
    reunion_id in (
      select reunion_id from public.profile_reunions where profile_id = auth.uid()
    )
  );

-- Inserts are also rejected once the reunion's nomination deadline has
-- passed (migration 006)
create policy "nomination_insert" on public.reunion_nominations
  for insert to authenticated with check (
    auth.uid() = created_by_uuid
    and reunion_id in (
      select reunion_id from public.profile_reunions where profile_id = auth.uid()
    )
    and exists (
      select 1 from public.reunions r
      where r.id = reunion_id
        and (r.nomination_deadline is null or now() < r.nomination_deadline)
    )
  );

-- WITH CHECK validates the new values too, so an update can't reassign
-- created_by_uuid or move the nomination to another reunion (migration 004)
create policy "nomination_update_own" on public.reunion_nominations
  for update to authenticated
  using (auth.uid() = created_by_uuid)
  with check (
    auth.uid() = created_by_uuid
    and public.is_reunion_member(reunion_id)
  );

create policy "nomination_delete_own" on public.reunion_nominations
  for delete to authenticated using (auth.uid() = created_by_uuid);
