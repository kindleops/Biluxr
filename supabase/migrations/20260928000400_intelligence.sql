-- Intelligence and operations: AI event log, founding cohort tracking,
-- privacy-conscious analytics, audit log, contact inquiries.

-- ---------------------------------------------------------------------------
-- Biluxr AI event log. Every model call is recorded with its prompt version,
-- output, and human review outcome. Staff-only.
-- ---------------------------------------------------------------------------
create table public.ai_events (
  id uuid primary key default gen_random_uuid(),
  kind public.ai_event_kind not null,
  request_id uuid references public.requests (id) on delete cascade,
  member_id uuid references public.profiles (id) on delete cascade,
  model text not null,
  prompt_version text not null,
  output jsonb not null default '{}'::jsonb,
  status public.ai_review_status not null default 'proposed',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  latency_ms integer,
  input_tokens integer,
  output_tokens integer,
  error text,
  created_at timestamptz not null default now()
);
create index ai_events_request_idx on public.ai_events (request_id, created_at desc);
create index ai_events_review_idx on public.ai_events (status) where status = 'proposed';

-- ---------------------------------------------------------------------------
-- Founding cohort: 25 members, 25 providers, curated by hand.
-- ---------------------------------------------------------------------------
create table public.founding_members (
  id uuid primary key default gen_random_uuid(),
  member_id uuid unique references public.profiles (id) on delete set null,
  application_id uuid unique references public.applications (id) on delete set null,
  display_name text not null,
  referral_source text,
  relationship_owner_id uuid references public.profiles (id) on delete set null,
  onboarding_status public.onboarding_status not null default 'not_started',
  preferences_completed boolean not null default false,
  first_request_at timestamptz,
  satisfaction smallint check (satisfaction is null or satisfaction between 1 and 5),
  referral_potential text check (referral_potential is null or referral_potential in ('low', 'medium', 'high')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger founding_members_touch before update on public.founding_members
  for each row execute function public.touch_updated_at();

create table public.founding_providers (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null unique references public.providers (id) on delete cascade,
  vetting_status text not null default 'not_started' check (vetting_status in ('not_started', 'in_progress', 'passed', 'failed')),
  terms_status text not null default 'not_started' check (terms_status in ('not_started', 'negotiating', 'agreed')),
  test_request_status text not null default 'not_started' check (test_request_status in ('not_started', 'scheduled', 'passed', 'failed')),
  performance_note text,
  preferred_status boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger founding_providers_touch before update on public.founding_providers
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Product analytics. No names, emails, request text, or IP addresses are
-- stored. `subject` is a salted hash computed server-side.
-- ---------------------------------------------------------------------------
create table public.analytics_events (
  id bigint generated always as identity primary key,
  name text not null check (name ~ '^[a-z][a-z0-9_.]{1,63}$'),
  subject text check (subject is null or char_length(subject) = 64),
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object' and pg_column_size(properties) < 2048),
  occurred_at timestamptz not null default now()
);
create index analytics_events_name_idx on public.analytics_events (name, occurred_at desc);

-- ---------------------------------------------------------------------------
-- Audit log (append-only; written by triggers and trusted server code)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed jsonb := '{}'::jsonb;
  k text;
begin
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(to_jsonb(new)) loop
      if k not in ('updated_at') and (to_jsonb(new) -> k) is distinct from (to_jsonb(old) -> k) then
        changed := changed || jsonb_build_object(k, jsonb_build_object('from', to_jsonb(old) -> k, 'to', to_jsonb(new) -> k));
      end if;
    end loop;
    if changed = '{}'::jsonb then
      return null;
    end if;
  end if;
  insert into public.audit_log (actor_id, action, entity, entity_id, meta)
  values (auth.uid(), lower(tg_op), tg_table_name, coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id')), changed);
  return null;
end;
$$;

-- Audit sensitive tables.
create trigger audit_profiles after update on public.profiles
  for each row execute function public.audit_row_change();
create trigger audit_memberships after insert or update or delete on public.memberships
  for each row execute function public.audit_row_change();
create trigger audit_applications after update on public.applications
  for each row execute function public.audit_row_change();
create trigger audit_fee_rules after insert or update or delete on public.fee_rules
  for each row execute function public.audit_row_change();
create trigger audit_membership_tiers after insert or update or delete on public.membership_tiers
  for each row execute function public.audit_row_change();

-- ---------------------------------------------------------------------------
-- Public contact form
-- ---------------------------------------------------------------------------
create table public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  topic text not null check (topic in ('membership', 'partnership', 'press', 'other')),
  message text not null check (char_length(message) between 1 and 4000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
