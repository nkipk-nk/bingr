# bingr

Track movies and TV shows — watchlist, ratings, episode-by-episode progress, a diary,
stats, curated lists, follows, and an activity feed. React + Vite on the frontend,
Supabase (Postgres + Auth + RLS) on the backend, TMDB for catalogue metadata.

Live at [bingr-tawny.vercel.app](https://bingr-tawny.vercel.app/).

## Stack

- **Frontend:** React 19, Vite 8 (Rolldown build engine)
- **Backend:** Supabase — Postgres with Row Level Security, Auth (email + Google OAuth, PKCE flow), one Edge Function (`delete-account`)
- **Catalogue data:** [TMDB API](https://www.themoviedb.org/documentation/api)
- **Error tracking:** Sentry
- **Hosting:** Vercel
- **CI:** GitHub Actions — lint + build on every push/PR to `main` ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))

## Local setup

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run dev
```

### Environment variables

Create `.env` in the project root (never committed — see `.gitignore`):

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase project → Settings → API (the `anon`/public key — safe to expose client-side, RLS is the real access boundary) |
| `VITE_TMDB_API_KEY` | [TMDB](https://www.themoviedb.org/settings/api) → API Settings |
| `VITE_SENTRY_DSN` | Sentry project → Settings → Client Keys (optional — the app runs fine without it; Sentry only activates in production builds) |

The `delete-account` Edge Function additionally needs, set as **Supabase Edge Function
secrets** (not in `.env` — the service role key must never reach the client):

| Variable | Notes |
|---|---|
| `SUPABASE_URL` | Same project |
| `SUPABASE_ANON_KEY` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API — bypasses RLS, keep this out of any client-reachable code |
| `ALLOWED_ORIGIN` | The deployed app origin (e.g. `https://bingr-tawny.vercel.app`) — CORS is pinned to this rather than `*` |

## Database setup

Schema and RLS policies live in [`supabase/`](supabase/) and are tracked in git —
they're the source of truth for what's actually enforced, not just documentation of it.

Two kinds of file:

- **`supabase/supabase_*.sql`** — the original table definitions (comments, diary, follows,
  lists, the profile-creation trigger, admin/donations/feedback tables). Run once, in any
  order, against a fresh project. `profiles`, `bingr_library`, and `bingr_episodes` predate
  this file layout and aren't captured here — pull the live schema with
  `supabase db pull` if bootstrapping a new environment from scratch.
- **`supabase/migrations/*.sql`** — dated, sequential fixes and additions applied to the
  already-running production database. **Run these in filename order** (they're prefixed
  by date, so alphabetical order is chronological order); each one is idempotent and
  documents in its own header comment what it does, why, and how to verify it applied
  correctly. Apply via the Supabase Dashboard's SQL Editor, or the Supabase CLI once the
  project is linked (`supabase db push`).

To bootstrap a brand-new Supabase project: run the `supabase_*.sql` files first, then every
file in `supabase/migrations/` in order.

## Scripts

```bash
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # preview a production build locally
npm run lint      # ESLint — this is also what CI runs
```

## Project layout

```
src/
  components/   shared UI components (MovieCard, DetailPanel, EpisodeTracker, ...)
  pages/        route-level views, most lazy-loaded off the critical path in App.jsx
  hooks/        one hook per data domain (useLibrary, useDiary, useFollows, ...) —
                this is the data-access layer; components don't call Supabase directly
  lib/          supabase.js, tmdb.js (client + cache), stats.js, export.js, constants.js
supabase/
  *.sql              original table/policy definitions
  migrations/         dated fixes and additions, run in order — see above
  functions/          Edge Functions (delete-account)
```

## Contributing / auditing this repo

[`BINGR_AUDIT_REPORT.md`](BINGR_AUDIT_REPORT.md) is a living record of a full software
audit of this codebase, kept up to date as findings are fixed — architecture notes, the
full functional/security audit, and a status tracker for every finding. Read it before
making structural changes; it explains a lot of *why* the code looks the way it does.
