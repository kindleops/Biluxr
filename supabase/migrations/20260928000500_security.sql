-- Row level security. Default posture: deny. Every table is enabled and
-- receives explicit policies. Members see only their own world; internal
-- notes, provider records, AI output and configuration internals are staff-only.

do $$
declare
  t text;
begin
  foreach t in array array[
    'markets', 'membership_tiers', 'privileges', 'request_categories', 'service_level_targets',
    'fee_rules', 'card_programs', 'notification_templates', 'app_settings', 'organizations',
    'profiles', 'applications', 'invitations', 'memberships', 'member_cards', 'member_preferences',
    'member_people', 'providers', 'partner_applications', 'journeys', 'requests', 'request_events',
    'request_messages', 'request_options', 'journey_items', 'access_offers', 'ai_events',
    'founding_members', 'founding_providers', 'analytics_events', 'audit_log', 'contact_inquiries'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public configuration (readable by anyone; writable by admins)
-- ---------------------------------------------------------------------------
create policy markets_read on public.markets for select using (true);
create policy markets_admin on public.markets for all using (public.is_admin()) with check (public.is_admin());

create policy tiers_read on public.membership_tiers for select using (is_active or public.is_staff());
create policy tiers_admin on public.membership_tiers for all using (public.is_admin()) with check (public.is_admin());

create policy privileges_read on public.privileges for select using (true);
create policy privileges_admin on public.privileges for all using (public.is_admin()) with check (public.is_admin());

create policy categories_read on public.request_categories for select using (is_active or public.is_staff());
create policy categories_admin on public.request_categories for all using (public.is_admin()) with check (public.is_admin());

create policy card_programs_read on public.card_programs for select using (is_active or public.is_staff());
create policy card_programs_admin on public.card_programs for all using (public.is_admin()) with check (public.is_admin());

-- Staff-readable configuration
create policy sla_read on public.service_level_targets for select using (public.is_staff());
create policy sla_admin on public.service_level_targets for all using (public.is_admin()) with check (public.is_admin());

create policy fees_read on public.fee_rules for select using (public.is_staff());
create policy fees_admin on public.fee_rules for all using (public.is_admin()) with check (public.is_admin());

create policy templates_read on public.notification_templates for select using (public.is_staff());
create policy templates_admin on public.notification_templates for all using (public.is_admin()) with check (public.is_admin());

create policy settings_read on public.app_settings for select using (public.is_staff());
create policy settings_admin on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

create policy organizations_staff on public.organizations for select using (public.is_staff());
create policy organizations_admin on public.organizations for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
-- Members may see the name of their relationship owner (concierge) only.
create policy profiles_owner_visible on public.profiles for select using (
  exists (
    select 1 from public.memberships m
    where m.member_id = auth.uid() and m.relationship_owner_id = profiles.id
  )
);

-- ---------------------------------------------------------------------------
-- Applications: anyone may submit; only staff may read or decide.
-- ---------------------------------------------------------------------------
create policy applications_submit on public.applications for insert to anon, authenticated
  with check (status = 'submitted' and reviewer_id is null and decision_note is null and decided_at is null and user_id is null);
create policy applications_staff_read on public.applications for select using (public.is_staff());
create policy applications_staff_update on public.applications for update using (public.is_staff()) with check (public.is_staff());

create policy partner_applications_submit on public.partner_applications for insert to anon, authenticated
  with check (status = 'submitted');
create policy partner_applications_staff on public.partner_applications for select using (public.is_staff());
create policy partner_applications_staff_update on public.partner_applications for update using (public.is_staff()) with check (public.is_staff());

create policy contact_submit on public.contact_inquiries for insert to anon, authenticated with check (handled = false);
create policy contact_staff on public.contact_inquiries for select using (public.is_staff());
create policy contact_staff_update on public.contact_inquiries for update using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Invitations: members see their own (creation via RPC); staff manage all.
-- ---------------------------------------------------------------------------
create policy invitations_own on public.invitations for select using (inviter_id = auth.uid() or public.is_staff());
create policy invitations_staff on public.invitations for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Membership & member world
-- ---------------------------------------------------------------------------
create policy memberships_own on public.memberships for select using (member_id = auth.uid() or public.is_staff());
create policy memberships_staff on public.memberships for all using (public.is_staff()) with check (public.is_staff());

create policy cards_own on public.member_cards for select using (member_id = auth.uid() or public.is_staff());
create policy cards_staff on public.member_cards for all using (public.is_staff()) with check (public.is_staff());

create policy preferences_own on public.member_preferences for all
  using (member_id = auth.uid() or public.is_staff())
  with check (
    (member_id = auth.uid() and source = 'member')
    or public.is_staff()
  );

create policy people_own on public.member_people for all
  using (member_id = auth.uid() or public.is_staff())
  with check (member_id = auth.uid() or public.is_staff());

-- ---------------------------------------------------------------------------
-- Requests
-- ---------------------------------------------------------------------------
create or replace function public.has_active_membership(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.memberships m where m.member_id = uid and m.status = 'active');
$$;

create policy requests_member_read on public.requests for select using (member_id = auth.uid() or public.is_staff());
create policy requests_member_create on public.requests for insert to authenticated with check (
  member_id = auth.uid()
  and public.has_active_membership(auth.uid())
  and assignee_id is null
  and first_responded_at is null
  and (journey_id is null or exists (select 1 from public.journeys j where j.id = journey_id and j.member_id = auth.uid()))
);
create policy requests_staff_update on public.requests for update using (public.is_staff()) with check (public.is_staff());
create policy requests_staff_insert on public.requests for insert to authenticated with check (public.is_staff());

create policy request_events_read on public.request_events for select using (
  public.is_staff()
  or exists (select 1 from public.requests r where r.id = request_id and r.member_id = auth.uid())
);

create policy messages_member_read on public.request_messages for select using (
  public.is_staff()
  or (
    visibility = 'member'
    and exists (select 1 from public.requests r where r.id = request_id and r.member_id = auth.uid())
  )
);
create policy messages_member_write on public.request_messages for insert to authenticated with check (
  author_id = auth.uid()
  and author_kind = 'member'
  and visibility = 'member'
  and exists (
    select 1 from public.requests r
    where r.id = request_id and r.member_id = auth.uid() and r.status not in ('completed', 'cancelled')
  )
);
create policy messages_staff_write on public.request_messages for insert to authenticated with check (
  public.is_staff() and author_kind in ('concierge', 'system') and author_id = auth.uid()
);

create policy options_member_read on public.request_options for select using (
  public.is_staff()
  or (
    status <> 'draft'
    and exists (select 1 from public.requests r where r.id = request_id and r.member_id = auth.uid())
  )
);
create policy options_staff on public.request_options for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Journeys
-- ---------------------------------------------------------------------------
create policy journeys_member_read on public.journeys for select using (member_id = auth.uid() or public.is_staff());
create policy journeys_staff on public.journeys for all using (public.is_staff()) with check (public.is_staff());

create policy journey_items_member_read on public.journey_items for select using (
  public.is_staff()
  or (
    status <> 'cancelled'
    and exists (select 1 from public.journeys j where j.id = journey_id and j.member_id = auth.uid())
  )
);
create policy journey_items_staff on public.journey_items for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Providers & access
-- ---------------------------------------------------------------------------
create policy providers_staff on public.providers for all using (public.is_staff()) with check (public.is_staff());

create policy access_member_read on public.access_offers for select using (
  public.is_staff()
  or (status = 'published' and public.has_active_membership(auth.uid()))
);
create policy access_staff on public.access_offers for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Intelligence & operations (staff only)
-- ---------------------------------------------------------------------------
create policy ai_events_staff_read on public.ai_events for select using (public.is_staff());
create policy ai_events_staff_update on public.ai_events for update using (public.is_staff()) with check (public.is_staff());
create policy ai_events_staff_insert on public.ai_events for insert to authenticated with check (public.is_staff());

create policy founding_members_staff on public.founding_members for all using (public.is_staff()) with check (public.is_staff());
create policy founding_providers_staff on public.founding_providers for all using (public.is_staff()) with check (public.is_staff());

create policy analytics_insert on public.analytics_events for insert to anon, authenticated with check (true);
create policy analytics_admin_read on public.analytics_events for select using (public.is_admin());

create policy audit_admin_read on public.audit_log for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants (Supabase roles). RLS still applies on top of these.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant insert on public.applications, public.partner_applications, public.contact_inquiries, public.analytics_events to anon;
grant usage on all sequences in schema public to anon, authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.check_invitation(text) to anon, authenticated;
grant execute on function public.member_issue_invitation(text, text) to authenticated;
grant execute on function public.member_respond_to_option(uuid, text) to authenticated;
grant execute on function public.member_cancel_request(uuid, text) to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.has_active_membership(uuid) to anon, authenticated;
grant execute on function public.is_trusted_context() to anon, authenticated;
grant execute on function public.request_transition_allowed(public.request_status, public.request_status) to anon, authenticated;
grant execute on function public.hash_invitation_code(text) to anon, authenticated;
grant execute on function public.touch_updated_at() to anon, authenticated;
grant execute on function public.protect_profile_privileges() to anon, authenticated;
grant execute on function public.requests_before_update() to anon, authenticated;
