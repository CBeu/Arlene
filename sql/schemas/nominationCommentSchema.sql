-- ============================================
-- Schema: nomination_comments table
-- Run in the Supabase SQL Editor
-- (requires public.is_reunion_member from migration 002)
-- ============================================

create table public.nomination_comments (
  id uuid primary key default gen_random_uuid(),
  nomination_id uuid not null references public.reunion_nominations(id) on delete cascade,
  created_by_uuid uuid not null references public.profiles(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

create index nomination_comments_nomination_id_idx
  on public.nomination_comments (nomination_id);

-- Row level security: signed-in users can see and add comments on nominations
-- in reunions they're members of; only the author can delete their own comment.
alter table public.nomination_comments enable row level security;

create policy "comment_read" on public.nomination_comments
  for select to authenticated using (
    exists (
      select 1 from public.reunion_nominations n
      where n.id = nomination_id and public.is_reunion_member(n.reunion_id)
    )
  );

create policy "comment_insert" on public.nomination_comments
  for insert to authenticated with check (
    auth.uid() = created_by_uuid
    and exists (
      select 1 from public.reunion_nominations n
      where n.id = nomination_id and public.is_reunion_member(n.reunion_id)
    )
  );

create policy "comment_delete_own" on public.nomination_comments
  for delete to authenticated using (auth.uid() = created_by_uuid);
