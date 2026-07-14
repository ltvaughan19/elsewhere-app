-- Elsewhere: persist Fit Quiz / plan for logged-in users
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Project must already have public.profiles (see seed-elsewhere-v1.sql)

create table if not exists public.user_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_plans enable row level security;

drop policy if exists "user_plans_select_own" on public.user_plans;
create policy "user_plans_select_own" on public.user_plans
  for select using (auth.uid() = user_id);

drop policy if exists "user_plans_insert_own" on public.user_plans;
create policy "user_plans_insert_own" on public.user_plans
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_plans_update_own" on public.user_plans;
create policy "user_plans_update_own" on public.user_plans
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_plans_delete_own" on public.user_plans;
create policy "user_plans_delete_own" on public.user_plans
  for delete using (auth.uid() = user_id);

comment on table public.user_plans is
  'Fit Quiz / readiness plan JSON per auth user. Guest plans stay in localStorage until signup.';
