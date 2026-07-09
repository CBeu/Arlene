-- ============================================
-- Migration 005: validate reunion updates
-- Run in the Supabase SQL Editor
-- ============================================

-- Same fix as migration 004 but for reunions: the original
-- reunions_update_own policy had USING but no WITH CHECK, so an update
-- passed RLS based only on the row's old values — a crafted request
-- could reassign created_by_uuid to another user.

drop policy if exists "reunions_update_own" on public.reunions;

create policy "reunions_update_own" on public.reunions
  for update to authenticated
  using (auth.uid() = created_by_uuid)
  with check (auth.uid() = created_by_uuid);
