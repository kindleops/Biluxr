-- Service: providers, requests (with lifecycle enforcement), messages,
-- options, journeys, access offers.

-- ---------------------------------------------------------------------------
-- Providers (Biluxr Network foundation)
-- ---------------------------------------------------------------------------
create table public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  category_slug text references public.request_categories (slug) on update cascade on delete set null,
  market_id uuid references public.markets (id) on delete set null,
  status public.provider_status not null default 'prospect',
  is_founding boolean not null default false,
  website text,
  contact_name text,
  contact_email text,
  contact_phone text,
  terms_summary text,
  notes text,
  test_request_status text not null default 'not_started' check (test_request_status in ('not_started', 'scheduled', 'passed', 'failed')),
  performance_score smallint check (performance_score is null or performance_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index providers_status_idx on public.providers (status, market_id);
create trigger providers_touch before update on public.providers
  for each row execute function public.touch_updated_at();

create table public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  organization text not null check (char_length(organization) between 2 and 200),
  contact_name text not null check (char_length(contact_name) between 2 and 160),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or char_length(phone) <= 40),
  category_slug text,
  city text not null check (char_length(city) between 2 and 120),
  website text check (website is null or char_length(website) <= 300),
  message text not null check (char_length(message) between 1 and 4000),
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'accepted', 'declined')),
  submitted_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Journeys
