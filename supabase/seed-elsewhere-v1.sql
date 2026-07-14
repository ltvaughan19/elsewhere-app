-- Elsewhere v1 schema: newsletter consent + plan profile
-- Run in: SQL Editor → New query → Run
-- Project: kjrmtklvfecvzlhlzuaf

-- Consent + free Corridor Brief list (marketing capture; may not have auth yet)
create table if not exists public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'marketing',
  consent_at timestamptz not null default now(),
  free_brief boolean not null default true,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.email_subscribers enable row level security;
-- No public policies: writes via service role from Next API only.

-- Profile plan (paid digest gate for Explorer+)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  plan_tier text not null default 'free'
    check (plan_tier in ('free','explorer','builder','serious_move')),
  digest_opt_in boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fit Quiz plan persistence: also run supabase/user-plans.sql in SQL Editor.
