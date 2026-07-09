-- ============================================
-- Migration 006: nomination and voting deadlines
-- Run in the Supabase SQL Editor
-- ============================================

-- Deadlines mark the start of the day they fall on: a nomination deadline
-- of 2026-07-10 means submissions close at 00:00:00 on 7/10 (stored as a
-- timestamptz at the creator's local midnight).

alter table public.reunions
  add column nomination_deadline timestamptz,
  add column voting_deadline timestamptz;

-- Enforce the nomination cutoff at the database, not just in the UI:
-- inserts are rejected once the reunion's deadline has passed.
-- (Voting enforcement will come with the voting feature.)
drop policy if exists "nomination_insert" on public.reunion_nominations;

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
