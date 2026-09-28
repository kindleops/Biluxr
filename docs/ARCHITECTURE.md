# Biluxr — Architecture

One company, one codebase: the public site, the application flow, the member
app, Biluxr Command, the partner network foundation and Biluxr AI share a single
identity, design language, data model and permission model.

## Stack

| Layer        | Choice                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Framework    | Next.js 16 (App Router, React 19, Server Components, Server Actions, Turbopack)                  |
| Language     | TypeScript, `strict` + `noUncheckedIndexedAccess`; no `any` (lint error)                         |
| Styling      | Tailwind CSS v4, CSS-first tokens in `src/app/globals.css`                                       |
| Data & auth  | Supabase (Postgres, Auth with email magic links, row-level security) via `@supabase/ssr`         |
| Intelligence | Claude via `@anthropic-ai/sdk` — structured outputs validated with zod                           |
| Validation   | zod (v4) at every mutation boundary                                                              |
| Tests        | Vitest (unit + component/jsdom), a disposable-Postgres harness for SQL, Playwright + axe for e2e |

## Decision log

**1. Single Next.js application, not a monorepo.** The prompt asked for an
intentional choice. Today there is one deployable (web), one team, and every
surface shares auth, data and design tokens. A monorepo (Turborepo +
`packages/ui`, `packages/db`) would add build orchestration, version
coordination and CI complexity without a second consumer. The code is organised
so the split is mechanical if a native app or a separate Command deployment
arrives: `src/lib/domain` (pure types and rules), `src/lib/data` (repository
contract), `src/components/ui` + `src/components/brand` (design system) have no
dependency on routes.

**2. Route groups per surface.** `(site)` public marketing, `(auth)` sign-in,
`/app` member product, `/command` staff product. Each has its own layout and
guard (`requireMember`, `requireStaff`, `requireAdmin`). The proxy only refreshes
sessions and bounces signed-out visitors; authorization is re-checked in layouts
and, finally, enforced by RLS.

**3. A repository contract with two implementations.** `src/lib/data/repository.ts`
defines use-case methods (`home()`, `queue()`, `respondToOption()`…), not generic
CRUD. `src/lib/supabase/repository.ts` runs every query as the signed-in user so
RLS is the final authority; `src/lib/demo/repository.ts` is an in-memory store
that mirrors the same rules (and is unit-tested to). Screens never import
Supabase directly.

**4. Data modes.** `dataMode()` in `src/lib/env.ts`:

- `supabase` — credentials present (always wins).
- `demo` — `BILUXR_DEMO_MODE=true` **and** not a Vercel production deployment.
  A persistent banner marks every page; fixtures are fictional.
- `unavailable` — neither. Forms disable with an honest message; private
  surfaces show "not yet available". Nothing pretends to work.

**5. Member actions go through RPCs.** Members have no `UPDATE` right on
requests or options. Choosing/declining an option (`member_respond_to_option`),
withdrawing a request (`member_cancel_request`) and issuing invitations
(`member_issue_invitation`) are `SECURITY DEFINER` functions that validate
ownership, state and allowances.

**6. Lifecycle enforced twice.** `REQUEST_TRANSITIONS` (TypeScript) and
`request_transition_allowed()` (SQL trigger) define the same graph; a unit test
parses the migration and fails if they drift. Every status change and
assignment writes `request_events` from a trigger.

**7. Product truth is structural.** A member choosing an option records a
_choice_; only staff can move a request to `confirmed`. The member UI says
"Securing your choice" until then. Presence ("concierge online") is not shown
because no presence system exists. Tier fees are `NULL` until published and the
UI says so. Analytics return "—" instead of rates with zero denominators.

**8. No generic component library.** The design system is ~20 purpose-built
components (see `docs/BRAND.md`). No Radix/shadcn: native `<dialog>` provides
focus trapping and inert backgrounds for `Modal` and `Sheet`.

## Directory map

