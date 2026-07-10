-- ============================================
-- Schema: reunion_votes table
-- Run in the Supabase SQL Editor
-- (requires public.is_reunion_member from reunionSchema.sql)
-- ============================================

-- One ballot per member per reunion: ranked_nomination_ids is ordered,
-- position 1 = most preferred.
create table public.reunion_votes (
  id uuid primary key default gen_random_uuid(),
  reunion_id uuid not null references public.reunions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  ranked_nomination_ids uuid[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reunion_id, profile_id)
);

-- Row level security: reunion members can see all ballots in their reunion
-- (needed to tally results); users can only write their own ballot, and
-- only while voting is open.
alter table public.reunion_votes enable row level security;

create policy "vote_read" on public.reunion_votes
  for select to authenticated using (public.is_reunion_member(reunion_id));

create policy "vote_insert" on public.reunion_votes
  for insert to authenticated with check (
    auth.uid() = profile_id
    and public.is_reunion_member(reunion_id)
    and exists (
      select 1 from public.reunions r
      where r.id = reunion_id
        and (r.voting_deadline is null or now() < r.voting_deadline)
    )
  );

create policy "vote_update_own" on public.reunion_votes
  for update to authenticated
  using (auth.uid() = profile_id)
  with check (
    auth.uid() = profile_id
    and public.is_reunion_member(reunion_id)
    and exists (
      select 1 from public.reunions r
      where r.id = reunion_id
        and (r.voting_deadline is null or now() < r.voting_deadline)
    )
  );

create policy "vote_delete_own" on public.reunion_votes
  for delete to authenticated using (auth.uid() = profile_id);
