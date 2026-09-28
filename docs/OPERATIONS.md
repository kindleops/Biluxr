# Launch & operations

## Founding cohort

Target: **25 members, 25 providers**, curated by hand (`app_settings.founding_cohort_target`).

Command → _Founding cohort_ tracks:

- **Members** (`founding_members`): referral source, application, relationship
  owner, onboarding status, preferences completed, first request date,
  satisfaction (1–5), referral potential. Onboarding moves through
  `not_started`, `welcome_call`, `preferences`, `first_request`, `established`.
- **Providers** (`founding_providers`): category and market (from `providers`),
  vetting, terms, test request, performance note, preferred status.

Rows are created by staff (SQL or future admin forms); providers flagged
"founding" in Command are added automatically.

## Membership lifecycle

1. Application submitted on `/apply` (anonymous insert, RLS-constrained).
2. Reviewed in Command → _Applications_ (`in_review`, `conversation`,
   `approved`, `waitlisted`, `declined`).
3. On approval, the applicant signs in with the same email. A trigger creates
   their profile as `member` and a membership `pending_activation` with the
   next member number.
4. Staff activate in Member 360 (founding cohort / off-platform payment), or a
   future payment webhook activates on successful charge.
5. Active members can send requests, see access offers and issue invitations
   within their tier allowance.

## Markets

`markets` holds service regions with status `planned | preparing | active |
paused`. Seeded: Miami & South Florida as **preparing**; New York, Los Angeles,
Aspen, St. Barthélemy, London, Paris, Milan, Monaco, Ibiza, Mykonos, Dubai,
Tokyo, Singapore as **planned**. Public copy says Biluxr is _opening first in
Miami_ and does not claim active operations anywhere.

## Business model configuration

Nothing is charged from code. `membership_tiers` hold annual and initiation fees
(currently `NULL` = unpublished). `fee_rules` model service fees, commissions,
premium sourcing and aviation margin — all **inactive** with zero values until
an administrator sets them. The audit log records every change.

Supported revenue streams by design: annual membership, initiation fee,
booking/service fee, commissions, partner economics, premium sourcing, travel
management, enterprise/private office contracts (`organizations`), residence
services (`vertical = residences`), aviation economics (`vertical = aviation`).

## Service levels

`service_level_targets`: urgent 15 min / 4 h, priority 60 min / 12 h,
standard 240 min / 48 h (first response / options). The queue orders by
unanswered-and-soonest-due first; the first member-visible staff reply stamps
`first_responded_at` (internal notes do not).

## Analytics (privacy-conscious)

`analytics_events` stores an event name, a few non-identifying properties and
an optional salted hash of the user id — no names, emails, IPs or request text.
Events: applications, requests, option decisions, cancellations, invitations,
application decisions, activations, AI review outcomes.

Command → _Analytics_ computes live from records: applications, approvals,
active/pending members, requests by status and category, median first
response, SLA attainment, option acceptance, provider counts, AI review
outcomes. GMV, take rate, retention and referral conversion are explicitly
listed as _not yet measured_ until payments and history exist.

## Configuration surface

Command → _Configuration_ (admins) shows integrations status, tiers,
privileges, SLAs, revenue rules, markets, categories, card programs and
notification templates, and — in demo mode — a reset control.