```
src/
  app/
    (site)/            public site: home, membership, concierge, partners, apply, contact, legal
    (auth)/login/      magic-link sign-in; demo persona chooser in demo mode
    auth/              callback + POST sign-out route handlers
    app/               member product (+ actions.ts)
    command/           staff product (+ actions.ts)
    sitemap.ts robots.ts opengraph-image.tsx icon.svg
  components/
    brand/             drawn wordmark + mark + lockup
    ui/                Button, Surface/GlassSurface/PaperSurface, Field…, Modal/Sheet, StatusPill, Timeline, EmptyState…
    site/ home/        public chrome and sections
    member/            composer, cards, option card, thread, membership credential
    command/           queue, request tools, AI panel, forms
  lib/
    domain/            types, lifecycle rules, zod schemas (pure, framework-free)
    data/              repository contract, factory, analytics, trusted system writes
    supabase/          clients, generated Database types, mappers, repository
    demo/              fictional fixtures + in-memory repository
    ai/                prompts, schemas, Claude boundary, intake orchestration, demo heuristic
    auth/session.ts    identity + guards
    env.ts             the only reader of process.env
supabase/
  migrations/          five ordered migrations
  seed.sql             configuration only (markets, tiers, categories, SLAs, inactive fee rules…)
  tests/auth_shim.sql  stand-in for Supabase's auth schema in local tests
tests/
  unit/ component/     Vitest
  db/                  node:test against a disposable Postgres
  e2e/                 Playwright (demo production build)
```

## Data model (summary)

Configuration: `markets`, `membership_tiers`, `privileges`, `request_categories`
(with `vertical`), `service_level_targets`, `fee_rules` (inactive by default),
`card_programs`, `notification_templates`, `app_settings`, `organizations`.

People & membership: `profiles` (1:1 `auth.users`, role enum), `applications`,
`invitations` (SHA-256 hashed codes), `memberships` (member number sequence,
founding flag, relationship owner), `member_cards`, `member_preferences`,
`member_people`.

Service: `requests` (reference, lifecycle, priority, SLA stamps, `vertical`,
`details jsonb`), `request_events`, `request_messages` (`member` | `internal`
visibility), `request_options`, `journeys`, `journey_items`, `providers`,
`partner_applications`, `access_offers`.

Intelligence & operations: `ai_events`, `founding_members`,
`founding_providers`, `analytics_events` (no PII), `audit_log`,
`contact_inquiries`.

Generated types: `npm run db:types` migrates a disposable Postgres and writes
`src/lib/supabase/database.types.ts`.

## Security model

- **Roles**: `applicant`, `member`, `concierge`, `admin`, `provider` on
  `profiles.role`. Helpers `is_staff()`, `is_admin()` are `SECURITY DEFINER`
  with pinned `search_path`.
- **Escalation guard**: a trigger rejects role/organization changes unless the
  caller is an admin or a trusted server context.
- **RLS on every table.** Members read only their own rows; internal messages,
  draft options, providers, AI events, SLAs and fee rules are staff-only;
  analytics and audit logs are admin-only. Anonymous users may insert
  applications/partner/contact submissions with constrained columns and
  nothing else.
- **Account creation**: sign-in links create accounts only for approved
  applicants (`shouldCreateUser` decided server-side with the service role);
  responses are identical for unknown emails (no enumeration).
- **Service role** is used only in `server-only` modules for AI event logging on
  member-initiated requests, sign-in eligibility and analytics.
- **Headers**: HSTS, `X-Frame-Options: DENY`, `nosniff`, strict referrer,
  restrictive `Permissions-Policy`.
- **Abuse**: honeypot fields + per-instance rate limiting on public forms (a
  speed bump; swap for a shared store if abuse appears).
- **Audit**: triggers log changes to profiles, memberships, applications, tiers
  and fee rules with before/after values.

Verified by 35 database tests (`npm run test:db`).

## Extension points (not built)

| Future product    | Where it plugs in                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Biluxr Aviation   | `vertical = 'aviation'` categories; legs/manifests in `requests.details` until promoted to tables; providers as operators         |
| Biluxr Residences | `vertical = 'residences'`; `providers` for managed properties; journeys already model stays                                       |
| Biluxr Private    | `membership_tiers.private` (inactive); relationship owner + team model                                                            |
| Biluxr Enterprise | `organizations` + `profiles.organization_id` / `memberships.organization_id`                                                      |
| Biluxr Network    | `providers`, `founding_providers`, `partner_applications`, provider role                                                          |
| Payments          | `fee_rules`, `integrationStatus()`; Stripe env vars reserved; payment authorization page states payments are not enabled          |
| Notifications     | `notification_templates`; no delivery provider wired                                                                              |
| Sound             | Not implemented. If added: opt-in, muted by default, a `SoundProvider` gated by a stored preference and `prefers-reduced-motion`. |
