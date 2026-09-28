@AGENTS.md

# Biluxr — notes for agents

- Read `docs/ARCHITECTURE.md` first. Screens talk to `src/lib/data` repositories only; never import Supabase in components.
- Every schema change: add a new migration in `supabase/migrations`, then `npm run db:types` and `npm run test:db`.
- Keep `REQUEST_TRANSITIONS` (TS) and `request_transition_allowed` (SQL) identical — a unit test enforces it.
- Product truth: never show a state the data does not hold (no fake confirmations, presence, benefits, metrics).
- Copy rules and banned words: `docs/BRAND.md`.
- Before finishing: `npm run verify`, `npm run test:db`, `npm run build && npm run test:e2e`.
- Demo fixtures (`src/lib/demo`) are fictional and must never be imported by Supabase-mode code paths.
