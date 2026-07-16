-- Close the two highest-risk gaps in the manually created production schema:
-- client-controlled paid entitlements and direct execution of a definer function.

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

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_safe_columns
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists user_plans_select_own on public.user_plans;
drop policy if exists user_plans_insert_own on public.user_plans;
drop policy if exists user_plans_update_own on public.user_plans;
drop policy if exists user_plans_delete_own on public.user_plans;

create policy user_plans_select_own
on public.user_plans
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy user_plans_insert_own
on public.user_plans
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy user_plans_update_own
on public.user_plans
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy user_plans_delete_own
on public.user_plans
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- RLS controls rows; column grants prevent a user from changing plan_tier or
-- email on their own profile. Stripe/webhook code will use the server role.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (digest_opt_in) on table public.profiles to authenticated;

revoke all on table public.user_plans from anon, authenticated;
grant select, insert, update, delete on table public.user_plans to authenticated;

revoke all on table public.email_subscribers from anon, authenticated;

comment on column public.profiles.plan_tier is
  'Server-managed entitlement. Never writable by an authenticated client.';
