-- Baseline the three tables that existed in production before migrations were
-- introduced. Every statement is safe to run against the existing project and
-- also recreates the original foundation on a fresh database.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan_tier text not null default 'free'
    check (plan_tier in ('free', 'explorer', 'builder', 'serious_move')),
  digest_opt_in boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'marketing',
  consent_at timestamptz not null default now(),
  free_brief boolean not null default true,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_plans enable row level security;
alter table public.email_subscribers enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end;
$$;

comment on table public.profiles is
  'Account-level profile and server-managed subscription entitlement.';
comment on table public.user_plans is
  'User-owned planning state. Entitlements must never be read from plan JSON.';
comment on table public.email_subscribers is
  'Server-written newsletter consent records; intentionally closed to client roles.';
