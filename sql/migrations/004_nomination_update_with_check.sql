-- ============================================
-- Migration 004: validate nomination updates
-- Run in the Supabase SQL Editor
-- ============================================

-- The original nomination_update_own policy had USING but no WITH CHECK,
-- so an update passed RLS based only on the row's old values — a crafted
-- request could reassign created_by_uuid or move the nomination to a
-- reunion the user isn't a member of. WITH CHECK validates the new values.

drop policy if exists "nomination_update_own" on public.reunion_nominations;

create policy "nomination_update_own" on public.reunion_nominations
  for update to authenticated
  using (auth.uid() = created_by_uuid)
  with check (
    auth.uid() = created_by_uuid
    and public.is_reunion_member(reunion_id)
  );
