-- Membership lifecycle: applications, invitations, memberships, cards,
-- preferences, and the people in a member's world.

create sequence public.member_number_seq start 1;

-- ---------------------------------------------------------------------------
-- Applications (public, pre-auth)
-- ---------------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 160),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or char_length(phone) <= 40),
  city text not null check (char_length(city) between 2 and 120),
  market_slug text,
  occupation text check (occupation is null or char_length(occupation) <= 200),
  referral_source text check (referral_source is null or char_length(referral_source) <= 200),
  invitation_code text check (invitation_code is null or char_length(invitation_code) <= 64),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) < 16000),
  status public.application_status not null default 'submitted',
  reviewer_id uuid references public.profiles (id) on delete set null,
  decision_note text,
  user_id uuid references public.profiles (id) on delete set null,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  updated_at timestamptz not null default now()
);
create index applications_status_idx on public.applications (status, submitted_at desc);
create index applications_email_idx on public.applications (lower(email));
create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Invitations. Only a SHA-256 hash of the code is stored.
-- ---------------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid references public.profiles (id) on delete set null,
  email text,
  invitee_name text,
  code_hash text not null unique,
  code_hint text not null, -- last 4 characters, for recognition only
  status public.invitation_status not null default 'issued',
  application_id uuid references public.applications (id) on delete set null,
  expires_at timestamptz not null default now() + interval '60 days',
  created_at timestamptz not null default now()
);
create index invitations_inviter_idx on public.invitations (inviter_id, created_at desc);

create or replace function public.hash_invitation_code(code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(upper(trim(code)), 'UTF8')), 'hex');
$$;

-- ---------------------------------------------------------------------------
-- Memberships
-- ---------------------------------------------------------------------------
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references public.profiles (id) on delete cascade,
  tier_id uuid not null references public.membership_tiers (id),
  status public.membership_status not null default 'pending_activation',
  member_number text not null unique default lpad(nextval('public.member_number_seq')::text, 4, '0'),
  started_at timestamptz,
  renews_at timestamptz,
  relationship_owner_id uuid references public.profiles (id) on delete set null,
  is_founding boolean not null default false,
  organization_id uuid references public.organizations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index memberships_owner_idx on public.memberships (relationship_owner_id);
create trigger memberships_touch before update on public.memberships
  for each row execute function public.touch_updated_at();

create table public.member_cards (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid not null references public.card_programs (id),
  status public.card_status not null default 'not_issued',
  last_four text check (last_four is null or last_four ~ '^[0-9]{4}$'),
  requested_at timestamptz,
  issued_at timestamptz,
  unique (member_id, program_id)
);

create table public.member_preferences (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  domain public.preference_domain not null,
  label text not null check (char_length(label) between 1 and 120),
  value text not null check (char_length(value) between 1 and 2000),
  source text not null default 'member' check (source in ('member', 'concierge')),
  updated_at timestamptz not null default now()
);
create index member_preferences_member_idx on public.member_preferences (member_id, domain);
create trigger member_preferences_touch before update on public.member_preferences
  for each row execute function public.touch_updated_at();

create table public.member_people (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  relationship text not null check (char_length(relationship) between 1 and 80),
  notes text check (notes is null or char_length(notes) <= 2000),
  birthday date,
  created_at timestamptz not null default now()
);
create index member_people_member_idx on public.member_people (member_id);

-- ---------------------------------------------------------------------------
-- New auth user → profile. Approved applicants become members with a
-- membership awaiting activation (payment or staff activation).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  approved public.applications%rowtype;
  default_tier uuid;
begin
  select * into approved
  from public.applications a
  where lower(a.email) = lower(new.email) and a.status = 'approved'
  order by a.decided_at desc nulls last
  limit 1;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(approved.full_name, new.raw_user_meta_data ->> 'full_name', ''),
    case when approved.id is not null then 'member'::public.app_role else 'applicant'::public.app_role end
  );

  if approved.id is not null then
    update public.applications set user_id = new.id where id = approved.id;

    select t.id into default_tier
    from public.membership_tiers t
    where t.is_active
    order by t.sort_order
    limit 1;

    if default_tier is not null then
      insert into public.memberships (member_id, tier_id, status)
      values (new.id, default_tier, 'pending_activation');
    end if;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Invitation RPCs
-- ---------------------------------------------------------------------------

-- Anyone may check whether a code is currently valid. Returns no personal data.
create or replace function public.check_invitation(code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.invitations i
    where i.code_hash = public.hash_invitation_code(code)
      and i.status = 'issued'
      and i.expires_at > now()
  );
$$;

-- An active member issues an invitation within their tier's allowance.
-- Returns the plain code exactly once.
create or replace function public.member_issue_invitation(invitee_email text, invitee_name text)
returns table (invitation_id uuid, code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  allowance integer;
  used integer;
  new_code text;
  new_id uuid;
begin
  if me is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select t.invitation_allowance into allowance
  from public.memberships m
  join public.membership_tiers t on t.id = m.tier_id
  where m.member_id = me and m.status = 'active';

  if allowance is null then
    raise exception 'an active membership is required to invite' using errcode = '42501';
  end if;

  select count(*) into used
  from public.invitations i
  where i.inviter_id = me and i.status in ('issued', 'accepted');

  if used >= allowance then
    raise exception 'invitation allowance reached' using errcode = 'P0001';
  end if;

  new_code := upper(substr(encode(public.gen_random_bytes_compat(), 'hex'), 1, 12));

  insert into public.invitations (inviter_id, email, invitee_name, code_hash, code_hint)
  values (me, nullif(trim(invitee_email), ''), nullif(trim(invitee_name), ''),
          public.hash_invitation_code(new_code), right(new_code, 4))
  returning id into new_id;

  return query select new_id, new_code;
end;
$$;

-- Portable random bytes without requiring pgcrypto.
create or replace function public.gen_random_bytes_compat()
returns bytea
language sql
volatile
set search_path = ''
as $$
  select decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'hex');
$$;
