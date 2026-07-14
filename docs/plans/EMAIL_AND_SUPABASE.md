# Elsewhere — Email + Supabase (locked decisions)

**Date:** 2026-07-14  
**Product:** Elsewhere relocation OS + paid research digest

---

## Marketing take (short)

Waitlists were for multi-month builds and artificial scarcity. Elsewhere ships continuously; the brand is **calm clarity**, not FOMO.

| Wrong | Right |
|-------|--------|
| “Join the waitlist / Start your path” | **Start Fit Quiz** — product next step |
| Dual hero CTAs (quiz + waitlist) | One primary product CTA |
| Hype drip | Rare, sourced **Corridor Brief** (value exchange) |
| Paid newsletter as a second Substack subscription | Paid digest as an **Explorer+ entitlement** |

Free email capture is fine. Selling access to the **full** signal digest belongs on the same paid plan as the app — one bill, one identity.

---

## Stack decision (do this)

```
Visitor / member
      │
      ▼
┌─────────────────────┐
│  Next.js (this app) │  CTA: Fit Quiz · signup · newsletter form
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ONE Supabase       │  auth.users · profiles · plan_tier · newsletter_prefs
│  project            │  email_subscribers (consent log)
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
 Stripe       Resend
 (billing)    (send)
```

### Why not Beehiiv / Substack as the paid newsletter host

| Tool | Verdict for Elsewhere |
|------|------------------------|
| **Substack** | Discovery is nice; 10% forever; **second identity + second bill** vs SaaS. Skip for the product newsletter. |
| **Beehiiv** | Best if the *business* is a media newsletter. Here the newsletter is a **paid-plan perk**. Skip as billing surface. |
| **Kit** | Creator/course funnels. Overkill / wrong model. |
| **Loops / Customer.io** | Great later for *product* lifecycle email (onboarding). Not required for v1 digest. |
| **Resend** | **Use this.** Dev-friendly, Next-native, Audience + Broadcasts, React Email. You write few issues; send when ready. |
| **Supabase** | **Source of truth** for who may receive paid digest (`plan_tier`). |

Optional later: sync paid segments to Loops for churn/onboarding sequences. Not day one.

---

## Newsletter product shape (low author burden)

You will **not** write 52 essays a year.

| Layer | Who gets it | Cadence | Content |
|-------|-------------|---------|---------|
| **Corridor Brief (free)** | Anyone who opts in | Rare — only when a sourced note actually changes | 3–5 bullets + sources + confidence labels |
| **Corridor Digest (paid)** | Explorer+ (and Builder) | Monthly **or** same event + deeper brief | Same bullets + “what to research next” for their corridor |

**Format template (reuse forever):**
1. Corridor(s) touched  
2. What changed (fact)  
3. Source + confidence / `needs_review`  
4. What *not* to conclude (trust)  
5. One next step in the app (path / claim link)

Agent-assisted draft from claim updates → you edit 15 minutes → send. That is the system.

---

## Supabase — what to create (YOU)

### 1. One project only
Name e.g. `elsewhere`. Already locked in `ONE_SITE_ONE_AUTH.md`.

### 2. Env on Vercel + `apps/web/.env.local`
```bash
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=Elsewhere <hello@YOUR_DOMAIN>   # verify domain in Resend
NEWSLETTER_WEBHOOK=   # optional Make/Zapier mirror; prefer direct Resend when keys exist
```

### 3. Auth URLs
Site URL + redirect allowlist for localhost + Vercel + production only — **this** app’s hostnames.

### 4. Tables (when you open Supabase SQL)

```sql
-- Consent + free brief list (marketing capture; may not have auth yet)
create table public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'marketing',
  consent_at timestamptz not null default now(),
  free_brief boolean not null default true,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.email_subscribers enable row level security;
-- writes via service role from API only; no public insert policies

-- Profile plan (paid digest gate)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  plan_tier text not null default 'free'
    check (plan_tier in ('free','explorer','builder','serious_move')),
  digest_opt_in boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
```

Paid digest eligibility: `plan_tier in ('explorer','builder')` AND `digest_opt_in` AND not unsubscribed.

### 5. YOU order of operations
1. Create Supabase project + paste keys  
2. Run SQL above  
3. Create Resend account → verify sending domain → paste `RESEND_API_KEY` + `RESEND_FROM_EMAIL`  
4. Create Resend Audience “Corridor Brief (free)”  
5. Stripe (later) updates `profiles.plan_tier` on checkout  
6. Privacy Policy must mention email consent before any paid ads to the list  

---

## App behavior (implemented / next)

| Surface | Behavior |
|---------|----------|
| `/` hero + nav | **Start Fit Quiz** primary |
| `/` finale | Soft **Corridor Brief** email opt-in (not waitlist) |
| `/api/newsletter` | Validates email → optional webhook / future Supabase+Resend |
| `/api/waitlist` | Compat shim → same newsletter handler (retire later) |
| Paid digest send | Server job: query paid profiles → Resend Broadcast (not built until keys exist) |

---

## What AGENT needs from YOU (blocking)
1. Supabase URL + anon + service role  
2. Resend API key + verified from-domain  
3. Confirm paid digest gates on **Explorer** (recommended) vs Builder-only  

Until keys exist, forms still accept email (local + API `accepted_no_provider`) so UX and CTAs ship now.
