-- Biluxr configuration seed.
--
-- Configuration only. No members, requests, providers or partner benefits are
-- seeded here: production screens must reflect reality. Development fixtures
-- live in the application's demo mode (src/lib/demo) and never touch this
-- database.

insert into public.markets (slug, name, region, timezone, currency, status, sort_order) values
  ('miami', 'Miami & South Florida', 'North America', 'America/New_York', 'USD', 'preparing', 10),
  ('new-york', 'New York', 'North America', 'America/New_York', 'USD', 'planned', 20),
  ('los-angeles', 'Los Angeles', 'North America', 'America/Los_Angeles', 'USD', 'planned', 30),
  ('aspen', 'Aspen', 'North America', 'America/Denver', 'USD', 'planned', 40),
  ('st-barts', 'St. Barthélemy', 'Caribbean', 'America/St_Barthelemy', 'EUR', 'planned', 50),
  ('london', 'London', 'Europe', 'Europe/London', 'GBP', 'planned', 60),
  ('paris', 'Paris', 'Europe', 'Europe/Paris', 'EUR', 'planned', 70),
  ('milan', 'Milan', 'Europe', 'Europe/Rome', 'EUR', 'planned', 80),
  ('monaco', 'Monaco', 'Europe', 'Europe/Monaco', 'EUR', 'planned', 90),
  ('ibiza', 'Ibiza', 'Europe', 'Europe/Madrid', 'EUR', 'planned', 100),
  ('mykonos', 'Mykonos', 'Europe', 'Europe/Athens', 'EUR', 'planned', 110),
  ('dubai', 'Dubai', 'Middle East', 'Asia/Dubai', 'AED', 'planned', 120),
  ('tokyo', 'Tokyo', 'Asia', 'Asia/Tokyo', 'JPY', 'planned', 130),
  ('singapore', 'Singapore', 'Asia', 'Asia/Singapore', 'SGD', 'planned', 140)
on conflict (slug) do nothing;

-- Fees are intentionally null: unpublished until the business sets them.
insert into public.membership_tiers (slug, name, description, annual_fee_minor, initiation_fee_minor, currency, invitation_allowance, is_active, sort_order) values
  ('membership', 'Membership', 'One relationship for every part of life that moves.', null, null, 'USD', 3, true, 10),
  ('private', 'Biluxr Private', 'A dedicated team for households and family offices.', null, null, 'USD', 5, false, 20)
on conflict (slug) do nothing;

insert into public.privileges (tier_id, title, description, sort_order)
select t.id, p.title, p.description, p.sort_order
from public.membership_tiers t
cross join (values
  ('A single relationship', 'One concierge who knows your life, supported by a team that keeps it moving.', 10),
  ('Considered options', 'Every request returns a short, reasoned set of options — never a search result.', 20),
  ('Remembered preferences', 'Seats, rooms, tables, allergies, the people you travel with. Said once.', 30),
  ('Journeys, held together', 'Flights, stays, tables and transfers gathered into one living itinerary.', 40),
  ('Invitations to extend', 'A small number of invitations to share Biluxr with people you trust.', 50)
) as p(title, description, sort_order)
where t.slug = 'membership'
and not exists (select 1 from public.privileges x where x.tier_id = t.id);

insert into public.request_categories (slug, name, vertical, sort_order) values
  ('travel', 'Travel', 'concierge', 10),
  ('stays', 'Stays', 'concierge', 20),
  ('dining', 'Dining', 'concierge', 30),
  ('aviation', 'Private aviation', 'aviation', 40),
  ('ground', 'Ground transport', 'concierge', 50),
  ('access', 'Events & access', 'concierge', 60),
  ('wellness', 'Wellness', 'concierge', 70),
  ('residences', 'Residences', 'residences', 80),
  ('gifting', 'Gifting', 'concierge', 90),
  ('household', 'Household & errands', 'concierge', 100),
  ('other', 'Something else', 'concierge', 110)
on conflict (slug) do nothing;

insert into public.service_level_targets (priority, first_response_minutes, options_within_hours) values
  ('urgent', 15, 4),
  ('priority', 60, 12),
  ('standard', 240, 48)
on conflict (priority) do nothing;

-- Revenue model scaffolding. All inactive; amounts are placeholders to be set
-- by an administrator before anything is charged.
insert into public.fee_rules (key, label, kind, basis_points, amount_minor, applies_to, is_active) values
  ('service_fee', 'Service fee on arranged bookings', 'percentage', 0, null, 'all', false),
  ('partner_commission', 'Partner commission', 'percentage', 0, null, 'all', false),
  ('premium_sourcing', 'Premium sourcing fee', 'fixed', null, 0, 'concierge', false),
  ('aviation_margin', 'Aviation margin', 'percentage', 0, null, 'aviation', false)
on conflict (key) do nothing;

insert into public.card_programs (slug, name, description, is_active) values
  ('member-card', 'Member card', 'A physical credential identifying a Biluxr member to partners.', false)
on conflict (slug) do nothing;

insert into public.notification_templates (key, channel, subject, body) values
  ('application_received', 'email', 'Your application to Biluxr', 'Thank you, {{first_name}}. Your application has been received. We read every one personally and will be in touch.'),
  ('application_approved', 'email', 'Welcome to Biluxr', '{{first_name}}, we would be glad to have you. Sign in with this address to begin: {{sign_in_url}}'),
  ('request_received', 'email', 'Received: {{request_title}}', 'Your request is with {{concierge_name}}. We will be in touch shortly.'),
  ('options_ready', 'email', 'Options for {{request_title}}', 'A considered set of options is ready for you in Biluxr.')
on conflict (key, channel) do nothing;

insert into public.app_settings (key, value, description) values
  ('founding_cohort_target', '{"members": 25, "providers": 25}', 'Size of the hand-curated founding cohort.'),
  ('launch_market', '"miami"', 'The market being launched in depth first.'),
  ('concierge_presence_enabled', 'false', 'When false, the product never claims a concierge is online.')
on conflict (key) do nothing;
