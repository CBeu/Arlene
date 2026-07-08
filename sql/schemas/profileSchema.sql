-- ============================================
-- Schema v1: user profiles only
-- (nominations & votes come in a later migration)
-- Run in the Supabase SQL Editor
-- ============================================

-- Supabase stores sign-ins (Apple, Google, email) in auth.users.
-- This is the app-facing user record, linked 1:1.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile whenever someone signs up,
-- regardless of which provider they used
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row level security: signed-in users can see profiles
-- (needed later to show who nominated what); you can only
-- edit your own.
alter table public.profiles enable row level security;

create policy "profiles_read" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);
