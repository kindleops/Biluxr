-- Biluxr foundation: enums, configuration tables, profiles, role helpers.
--
-- Conventions
--   * Every table has RLS enabled (see 20260928000500_security.sql).
--   * Money is stored as integer minor units + ISO currency.
--   * Business assumptions (tiers, fees, SLAs, categories, markets) live in
--     configuration tables, never in application code.

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('applicant', 'member', 'concierge', 'admin', 'provider');
create type public.market_status as enum ('planned', 'preparing', 'active', 'paused');
create type public.membership_status as enum ('pending_activation', 'active', 'paused', 'lapsed', 'cancelled');
create type public.application_status as enum ('submitted', 'in_review', 'conversation', 'approved', 'waitlisted', 'declined', 'withdrawn');
create type public.invitation_status as enum ('issued', 'accepted', 'expired', 'revoked');
create type public.request_status as enum ('received', 'clarifying', 'sourcing', 'options_ready', 'confirmed', 'in_progress', 'completed', 'cancelled');
create type public.request_priority as enum ('standard', 'priority', 'urgent');
create type public.vertical as enum ('concierge', 'aviation', 'residences', 'private', 'enterprise');
create type public.message_author_kind as enum ('member', 'concierge', 'system', 'ai');
create type public.message_visibility as enum ('member', 'internal');
create type public.option_status as enum ('draft', 'presented', 'accepted', 'declined', 'expired', 'withdrawn');
create type public.journey_status as enum ('planning', 'confirmed', 'underway', 'completed', 'cancelled');
create type public.journey_item_kind as enum ('flight', 'stay', 'dining', 'transfer', 'experience', 'event', 'note');
create type public.journey_item_status as enum ('tentative', 'confirmed', 'cancelled');
create type public.provider_status as enum ('prospect', 'vetting', 'approved', 'preferred', 'paused', 'removed');
create type public.access_offer_status as enum ('draft', 'published', 'archived');
create type public.card_status as enum ('not_issued', 'requested', 'in_production', 'issued', 'suspended');
create type public.ai_event_kind as enum ('intent_extraction', 'clarification', 'summary');
create type public.ai_review_status as enum ('proposed', 'accepted', 'edited', 'dismissed', 'failed');
create type public.onboarding_status as enum ('not_started', 'welcome_call', 'preferences', 'first_request', 'established');
create type public.preference_domain as enum ('travel', 'stays', 'dining', 'wellness', 'family', 'communication', 'gifting', 'other');
create type public.fee_kind as enum ('percentage', 'fixed');
create type public.notification_channel as enum ('email', 'sms', 'push');

-- ---------------------------------------------------------------------------
-- Utility: updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Configuration: service regions
-- ---------------------------------------------------------------------------
create table public.markets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  region text not null,
  timezone text not null,
  currency char(3) not null default 'USD',
  status public.market_status not null default 'planned',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
comment on table public.markets is 'Service regions. Only markets with status = active may be described publicly as operating.';

-- ---------------------------------------------------------------------------
-- Configuration: membership tiers & privileges
-- ---------------------------------------------------------------------------
create table public.membership_tiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  description text not null default '',
  annual_fee_minor bigint check (annual_fee_minor is null or annual_fee_minor >= 0),
  initiation_fee_minor bigint check (initiation_fee_minor is null or initiation_fee_minor >= 0),
  currency char(3) not null default 'USD',
  invitation_allowance integer not null default 0 check (invitation_allowance >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
comment on column public.membership_tiers.annual_fee_minor is 'Null means the fee is not yet published; the UI must say so rather than invent a number.';

create table public.privileges (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.membership_tiers (id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Configuration: categories, SLAs, fees, card programs, notifications
-- ---------------------------------------------------------------------------
create table public.request_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  vertical public.vertical not null default 'concierge',
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table public.service_level_targets (
  priority public.request_priority primary key,
  first_response_minutes integer not null check (first_response_minutes > 0),
  options_within_hours integer not null check (options_within_hours > 0)
);

create table public.fee_rules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  kind public.fee_kind not null,
  basis_points integer check (basis_points is null or basis_points between 0 and 10000),
  amount_minor bigint check (amount_minor is null or amount_minor >= 0),
  currency char(3) not null default 'USD',
  applies_to text not null default 'all',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint fee_rule_shape check (
    (kind = 'percentage' and basis_points is not null and amount_minor is null)
    or (kind = 'fixed' and amount_minor is not null and basis_points is null)
  )
);
comment on table public.fee_rules is 'Revenue configuration (service fees, commissions, partner economics). Inactive by default; nothing is charged from this table without explicit activation.';

create table public.card_programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  channel public.notification_channel not null,
  subject text,
  body text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (key, channel)
);
create trigger notification_templates_touch before update on public.notification_templates
  for each row execute function public.touch_updated_at();

-- Scalar settings that do not merit their own table.
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);
create trigger app_settings_touch before update on public.app_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Organizations (extension point: Biluxr Enterprise / Private office)
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'private_office' check (kind in ('private_office', 'family_office', 'residence', 'club', 'hotel', 'employer')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  preferred_name text,
  phone text,
  role public.app_role not null default 'applicant',
  timezone text not null default 'America/New_York',
  home_market_id uuid references public.markets (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_email_key on public.profiles (lower(email));
create index profiles_role_idx on public.profiles (role);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so policies can consult profiles without
-- recursive RLS evaluation. search_path is pinned to prevent hijacking.
-- ---------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.role in ('concierge', 'admin') from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.role = 'admin' from public.profiles p where p.id = auth.uid()), false);
$$;

-- Trusted server context: the service role, or a direct database session
-- (migrations, seeds, operators). Must be SECURITY INVOKER so current_user is
-- the caller's role — never call it from inside a SECURITY DEFINER function.
create or replace function public.is_trusted_context()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user not in ('anon', 'authenticated')
      or coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

-- Prevent privilege escalation: only admins (or trusted server code) may
-- change a profile's role or organization.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.organization_id is distinct from old.organization_id)
     and not public.is_admin() and not public.is_trusted_context() then
    raise exception 'insufficient_privilege: role changes require an administrator'
      using errcode = '42501';
  end if;
  if new.id is distinct from old.id then
    raise exception 'profile id is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_privileges();
