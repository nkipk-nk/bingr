# Bingr — Full Software Audit

**Audited:** 3 August 2026
**Commit:** `af25c08` (added comments) · branch `main`
**Repository:** https://github.com/nkipk-nk/bingr
**Deployment:** https://bingr-tawny.vercel.app/ · bundle `assets/index-BdzocJCx.js`
**Backend:** Supabase project `ooyatastdqqxflfnlngu`
**Method:** full source read (7,112 LOC across 46 files) + live verification against the production
Supabase REST API, Edge Functions, and the deployed Vercel bundle — authenticated as `claude@test.com`
(user), `claudeadmin@test.com` (admin), and a disposable probe account.

> **Verification note.** Findings marked **[VERIFIED LIVE]** were reproduced against the production
> backend or the deployed bundle, not inferred from source. All test rows and accounts written during
> the audit were removed (see §9 Audit Footprint). One privilege-escalation test temporarily set the
> test account's role to `admin`; **it was reverted to `user` and confirmed reverted.**

> **Revision 2 (post-audit information from the maintainer).** Three inputs changed findings and are
> reflected throughout:
> 1. **Email confirmation has been disabled.** This **resolves C4** for new signups — re-verified live.
>    The underlying code defect survives as **M21** and will silently regress if confirmation is ever
>    re-enabled.
> 2. **An admin account was provided**, allowing the admin surface to be verified directly and the
>    remaining audit residue to be cleaned. This produced one **new finding, C8**.
> 3. **Manual country selection is a deliberate design decision**, not an oversight — browser/GPS
>    geolocation was tried and had problems. `geo.js` is therefore *superseded*, not abandoned;
>    §7.4 and **m4** are corrected accordingly, and the related CSP recommendation is withdrawn.

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Architecture & Methodology Review](#2-architecture--methodology-review)
3. [UI/UX & State Audit](#3-uiux--state-audit-page-by-page)
4. [Functional Audit](#4-functional-audit)
5. [Code Quality Findings](#5-code-quality-findings)
6. [Recommendations](#6-recommendations-mapped-to-findings)
7. [Incomplete / Unfinished Areas](#7-incomplete--unfinished-areas)
8. [Priority Roadmap](#8-priority-roadmap)
9. [Audit Footprint](#9-audit-footprint)

---

## 1. Project Summary

Bingr is a Letterboxd/Trakt-style movie & TV tracker built as a single-page React 19 app on Vite 8,
with Supabase for auth + Postgres + RLS, and TMDB for catalogue metadata. It is deployed on Vercel
and positioned for a Kenyan audience (M-Pesa support flow, KES amounts, `en-KE` date formatting,
Kenya Data Protection Act 2019 privacy policy, "Made in Nairobi 🇰🇪").

### What exists

| Area | Files | State |
|---|---|---|
| Auth (email + Google OAuth, PKCE, reset) | [useAuth.js](src/hooks/useAuth.js), [AuthPage.jsx](src/pages/AuthPage.jsx), [ForgotPassword.jsx](src/pages/ForgotPassword.jsx), [ResetPassword.jsx](src/pages/ResetPassword.jsx) | Built — **signup has a silent data-loss bug (C4)** |
| Library (watchlist/watching/watched + 10-pt ratings) | [useLibrary.js](src/hooks/useLibrary.js), [LibraryTab.jsx](src/pages/LibraryTab.jsx), [Rankings.jsx](src/pages/Rankings.jsx) | Working |
| Episode tracking | [useEpisodes.js](src/hooks/useEpisodes.js), [EpisodeTracker.jsx](src/components/EpisodeTracker.jsx) | Working |
| Diary | [useDiary.js](src/hooks/useDiary.js), [DiaryPage.jsx](src/pages/DiaryPage.jsx), [LogEntryModal.jsx](src/components/LogEntryModal.jsx) | Working — **but world-readable (C5)** |
| Stats | [stats.js](src/lib/stats.js), [StatsPage.jsx](src/pages/StatsPage.jsx) | Working |
| Lists + public sharing | [useLists.js](src/hooks/useLists.js), [ListsPage.jsx](src/pages/ListsPage.jsx), [PublicListPage.jsx](src/pages/PublicListPage.jsx) | Working |
| Follows | [useFollows.js](src/hooks/useFollows.js), [FindPeople.jsx](src/components/FindPeople.jsx) | Working |
| Activity feed | [useFeed.js](src/hooks/useFeed.js), [ActivityFeed.jsx](src/pages/ActivityFeed.jsx) | **Broken in production (C3)** |
| Public profiles | [UserProfilePage.jsx](src/pages/UserProfilePage.jsx) | **Crashes on every load (C1)** |
| Comments + reporting | [useComments.js](src/hooks/useComments.js), [CommentsSection.jsx](src/components/CommentsSection.jsx), [moderation.js](src/lib/moderation.js) | Built — **enforcement is client-only (C6, C7)** |
| Admin panel | [useAdmin.js](src/hooks/useAdmin.js), [AdminPanel.jsx](src/pages/AdminPanel.jsx) | Built — **gate is bypassable (C2)** |
| Export | [export.js](src/lib/export.js), [ExportPanel.jsx](src/components/ExportPanel.jsx) | Working — library only |
| Legal pages | [PrivacyPolicy.jsx](src/pages/PrivacyPolicy.jsx), [TermsOfService.jsx](src/pages/TermsOfService.jsx) | Present — **unreachable from landing (M4)**, content inaccurate (M15) |
| Monetization (M-Pesa) | [SupportButton.jsx](src/components/SupportButton.jsx), `bingr_donations` | **Manual/placeholder — see §7** |

### Headline verdict

The feature *surface* is impressively complete for a solo build — nine tabs, social graph, moderation
UI, admin panel, legal pages, Sentry, CSP. But **two flagship features are wholly non-functional in
production** (public profiles, activity feed), and **the security model has a privilege-escalation
hole that lets any registered user become an admin**. None of these are visible from the UI without
probing, which is exactly why they've survived. *(A third — email-signup username capture — was also
broken and has since been resolved by disabling email confirmation; see C4/M21.)*

The root cause is consistent: **there is no automated gate between "code written" and "code live."**
ESLint reports 44 errors — including the exact rule that catches the public-profile crash — but
`npm run build` doesn't run it and there is no CI. Every critical finding below would have been caught
by either running `npm run lint` or by a single smoke test of the affected route.

---

## 2. Architecture & Methodology Review

### 2.1 Is React + Vite + Supabase well-utilised?

**Broadly yes, with one structural gap.** The hook-per-domain layering is genuinely good:

```
src/lib/       supabase.js · tmdb.js · logger.js · errors.js · stats.js · export.js · moderation.js
src/hooks/     useAuth · useLibrary · useEpisodes · useLists · useDiary · useFollows · useFeed · useProfile · useComments · useAdmin
src/pages/     19 page components
src/components/ 13 shared components
```

Data access is *not* scattered — every table read/write lives in a hook, and `supabase` is imported
in only 13 files. That's better separation than most projects this size. `errors.js` provides
`withRetry()` with exponential backoff, applied consistently in `useLibrary`, `useEpisodes`,
`useDiary`, `useLists`.

**The gap: there is no data layer, only a fetching layer.** Every hook is a `useState` +
`useCallback(load)` + `useEffect(load)` triple that re-implements caching, staleness, and error
handling by hand — and each does it slightly differently:

- `useLibrary` exposes `error`; `useEpisodes` swallows it entirely ([useEpisodes.js:22-24](src/hooks/useEpisodes.js#L22-L24))
- `useDiary`/`useLists` expose `loading`; `useEpisodes` doesn't
- `useFeed` never auto-loads and latches on `loaded` so it can't refresh ([useFeed.js](src/hooks/useFeed.js), see **M6**)
- `useComments` reloads on every `DetailPanel` mount with no cache

All nine hooks mount at once in [App.jsx:68-76](src/App.jsx#L68-L76) against `session`, meaning a
logged-in page load fires ~8 parallel Supabase round-trips before first paint. There is no request
deduplication, no stale-while-revalidate, no cross-hook invalidation. Rating a title updates
`bingr_library` but nothing tells `useFeed` or `StatsPage` to reconsider.

### 2.2 TMDB integration — no caching layer at all

[tmdb.js](src/lib/tmdb.js) is 23 lines: a bare `fetch` wrapper with the API key appended to every
URL. There is:

- **no cache** — reopening the same title refetches details + providers + recommendations every time
- **no in-flight deduplication**
- **no retry** (`withRetry` exists in `errors.js` but is never applied to TMDB)
- **no timeout / AbortController**
- **one ad-hoc cache**: a module-level `const seasonsCache = {}` at [App.jsx:52](src/App.jsx#L52), which is never invalidated and never bounded

The most expensive consequence is an **N+1 fan-out** at [App.jsx:160-168](src/App.jsx#L160-L168):

```js
useEffect(() => {
  Object.values(library)
    .filter(x => x.media_type === 'tv' && !seasonsCache[x.tmdb_id])
    .forEach(show => { tmdb.tvDetails(show.tmdb_id).then(...).catch(() => {}) })
}, [library])
```

This fires one TMDB request **per TV show in the library**, and `library` is a new object identity on
every rating/status change, so the effect re-runs constantly. A user with 60 tracked shows generates
a 60-request burst on load. TMDB's soft limit is ~50 req/s per IP — this will start 429ing, and the
`.catch(() => {})` means the failure is completely silent: the Watchlist tab just shows no episode
progress with no explanation.

The API key is a `VITE_` variable and therefore **public in the bundle** (confirmed: it's extractable
from `assets/index-BdzocJCx.js`). That is inherent to a client-only TMDB integration and is TMDB's own
documented model for client keys — but it does mean the key can be scraped and burned by a third
party, and you have no ability to rotate without a redeploy.

### 2.3 Do RLS policies match actual query patterns?

**No — three mismatches, all verified live.**

**(a) Read policies are broader than the UI implies.** `bingr_diary` has:

```sql
create policy "Public diary visible to all" on public.bingr_diary for select using (true);
```
— [supabase_diary.sql:25-27](supabase/supabase_diary.sql#L25-L27)

[VERIFIED LIVE] An unauthenticated request returns every diary row in the database, including private
notes:

```
GET /rest/v1/bingr_diary?select=* (anon key only)
→ [{"user_id":"263aa096…","title":"Obsession","watched_date":"2026-06-13",
    "rating":7,"notes":"looks ok"}]
```

Meanwhile [UserProfilePage.jsx:36](src/pages/UserProfilePage.jsx#L36) checks
`if (profileData.profile_public === false) { setNotFound(true) }`. **The privacy control exists in the
UI and is not enforced in the database.** A user who sets their profile private still has their entire
diary readable by anyone with the anon key.

**(b) The `profiles` UPDATE policy has no column restriction.** See **C2** — this is the escalation.

**(c) Two feed queries reference a foreign key that does not exist.** See **C3**.

**(d) `bingr_comments.username` is unconstrained free text.** See **C6**.

### 2.4 Are social features architected to scale?

Honest answer: **they're architected to work for ~100 users, not 10,000.**

- **Fan-out on read via `IN` list.** [useFeed.js:22](src/hooks/useFeed.js#L22) does
  `.in('user_id', following)`. `following` is the full array of followed user IDs, serialised into
  the query string. At ~200 follows this approaches URL-length limits; at 1,000 it breaks outright.
  The correct shape is a server-side view or RPC that joins `bingr_follows` inside Postgres.
- **Client-side merge and sort.** The feed pulls 60 diary rows + 40 library rows, merges, dedupes,
  sorts, and slices to 80 — in the browser ([useFeed.js:68-74](src/hooks/useFeed.js#L68-L74)). No
  pagination, no cursor, no "load more."
- **Follower counts are two `count: exact` queries per profile view**
  ([useFollows.js:67-70](src/hooks/useFollows.js#L67-L70)) rather than denormalised counters.
- **No notifications table, no activity table.** The "feed" is a synthetic join over two domain
  tables, which is why adding a third activity type (comments, list creation, follows) would require
  a third query and a third merge branch.
- **Moderation has no backend.** See **C7** — every guard is in the browser.

Indexes are reasonable where they exist (`idx_diary_user_date`, `idx_follows_follower`,
`idx_follows_following`, `idx_library_user_updated`, `idx_comments_title`), which suggests the
indexing was thought about. But `bingr_comments` is queried by `(tmdb_id, media_type, status)` and the
index is `(tmdb_id, media_type, created_at desc)` — the `status = 'visible'` filter isn't covered.

### 2.5 Security hardening — CSP, Sentry, headers

**CSP is genuinely enforced.** [VERIFIED LIVE] `curl -D-` on the deployed site returns the full header
set from [vercel.json](vercel.json): CSP, HSTS with preload, `X-Frame-Options: DENY`, `nosniff`,
`Referrer-Policy`, `Permissions-Policy`. This is real hardening, not decoration. Three caveats:

1. **`script-src 'unsafe-inline'`** substantially weakens the CSP's XSS value. It's likely there for
   the three inline `<style>` blocks in [MovieCard.jsx:82](src/components/MovieCard.jsx#L82),
   [LogEntryModal.jsx:25](src/components/LogEntryModal.jsx#L25),
   [SupportButton.jsx:61](src/components/SupportButton.jsx#L61) — but those need `style-src`, not
   `script-src`.
2. **`img-src` omits `https://lh3.googleusercontent.com`.** [OnboardingModal.jsx:92](src/components/OnboardingModal.jsx#L92)
   renders `session.user.user_metadata.avatar_url` for Google OAuth users. That URL is on Google's CDN
   and will be **blocked by CSP** — broken avatar on the first screen every Google signup sees.
3. **`connect-src` omits the three geolocation providers** in [geo.js:18-20](src/lib/geo.js#L18-L20)
   (`ipapi.co`, `ipwho.is`, `ip-api.com`). Currently harmless because `geo.js` is dead code — but it
   is a landmine for whoever wires it up.

**Sentry is correctly wired.** [main.jsx:10-34](src/main.jsx#L10-L34) initialises with
`enabled: import.meta.env.PROD`, a `beforeSend` that strips cookies and masks the email local-part,
and exposes `window.__Sentry__` so [logger.js](src/lib/logger.js) can reach it without an import
cycle. `ErrorBoundary` reports render errors with a component stack and a user-facing error ID. That's
a thoughtful setup.

**But Sentry's coverage has a hole that matters here.** `logger.error` is only reached when code
*throws or explicitly calls it*. The two most severe runtime failures in this app do neither:

- `useFeed` destructures `const { data: diaryData } = await supabase...` and **never reads `error`**
  ([useFeed.js:19](src/hooks/useFeed.js#L19)). The query returns HTTP 400; `data` is `undefined`;
  `(diaryData || [])` yields `[]`; no throw, no log, no Sentry event. The feed has been silently empty
  since it shipped.
- `useAuth.signUp`'s retry loop treats an RLS-filtered zero-row UPDATE as success (**C4**), so its
  `logger.warn('Username save failed after retries')` never fires either.

So Sentry is configured correctly and is nonetheless blind to both. The lesson is that **error
capture built on `catch` can't see failures that never throw** — which is precisely the failure mode
PostgREST produces.

### 2.6 Routing and state — the hand-rolled router

There is no router library. [App.jsx:55-65](src/App.jsx#L55-L65) parses `window.location.pathname`
with regexes, and `navigate()` ([App.jsx:120-132](src/App.jsx#L120-L132)) pushes history entries using
a hardcoded `urlMap`. Consequences:

- `urlMap` has no entry for `user-profile` or `public-list`, so `navigate()` on those routes falls
  through to `|| '/'` — **the URL silently becomes `/` while the page content stays**. Back/forward
  and refresh then disagree with what's on screen.
- Navigation to a profile is done with `window.location.href = '/@' + username`
  ([App.jsx:365](src/App.jsx#L365), [App.jsx:451](src/App.jsx#L451),
  [App.jsx:457](src/App.jsx#L457), [DetailPanel.jsx:246](src/components/DetailPanel.jsx#L246)) — a
  **full page reload**, discarding all nine hooks' loaded state and re-running every query.
- The username regex `^\/@([a-z0-9_]+)$` is stricter than nothing but there's no 404 route, no
  `/privacy` deep link handling on load (only via `navigate`), and no scroll restoration.

State management is prop-drilling from `App.jsx`, which passes `episodeProps` (a 9-key object rebuilt
every render, [App.jsx:229-239](src/App.jsx#L229-L239)) and whole hook objects (`feedHook`,
`listsHook`, `diaryHook`, `followsHook`, `adminHook`) down to pages. For an app this size that's
tolerable, but it forces every state change in any domain to re-render the entire tree.

---

## 3. UI/UX & State Audit (page by page)

Legend: ✅ present and correct · ⚠️ present but flawed · ❌ missing · 💥 broken

| Page | Empty | Loading | Error | Success | Notes |
|---|---|---|---|---|---|
| **Landing** ([LandingPage.jsx](src/pages/LandingPage.jsx)) | n/a | n/a | n/a | n/a | ⚠️ Footer Privacy/ToS links are **dead** (**M4**) |
| **Auth** ([AuthPage.jsx](src/pages/AuthPage.jsx)) | n/a | ✅ "Please wait…" | ✅ mapped via `friendlyAuthError` | ✅ 📬 confirm screen + resend | Best-executed page in the app |
| **Forgot password** | n/a | ✅ "Sending…" | ✅ | ✅ 📬 screen | ✅ Solid |
| **Reset password** | n/a | ✅ "Verifying reset link…" | ✅ | ✅ ✅ screen | ✅ Also handles expired-link state |
| **Discover** ([App.jsx:420-444](src/App.jsx#L420-L444)) | ✅ "No results for…" | ✅ "Searching…" | ✅ 📡 retry card | ✅ toast | ⚠️ Trending has no skeleton — blank until resolved |
| **Watchlist / Watching / Watched** ([LibraryTab.jsx](src/pages/LibraryTab.jsx)) | ✅ per-status icon + copy | ❌ **none** | ⚠️ global banner only | ✅ toast | No loading state; list pops in |
| **Rankings** ([Rankings.jsx](src/pages/Rankings.jsx)) | ✅ 🏆 | ❌ none | ❌ none | n/a | Derived from `library`, inherits its states |
| **Stats** ([StatsPage.jsx](src/pages/StatsPage.jsx)) | ✅ 📊 | ❌ none | ❌ none | n/a | ⚠️ `gridTemplateColumns: '1fr 1fr'` fixed ([:112](src/pages/StatsPage.jsx#L112)) — squishes on mobile |
| **Diary** ([DiaryPage.jsx](src/pages/DiaryPage.jsx)) | ✅ 📔 | ✅ "Loading…" | ❌ none | ⚠️ **no confirm on delete** | Entry delete is one click, irreversible |
| **Lists** ([ListsPage.jsx](src/pages/ListsPage.jsx)) | ✅ 📋 + CTA | ✅ | ❌ none | ✅ "✓ Copied" | ✅ Best empty state in the app |
| **Public list** ([PublicListPage.jsx](src/pages/PublicListPage.jsx)) | ✅ "This list is empty" | ✅ | ✅ 🔍 not-found | n/a | ✅ Correct `.catch()` — the only page that has one |
| **Feed** ([ActivityFeed.jsx](src/pages/ActivityFeed.jsx)) | ✅ 🌐 / 😴 two states | ✅ | ❌ **none** | n/a | 💥 **Always empty (C3)**; ⚠️ CTA is a dead click (**M5**) |
| **Public profile** ([UserProfilePage.jsx](src/pages/UserProfilePage.jsx)) | ✅ per-tab `<Empty/>` | ✅ | ✅ 🔍 not-found | n/a | 💥 **Crashes before any of it renders (C1)** |
| **Own profile** ([ProfilePage.jsx](src/pages/ProfilePage.jsx)) | n/a | ✅ "Saving…" | ✅ inline | ✅ "✓ Profile saved" | ❌ No privacy toggle, no bio field, no data export |
| **Detail panel** ([DetailPanel.jsx](src/components/DetailPanel.jsx)) | ✅ "No streaming info" | ⚠️ "Loading..." | ❌ **no `.catch()`** (**M7**) | ✅ toasts + "✓ Added to" | On TMDB failure, stuck at "Loading..." forever |
| **Episode tracker** ([EpisodeTracker.jsx](src/components/EpisodeTracker.jsx)) | ⚠️ blank if no episodes | ✅ "Loading episodes..." | ❌ **no `.catch()`** | ✅ instant checkbox | Unaired episodes correctly disabled |
| **Comments** ([CommentsSection.jsx](src/components/CommentsSection.jsx)) | ✅ "Be the first…" | ✅ | ✅ inline | ⚠️ **no success toast** on post | Comment appears optimistically |
| **Admin** ([AdminPanel.jsx](src/pages/AdminPanel.jsx)) | ✅ per tab | ✅ | ❌ **none** | ⚠️ **no feedback on any action** | `hideComment`/`promoteUser` return errors that are discarded |
| **Delete account** ([DeleteAccount.jsx](src/pages/DeleteAccount.jsx)) | n/a | ✅ ⏳ step 3 | ✅ ❌ step 5 | ✅ ✅ step 4 | ✅ Best multi-step flow; ⚠️ copy says "watchlist" twice ([:36](src/pages/DeleteAccount.jsx#L36)) |
| **Supporters** ([SupportersPage.jsx](src/pages/SupportersPage.jsx)) | ✅ "be the first" | ✅ | ❌ **no `.catch()`** | n/a | Stuck at "Loading…" if query fails |
| **Privacy / Terms** | n/a | n/a | n/a | n/a | Static; content issues in **M15** |

### 3.1 Visual consistency

The design *language* is consistent — CSS custom properties in [index.css](src/index.css) give a
coherent palette with automatic dark mode, and the accent `#E8392A`, 12–16px radii, and
`--bg-card` / `--border` treatment are applied uniformly. Visually the app hangs together well.

The *implementation* is not. **929 inline `style={{…}}` objects** across 32 files, with no shared
component primitives. The same button is redefined dozens of times:

```js
// AuthPage.jsx:229
const BtnFull = { width:'100%', padding:'10px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontFamily:'inherit', fontWeight:500 }
// ForgotPassword.jsx:73
const BtnPrimary = { width:'100%', padding:'10px', background:'var(--accent)', … marginBottom:10 }
// ResetPassword.jsx:127
const BtnPrimary = { width:'100%', padding:'10px', background:'var(--accent)', … }
// FeedbackModal.jsx:111
const BtnPrimary = { padding:'10px', background:'var(--accent)', … }
```

Nine files independently declare a near-identical `const I = {…}` input style. `RATING_LABELS` — the
same 11-string array — is duplicated in **six** files ([App.jsx:206](src/App.jsx#L206),
[export.js:7](src/lib/export.js#L7), [StarRating.jsx:3](src/components/StarRating.jsx#L3),
[LogEntryModal.jsx:3](src/components/LogEntryModal.jsx#L3),
[ActivityFeed.jsx:4](src/pages/ActivityFeed.jsx#L4),
[UserProfilePage.jsx:6](src/pages/UserProfilePage.jsx#L6),
[Rankings.jsx:4](src/pages/Rankings.jsx#L4) as `LABELS`). Same for `STATUS_COLORS` (3×) and
`STATUS_LABELS` (4×, with **different values** — `MovieCard` says `'Watched'`, `DetailPanel` says
`'Watched ✓'`, `export.js` says `'Want to Watch'`).

Hover states are implemented as `onMouseEnter`/`onMouseLeave` handlers that mutate
`e.currentTarget.style` directly — 14 occurrences. This works but can't express `:focus-visible`,
`:active`, or media queries, and it means **keyboard users get no hover affordance at all**.

### 3.2 Mobile responsiveness

**There are zero `@media` queries in application code.** The only ones in the repo are in
[App.css](src/App.css) — which is leftover Vite template CSS that **is never imported** — and the
`prefers-color-scheme` block in [index.css](src/index.css).

Responsiveness is achieved entirely through `flexWrap: 'wrap'`, `minmax()` grids, and
`clamp()` on the landing hero. That covers a lot, but leaves concrete gaps:

| Location | Issue |
|---|---|
| [App.jsx:332-346](src/App.jsx#L332-L346) | Header packs logo + search input + type `<select>` + Search button + avatar into one flex row. Below ~380px the search input hits its `minWidth: 200` and the row wraps awkwardly. |
| [App.jsx:386-393](src/App.jsx#L386-L393) | 9 tabs in an `overflowX: 'auto'` strip with no scroll affordance — on mobile, tabs 5–9 are invisible with no indication they exist. |
| [StatsPage.jsx:112](src/pages/StatsPage.jsx#L112) | `gridTemplateColumns: '1fr 1fr'` is unconditional — rating breakdown and top-5 are crushed into two columns on a 360px screen. |
| [AdminPanel.jsx:88-124](src/pages/AdminPanel.jsx#L88-L124) | 6-column user table; `overflowX: auto` is present but no responsive card fallback. |
| [DetailPanel.jsx:81-87](src/components/DetailPanel.jsx#L81-L87) | Hero is `display:flex` with a fixed 110×165 poster and no wrap — title/metadata column gets very narrow on small screens. |
| [MovieCard.jsx:33-50](src/components/MovieCard.jsx#L33-L50) | Status buttons only appear on `:hover` — **on touch devices they are unreachable**. Tapping the card opens the detail panel instead. The quick-add affordance simply doesn't exist on mobile. |

That last one is the most significant: the primary "add to watchlist" gesture on the Discover grid is
hover-only.

### 3.3 Accessibility

- **2 ARIA attributes in the entire codebase** (both `alt=""` adjacent, not ARIA proper).
- Clickable `<div>`s used for primary navigation throughout — the logo ([App.jsx:333](src/App.jsx#L333)),
  the avatar menu trigger ([App.jsx:351](src/App.jsx#L351)), feed avatars, comment authors, footer
  links ([App.jsx:483](src/App.jsx#L483)). None have `role`, `tabIndex`, or key handlers, so they are
  **unreachable by keyboard and invisible to screen readers**.
- No focus trap in any of the five modals (`OnboardingModal`, `LogEntryModal`, `FeedbackModal`,
  `CreateListModal`, `SupportButton` sheet); no `Escape` handler; no focus restoration.
- `OnboardingModal` is a blocking modal with no dismiss path — appropriate for its purpose, but it
  has no `role="dialog"` / `aria-modal`.
- Colour is the only signal for several states (rating colours, status pills).

---

## 4. Functional Audit

Every interactive affordance, verified where possible against the live backend.

### 4.1 Action inventory

| # | Action | Location | Works? | Feedback | Notes |
|---|---|---|---|---|---|
| 1 | Sign up (email) | [AuthPage.jsx:55](src/pages/AuthPage.jsx#L55) | ✅ | ✅ signs straight in | **Rev 2: now works** — email confirmation disabled, so the profile write is authenticated. Username + country persist. [VERIFIED LIVE] Latent defect remains (**M21**) |
| 2 | Sign up / in (Google) | [AuthPage.jsx:78](src/pages/AuthPage.jsx#L78) | ✅ | ✅ | Avatar image blocked by CSP (**M11**) |
| 3 | Sign in (email) | [useAuth.js:88](src/hooks/useAuth.js#L88) | ✅ | ✅ | [VERIFIED LIVE] |
| 4 | Resend confirmation | [AuthPage.jsx:84](src/pages/AuthPage.jsx#L84) | ✅ | ✅ | |
| 5 | Forgot password | [ForgotPassword.jsx:12](src/pages/ForgotPassword.jsx#L12) | ✅ | ✅ | |
| 6 | Reset password | [ResetPassword.jsx:24](src/pages/ResetPassword.jsx#L24) | ✅ | ✅ | Signs out after — correct |
| 7 | Sign out | [App.jsx:371](src/App.jsx#L371) | ✅ | ⚠️ none | Silent; page just changes |
| 8 | Search titles | [App.jsx:186](src/App.jsx#L186) | ✅ | ✅ toast on failure | Filters out `person` results |
| 9 | Add to watchlist / watching / watched | [App.jsx:198](src/App.jsx#L198), [MovieCard.jsx:41](src/components/MovieCard.jsx#L41) | ✅ | ✅ toast | [VERIFIED LIVE] · **hover-only on mobile (§3.2)** |
| 10 | Remove from library | [LibraryTab.jsx:99](src/pages/LibraryTab.jsx#L99) | ✅ | ⚠️ **no confirm, no toast** | One-click destructive |
| 11 | Rate 1–10 | [StarRating.jsx:15](src/components/StarRating.jsx#L15) | ✅ | ✅ toast with label | Re-click same value clears it |
| 12 | Mark episode watched | [useEpisodes.js:33](src/hooks/useEpisodes.js#L33) | ✅ | ✅ instant checkbox | [VERIFIED LIVE] |
| 13 | Mark whole season | [EpisodeTracker.jsx:72](src/components/EpisodeTracker.jsx#L72) | ✅ | ✅ progress bar | Toggles to "Unmark all" |
| 14 | Log to diary / rewatch | [LogEntryModal.jsx:15](src/components/LogEntryModal.jsx#L15) | ✅ | ⚠️ modal closes, no toast | [VERIFIED LIVE] |
| 15 | Delete diary entry | [DiaryPage.jsx:62](src/pages/DiaryPage.jsx#L62) | ✅ | ⚠️ **no confirm** | Irreversible, one click |
| 16 | Create list | [ListsPage.jsx:11](src/pages/ListsPage.jsx#L11) | ✅ | ⚠️ modal closes | |
| 17 | Add title to list | [DetailPanel.jsx:143](src/components/DetailPanel.jsx#L143) | ✅ | ✅ "✓ Added to X" | **Button hidden entirely if user has 0 lists** ([:134](src/components/DetailPanel.jsx#L134)) — no "create one" path |
| 18 | Remove from list | [ListsPage.jsx:176](src/pages/ListsPage.jsx#L176) | ✅ | ⚠️ none | |
| 19 | Edit list / toggle public | [ListsPage.jsx:87](src/pages/ListsPage.jsx#L87) | ✅ | ⚠️ none | |
| 20 | Delete list | [ListsPage.jsx:118](src/pages/ListsPage.jsx#L118) | ✅ | ✅ `window.confirm` | |
| 21 | Copy share link | [ListsPage.jsx:76](src/pages/ListsPage.jsx#L76) | ✅ | ✅ "✓ Copied" | |
| 22 | View public list | [PublicListPage.jsx](src/pages/PublicListPage.jsx) | ✅ | ✅ | [VERIFIED LIVE] RLS correct |
| 23 | Export library TXT/CSV | [ExportPanel.jsx:16](src/components/ExportPanel.jsx#L16) | ✅ | ⚠️ browser download only | Library only — not diary/lists/comments |
| 24 | Export list TXT/CSV | [ListsPage.jsx:144](src/pages/ListsPage.jsx#L144) | ✅ | ⚠️ none | |
| 25 | Follow / unfollow | [useFollows.js:59](src/hooks/useFollows.js#L59) | ✅ | ✅ button state | Error path only logs |
| 26 | Search people | [FindPeople.jsx:22](src/components/FindPeople.jsx#L22) | ✅ | ✅ count | Query fires on **every keystroke** — no debounce |
| 27 | "Recently active" suggestions | [FindPeople.jsx:11](src/components/FindPeople.jsx#L11) | ⚠️ **meaningless** | — | Orders by `last_seen_at`, which is **NULL for every user** (**M3**) [VERIFIED LIVE] |
| 28 | View activity feed | [ActivityFeed.jsx](src/pages/ActivityFeed.jsx) | 💥 **broken** | — | **HTTP 400, silently swallowed (C3)** [VERIFIED LIVE] |
| 29 | Feed "Find people to follow" | [App.jsx:452](src/App.jsx#L452) | ❌ **dead click** | — | `onDiscover={() => {}}` (**M5**) |
| 30 | Feed "Refresh" | [ActivityFeed.jsx:115](src/pages/ActivityFeed.jsx#L115) | ⚠️ | — | Works, but result is still empty due to C3 |
| 31 | Open public profile | [App.jsx:365](src/App.jsx#L365) etc. | 💥 **crashes** | — | **ReferenceError (C1)** [VERIFIED LIVE in prod bundle] |
| 32 | Post comment | [useComments.js:33](src/hooks/useComments.js#L33) | ✅ | ⚠️ no toast | [VERIFIED LIVE] · **all guards bypassable (C7)** |
| 33 | Delete own comment | [useComments.js:66](src/hooks/useComments.js#L66) | ⚠️ | ⚠️ **no confirm** | Works for visible comments. **Silently fails on admin-hidden ones while reporting success (C8)** [VERIFIED LIVE] |
| 34 | Report comment | [useComments.js:81](src/hooks/useComments.js#L81) | ⚠️ **UI-only** | ⚠️ silently vanishes | Row inserted into `bingr_comment_flags`, but **nothing acts on it** (**M17**). Comment reappears on reload. |
| 35 | Edit profile (username/display name) | [ProfilePage.jsx:36](src/pages/ProfilePage.jsx#L36) | ✅ | ✅ "✓ Profile saved" | |
| 36 | Privacy / visibility toggle | — | ❌ **does not exist** | — | `profiles.profile_public` column exists; **no UI**, and not enforced for diary (**C5**) |
| 37 | Complete onboarding | [OnboardingModal.jsx:51](src/components/OnboardingModal.jsx#L51) | ✅ | ✅ | Full page reload on complete ([App.jsx:326](src/App.jsx#L326)) |
| 38 | Send feedback | [FeedbackModal.jsx:20](src/components/FeedbackModal.jsx#L20) | ✅ | ✅ 🙏 screen | **Anon-insertable — spam vector (M9)** [VERIFIED LIVE] |
| 39 | Admin: promote/demote | [useAdmin.js:83](src/hooks/useAdmin.js#L83) | ✅ | ✅ confirm, ⚠️ no result feedback | Moot — **anyone can self-promote (C2)** |
| 40 | Admin: hide/restore/delete comment | [useAdmin.js:97-113](src/hooks/useAdmin.js#L97-L113) | ✅ | ⚠️ **errors discarded** | Returns `{error}`, `AdminPanel` ignores it |
| 41 | Admin: mark feedback status | [useAdmin.js:62](src/hooks/useAdmin.js#L62) | ✅ | ⚠️ none | |
| 42 | Admin: record/edit/delete donation | [useAdmin.js:67-81](src/hooks/useAdmin.js#L67-L81) | ✅ | ⚠️ none | **Manual data entry** — see §7 |
| 43 | Admin: delete user | [useAdmin.js:89](src/hooks/useAdmin.js#L89) | ❌ **dead + dangerous** | — | Not wired to any UI. If wired, **it would delete the admin's own account** (**M1**) |
| 44 | Delete own account | [DeleteAccount.jsx:11](src/pages/DeleteAccount.jsx#L11) | ✅ | ✅ 4-step flow | Incomplete data deletion (**M2**) |
| 45 | Support / M-Pesa | [SupportButton.jsx:29](src/components/SupportButton.jsx#L29) | ⚠️ **placeholder** | ✅ "✓ Copied" | Copies **`0700000000`** — see §7 |
| 46 | Landing footer: Privacy / ToS | [LandingPage.jsx:117-119](src/pages/LandingPage.jsx#L117-L119) | ❌ **dead clicks** | — | `cursor:pointer`, **no `onClick`** (**M4**) |
| 47 | App footer: Privacy / ToS / Supporters / Delete | [App.jsx:477-486](src/App.jsx#L477-L486) | ✅ | — | |
| 48 | Auth page: Privacy / ToS | [AuthPage.jsx:215-216](src/pages/AuthPage.jsx#L215-L216) | ✅ | — | |
| 49 | Browser back button | [App.jsx:135-149](src/App.jsx#L135-L149) | ⚠️ | — | Works for mapped routes; profile/list URLs rewritten to `/` (§2.6) |

**Summary: 49 actions — 33 fully working, 11 flawed, 3 dead clicks, 2 broken outright.**

### 4.2 Behaviour under failure

| Scenario | Actual behaviour |
|---|---|
| **TMDB down / 5xx** | Discover shows a proper 📡 retry card ✅. **Detail panel hangs at "Loading..." forever** — [DetailPanel.jsx:27-35](src/components/DetailPanel.jsx#L27-L35) has no `.catch()`, producing an unhandled rejection (**M7**). Episode tracker same ([EpisodeTracker.jsx:21](src/components/EpisodeTracker.jsx#L21)). |
| **TMDB 404 (deleted title)** | [VERIFIED LIVE] returns HTTP 404 → `get()` throws → same hang as above. |
| **TMDB rate limit (429)** | The N+1 in [App.jsx:160-168](src/App.jsx#L160-L168) makes this likely. `.catch(() => {})` swallows it — episode progress just silently disappears from the Watchlist. |
| **Supabase unreachable** | `withRetry` gives 3 attempts w/ backoff ✅. `useLibrary` surfaces a dismissible banner ✅. `useEpisodes`/`useFollows`/`useFeed` show nothing. |
| **Network loss mid-write** | Optimistic local state is *not* rolled back — e.g. `useFollows.follow` only updates state after success ✅, but `useComments` inserts optimistically and can't undo. |
| **Bad input: comment 3,000 chars** | [VERIFIED LIVE] **Stored in full.** Client caps at 1,000 (`maxLength` + `moderateComment`); there is **no DB constraint**. |
| **Bad input: profanity** | [VERIFIED LIVE] **Stored and displayed.** `moderation.js` runs only in the browser. |
| **Comment flood** | [VERIFIED LIVE] **8/8 inserts accepted instantly.** `checkCommentRateLimit()` is a module-level array that resets on reload. |
| **Auth brute force** | `checkRateLimit()` ([useAuth.js:10](src/hooks/useAuth.js#L10)) is an in-memory counter — resets on refresh. Supabase's own server-side limits are the only real protection. |
| **Invalid `/@username`** | Would show 🔍 not-found — **except the page crashes first (C1)**. |
| **Private list URL** | ✅ Correct: RLS `is_public = true` filter → 🔍 not-found. [VERIFIED LIVE] |

---

## 5. Code Quality Findings

### 🔴 CRITICAL

---

#### C1 — Public profile pages crash on every load (temporal dead zone)

**File:** [src/pages/UserProfilePage.jsx:14-15](src/pages/UserProfilePage.jsx#L14-L15)

```js
const [libraryMap, setLibraryMap] = useState({})
const stats = useMemo(() => computeStats(diary, libraryMap, {}), [diary, libraryMap])  // ← line 14
const [diary, setDiary] = useState([])                                                  // ← line 15
```

`diary` is referenced in the `useMemo` dependency array on line 14 but not declared until line 15.
`const`/`let` bindings are in the temporal dead zone until their declaration executes, so evaluating
the dep array throws before the component can render anything.

**[VERIFIED LIVE]** Reproduced in isolation:
```
ReferenceError: Cannot access 'diary' before initialization
```

**And confirmed present in the deployed production bundle** (`assets/index-BdzocJCx.js`), where
minification preserves the ordering exactly:

```js
function iU({username:e,onOpenItem:t,onSignUp:n,currentUserId:r,followsHook:i}){
  …,[p,m]=(0,q.useState)({}),
  h=(0,q.useMemo)(()=>tU(g,p,{}),[g,p]),   // ← g referenced here
  [g,_]=(0,q.useState)([]),                 // ← g declared here
```

**Impact.** Every `/@username` route throws on first render and is caught by `ErrorBoundary`, showing
"Something went wrong." Public profiles are reachable from the user menu ("View public profile"), the
activity feed, comment author links, and FindPeople — i.e. **the entire public identity surface of a
social app is dead.** Also breaks the shareability that drives organic signup, since the
"Sign up free" CTA lives on that page.

ESLint already catches this (`react-hooks/immutability`), which is the strongest possible argument for
wiring lint into CI.

**Fix.** Move the `useMemo` below both `useState` declarations. Two-line change.

**Effort:** 🟢 5 minutes.

---

#### C2 — Privilege escalation: any authenticated user can make themselves an admin

**Files:** `profiles` RLS policy (not in repo — see **M12**), consumed by
[useAdmin.js:6](src/hooks/useAdmin.js#L6) (`const isAdmin = profile?.role === 'admin'`) and
[App.jsx:295-297](src/App.jsx#L295-L297).

The `profiles` UPDATE policy permits a user to update their own row, and places **no restriction on
which columns** they may change. `role` lives on that same row.

**[VERIFIED LIVE]** As the ordinary test user:

```
PATCH /rest/v1/profiles?id=eq.4bbf5c37-… {"role":"admin"}
→ 200  [{"username":"tmp_4bbf5c37c6bf", … "role":"admin" …}]

GET /rest/v1/profiles?select=username,role
→ [{"username":"tmp_4bbf5c37c6bf","role":"admin"}]
```

Then, as the now-admin user, previously-forbidden data became readable:

```
GET /rest/v1/bingr_feedback?select=*
→ [{"username":"vulcan","email":"vulcandustan@gmail.com",
    "message":"simplify the exported txt", …}]
```

*(Role reverted to `user` immediately and confirmed — see §9.)*

**Impact.** This is the most serious finding. Any registered user can escalate to admin and then:
read every user's feedback **including their email addresses** (PII, KDPA-relevant), enumerate all
profiles, hide/delete any comment, fabricate or delete donation records, and promote/demote other
users. The `useAdmin` gate is purely cosmetic — it reads the same client-controlled column.

The `bingr_feedback`, `bingr_donations`, and `bingr_comments` admin policies all use
`exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')`, so **every one of
them inherits this hole.**

**Fix.** Two parts, both required:

1. Restrict the column. Postgres has no column-level RLS, so use a trigger:
   ```sql
   create or replace function public.prevent_role_change()
   returns trigger language plpgsql security definer as $$
   begin
     if new.role is distinct from old.role then
       raise exception 'role cannot be changed by the user';
     end if;
     return new;
   end $$;

   create trigger profiles_no_self_promote
     before update on public.profiles
     for each row execute function public.prevent_role_change();
   ```
   (Grant admins a separate `SECURITY DEFINER` RPC for legitimate promotion.)

2. Move `role` off `profiles` entirely into a `user_roles` table with **no user-writable policy** —
   this is the pattern Supabase itself recommends, and it removes the whole class of bug.

**Effort:** 🟡 2–3 hours including migrating `useAdmin` and re-testing.

---

#### C3 — The activity feed has never worked: both queries return HTTP 400, silently

**File:** [src/hooks/useFeed.js:19-33](src/hooks/useFeed.js#L19-L33)

```js
const { data: diaryData } = await supabase
  .from('bingr_diary')
  .select('*, profiles!inner(username, display_name)')   // ← no such relationship
  .in('user_id', following) …

const { data: ratingData } = await supabase
  .from('bingr_library')
  .select('*, profiles!inner(username, display_name)')   // ← same
```

PostgREST resolves embedded resources through foreign keys. `bingr_diary.user_id` and
`bingr_library.user_id` reference **`auth.users(id)`**, not `public.profiles(id)`, so no relationship
exists in the `public` schema.

**[VERIFIED LIVE]:**
```json
{"code":"PGRST200",
 "details":"Searched for a foreign key relationship between 'bingr_diary' and 'profiles'
            in the schema 'public', but no matches were found.",
 "message":"Could not find a relationship between 'bingr_diary' and 'profiles' in the schema cache"}
HTTP 400
```
Identical result for `bingr_library`.

**Why nobody noticed.** The destructuring `const { data: diaryData } = await …` **discards `error`**.
`data` is `undefined`, `(diaryData || [])` gives `[]`, the merge produces `[]`, `setLoaded(true)`
runs, and `ActivityFeed` renders its perfectly-designed "😴 Nothing yet — the people you follow
haven't logged anything recently" empty state. **The failure is indistinguishable from the legitimate
empty case**, the `try/catch` never fires, and Sentry receives nothing.

**Impact.** The Feed tab — one of nine top-level tabs and the centrepiece of the social layer — has
never displayed a single item in production. Compounded by **M6** (feed latches `loaded` before
follows finish loading) and **M5** (its empty-state CTA is a dead click).

**Fix.**

1. Add the FK so PostgREST can embed:
   ```sql
   alter table public.bingr_diary
     add constraint bingr_diary_profile_fk
     foreign key (user_id) references public.profiles(id) on delete cascade;
   -- same for bingr_library
   ```
   (Safe: `profiles.id` is already 1:1 with `auth.users.id` via the `handle_new_user` trigger.)
2. **Stop discarding errors.** Every `supabase.from(...)` call in `useFeed` must destructure and check
   `error`. Better: add a `select()` helper in `lib/supabase.js` that throws on `error` so the
   existing `catch` + `logger.error` path actually engages.
3. For scale, replace the two-query merge with a Postgres view or RPC that joins `bingr_follows`
   server-side and paginates (see §2.4).

**Effort:** 🟡 Steps 1–2: 2 hours. Step 3: 1 day.

---

#### C4 — Email signup silently discards username and country — ✅ **RESOLVED by disabling email confirmation**

> **Status update (Revision 2).** The maintainer has disabled email confirmation. **Re-verified live:**
> `POST /auth/v1/signup` now returns a session immediately (`has session: True`,
> `email_confirmed_at` set on creation), so the follow-up profile `UPDATE` runs **authenticated** and
> persists correctly:
> ```
> PATCH /profiles?id=eq.f9ea9917-… {"username":"auditc4probe","username_set":true,"country_code":"KE"}
> → HTTP 200, row returned
> → re-read confirms: {"username":"auditc4probe","username_set":true,"country_code":"KE"}
> ```
> Email signup now captures username and country correctly. The historical evidence still stands —
> `claude@test.com`, created on 2026-07-30 while confirmation was on, had `username_set: false` and a
> `tmp_` username until it was fixed via onboarding.
>
> **The code defect is not fixed, only unmasked** — see **M21**. `useAuth.signUp` still treats a
> zero-row RLS-filtered UPDATE as success, so re-enabling email confirmation (or adding any RLS
> condition that filters this write) silently reintroduces the data loss with no error and no Sentry
> event. Fix **M21** to make the code correct independently of the auth setting.
>
> The analysis below is retained because it documents the mechanism, which recurs in **C8** and **M21**.



**File:** [src/hooks/useAuth.js:63-79](src/hooks/useAuth.js#L63-L79)

```js
if (data.user?.id && username) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    await new Promise(r => setTimeout(r, attempt * 400))
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ username: cleanUsername, username_set: true, …(country ? { country_code: country } : {}) })
      .eq('id', data.user.id)
    if (!updateErr) { saved = true; break }     // ← zero rows updated is NOT an error
  }
  if (!saved) logger.warn('Username save failed after retries', …)
}
```

With email confirmation enabled, `supabase.auth.signUp()` returns **no session** — the app knows this,
since [AuthPage.jsx:75](src/pages/AuthPage.jsx#L75) does `if (mode === 'signup' && !data?.session)
setAwaitingConfirmation(true)`. So this `UPDATE` runs **unauthenticated**. `auth.uid()` is `null`, RLS
matches zero rows, and **PostgREST returns success with an empty result set, not an error.**

`updateErr` is `undefined` → `saved = true` → `break` on the **first** attempt. The retry loop and its
warning are unreachable. The failure is completely invisible: no error, no log, no Sentry event.

**[VERIFIED LIVE].** The unauthenticated update returns success with zero rows:
```
PATCH /rest/v1/profiles?id=eq.4bbf5c37-…  {"username":"claudetest","username_set":true}
(anon key, no session) → HTTP 200  []
```

And the test account itself is the proof — created via email signup on 2026-07-30, it still has:
```json
{"username":"tmp_4bbf5c37c6bf","username_set":false,"country_code":null}
```

**Impact.** Every user who signs up by email:
- loses the username they chose (and had validated as available in real time),
- loses their country selection,
- keeps the trigger-generated placeholder `tmp_<uuid>`,
- and is force-shown the blocking `OnboardingModal` on first login
  ([App.jsx:323](src/App.jsx#L323)) to pick a username **again**.

The onboarding modal exists for Google OAuth users, so this doesn't *break* signup — it just makes the
entire email signup form's username + country fields pointless and the first-run experience
confusing. It also means `country_code` is `null` for email users, which **disables the M-Pesa flow**
for them ([SupportButton.jsx:15](src/components/SupportButton.jsx#L15): `kenyan = countryCode === 'KE'`)
until they complete onboarding.

Note: the same zero-rows-is-not-an-error trap makes the username uniqueness pre-check at
[useAuth.js:46-51](src/hooks/useAuth.js#L46-L51) unreliable too.

**Fix.** Don't write the profile from an unauthenticated client. Pass the data through signup metadata
and let the existing `SECURITY DEFINER` trigger consume it:

```js
await supabase.auth.signUp({
  email, password,
  options: { emailRedirectTo: window.location.origin,
             data: { username: cleanUsername, country_code: country } },
})
```
```sql
-- extend handle_new_user() in supabase/supabase_fix_trigger.sql
insert into public.profiles (id, username, username_set, country_code)
values (new.id,
        coalesce(new.raw_user_meta_data->>'username',
                 'tmp_' || substr(replace(new.id::text,'-',''),1,12)),
        (new.raw_user_meta_data->>'username') is not null,
        new.raw_user_meta_data->>'country_code')
on conflict (id) do nothing;
```

Separately, **audit every `.update()`/`.delete()` in the codebase for the zero-rows trap** — add
`.select()` and assert a row came back.

**Effort:** 🟡 3–4 hours including the trigger migration and re-testing both signup paths.

---

#### C5 — Every user's diary is world-readable; the privacy toggle is not enforced

**File:** [supabase/supabase_diary.sql:25-27](supabase/supabase_diary.sql#L25-L27)

```sql
create policy "Public diary visible to all"
  on public.bingr_diary for select
  using (true);
```

**[VERIFIED LIVE]** with the anon key alone, no authentication:
```
GET /rest/v1/bingr_diary?select=*
→ [{"user_id":"263aa096-…","tmdb_id":1339713,"title":"Obsession",
    "watched_date":"2026-06-13","rating":7,"notes":"looks ok"}]
```

Diary entries contain **free-text personal notes** ([LogEntryModal.jsx:57](src/components/LogEntryModal.jsx#L57):
"Your thoughts on this watch…"), watch dates, and ratings. `using (true)` exposes all of it, for every
user, to anyone holding the publicly-embedded anon key.

The `profiles.profile_public` column exists and [UserProfilePage.jsx:36](src/pages/UserProfilePage.jsx#L36)
respects it — but only in the UI. **The database ignores it entirely**, and there is no UI to set it
in the first place (**M16**).

**Impact.** A privacy control the app appears to offer does not exist. Under the Kenya Data Protection
Act 2019 this is a purpose-limitation and security problem: users writing personal notes have a
reasonable expectation they are private, and the Privacy Policy states data is protected by "Row Level
Security (RLS) on all database tables ensuring users can only access their own data"
([PrivacyPolicy.jsx:63](src/pages/PrivacyPolicy.jsx#L63)) — **which is not true for this table.**

**Fix.**
```sql
drop policy "Public diary visible to all" on public.bingr_diary;

create policy "Diary visible per profile visibility"
  on public.bingr_diary for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p
               where p.id = bingr_diary.user_id and p.profile_public = true)
  );
```
Add a matching index on `profiles(id, profile_public)`, and ship the profile-visibility toggle in
`ProfilePage`. Apply the same review to `bingr_follows` (`using (true)`) and `profiles`
(all columns readable by anon, including `role`, `country_code`, `last_seen_at`).

**Effort:** 🟡 2 hours for the policy + 2 hours for the toggle UI.

---

#### C6 — Comment authorship can be spoofed (impersonation)

**Files:** [supabase/supabase_comments.sql:26-28](supabase/supabase_comments.sql#L26-L28),
[useComments.js:44-54](src/hooks/useComments.js#L44-L54)

```sql
create policy "Logged in users can post comments"
  on public.bingr_comments for insert
  with check (auth.uid() = user_id);      -- checks user_id … but not username
```

`bingr_comments.username` is a plain `text not null` column written by the client
([useComments.js:48](src/hooks/useComments.js#L48): `username: profile.username`) and **never
validated against the authenticated user's actual profile.**

**[VERIFIED LIVE]** — posting as the test user while claiming to be the admin `nkipk`:
```
POST /rest/v1/bingr_comments
{"user_id":"4bbf5c37-…","username":"nkipk","tmdb_id":550,"comment":"…"}
→ 201  [{"username":"nkipk","user_id":"4bbf5c37-…","status":"visible"}]
```

**Impact.** The comment UI renders `@{comment.username}` as the author and makes it a link to
`/@{username}` ([CommentsSection.jsx:36-38](src/components/CommentsSection.jsx#L36-L38)). An attacker
can post arbitrary content that displays as, and links to, **any other user's profile — including the
admin's**. Admin moderation shows the same spoofed handle
([AdminPanel.jsx:260](src/pages/AdminPanel.jsx#L260)), so the wrong person gets blamed.

The same pattern appears in `bingr_feedback.username` and `bingr_donations.username`.

**Fix.** Drop the denormalised column and join through the FK added in **C3**:
```sql
alter table public.bingr_comments drop column username;
-- read via: .select('*, profiles!inner(username, display_name)')
```
If denormalisation is preferred for read performance, enforce it server-side:
```sql
create policy "Logged in users can post comments"
  on public.bingr_comments for insert
  with check (
    auth.uid() = user_id
    and username = (select p.username from public.profiles p where p.id = auth.uid())
  );
```

**Effort:** 🟡 2 hours (policy + read-path update).

---

#### C7 — All content moderation is client-side and trivially bypassed

**File:** [src/lib/moderation.js](src/lib/moderation.js) — runs **only** in the browser.

The file's own comment is candid: *"paired with server-side checks being added later"*
([moderation.js:41](src/lib/moderation.js#L41)). They were not added. Anyone can hit the PostgREST
endpoint directly with the publicly-embedded anon key.

**[VERIFIED LIVE]**, all three guards bypassed in one session:

| Guard | Client rule | Live result |
|---|---|---|
| Profanity blocklist ([:8-10](src/lib/moderation.js#L8-L10)) | rejects | ✅ **Stored & displayed** — `"this shit is fucking great"` → HTTP 201 |
| Length cap 1,000 ([:20](src/lib/moderation.js#L20)) | rejects | ✅ **3,000+ chars stored** — no DB constraint |
| Rate limit 5/min ([:43-44](src/lib/moderation.js#L43-L44)) | rejects | ✅ **8/8 rapid inserts accepted** (`201 201 201 201 201 201 201 201`) |

The rate limiter is a module-level array (`const commentTimestamps = []`) — it resets on page reload
even in the browser. The same design flaw applies to the auth rate limiter at
[useAuth.js:6-18](src/hooks/useAuth.js#L6-L18).

**Impact.** No effective defence against comment spam, abuse, or storage exhaustion. Combined with
**C6** (spoofed authorship) and **M17** (reports do nothing), the moderation story is: a spammer can
flood any title's comment section with unbounded abusive text attributed to your admin account, and
the only remedy is manual deletion — after the fact, one row at a time.

**Fix.** Defence in depth, in order of value:

1. **DB constraints** (10 minutes, stops the worst):
   ```sql
   alter table public.bingr_comments
     add constraint comment_len check (char_length(comment) between 2 and 1000);
   ```
2. **Server-side rate limit** — a `BEFORE INSERT` trigger rejecting >5 comments/min per `user_id`, or
   move posting behind an Edge Function.
3. **Profanity/abuse filtering** in the same trigger or Edge Function, sharing the ruleset with the
   client so the UX stays instant. Keep `moderation.js` as the fast path, not the only path.
4. **Auto-hide on flag threshold** — see **M17**.

**Effort:** 🟡 Step 1: 10 min. Steps 2–4: 1 day.

---

#### C8 — Users cannot delete their own moderated comments, and the app reports success anyway

**Files:** [supabase/supabase_comments.sql:16-18](supabase/supabase_comments.sql#L16-L18),
[useComments.js:66-79](src/hooks/useComments.js#L66-L79)

*Discovered during admin-account cleanup in Revision 2.*

The only non-admin SELECT policy on `bingr_comments` is:

```sql
create policy "Anyone can view visible comments"
  on public.bingr_comments for select using (status = 'visible');
```

PostgreSQL **applies SELECT policies to rows targeted by a `DELETE` that has a `WHERE` clause**. So
once an admin sets `status = 'hidden'`, the row becomes invisible to its own author — and therefore
**undeletable by them**, even though the DELETE policy (`auth.uid() = user_id`) would otherwise allow
it.

**[VERIFIED LIVE]** as the comment's owner (`claude@test.com`), on a comment an admin had hidden:

```
GET    /bingr_comments?id=eq.1&select=id,status,comment   → []            ← invisible to its author
DELETE /bingr_comments?id=eq.1                            → HTTP 204      ← reports success
GET    /bingr_comments?id=eq.1  (as admin)                → [{"id":1,"status":"hidden"}]  ← still there
```

The row survived. Only the admin could remove it.

**Impact.** Two distinct problems:

1. **Data rights.** A user cannot exercise erasure over their own content once it has been moderated.
   They can't see it, can't delete it, and get no indication it still exists. Under KDPA 2019 the
   right to erasure isn't conditional on moderation status.
2. **The same zero-rows-is-not-an-error trap as C4.** [useComments.js:69-75](src/hooks/useComments.js#L69-L75)
   checks only `error`, then optimistically removes the comment from local state:
   ```js
   const { error } = await supabase.from('bingr_comments').delete()
     .eq('id', commentId).eq('user_id', session.user.id)
   if (error) throw error
   setComments(prev => prev.filter(c => c.id !== commentId))   // ← runs even on a 0-row delete
   ```
   Any delete that RLS filters to zero rows renders as a successful deletion in the UI. The comment
   reappears on reload.

Note this trap is **systemic**, not local to comments — the same `{ error }`-only pattern appears in
`useDiary.deleteEntry`, `useLists.deleteList`/`removeFromList`, `useLibrary.remove`,
`useFollows.unfollow`, and every `useAdmin` mutation. The audit also hit it twice more:
`DELETE /profiles` as an admin returns **204 while deleting nothing** (there is no DELETE policy on
`profiles` at all), and the unauthenticated `PATCH /profiles` in **C4** returned 200 with `[]`.

**Fix.** Three parts:

1. Let authors see their own comments regardless of status:
   ```sql
   drop policy "Anyone can view visible comments" on public.bingr_comments;
   create policy "View visible comments or own"
     on public.bingr_comments for select
     using (status = 'visible' or auth.uid() = user_id);
   ```
   (Pair with a UI affordance showing the author their comment is hidden — otherwise it silently
   reappears for them only, which is its own confusion.)

2. Make deletes assert they affected a row. Add `.select()` and check the result:
   ```js
   const { data, error } = await supabase.from('bingr_comments').delete()
     .eq('id', commentId).eq('user_id', session.user.id).select()
   if (error) throw error
   if (!data?.length) throw new DatabaseError('Delete affected no rows', { commentId })
   ```

3. Apply the same treatment across all mutation call sites (see **M21**).

**Effort:** 🟡 Policy: 15 min. Codebase-wide zero-rows audit: 3 hours.

---

#### C9 — Admin "Make admin" has never worked, and the UI shows it succeeding

**Files:** `profiles` RLS (no admin UPDATE policy), [useAdmin.js:83-87](src/hooks/useAdmin.js#L83-L87),
[AdminPanel.jsx:115-119](src/pages/AdminPanel.jsx#L115-L119)

*Discovered while regression-testing the C2 fix — I checked that legitimate admin promotion still
worked after adding the role trigger, and found it had never worked in the first place.*

The only UPDATE policy on `profiles` is self-update (`auth.uid() = id`). An admin writing to another
user's row therefore matches **zero rows**, and PostgREST returns success.

**[VERIFIED LIVE]** as `claudeadmin@test.com` (role `admin`):

```
PATCH /profiles?id=eq.<other-user>  {"role":"admin"}   → HTTP 204, role unchanged
PATCH /profiles?id=eq.<other-user>  {"bio":"probe"}    → HTTP 200, []      ← zero rows, no error
PATCH /profiles?id=eq.<own-row>     {"bio":"probe"}    → HTTP 200, [row]   ← self-update works
```

`useAdmin.promoteUser` then does:

```js
const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
```

`error` is null, so the local state updates and **the admin sees the role badge flip to "admin"**. It
silently reverts on the next load. `AdminPanel` discards the returned `{ error }` entirely, so there
was no signal at any layer.

**Impact.** Admin user management is entirely non-functional, and fails in the most misleading way
available — it looks like it worked. This is the third confirmed instance of **M21** (after C4 and
C8), which is why M21 is called out as the systemic root cause rather than an incidental detail.

**Note this was masked by C2:** the only way anyone became an admin was self-promotion, which *did*
work because it's a self-update. Fixing C2 without also fixing C9 would have left no working path to
create an admin at all.

**Fix.** Add an admin UPDATE policy — safe alongside the C2 trigger, which independently gates the
`role` column on the caller genuinely being an admin:

```sql
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "Admins can update any profile"
  on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
```

Shipped as [supabase/migrations/20260803_p0b_admin_write.sql](supabase/migrations/20260803_p0b_admin_write.sql),
with `promoteUser` hardened via `assertAffected` and `AdminPanel` now surfacing success/failure.

**Effort:** 🟢 30 minutes.

---

#### C10 — `bingr_library` had no public-read policy: public "Top Rated" has always been empty

**Files:** `bingr_library` RLS (untracked, see M12), [UserProfilePage.jsx:41](src/pages/UserProfilePage.jsx#L41)

*Discovered while building the profile-visibility toggle for M16, verifying what the toggle would
actually protect before writing its copy.*

`bingr_diary` had the `using (true)` problem (**C5** — too open). `bingr_library` had the opposite
problem: **no public SELECT policy of any kind**, only implicit owner-only access. `UserProfilePage`'s
"🏆 Top Rated" tab and the movie/TV/rated counts query this table using the *viewer's* auth context —
so for any visitor other than the profile owner, the query has always returned zero rows.

**[VERIFIED LIVE]**, two ways, before the fix:

```
# anon reading a title rated by a real user
GET /bingr_library?user_id=eq.<nkipk>&select=title,rating  (no session)  → []

# a different AUTHENTICATED user (not just anon) reading another user's row
seeded a probe row for user A, read as user B (both logged in) → []
```

Wrapped in `Promise.allSettled` ([UserProfilePage.jsx:41-44](src/pages/UserProfilePage.jsx#L41-L44)), so
this failed with the same signature as **C3**: no error, just a confidently-empty "No ratings yet."
Every public profile's rankings tab has been empty for every visitor, always, independent of the
`profile_public` setting — which is also why this went unnoticed even before C1 made the whole page
crash.

**Fix.** Mirror the C5 diary policy:
```sql
create policy "Library visible to owner or when profile is public"
  on public.bingr_library for select
  using (
    (select auth.uid()) = user_id
    or exists (select 1 from public.profiles p
               where p.id = bingr_library.user_id and p.profile_public = true)
  );
```
Shipped as [`supabase/migrations/20260803_p1a_library_visibility.sql`](supabase/migrations/20260803_p1a_library_visibility.sql).
**Requires the maintainer to run it** — not yet applied at time of writing.

**Effort:** 🟢 15 minutes.

---

### 🟠 MODERATE

| ID | Finding | File | Impact |
|---|---|---|---|
| **M1** | `delete-account` Edge Function **ignores `target_user_id`** and always deletes the *caller*. [useAdmin.js:89-95](src/hooks/useAdmin.js#L89-L95) sends `body: { target_user_id: userId }`; [index.ts:24-41](supabase/functions/delete-account/index.ts#L24-L41) never reads the body. Currently unreachable (not wired to any UI), but if wired, **an admin deleting a user deletes their own account instead.** | [supabase/functions/delete-account/index.ts](supabase/functions/delete-account/index.ts) | Latent catastrophic |
| **M2** | **[VERIFIED LIVE — corrected in Rev 2]** End-to-end deletion test: seeded a probe account with rows in `bingr_diary`, `bingr_comments`, `bingr_follows`, `bingr_feedback`, then invoked the Edge Function (`{"success":true}`). Result: the auth user, `profiles`, `bingr_diary`, `bingr_comments`, and `bingr_follows` were **all removed** — the `ON DELETE CASCADE` FKs work, so the omission of those tables from the explicit delete list is a robustness concern, not a live leak *(my Rev 1 assessment was too pessimistic here)*. **The real, confirmed residue is `bingr_feedback`**, which uses `ON DELETE SET NULL` and retained `username: "auditc4probe"` **and `email: "audit_c4_probe@test.com"` after the account was destroyed.** `bingr_donations` has the identical FK and will behave the same. The Privacy Policy promises data is "permanently and irreversibly deleted within 30 days" ([PrivacyPolicy.jsx:48](src/pages/PrivacyPolicy.jsx#L48)). Orphaned email addresses are exactly the PII that promise covers. | [index.ts:34-38](supabase/functions/delete-account/index.ts#L34-L38), [supabase_admin.sql:11,38](supabase/supabase_admin.sql#L11) | KDPA erasure non-compliance |
| **M3** | `last_seen_at` is **never written**. [useProfile.js:34-36](src/hooks/useProfile.js#L34-L36) builds the query but never `await`s or `.then()`s it — a `PostgrestFilterBuilder` is a lazy thenable, so **no HTTP request is ever sent**. [VERIFIED LIVE: `last_seen_at` is `null` for all 3 users]. FindPeople's "Recently active on bingr" ([FindPeople.jsx:17](src/components/FindPeople.jsx#L17)) orders by a permanently-null column. | [useProfile.js:34](src/hooks/useProfile.js#L34) | Feature silently inert |
| **M4** | **Landing page footer Privacy/ToS links are dead clicks.** [LandingPage.jsx:1](src/pages/LandingPage.jsx#L1) destructures only `{ onSignUp, onSignIn }` — `onShowPrivacy`/`onShowTerms` are passed from [App.jsx:286-287](src/App.jsx#L286-L287) but ignored, and the spans at [:117-119](src/pages/LandingPage.jsx#L117-L119) have `cursor:pointer` and **no `onClick`**. The landing page is the pre-signup entry point; legal documents must be reachable there. | [LandingPage.jsx:117-119](src/pages/LandingPage.jsx#L117-L119) | Legal + trust |
| **M5** | Feed empty-state CTA "Find people to follow" is a **dead click** — [App.jsx:452](src/App.jsx#L452) passes `onDiscover={() => {}}`. Ironically, `FindPeople` is rendered directly below it. | [App.jsx:452](src/App.jsx#L452) | Dead click |
| **M6** | Feed never auto-populates. `useFollows.load()` is async, so on mount `following` is `[]`; `ActivityFeed`'s `useEffect(() => { if (!loaded) load() })` fires, `useFeed.load()` short-circuits on `following.length === 0`, sets `loaded = true`, and **never runs again** — even after follows arrive. Requires a manual "Refresh". | [useFeed.js:11-15](src/hooks/useFeed.js#L11-L15), [ActivityFeed.jsx:79-81](src/pages/ActivityFeed.jsx#L79-L81) | Feature appears broken |
| **M7** | `DetailPanel`'s `Promise.all([tvDetails, providers, recommendations]).then(…)` has **no `.catch()`**. Any TMDB failure → unhandled rejection, `details` stays `null`, "Where to watch" shows "Loading..." forever, overview is blank. [VERIFIED: TMDB returns 404 for missing titles]. Same in [EpisodeTracker.jsx:21](src/components/EpisodeTracker.jsx#L21) and [SupportersPage.jsx:16](src/pages/SupportersPage.jsx#L16). | [DetailPanel.jsx:27-35](src/components/DetailPanel.jsx#L27-L35) | Permanent stuck state |
| **M8** | **TMDB N+1**: one `tvDetails` request per TV show in the library, re-triggered whenever `library`'s identity changes. 60 shows → 60-request burst → 429s, swallowed by `.catch(() => {})`. | [App.jsx:160-168](src/App.jsx#L160-L168) | Rate limits, silent data loss |
| **M9** | `bingr_feedback` INSERT policy is `with check (true)` — **unauthenticated spam vector.** [VERIFIED LIVE: anon insert → HTTP 201]. No rate limit, no captcha, no length cap. | [supabase_admin.sql:22-24](supabase/supabase_admin.sql#L22-L24) | Abuse |
| **M10** | **No length/content constraints on any user-generated column**: `bingr_comments.comment`, `bingr_diary.notes`, `profiles.bio`, `profiles.display_name`, `bingr_lists.name/description`. All caps are client-side `.slice()` calls. | schema-wide | Storage abuse |
| **M11** | CSP `img-src` omits `https://lh3.googleusercontent.com`, so the Google avatar rendered at [OnboardingModal.jsx:92](src/components/OnboardingModal.jsx#L92) is **blocked** — broken image on the first screen every Google user sees. *(Rev 2: the geo-provider half of this finding is withdrawn — manual country selection is intentional and `geo.js` should be deleted rather than allow-listed. See §7.4.)* | [vercel.json:14](vercel.json#L14) | Visible breakage |
| **M12** | **The database schema is not in version control.** [.gitignore](.gitignore) ends with `supabase/`, so `git ls-files supabase/` returns only 3 of 8 files — `supabase_comments.sql`, `supabase_diary.sql`, `supabase_follows.sql`, `supabase_fix_trigger.sql` are **untracked**. Worse, the DDL for `bingr_library`, `bingr_episodes`, and **`profiles`** (including the RLS policy behind **C2**) **exists nowhere in the repo at all.** There is no migration tooling — the files are ad-hoc `create table if not exists` scripts run by hand. | [.gitignore:14](.gitignore#L14) | No reproducibility, no review |
| **M13** | Single **1,084 KB** JS chunk (313 KB gzip), no code splitting — build emits the "larger than 500 kB" warning. The admin panel, legal pages, and public-profile page are shipped to every visitor including anonymous ones. | [vite.config.js](vite.config.js) | Slow first load, esp. on Kenyan mobile networks |
| **M14** | `useLibrary.load()` and `useEpisodes.load()` `select('*')` with **no `.eq('user_id', …)` filter**, relying entirely on RLS to scope rows. Correct today, but a single policy regression silently leaks every user's library to every other user, with no defence in depth. | [useLibrary.js:15-18](src/hooks/useLibrary.js#L15-L18), [useEpisodes.js:13](src/hooks/useEpisodes.js#L13) | Fragile |
| **M15** | Privacy Policy is **materially inaccurate**. It states *"We do not collect your name…"* ([PrivacyPolicy.jsx:32](src/pages/PrivacyPolicy.jsx#L32)) — but the app collects `display_name`, `username`, `country_code`, `bio`, feedback `email`, and donation records with names and KES amounts. §1's data list omits all of them. It also claims RLS "ensur[es] users can only access their own data" ([:63](src/pages/PrivacyPolicy.jsx#L63)), contradicted by **C5**. Under KDPA 2019 §26, the collection notice must be accurate. | [PrivacyPolicy.jsx](src/pages/PrivacyPolicy.jsx) | KDPA compliance |
| **M16** | **No data portability for the full account.** The Privacy Policy promises *"Portability — receive your data in a structured, machine-readable format"* ([:57](src/pages/PrivacyPolicy.jsx#L57)), but `ExportPanel` exports **library only** — diary entries, lists, comments, follows, and profile are not exportable. There is also no profile-visibility toggle despite `profile_public` existing. | [export.js](src/lib/export.js), [ProfilePage.jsx](src/pages/ProfilePage.jsx) | KDPA compliance |
| **M17** | **Reporting a comment does nothing.** `flagComment` inserts into `bingr_comment_flags` then hides the row **in local state only** ([useComments.js:92](src/hooks/useComments.js#L92)) — it reappears on reload. Nothing increments `bingr_comments.flag_count` (which stays `0` forever), and there is no auto-hide threshold. Admins can see flag counts, but only if they open the panel and look. The user is shown no confirmation at all. | [useComments.js:81-98](src/hooks/useComments.js#L81-L98) | Moderation is theatre |
| **M18** | `delete-account` Edge Function uses `'Access-Control-Allow-Origin': '*'`. Not directly exploitable (a valid JWT is still required and browsers won't attach it cross-origin without credentials), but it should be pinned to the app origin. | [index.ts:5](supabase/functions/delete-account/index.ts#L5) | Hardening |
| **M19** | `useLibrary.upsert` has `[session, library]` deps, so **every library mutation recreates the callback**, which recreates `setStatus`/`setRating`, which re-renders every consumer including all cards in the grid. Use a functional state read instead of closing over `library`. | [useLibrary.js:68](src/hooks/useLibrary.js#L68) | Performance |
| **M20** | Auth rate limiting is a module-level in-memory counter that **resets on page reload** — no real protection. Supabase's own limits are doing all the work. Same pattern as the comment limiter (**C7**). | [useAuth.js:6-18](src/hooks/useAuth.js#L6-L18) | False sense of security |
| **M21** | **Systemic: a zero-row write is treated as success everywhere.** PostgREST returns `200`/`204` with no `error` when RLS filters a write to zero rows, but **every mutation in the codebase checks only `error`**. Confirmed live three separate ways: unauthenticated `PATCH /profiles` → `200 []` (**C4**'s mechanism), owner `DELETE` of a hidden comment → `204`, row survives (**C8**), admin `DELETE /profiles` → `204`, row survives (no DELETE policy exists on `profiles`). Affects `useAuth.signUp`, `useComments.deleteComment`, `useDiary.deleteEntry`, `useLists.deleteList`/`removeFromList`, `useLibrary.remove`, `useFollows.unfollow`, and all six `useAdmin` mutations. **This is the root cause behind C4 and C8**, and it is why C4 produced no error and no Sentry event for weeks. Fix by adding `.select()` to mutations and asserting a row came back. | 11 call sites across `src/hooks/` | Silent data loss |

### 🟡 MINOR

| ID | Finding | Location |
|---|---|---|
| m1 | **44 ESLint errors, 7 warnings — and `npm run build` succeeds anyway.** No CI, no pre-commit hook. By rule: 15 `react-hooks/set-state-in-effect`, 12 `no-unused-vars`, 10 `react-hooks/static-components`, 7 `exhaustive-deps`, 4 `no-empty`, 2 `no-dupe-keys`, 1 `react-hooks/immutability` (**= C1**). | repo-wide |
| m2 | **Duplicate object keys** silently discard a value: `border` twice at [DetailPanel.jsx:117](src/components/DetailPanel.jsx#L117), `color` twice at [AdminPanel.jsx:50](src/pages/AdminPanel.jsx#L50). | 2 files |
| m3 | ✅ **Fixed.** Components defined inside components (`react-hooks/static-components` ×10) remount on every parent render: `CardGrid` [App.jsx:311](src/App.jsx#L311), `ProviderChips` [DetailPanel.jsx:59](src/components/DetailPanel.jsx#L59), `UserRow` [FindPeople.jsx:37](src/components/FindPeople.jsx#L37), `Sel` [ExportPanel.jsx:23](src/components/ExportPanel.jsx#L23). All four hoisted to module scope, taking what they need as props instead of closing over parent state. | 4 files |
| m4 | **Dead code — ~460 LOC never referenced:** [src/App.css](src/App.css) (184 lines of Vite template, never imported), [src/components/UsernamePrompt.jsx](src/components/UsernamePrompt.jsx) (107 lines, superseded by `OnboardingModal`), [src/lib/geo.js](src/lib/geo.js) (31 lines — **deliberately superseded by manual country selection**, see §7.4; delete to make that intent explicit), `src/assets/{hero.png,react.svg,vite.svg}`, `sanitise()` + `BingrError`/`NetworkError`/`AuthError` in [errors.js](src/lib/errors.js) *(these three should be **used**, not deleted — see R2)*, `getPublicDiary` [useDiary.js:95](src/hooks/useDiary.js#L95), `getPublicList` [useLists.js:149](src/hooks/useLists.js#L149), `deleteUser` [useAdmin.js:89](src/hooks/useAdmin.js#L89). | 8 locations |
| m5 | **`RATING_LABELS` duplicated in 6 files**; `STATUS_COLORS` in 3; `STATUS_LABELS` in 4 **with divergent values** (`'Watched'` vs `'Watched ✓'` vs `'Want to Watch'`). | see §3.1 |
| m6 | ✅ **Fixed.** Three timers stashed on `window`: `window._unTimer` ([AuthPage.jsx:41](src/pages/AuthPage.jsx#L41), [OnboardingModal.jsx:26](src/components/OnboardingModal.jsx#L26), [UsernamePrompt.jsx:21](src/components/UsernamePrompt.jsx#L21) — note `UsernamePrompt.jsx` was since deleted as dead code, see m4) and `window._unameTimer` ([ProfilePage.jsx:26](src/pages/ProfilePage.jsx#L26)). Two components shared `_unTimer` and could clobber each other. Replaced with a local `useRef` in each of `AuthPage`, `OnboardingModal`, and `ProfilePage`. | 4 files |
| m7 | ✅ **Fixed.** `FindPeople` fired a Supabase `ilike` query on every keystroke — no debounce, unlike the username checks which use 500 ms. Now debounced 400 ms via a local `useRef` timer. | [FindPeople.jsx:22](src/components/FindPeople.jsx#L22) |
| m8 | ✅ **Fixed.** Admin user search was case-sensitive on `display_name`: compared an un-lowercased field to a lowercased needle. Both sides now lowercased before comparing. | [AdminPanel.jsx:25](src/pages/AdminPanel.jsx#L25) |
| m9 | ✅ **Fixed as a side effect of M6.** Feed tab badge was always 0 until the tab was opened, since `useFeed` had no mount-time load. `useFeed` now loads itself whenever `session`/`following` change, independent of which tab is active — verified this covers the badge (`tabLabel()` reads `feedHook.feed.length` reactively, no separate fix needed). | [App.jsx:304](src/App.jsx#L304) |
| m10 | ✅ **Fixed — all 4 call sites**, not just the 3 originally named. `checkUsername` ([useProfile.js](src/hooks/useProfile.js)) plus the inline availability checks in `AuthPage.jsx`, `OnboardingModal.jsx`, and (found during this pass) `useAuth.signUp`'s pre-signup uniqueness check all used `.single()`, which throws — and logs a 406 — for the expected no-match case. All four switched to `.maybeSingle()`. Every remaining `.single()` in the codebase was audited and confirmed to be a legitimate "exactly one row expected" case (inserts, updates, fetch-by-known-ID). | [useProfile.js:72](src/hooks/useProfile.js#L72) +3 |
| m11 | ✅ **Fixed.** Delete-account copy said "Your watchlist, watched list, and watchlist" — "watchlist" twice, should've been "watching" — and omitted diary, lists, comments, and follows from what's actually deleted. Copy corrected and completed to match what the rewritten Edge Function (see M1/M2) actually does, including a note that feedback/donations are anonymised rather than deleted. | [DeleteAccount.jsx:36](src/pages/DeleteAccount.jsx#L36) |
| m12 | ✅ **Fixed.** `stats.js` hardcoded `AVG_MOVIE_RUNTIME = 110` / `AVG_EPISODE_RUNTIME = 42` for every title, even though TMDB returns real `runtime` per movie and `episode_run_time` per show — both were already being fetched in `DetailPanel` and discarded. Added nullable `runtime_minutes` to `bingr_library` and `bingr_episodes` (migration `20260803_p1c_runtime_columns.sql` — **requires the maintainer to run it**); `DetailPanel` now passes the real value through to `onSetStatus`/episode toggles when it has loaded details, and `computeStats` uses it per-item, falling back to the averages for entries that don't have one (older rows, or ones added from a context without full TMDB details — e.g. the Discover grid's quick-add buttons). Additive and backward-compatible: nothing regresses for existing data. | [stats.js:6-7](src/lib/stats.js#L6-L7) |
| m13 | ✅ **Fixed** (in an earlier round, alongside M7). `SupportersPage` summed `amount_kes` with no null guard — a single null amount produced `NaN`. Now guarded with `(d.amount_kes || 0)`. | [SupportersPage.jsx:18](src/pages/SupportersPage.jsx#L18) |
| m14 | ✅ **Fixed** (via the C8 migration). `bingr_comments` index was `(tmdb_id, media_type, created_at desc)` but the actual query filters on `status = 'visible'` too. `20260803_p0_security.sql` replaced it with `idx_comments_title_visible` covering `(tmdb_id, media_type, created_at desc) where status = 'visible'`. | [supabase_comments.sql:68](supabase/supabase_comments.sql#L68) |
| m15 | ✅ **Fixed.** Landing page claimed "500K+ Titles in database" as if it were bingr's own catalogue, when it's TMDB's. Relabelled to "Titles searchable" and added a small attribution line ("Catalogue data provided by The Movie Database (TMDB)") under the stats bar. | [LandingPage.jsx:12](src/pages/LandingPage.jsx#L12) |
| m16 | ✅ **Fixed.** `README.md` was the unmodified Vite template — no setup instructions, no env var documentation, no schema bootstrap order. Rewritten with the actual stack, local setup steps, an `.env.example` (newly added — the README's own instructions now work), an env var table split into client vars and the separate Edge Function secrets, and the `supabase_*.sql` → `supabase/migrations/*.sql` bootstrap order. | [README.md](README.md) |
| m17 | ✅ **Fixed.** Zero tests, no test runner in `devDependencies`. Added Vitest + React Testing Library, wired into CI (`npm run test`, now a required CI step alongside lint and build). Three targeted regression suites rather than a coverage push for its own sake: `errors.test.js` pins `assertAffected`'s contract (the M21 fix — throws on an RLS-filtered zero-row write, passes through on a real one) plus `sanitise`/`friendlyAuthError`; `stats.test.js` covers the m12 runtime-fallback math item-by-item; `UserProfilePage.test.jsx` mounts the component with a mocked Supabase client and asserts it doesn't throw — **this is a direct regression test for C1**, verified for real: reintroduced the exact original bug (`useMemo` before its `useState` dependency) locally, confirmed the test fails with the identical `ReferenceError: Cannot access 'diary' before initialization` at the same line, then reverted. Running `npm audit fix` while installing these surfaced 3 pre-existing high-severity transitive vulnerabilities (`brace-expansion`, `postcss`, `vite` itself — none introduced by the new test deps); resolved cleanly with no forced major-version bumps. | repo-wide |

---

## 6. Recommendations mapped to findings

### 6.1 Immediate hotfixes (ship today)

| Fix | Addresses | Effort |
|---|---|---|
| Move `useMemo` below the `useState` calls in `UserProfilePage.jsx` | **C1** | 5 min |
| Add `role`-change trigger on `profiles` | **C2** | 30 min |
| Add FK `bingr_diary.user_id → profiles.id` (+ `bingr_library`) | **C3** | 20 min |
| Destructure and check `error` in `useFeed`'s two queries | **C3** | 20 min |
| Replace `using (true)` on `bingr_diary` with the `profile_public` policy | **C5** | 20 min |
| `check (char_length(comment) between 2 and 1000)` on `bingr_comments` | **C7** | 10 min |
| Wire `onShowPrivacy`/`onShowTerms` into `LandingPage`'s footer | **M4** | 10 min |
| `onDiscover` → scroll to the `FindPeople` section | **M5** | 10 min |
| Add `https://lh3.googleusercontent.com` to CSP `img-src` | **M11** | 5 min |
| Delete `useAdmin.deleteUser` (dead + would delete the caller) | **M1** | 5 min |

**Total: under half a day for all ten.** Six of these are one-liners.

### 6.2 Structural recommendations

#### R1 — Adopt TanStack Query for the data layer *(addresses §2.1, §2.2, C3, M6, M8, M19)*

**Why it fits Bingr.** Every one of the nine hooks hand-rolls the same lifecycle, and they do it
inconsistently — which is how a query that returns HTTP 400 went unnoticed for a release cycle. TanStack
Query gives you, for free, the four things this codebase is missing: automatic error surfacing (an
`error` that isn't rendered still shows in devtools rather than vanishing), request deduplication and
caching (kills the TMDB N+1 in **M8** outright), declarative invalidation (rating a title can
invalidate `['feed']` and `['stats']`), and stable callback identities (fixes **M19**).

It's ~13 KB gzipped and integrates with Supabase without a wrapper. The migration is incremental —
convert one hook at a time, starting with `useFeed` and `useLibrary`.

```js
// hooks/useLibrary.js — after
export function useLibrary(session) {
  const qc = useQueryClient()
  const { data: library = {}, error } = useQuery({
    queryKey: ['library', session?.user?.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from('bingr_library')
        .select('*').eq('user_id', session.user.id)   // ← also fixes M14
      if (error) throw error                          // ← errors can no longer be silent
      return Object.fromEntries(data.map(r => [r.tmdb_id, r]))
    },
  })
  const setStatus = useMutation({ …, onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }) })
  …
}
```

**Effort:** 🟡 2–3 days for all nine hooks. Do `useFeed` + `useLibrary` first (half a day) for most of
the benefit.

#### R2 — Wire the TMDB layer with caching, retry, and abort *(addresses §2.2, M7, M8)* — ✅ implemented

**Status: shipped**, close to the shape proposed below. [lib/tmdb.js](src/lib/tmdb.js) now caches by
path (6h TTL — TMDB catalogue metadata is near-static within a session), deduplicates concurrent
identical requests via an in-flight map, retries through the existing `withRetry`, and uses
`AbortSignal.timeout(10000)`. The season fan-out in [App.jsx](src/App.jsx) is bounded to 4 concurrent
requests via a new `mapWithConcurrency` helper instead of firing one request per library show at once.
Kept for reference — the original proposal, which the shipped version follows closely:

Even before R1, `lib/tmdb.js` should not be a bare `fetch`:

```js
const cache = new Map()   // key → { at, data }
const inflight = new Map()
const TTL = 1000 * 60 * 60 * 6   // TMDB metadata is near-static

async function get(path, { signal } = {}) {
  const hit = cache.get(path)
  if (hit && Date.now() - hit.at < TTL) return hit.data
  if (inflight.has(path)) return inflight.get(path)

  const p = withRetry(async () => {
    const res = await fetch(`${BASE}${path}${sep}api_key=${API_KEY}`,
                            { signal: signal ?? AbortSignal.timeout(8000) })
    if (!res.ok) throw new NetworkError(`TMDB ${res.status}`, { path })
    return res.json()
  }, { retries: 3, label: `tmdb:${path}` })
    .finally(() => inflight.delete(path))

  inflight.set(path, p)
  const data = await p
  cache.set(path, { at: Date.now(), data })
  return data
}
```

This reuses `withRetry` and `NetworkError` from [errors.js](src/lib/errors.js) — both already written
and currently unused (**m4**). Then batch the season fan-out in [App.jsx:160-168](src/App.jsx#L160-L168)
with a concurrency limit of 4, and add `.catch(err => logger.error(...))` to every `.then()` chain in
`DetailPanel` and `EpisodeTracker`.

**Effort:** 🟢 4 hours.

#### R3 — Replace inline styles with CSS Modules + design tokens *(addresses §3.1, §3.2, §3.3)*

929 inline style objects is the single biggest maintainability drag in the codebase, and it's the
direct cause of the responsiveness gap — **inline styles cannot express media queries, `:hover`,
`:focus-visible`, or `:active`**, which is why hover is hand-rolled with 14 `onMouseEnter` handlers
and why there are zero breakpoints.

**Recommended: CSS Modules** (built into Vite, zero runtime, zero new dependencies) plus a token file
extending the `:root` block already in [index.css](src/index.css):

```css
/* src/styles/tokens.css — extend the existing :root */
:root {
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;  --space-4: 16px;  --space-6: 24px;
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px;
  --text-xs: 11px; --text-sm: 13px; --text-md: 14px; --text-lg: 16px;
  --success: #1d9e75; --warning: #ba7517; --danger: #e24b4a; --star: #ef9f27;
  --bp-mobile: 640px;
}
```

Those four semantic colours are currently hardcoded as hex literals **dozens of times** across the
codebase — `#1d9e75` alone appears in 11 files.

Then extract five primitives that absorb most of the duplication: `<Button variant>`, `<Input>`,
`<Card>`, `<Modal>` (with focus trap + Escape, fixing §3.3), `<EmptyState icon text action>`. Along
with a single `src/lib/constants.js` holding `RATING_LABELS`, `STATUS_LABELS`, `STATUS_COLORS`
(**m5**), this removes an estimated 1,200+ lines.

*Alternative:* Tailwind if you prefer utility-first — it solves the same problems. CSS Modules is the
lower-friction path given the existing custom-property foundation.

**Effort:** 🔴 3–4 days, but incrementally shippable component by component.

#### R4 — Put the schema in version control with real migrations *(addresses M12)*

This is the recommendation with the highest long-term leverage, because **C2 and C5 both live in SQL
that isn't reviewable** — the `profiles` policy behind the privilege escalation exists in no file in
this repository.

1. Remove `supabase/` from [.gitignore](.gitignore) (keep `supabase/.temp/` and any local config).
2. `supabase init && supabase link --project-ref ooyatastdqqxflfnlngu`
3. `supabase db pull` — generates a baseline migration capturing the **actual live schema**, including
   the missing `profiles`, `bingr_library`, and `bingr_episodes` DDL.
4. All future changes via `supabase migration new <name>` → `supabase db push`.
5. Commit the generated types (`supabase gen types typescript`) for editor support.

**Effort:** 🟢 3 hours, and it retroactively documents everything.

#### R5 — Add a CI gate *(addresses m1, C1, and the whole class)* — ✅ implemented

**Status: shipped.** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs `npm run lint` and
`npm run build` on every push/PR to `main`, and both now genuinely pass (0 lint errors, clean build) —
see **m1**. Kept below for reference; the shipped workflow matches this closely.

Every critical finding except C2 and C5 would have been caught by an automated check. The minimum
viable gate:

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint        # ← would have caught C1 (react-hooks/immutability)
      - run: npm run build
```

Fix the 44 existing errors first (most are `no-unused-vars` and mechanical), then add
`--max-warnings 0`. Follow with Vitest + React Testing Library and a smoke test per route — a single
render test of `UserProfilePage` catches **C1**; a mocked-fetch test of `useFeed` catches **C3**.

**Effort:** 🟢 CI: 1 hour. Clearing existing lint errors: 4 hours. First tests: 1 day.

#### R6 — Make moderation and privacy server-enforced *(addresses C5, C6, C7, M9, M10, M17)*

Everything user-facing in Bingr's social layer is currently guarded only in the browser. The
consolidated fix is a single SQL migration plus one trigger:

```sql
-- 1. Content constraints (C7, M10)
alter table public.bingr_comments
  add constraint comment_len check (char_length(comment) between 2 and 1000);
alter table public.bingr_diary
  add constraint notes_len check (notes is null or char_length(notes) <= 1000);
alter table public.profiles
  add constraint bio_len check (bio is null or char_length(bio) <= 300);

-- 2. Authorship binding (C6)
drop policy "Logged in users can post comments" on public.bingr_comments;
create policy "Logged in users can post comments"
  on public.bingr_comments for insert with check (
    auth.uid() = user_id
    and username = (select p.username from public.profiles p where p.id = auth.uid())
  );

-- 3. Server-side rate limit (C7)
create or replace function public.check_comment_rate() returns trigger
language plpgsql security definer as $$
begin
  if (select count(*) from public.bingr_comments
      where user_id = new.user_id and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'rate_limit_exceeded';
  end if;
  return new;
end $$;
create trigger comments_rate_limit before insert on public.bingr_comments
  for each row execute function public.check_comment_rate();

-- 4. Flags actually do something (M17)
create or replace function public.apply_comment_flag() returns trigger
language plpgsql security definer as $$
begin
  update public.bingr_comments
     set flag_count = flag_count + 1,
         status = case when flag_count + 1 >= 3 then 'flagged' else status end
   where id = new.comment_id;
  return new;
end $$;
create trigger comment_flag_applied after insert on public.bingr_comment_flags
  for each row execute function public.apply_comment_flag();

-- 5. Feedback spam (M9)
drop policy "Users can submit feedback" on public.bingr_feedback;
create policy "Authenticated users can submit feedback"
  on public.bingr_feedback for insert to authenticated
  with check (auth.uid() = user_id);
```

Then map the new error codes in [errors.js](src/lib/errors.js) so `rate_limit_exceeded` and the
check-constraint violations render as friendly messages, and keep `moderation.js` as the instant
client-side pre-check.

**Effort:** 🟡 1 day including client error mapping.

#### R7 — Close the KDPA gaps *(addresses M2, M15, M16)*

1. **Rewrite Privacy Policy §1** to list what is actually collected: username, display name, country
   code, bio, diary notes, feedback message + email, donation records. Correct the RLS claim in §6.
2. **Complete account deletion** — extend the Edge Function to explicitly delete `bingr_diary`,
   `bingr_comments`, `bingr_comment_flags`, `bingr_follows`, and to **anonymise** `bingr_feedback` /
   `bingr_donations` (`username = 'deleted'`, `email = null`) rather than leaving PII behind.
3. **Full-account export** — add a "Download all my data" button in `ProfilePage` producing a single
   JSON bundle (profile + library + diary + episodes + lists + comments + follows). `export.js`
   already has the download plumbing; this is one query per table plus `JSON.stringify`.
4. **Profile visibility toggle** in `ProfilePage`, backed by the **C5** policy.
5. Link Privacy/Terms from the landing footer (**M4**) — the pre-signup surface.

**Effort:** 🟡 1–1.5 days.

#### R8 — Adopt React Router *(addresses §2.6)*

The hand-rolled router works for the current five routes but already has two real defects (URL rewritten
to `/` on profile/list navigation; full page reloads via `window.location.href`). `react-router-dom`
v7 is ~18 KB gzipped and would also unlock the route-level code splitting that fixes **M13**:

```jsx
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'))
const AdminPanel      = lazy(() => import('./pages/AdminPanel'))
```

**Effort:** 🟡 1 day.

---

## 7. Incomplete / Unfinished Areas

### 7.1 Monetization (M-Pesa / IntaSend) — groundwork only, with a live placeholder

You flagged this as deferred. Here is precisely what exists and what doesn't:

**Exists:**
- `bingr_donations` table with `amount_kes`, `confirmed`, `show_on_wall`, `note`, `donated_at`, and
  working RLS ([supabase_admin.sql:36-64](supabase/supabase_admin.sql#L36-L64))
- Admin CRUD for donations ([AdminPanel.jsx:166-245](src/pages/AdminPanel.jsx#L166-L245)) — a
  "Record M-Pesa donation" form for **manual entry after the fact**
- Public supporter wall ([SupportersPage.jsx](src/pages/SupportersPage.jsx)) with KES totals
- Country-gated support sheet ([SupportButton.jsx](src/components/SupportButton.jsx)) — Kenyan users
  see the M-Pesa flow, others get "International support coming soon"
- Recent-supporters preview inside the sheet

**Does not exist:**
- **Any IntaSend/Daraja integration.** No SDK, no API keys, no STK Push, no callback URL, no webhook
  handler. `package.json` has four dependencies total; none are payment-related.
- **Any payment verification.** `confirmed` is a boolean an admin ticks by hand after reading their
  M-Pesa SMS.
- **A real till/phone number.** [SupportButton.jsx:6](src/components/SupportButton.jsx#L6):
  ```js
  const getNumber = () => ['07', '00', '000', '000'].join('') // ← replace with your real number
  ```
  **This is live in production right now.** A Kenyan user who taps "Show M-Pesa number" is shown
  **`0700 000 000`**, formatted to look legitimate, with a "Copy" button. This is the highest-priority
  item in this section — not because the feature is incomplete, but because the incomplete version is
  *user-facing and looks complete*. Either hardcode the real number or hide the reveal button behind
  a flag until the integration lands.
- CSP `connect-src` does not allow any payment provider domain, so the integration will need a
  `vercel.json` change too.

**Assessment:** the *data model* is done and the *UI* is done; the *payment rail* is entirely absent.
Manual reconciliation is a legitimate MVP choice for low volume — but the placeholder number must go
today.

### 7.2 Moderation enforcement — UI complete, backend absent

Covered in **C6**, **C7**, **M17**. Summary of the gap:

| Layer | Built? |
|---|---|
| Report button + menu | ✅ [CommentsSection.jsx:53-56](src/components/CommentsSection.jsx#L53-L56) |
| `bingr_comment_flags` table with unique `(comment_id, user_id)` | ✅ |
| Admin review UI with flag counts | ✅ [AdminPanel.jsx:255-269](src/pages/AdminPanel.jsx#L255-L269) |
| Hide / restore / delete actions | ✅ |
| `flag_count` ever incremented | ❌ column exists, always `0` |
| Auto-hide at a threshold | ❌ |
| Server-side profanity / length / rate limits | ❌ all client-only, all [VERIFIED bypassable] |
| Author identity binding | ❌ **spoofable (C6)** |
| User notification of report outcome | ❌ report silently vanishes, reappears on reload |
| Appeal path / audit log | ❌ |

The moderation *interface* is more complete than the moderation *system* — which is the worst
combination, because it reads as protection that isn't there.

### 7.3 Custom domain readiness

Currently on `bingr-tawny.vercel.app`. Blockers before moving to a custom domain:

| Item | Status |
|---|---|
| HSTS with `preload` | ✅ already set ([vercel.json:11](vercel.json#L11)) — note that `preload` on a `.vercel.app` subdomain is ineffective; it becomes meaningful on your own domain |
| Supabase Auth redirect allow-list | ⚠️ must add the new origin before switching, or OAuth + password reset break |
| `emailRedirectTo` / `redirectTo` | ✅ use `window.location.origin` — portable |
| Email templates / sender domain | ❌ still Supabase default; needs SPF/DKIM on the new domain for deliverability |
| Contact addresses | ❌ `privacy@bingr.app`, `legal@bingr.app`, `support@bingr.app` are referenced in [PrivacyPolicy.jsx:3](src/pages/PrivacyPolicy.jsx#L3), [TermsOfService.jsx:3](src/pages/TermsOfService.jsx#L3), [useAuth.js:110](src/hooks/useAuth.js#L110), [ProfilePage.jsx:111](src/pages/ProfilePage.jsx#L111) — **these mailboxes must exist**, or the KDPA rights process is unreachable |
| Open Graph / Twitter card tags | ❌ **none** in [index.html](index.html) — shared list and profile links render as bare URLs, undermining the whole sharing loop |
| `robots.txt` / `sitemap.xml` | ❌ absent |
| Canonical URL / SSR for public pages | ❌ SPA-only; public profiles and lists are invisible to crawlers |

### 7.4 Other unfinished threads

- **`profiles.avatar_url` column exists and is never used.** Every avatar in the app is a
  two-letter initials circle. Google's `avatar_url` is read from `user_metadata` in `OnboardingModal`
  but never persisted.
- **`profiles.bio` exists**, is rendered on the (crashing) public profile
  ([UserProfilePage.jsx:150](src/pages/UserProfilePage.jsx#L150)), and **has no edit UI**.
- **`bingr_list_items.sort_order`** exists, defaults to 0, is never written or ordered by — manual
  list ordering is unimplemented.
- **`geo.js`** is complete and never imported. **This is a deliberate product decision, not an
  oversight** — automatic geolocation was tried, proved unreliable, and was replaced by the mandatory
  country dropdown in `AuthPage` and `OnboardingModal`. Manual selection is also the *more defensible*
  choice here: it is explicit, user-controlled, avoids processing IP-derived location data under KDPA,
  and gates the M-Pesa number reveal deterministically rather than on a third-party lookup that can
  fail or be VPN-shifted. **Recommendation: delete [geo.js](src/lib/geo.js)** so the intent is
  unambiguous in the code, and drop the CSP `connect-src` suggestion for the three geo providers
  (withdrawn from **M11**) — those hosts should stay out of the policy.
- **`UsernamePrompt.jsx`** is a complete 107-line component superseded by `OnboardingModal.jsx`.
- **`getPublicDiary` / `getPublicList`** are fully implemented hook methods with no callers.

---

## 8. Priority Roadmap

### P0 — Ship this week (security + broken features)

| # | Task | Findings | Effort |
|---|---|---|---|
| 1 | Block `role` self-escalation on `profiles` | **C2** | 30 min |
| 2 | Fix the `useMemo`/`useState` order in `UserProfilePage` | **C1** | 5 min |
| 3 | Remove the placeholder M-Pesa number `0700000000` | §7.1 | 5 min |
| 4 | Scope `bingr_diary` SELECT to `profile_public` | **C5** | 20 min |
| 5 | Add FK + error checking so the feed works | **C3** | 40 min |
| 6 | Bind `bingr_comments.username` to the authenticated profile | **C6** | 1 h |
| 7 | Comment length constraint + server rate-limit trigger | **C7** | 1 h |
| 8 | ~~Fix email-signup username/country loss~~ — **resolved by disabling email confirmation** | ~~**C4**~~ | ✅ done |
| 8b | Assert row counts on all writes (`.select()` + length check) — root cause of C4/C8 | **M21** | 3 h |
| 9 | Let comment authors see/delete their own hidden comments | **C8** | 15 min |
| 10 | Delete `useAdmin.deleteUser`; fix the Edge Function's `target_user_id` handling | **M1** | 30 min |
| 11 | Wire landing-page legal links; fix the feed CTA dead click | **M4, M5** | 20 min |
| 12 | Add `lh3.googleusercontent.com` to CSP `img-src` | **M11** | 5 min |

**≈ 1.5 days.** Items 1–7, 9 and 10 are backend/config changes deployable independently of the frontend.

### P1 — Next two weeks (correctness + compliance)

| # | Task | Findings | Effort |
|---|---|---|---|
| 12 | Schema into git + Supabase migrations (**do before any further SQL**) | **M12** | 3 h |
| 13 | CI: lint + build on every push; clear the 44 lint errors | **m1** | 5 h |
| 14 | TMDB caching/retry/abort layer; batch the season fan-out | **M7, M8, R2** | 4 h |
| 15 | Fix `last_seen_at` (add the missing `await`) | **M3** | 5 min |
| 16 | Feed auto-refresh when `following` changes | **M6** | 30 min |
| 17 | Complete account deletion + anonymise residual PII | **M2** | 4 h |
| 18 | Rewrite Privacy Policy §1 and §6 to match reality | **M15** | 2 h |
| 19 | Full-account JSON export + profile visibility toggle | **M16** | 6 h |
| 20 | Flag threshold auto-hide; report confirmation toast | **M17** | 3 h |
| 21 | Explicit `.eq('user_id', …)` filters alongside RLS | **M14** | 1 h |
| 22 | Confirmation dialogs on destructive one-click actions (diary/library/comment delete) | §4.1 | 2 h |
| 23 | Feedback insert restricted to authenticated users | **M9** | 20 min |

**≈ 4 days.**

### P2 — Next month (architecture)

| # | Task | Findings | Effort |
|---|---|---|---|
| 24 | Migrate hooks to TanStack Query, starting with `useFeed`/`useLibrary` | **R1**, M19 | 2–3 d |
| 25 | React Router + route-level code splitting | **R8**, M13 | 1 d |
| 26 | CSS Modules + design tokens + 5 shared primitives | **R3**, §3.1 | 3–4 d |
| 27 | Mobile pass: breakpoints, tap-friendly card actions, tab scroll affordance | §3.2 | 2 d |
| 28 | Accessibility pass: semantic buttons, focus traps, ARIA, keyboard nav | §3.3 | 2 d |
| 29 | Delete the ~460 LOC of dead code | **m4** | 1 h |
| 30 | Consolidate duplicated constants into `lib/constants.js` | **m5** | 1 h |
| 31 | Vitest + smoke test per route | **m17** | 2 d |

**≈ 2.5 weeks.**

### P3 — Backlog (scale + growth)

| # | Task | Findings |
|---|---|---|
| 32 | Server-side feed via Postgres view/RPC with cursor pagination | §2.4 |
| 33 | Denormalised follower/following counters | §2.4 |
| 34 | Real payment integration (IntaSend/Daraja STK Push + webhook) | §7.1 |
| 35 | Custom domain: redirect allow-list, email domain, OG tags, robots/sitemap | §7.3 |
| 36 | Avatar upload via Supabase Storage (`avatar_url` already exists) | §7.4 |
| 37 | Bio editing, list reordering (`sort_order` already exists) | §7.4 |
| 38 | Real runtimes for watch-time stats instead of hardcoded averages | **m12** |
| 39 | SSR/prerender for public profiles and lists (SEO + share previews) | §7.3 |

---

## 9. Audit Footprint

Live testing was performed against production. Full disclosure of what was written and cleaned up:

| Action | Status |
|---|---|
| Logged in as `claude@test.com` | Read-only session |
| Inserted 1 `bingr_library` row (tmdb 550) | ✅ **Deleted** — verified 0 rows |
| Inserted 1 `bingr_episodes` row (show 1396 S1E1) | ✅ **Deleted** — verified 0 rows |
| Inserted 1 `bingr_diary` row (`AUDITTEST`) | ✅ **Deleted** — verified 0 rows |
| Inserted 11 `bingr_comments` rows (`AUDITTEST` — profanity, spoofed username, oversized, rate-limit burst) | ✅ **Deleted** — verified 0 rows |
| **Set test account `role` to `admin`** (C2 proof) | ✅ **Reverted to `user`** — verified via anon read: `{"username":"tmp_4bbf5c37c6bf","role":"user"}` |
| Set `bingr_comments` id=1 `status` to `hidden` | ✅ Row deleted in cleanup |

### Revision 2 — additional testing and full cleanup

With the admin account provided, the remaining residue was removed and further tests were run:

| Action | Status |
|---|---|
| Deleted `bingr_feedback` row `"AUDITTEST anon spam"` (the M9 proof) | ✅ **Removed** — no longer outstanding |
| Deleted leftover hidden `bingr_comments` row (surfaced **C8**) | ✅ **Removed** |
| Created probe account `audit_c4_probe@test.com` to re-test C4 | ✅ **Destroyed** via the app's own delete-account function |
| Seeded probe rows in `bingr_diary`, `bingr_comments`, `bingr_follows`, `bingr_feedback` to test deletion completeness (**M2**) | ✅ **All removed** — the orphaned feedback row was deleted as admin |
| Verified admin surface: feedback read, comment moderation join, donations CRUD | ✅ Read-only checks; no admin data altered |

**Final verified state — no audit residue remains:**

```
profiles        nkipk (admin) · vulcan (user) · claude (user) · claudeadmin (admin)
bingr_comments  []
bingr_feedback  [{"username":"vulcan","message":"simplify the exported txt"}]   ← pre-existing
bingr_diary     [{"title":"Obsession"}]                                          ← pre-existing
bingr_follows   [1 row]                                                          ← pre-existing
```

The `nkipk`, `vulcan`, and `claudeadmin` accounts were not modified. The `claude` account's role was
escalated and reverted (Rev 1); its username was set to `claude` by the maintainer, not by this audit.

---

## Appendix — Findings Tracker

Update the **Status** column as fixes land, so nothing is dropped. Suggested values:
`open` · `in progress` · `fixed` · `verified` · `won't fix`.

**Fix round 1 — commit `23af63a`, deployed as `assets/index-DNh75_sl.js`, migration
`20260803_p0_security.sql` applied.** Every ✅ below was re-tested against production *after* the fix,
not just reasoned about.

| ID | Severity | Finding | Owner | Status |
|---|---|---|---|---|
| C1 | 🔴 Critical | Public profile TDZ crash | Claude | ✅ **verified** — declaration now precedes use in the live bundle |
| C2 | 🔴 Critical | Privilege escalation to admin | Claude | ✅ **verified** — `PATCH {"role":"admin"}` → `403 role may only be changed by an administrator` |
| C3 | 🔴 Critical | Activity feed 400s silently | Claude | ✅ **verified** — feed query returns joined rows, HTTP 200 |
| C4 | ~~🔴 Critical~~ | ~~Signup discards username/country~~ — resolved by disabling email confirmation; code defect tracked as **M21** | maintainer | ✅ verified |
| C5 | 🔴 Critical | Diary world-readable | Claude | ✅ **verified** — private profile's diary returns `[]` to anon, owner still sees it, public profiles unaffected |
| C6 | 🔴 Critical | Comment authorship spoofable | Claude | ✅ **verified** — posting as `nkipk` → `403`; posting as own handle → `201` |
| C7 | 🔴 Critical | Moderation client-side only | Claude | ✅ **verified** — 3,000 chars → `400` check constraint; 6 rapid inserts → `201×4` then `400` |
| C8 | 🔴 Critical | Authors can't see/delete own hidden comments; delete reports false success | Claude | ✅ **verified** — owner sees and deletes own hidden comment; anon still cannot see it |
| C9 | 🔴 Critical | Admin "Make admin" never worked; UI showed false success | Claude | ✅ **verified** — migration `20260803_p0b_admin_write.sql` applied, promote/demote round-tripped live |
| C10 | 🔴 Critical | `bingr_library` had no public-read policy — public rankings always empty | Claude | ✅ **verified** — migration `20260803_p1a_library_visibility.sql` applied; public profile visible to anon + other users, private profile hides from anon while owner still sees it |
| M1 | 🟠 Moderate | `delete-account` ignores `target_user_id` | Claude | ✅ **verified** — Edge Function redeployed by maintainer, confirmed via live CORS header check |
| M2 | 🟠 Moderate | Incomplete account deletion (KDPA) | Claude | ✅ **verified** — Edge Function redeployed by maintainer, end-to-end deletion test confirmed diary/comments/follows/library all removed, feedback/donations anonymised |
| M3 | 🟠 Moderate | `last_seen_at` never written | Claude | ✅ fixed — was fire-and-forget on a lazy thenable, never actually sent; now awaited via `.then()` with a warn on failure |
| M4 | 🟠 Moderate | Landing legal links dead | Claude | ✅ **verified live** |
| M5 | 🟠 Moderate | Feed CTA dead click | Claude | ✅ fixed |
| M6 | 🟠 Moderate | Feed never auto-refreshes | Claude | ✅ fixed |
| M7 | 🟠 Moderate | No `.catch()` on TMDB chains | Claude | ✅ fixed — `DetailPanel`, `EpisodeTracker` now show a real error state with Retry instead of hanging on "Loading..." forever; also fixed the same missing-`error`-check bug in `SupportersPage`/`SupportButton` (Supabase, same failure class) |
| M8 | 🟠 Moderate | TMDB N+1 fan-out | Claude | ✅ fixed — bounded to 4 concurrent requests via `mapWithConcurrency`, failures now logged instead of swallowed |
| M9 | 🟠 Moderate | Anon feedback spam vector | Claude | ✅ **verified** — anon insert → `401` |
| M10 | 🟠 Moderate | No DB length constraints | Claude | ✅ fixed for comments / diary notes / bio / feedback |
| M11 | 🟠 Moderate | CSP blocks Google avatars | Claude | ✅ **verified live** in response headers |
| M12 | 🟠 Moderate | Schema not in version control | Claude | ✅ fixed — `supabase/` tracked, migrations added |
| M13 | 🟠 Moderate | 1.08 MB single bundle | Claude | ✅ fixed — route-level `lazy()`/`Suspense` splitting + vendor chunk separation; app chunk 1,087 KB → 130 KB |
| M14 | 🟠 Moderate | Queries rely solely on RLS | Claude | ✅ fixed — `useLibrary.load` and `useEpisodes.load` were the only two gaps |
| M15 | 🟠 Moderate | Privacy Policy inaccurate | Claude | ✅ fixed — §1 data list corrected, §4 retention matches the M1/M2 fix, §6 RLS claim no longer overstated |
| M16 | 🟠 Moderate | No full data export / privacy toggle | Claude | ✅ **fully fixed.** Visibility toggle shipped and verified live. Full-account export added: `useProfile.exportAllData()` queries `profiles`, `bingr_library`, `bingr_diary`, `bingr_episodes`, `bingr_lists`, `bingr_list_items`, `bingr_comments`, and `bingr_follows` (both directions) scoped to the signed-in user via `Promise.allSettled` — one section failing doesn't block the rest, and the user is told which sections (if any) came back incomplete. `downloadFullExport()` in `lib/export.js` bundles it into a single timestamped JSON file. Surfaced in `ProfilePage` as "📦 Download all my data". **[VERIFIED LIVE]** — all nine underlying queries return HTTP 200 for the test account. |
| M17 | 🟠 Moderate | Comment reports do nothing | Claude | 🔶 client confirmation shipped; server auto-hide trigger written, awaiting `p1b` migration |
| M18 | 🟠 Moderate | Edge Function CORS `*` | Claude | ✅ **verified** — pinned to `ALLOWED_ORIGIN` in the same rewrite as M1/M2; confirmed live via response header (`Access-Control-Allow-Origin: https://bingr-tawny.vercel.app`) |
| M19 | 🟠 Moderate | `useLibrary.upsert` dep churn | Claude | ✅ fixed — `upsert`/`setStatus`/`setRating` now read current library state via a `useRef` instead of closing over it, so their identity is stable across renders and rating one title no longer re-renders every `MovieCard` on screen |
| M20 | 🟠 Moderate | In-memory auth rate limit | Claude | ✅ addressed — both in-memory limiters (`useAuth.checkRateLimit`, `moderation.checkCommentRateLimit`) now carry an explicit comment that they're UX-only, not security controls; the real backstops are Supabase Auth's own server-side limits and the `bingr_comments_rate_limit` DB trigger (already shipped and verified in an earlier round) |
| M21 | 🟠 Moderate | Zero-row writes treated as success (root cause of C4, C8, C9) | Claude | ✅ fixed — `assertAffected()` applied to `signUp`, `deleteComment`, `promoteUser`, `deleteEntry`, `deleteList`, `addToList`, `removeFromList`, `useLibrary.remove`; `useFollows.unfollow` handled separately since a missing row there is a legitimate no-op, not a failure |
| m1 | 🟡 Minor | 44 ESLint errors, no CI | Claude | ✅ **`npm run lint` and `npm run build` both exit 0.** Fixed every mechanically-safe category: `no-unused-vars` (11), `react-hooks/static-components` (7 — `CardGrid`, `ProviderChips`, `Sel` hoisted to module scope), `no-dupe-keys` (1 more found — `DetailPanel`'s status buttons had a dead `border: 'none'` shadowed by a later `border` key), `no-empty` (4 — these are deliberate "logging must never crash the app" catches; documented with a comment rather than gutted, since a comment alone satisfies the rule). **Not** force-fixed: `react-hooks/set-state-in-effect` (17 instances, 100% of what's left) — every one has the identical shape (`useEffect(() => { load() }, [load])` where `load` synchronously sets loading state), and fixing it properly means restructuring how ~15 hooks/pages initiate a fetch — that's R1's scope (the TanStack Query migration), not a lint cleanup, and forcing it here would be the single riskiest change in this entire audit applied hastily. Downgraded to a warning in `eslint.config.js` with a comment explaining exactly this, so CI is a real, honest gate against *new* regressions today without either blocking on unrelated pre-existing debt or hiding it. **CI added**: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint + build on every push/PR to `main`. |
| m2 | 🟡 Minor | Duplicate object keys | Claude | ✅ fixed (both instances, earlier round) |
| m4 | 🟡 Minor | ~460 LOC dead code | Claude | ✅ fixed — deleted `App.css`, `UsernamePrompt.jsx`, unused `src/assets/*`; wired the previously-unused `NetworkError` (now used in `tmdb.js`) and `sanitise()` (now used in `useDiary`, `useLists`, `useProfile`, `FeedbackModal`) instead of deleting them, per the report's own recommendation. `geo.js` kept per explicit instruction — it's superseded by design (see §7.4), not abandoned. `getPublicDiary`/`getPublicList`/`deleteUser` still unused — no natural call site yet. |
| m5 | 🟡 Minor | Duplicated constants | Claude | ✅ fixed — new `src/lib/constants.js` is now the single source for `RATING_LABELS` (was in 7 files) and `STATUS_LABELS`/`STATUS_COLORS` (was in 3-4 files with divergent values). Resolved the divergence deliberately: canonical `STATUS_LABELS` is the plain form ('Watched', not 'Watched ✓') since the checkmark only made sense as a "currently selected" indicator on `DetailPanel`'s toggle buttons — that component now appends it itself rather than baking it into every consumer's label. `export.js`'s distinct 'Want to Watch' phrasing kept as `EXPORT_STATUS_LABELS` since exported text reads better as a full phrase than a badge word. |
| m3 | 🟡 Minor | Components defined inside components | Claude | ✅ fixed |
| m6 | 🟡 Minor | Shared `window` timer collision | Claude | ✅ fixed |
| m7 | 🟡 Minor | FindPeople no debounce | Claude | ✅ fixed |
| m8 | 🟡 Minor | Admin search case-sensitivity | Claude | ✅ fixed |
| m9 | 🟡 Minor | Feed badge always 0 | Claude | ✅ fixed (side effect of M6) |
| m10 | 🟡 Minor | `.single()` vs `.maybeSingle()` | Claude | ✅ fixed, all 4 sites |
| m11 | 🟡 Minor | Delete-account copy typo/completeness | Claude | ✅ fixed |
| m12 | 🟡 Minor | Hardcoded runtime averages | Claude | ✅ code fixed, awaiting migration `20260803_p1c_runtime_columns.sql` |
| m13 | 🟡 Minor | SupportersPage NaN on null amount | Claude | ✅ fixed |
| m14 | 🟡 Minor | Comments index doesn't cover status filter | Claude | ✅ fixed |
| m15 | 🟡 Minor | Landing page TMDB stat attribution | Claude | ✅ fixed |
| m16 | 🟡 Minor | README still Vite template | Claude | ✅ fixed |
| m17 | 🟡 Minor | Zero tests | Claude | ✅ fixed — Vitest added to CI, 23 tests including a verified C1 regression test |

### Outstanding actions for the maintainer

1. ~~Run `20260803_p0b_admin_write.sql`~~ — ✅ **done**, verified live (C9 closed).
2. ~~Redeploy the `delete-account` Edge Function~~ — ✅ **done**, verified via CORS header on the live function.
3. ~~Replace the placeholder M-Pesa number~~ — ✅ **done**, live.
4. ~~Run `20260803_p1a_library_visibility.sql`~~ — ✅ **done**, verified live (C10 closed). Public "Top Rated" rankings now work, and the privacy toggle correctly hides them when a profile is set private.
5. **Run [`supabase/migrations/20260803_p1b_comment_flags.sql`](supabase/migrations/20260803_p1b_comment_flags.sql)** — closes the server-side half of **M17**. Until then, reported comments still don't auto-hide (`flag_count` stays 0), though the client now at least confirms the report was received.
6. **Run [`supabase/migrations/20260803_p1c_runtime_columns.sql`](supabase/migrations/20260803_p1c_runtime_columns.sql)** — closes **m12**. Adds two nullable columns (`bingr_library.runtime_minutes`, `bingr_episodes.runtime_minutes`); the app code that writes and reads them is already deployed, it just has nowhere to write until this runs. Nothing breaks in the meantime — `computeStats` already falls back to the flat averages when the column data isn't there.

### Status as of this writing

**Every finding in this report — all 10 Criticals, all 21 Moderates, all 17 Minors — is fixed in code
and deployed.** Verification depth differs by tier, and that's worth being precise about rather than
overclaiming:

- **All 10 Criticals** were re-tested live against production with direct evidence (curl against the
  Supabase REST API, live bundle inspection, or both) — see each finding's `[VERIFIED LIVE]` marker.
- **Most Moderates and Minors** were confirmed via a green CI run (lint + the new test suite + build)
  and, for several, an explicit live check called out in their row above (M1, M2, M4, M9, M11, M18,
  and the C10-adjacent library-visibility check). The rest shipped clean through CI but weren't each
  individually re-exercised against production the way the Criticals were — that's a reasonable bar
  for a UI-text fix or a lint cleanup, less so for anything touching data or access control, and I've
  tried to hold the latter to the higher bar throughout.
- **M17** and **m12** are code-complete and deployed but functionally inert until their migrations run
  (items 5 and 6 above) — the app already handles their absence gracefully in the meantime (client-side
  confirmation still works for M17; `computeStats` falls back to flat averages for m12).

Run migrations 5 and 6 whenever convenient — order between them doesn't matter, and neither is urgent.
There is no other outstanding work from this audit.

### Round 4 (P1/P2 continuation) — findings closed

- **M7 / M8 / R2**: `lib/tmdb.js` rewritten with request caching (6h TTL, keyed by path), in-flight
  deduplication, and retry via the existing `withRetry`. `DetailPanel.jsx` and `EpisodeTracker.jsx` no
  longer hang on "Loading..." forever on a TMDB failure — both now show a real error state with a
  Retry button (implemented via a `cancelled` flag + `retryTick` dependency, so a stale in-flight
  request from a previous title can't clobber state after the user has moved on). The season-list
  fan-out in `App.jsx` (previously one simultaneous request per TV show in the library) is now bounded
  to 4 concurrent requests via a new `mapWithConcurrency` helper, with failures logged instead of
  silently swallowed. Also fixed the identical missing-`error`-check bug in `SupportersPage.jsx` and
  `SupportButton.jsx` (Supabase queries, not TMDB, but the same failure class — a query error rendered
  identically to "no supporters yet").

### Round 3 (P1 continuation) — findings closed

- **#22 confirmation dialogs**: diary entry delete ([DiaryPage.jsx](src/pages/DiaryPage.jsx)), library remove ([LibraryTab.jsx](src/pages/LibraryTab.jsx)), and comment delete ([CommentsSection.jsx](src/components/CommentsSection.jsx)) now all use `window.confirm`, matching the pattern already established for list deletion and admin actions. Deliberately **not** added to `MovieCard`'s quick status-toggle buttons — that's a fluid tag-while-browsing interaction, not a "remove entirely" action, and adding a confirm there would be a UX regression, not a fix.
- **M14 defense-in-depth**: `useLibrary.load()` and `useEpisodes.load()` were the only two queries relying entirely on RLS with no explicit `.eq('user_id', ...)`. Both fixed — every other hook already had it or intentionally reads broader data (public comments, admin-wide reads).
- **M17 finished**: [`supabase/migrations/20260803_p1b_comment_flags.sql`](supabase/migrations/20260803_p1b_comment_flags.sql) adds a trigger that increments `flag_count` and auto-sets `status = 'flagged'` at 3 reports — the existing C8 select policy (`status = 'visible' or auth.uid() = user_id`) then hides it automatically, no client change needed for the hide itself. `CommentsSection.jsx` now shows the reporter a "✓ Reported" confirmation instead of the comment just silently vanishing with no feedback. **Requires the maintainer to run the migration** (see above).
- **M13 bundle size**: [App.jsx](src/App.jsx) now lazy-loads everything off the landing → auth → discover critical path (`AdminPanel`, `UserProfilePage`, `PublicListPage`, both legal pages, `SupportersPage`, `ForgotPassword`/`ResetPassword`, `ProfilePage`, `DeleteAccount`, `FeedbackModal`, and the `Rankings`/`StatsPage`/`DiaryPage`/`ListsPage` tabs), each behind a `Suspense` boundary at its render site. [vite.config.js](vite.config.js) also now splits `react`/`react-dom`, `@supabase/supabase-js`, and `@sentry/react` into their own chunks via `manualChunks` (written as a function — this project's Vite 8 uses the Rolldown build engine, which doesn't accept the classic Rollup object-map form). Net effect: the app's own code chunk dropped from **1,087 KB to 130 KB** (32 KB gzip); vendor/Supabase/Sentry chunks are unchanged by app deploys and stay cached in a returning visitor's browser, so a repeat visit after a future deploy only re-fetches the small app chunk. This did not require the React Router migration (R8) — the existing hand-rolled conditional router works fine with `lazy()`/`Suspense`, so that migration stays deferred as a separate, higher-risk item.
