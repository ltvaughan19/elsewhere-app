-- Stripe billing fields + subscription-only plan_tier.
-- serious_move is a one-time entitlement that stacks with explorer.

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists serious_move_purchased_at timestamptz;

create unique index if not exists profiles_stripe_customer_id_uidx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- Migrate legacy paid tiers into subscription model before tightening the check.
update public.profiles
set plan_tier = 'explorer'
where plan_tier in ('builder', 'serious_move');

alter table public.profiles
  drop constraint if exists profiles_plan_tier_check;

alter table public.profiles
  add constraint profiles_plan_tier_check
  check (plan_tier in ('free', 'explorer'));

comment on column public.profiles.plan_tier is
  'Server-managed subscription entitlement: free | explorer. Never writable by authenticated clients.';

comment on column public.profiles.stripe_customer_id is
  'Stripe Customer id. Server/webhook managed only.';

comment on column public.profiles.stripe_subscription_id is
  'Active Stripe Subscription id for Explorer, if any. Server/webhook managed only.';

comment on column public.profiles.serious_move_purchased_at is
  'When Serious Move one-time pack was purchased. Stacks with explorer; survives cancel.';
