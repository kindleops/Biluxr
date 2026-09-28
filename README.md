# Biluxr

**One relationship for an exceptional life.**

Biluxr is a private membership: one concierge relationship that coordinates
travel, stays, tables, access and every detail between — remembered, and
handled. This repository contains the whole company in one codebase:

| Surface        | Path                                                                                                  | For                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Public site    | `/`, `/membership`, `/concierge`, `/partners`, `/contact`, `/legal/*`                                 | Prospective members and partners                                           |
| Application    | `/apply` (supports `?invitation=CODE`)                                                                | Applicants                                                                 |
| Member app     | `/app` — Home, Concierge, Journeys, Access, Membership, Profile                                       | Members                                                                    |
| Biluxr Command | `/command` — Queue, Members (360), Applications, Providers, Founding cohort, Analytics, Configuration | Concierge team and administrators                                          |
| Biluxr AI      | Inside Command                                                                                        | Intent extraction, clarifying questions, summaries — always human-reviewed |

## Quick start (demo mode — no accounts needed)

```bash
npm install
cp .env.example .env.local        # then set BILUXR_DEMO_MODE=true
npm run dev                       # http://localhost:3000
```

Open `/login` and choose a fictional persona: **Elena Voss** (member),
**Isabel Moreau** (concierge) or **Rhea Linden** (administrator). Demo data is
fictional, lives in memory and resets on restart; a banner marks every page.
Demo mode is refused on Vercel production deployments.

## With Supabase

1. Create a Supabase project. Apply `supabase/migrations/*` in order, then
   `supabase/seed.sql` (or `supabase db push` + `supabase db reset` with the CLI;
   `supabase/config.toml` is included).
2. Auth → URL configuration: site URL = your origin; redirect URL =
   `<origin>/auth/callback`. Email sign-in (magic link) enabled.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SITE_URL`.
4. Create the first administrator: sign in once, then in SQL
   `update profiles set role = 'admin' where email = '…';`
5. Optional: `ANTHROPIC_API_KEY` for Biluxr AI, `BILUXR_ANALYTICS_SALT`.

Everything that needs a credential degrades to an honest "not yet available"
state without it.

## Scripts

| Command                                                                     | What it does                                                                                                         |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run dev` / `build` / `start`                                           | Next.js                                                                                                              |
| `npm run verify`                                                            | typecheck + lint + format check + unit/component tests                                                               |
| `npm run test:db`                                                           | Spins up a disposable Postgres, applies every migration + seed, runs 35 RLS/trigger/RPC tests                        |
| `npm run test:e2e`                                                          | Playwright against a production build in demo mode (6 viewports, axe, full request loop). Run `npm run build` first. |
| `npm run test:all`                                                          | All of the above                                                                                                     |
| `npm run db:types`                                                          | Regenerate `src/lib/supabase/database.types.ts` from the migrations                                                  |
| `npm run shots -- <outDir> <paths> <viewports> [--persona=member] [--full]` | Screenshots for visual review                                                                                        |

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, decision log (incl. why not a monorepo), data model, security model, extension points
- [`docs/BRAND.md`](docs/BRAND.md) — identity, tokens, components, copy system, art direction, motion
- [`docs/AI.md`](docs/AI.md) — Biluxr AI design, review loop, logging
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — founding cohort, membership lifecycle, markets, business configuration, analytics
- [`docs/AUDIT.md`](docs/AUDIT.md) — Phase 0 repository audit

## Credentials not yet provided

| Integration    | Env                                                                                      | Status without it                                                                      |
| -------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Supabase       | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Demo or unavailable mode                                                               |
| Anthropic      | `ANTHROPIC_API_KEY`                                                                      | AI panel shows "not configured" (demo uses a labelled heuristic)                       |
| Stripe         | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                                             | Not integrated; staff activate memberships manually                                    |
| Email delivery | —                                                                                        | Supabase Auth sends sign-in links; notification templates exist but no sender is wired |