-- ---------------------------------------------------------------------------
create table public.journeys (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  summary text,
  status public.journey_status not null default 'planning',
  starts_on date,
  ends_on date,
  primary_market_id uuid references public.markets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journey_dates check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index journeys_member_idx on public.journeys (member_id, starts_on);
create trigger journeys_touch before update on public.journeys
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Requests
-- ---------------------------------------------------------------------------
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('BX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  member_id uuid not null references public.profiles (id) on delete cascade,
  category_slug text references public.request_categories (slug) on update cascade on delete set null,
  vertical public.vertical not null default 'concierge',
  title text not null check (char_length(title) between 1 and 200),
  brief text not null check (char_length(brief) between 1 and 8000),
  status public.request_status not null default 'received',
  priority public.request_priority not null default 'standard',
  market_id uuid references public.markets (id) on delete set null,
  assignee_id uuid references public.profiles (id) on delete set null,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  party_size smallint check (party_size is null or party_size between 1 and 500),
  budget_minor bigint check (budget_minor is null or budget_minor >= 0),
  budget_currency char(3),
  location text,
  first_response_due_at timestamptz,
  first_responded_at timestamptz,
  journey_id uuid references public.journeys (id) on delete set null,
  -- Vertical-specific payloads (e.g. aviation legs, manifests) live here until
  -- a vertical graduates to its own tables.
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index requests_member_idx on public.requests (member_id, created_at desc);
create index requests_queue_idx on public.requests (status, priority, first_response_due_at);
create index requests_assignee_idx on public.requests (assignee_id) where status not in ('completed', 'cancelled');

create table public.request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  kind text not null check (kind in ('created', 'status_changed', 'assigned', 'option_presented', 'option_accepted', 'option_declined')),
  from_status public.request_status,
  to_status public.request_status,
  actor_id uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index request_events_request_idx on public.request_events (request_id, created_at);

create or replace function public.request_transition_allowed(from_status public.request_status, to_status public.request_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case from_status
    when 'received' then to_status in ('clarifying', 'sourcing', 'cancelled')
    when 'clarifying' then to_status in ('sourcing', 'cancelled')
    when 'sourcing' then to_status in ('clarifying', 'options_ready', 'confirmed', 'cancelled')
    when 'options_ready' then to_status in ('sourcing', 'confirmed', 'cancelled')
    when 'confirmed' then to_status in ('in_progress', 'completed', 'cancelled')
    when 'in_progress' then to_status in ('completed', 'cancelled')
    else false
  end;
$$;

-- Before insert: stamp the SLA deadline from configuration.
create or replace function public.requests_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  minutes integer;
begin
  new.status := 'received';
  new.first_responded_at := null;
  select s.first_response_minutes into minutes
  from public.service_level_targets s where s.priority = new.priority;
  if minutes is not null then
    new.first_response_due_at := coalesce(new.created_at, now()) + make_interval(mins => minutes);
  end if;
  return new;
end;
$$;
create trigger requests_before_insert before insert on public.requests
  for each row execute function public.requests_before_insert();

-- Before update: enforce the lifecycle graph and immutable ownership.
create or replace function public.requests_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.member_id is distinct from old.member_id or new.reference is distinct from old.reference then
    raise exception 'request ownership and reference are immutable' using errcode = '42501';
  end if;
  if new.status is distinct from old.status
     and not public.request_transition_allowed(old.status, new.status) then
    raise exception 'invalid request transition: % -> %', old.status, new.status using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger requests_before_update before update on public.requests
  for each row execute function public.requests_before_update();

-- After insert/update: write the audit trail of lifecycle events.
create or replace function public.requests_log_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.request_events (request_id, kind, to_status, actor_id)
    values (new.id, 'created', new.status, auth.uid());
  else
    if new.status is distinct from old.status then
      insert into public.request_events (request_id, kind, from_status, to_status, actor_id)
      values (new.id, 'status_changed', old.status, new.status, auth.uid());
    end if;
    if new.assignee_id is distinct from old.assignee_id then
      insert into public.request_events (request_id, kind, actor_id, note)
      values (new.id, 'assigned', auth.uid(), new.assignee_id::text);
    end if;
  end if;
  return null;
end;
$$;
create trigger requests_log_events after insert or update on public.requests
  for each row execute function public.requests_log_events();

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
create table public.request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  author_kind public.message_author_kind not null,
  author_name text not null default '',
  body text not null check (char_length(body) between 1 and 8000),
  visibility public.message_visibility not null default 'member',
  created_at timestamptz not null default now()
);
create index request_messages_request_idx on public.request_messages (request_id, created_at);

-- Author names are always derived from the profile, never trusted from input.
create or replace function public.request_messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.author_id is not null then
    select coalesce(nullif(p.preferred_name, ''), p.full_name) into new.author_name
    from public.profiles p where p.id = new.author_id;
  elsif new.author_kind = 'ai' then
    new.author_name := 'Biluxr';
  elsif new.author_kind = 'system' then
    new.author_name := 'Biluxr';
  end if;
  new.author_name := coalesce(new.author_name, '');
  new.created_at := now();
  return new;
end;
$$;
create trigger request_messages_before_insert before insert on public.request_messages
  for each row execute function public.request_messages_before_insert();

-- First staff reply visible to the member stamps first_responded_at.
create or replace function public.request_messages_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.author_kind = 'concierge' and new.visibility = 'member' then
    update public.requests
       set first_responded_at = coalesce(first_responded_at, new.created_at)
     where id = new.request_id and first_responded_at is null;
  end if;
  return null;
end;
$$;
create trigger request_messages_after_insert after insert on public.request_messages
  for each row execute function public.request_messages_after_insert();

-- ---------------------------------------------------------------------------
-- Options (quotes / proposals presented to the member)
-- ---------------------------------------------------------------------------
create table public.request_options (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  provider_id uuid references public.providers (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  summary text not null default '' check (char_length(summary) <= 4000),
  price_minor bigint check (price_minor is null or price_minor >= 0),
  price_currency char(3),
  status public.option_status not null default 'draft',
  expires_at timestamptz,
  responded_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index request_options_request_idx on public.request_options (request_id, sort_order);

-- Member decisions go through RPCs so members never hold UPDATE rights on
-- requests or options.
create or replace function public.member_respond_to_option(option_id uuid, decision text)
returns public.option_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  opt public.request_options%rowtype;
  req public.requests%rowtype;
  next_status public.option_status;
begin
  if decision not in ('accept', 'decline') then
    raise exception 'decision must be accept or decline' using errcode = '22023';
  end if;

  select * into opt from public.request_options where id = option_id for update;
  if not found then
    raise exception 'option not found' using errcode = 'P0002';
  end if;

  select * into req from public.requests where id = opt.request_id;
  if req.member_id is distinct from auth.uid() then
    raise exception 'option not found' using errcode = 'P0002';
  end if;
  if opt.status <> 'presented' then
    raise exception 'this option is no longer open' using errcode = 'P0001';
  end if;
  if opt.expires_at is not null and opt.expires_at < now() then
    update public.request_options set status = 'expired' where id = opt.id;
    raise exception 'this option has expired' using errcode = 'P0001';
  end if;
  if decision = 'accept' and exists (
    select 1 from public.request_options o where o.request_id = opt.request_id and o.status = 'accepted'
  ) then
    raise exception 'an option has already been chosen for this request' using errcode = 'P0001';
  end if;

  next_status := case decision when 'accept' then 'accepted'::public.option_status else 'declined'::public.option_status end;
  update public.request_options set status = next_status, responded_at = now() where id = opt.id;

  insert into public.request_events (request_id, kind, actor_id, note)
  values (opt.request_id, case decision when 'accept' then 'option_accepted' else 'option_declined' end, auth.uid(), opt.title);

  return next_status;
end;
$$;

create or replace function public.member_cancel_request(target uuid, reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  req public.requests%rowtype;
begin
  select * into req from public.requests where id = target for update;
  if not found or req.member_id is distinct from auth.uid() then
    raise exception 'request not found' using errcode = 'P0002';
  end if;
  if req.status not in ('received', 'clarifying', 'sourcing', 'options_ready') then
    raise exception 'this request can no longer be withdrawn here; your concierge will help' using errcode = 'P0001';
  end if;
  update public.requests set status = 'cancelled' where id = target;
  if reason is not null and char_length(trim(reason)) > 0 then
    insert into public.request_messages (request_id, author_id, author_kind, author_name, body, visibility)
    values (target, auth.uid(), 'member', '', 'Withdrawn: ' || left(trim(reason), 1000), 'member');
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Journey items
-- ---------------------------------------------------------------------------
create table public.journey_items (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys (id) on delete cascade,
  request_id uuid references public.requests (id) on delete set null,
  kind public.journey_item_kind not null,
  title text not null check (char_length(title) between 1 and 200),
  detail text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  status public.journey_item_status not null default 'tentative',
  sort_order integer not null default 0
);
create index journey_items_journey_idx on public.journey_items (journey_id, starts_at);

-- ---------------------------------------------------------------------------
-- Access offers (privileges, partner benefits, invitations to moments)
-- ---------------------------------------------------------------------------
create table public.access_offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  detail text,
  provider_id uuid references public.providers (id) on delete set null,
  market_id uuid references public.markets (id) on delete set null,
  minimum_tier_slug text references public.membership_tiers (slug) on update cascade on delete set null,
  available_from timestamptz,
  available_until timestamptz,
  status public.access_offer_status not null default 'draft',
  created_at timestamptz not null default now()
);
comment on table public.access_offers is 'Only published offers backed by a real agreement may exist here. Never seed fictional partner benefits in production.';
