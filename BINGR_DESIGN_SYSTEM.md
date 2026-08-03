# bingr — Design System & Redesign Proposal

**Date:** 3 August 2026
**Companion documents:** [`BINGR_AUDIT_REPORT.md`](BINGR_AUDIT_REPORT.md) (functional/security), [`BINGR_UI_AUDIT.md`](BINGR_UI_AUDIT.md) (redundancy/contradiction/gap tracker — this document resolves several rows from it directly)
**Status:** proposal, not yet implemented. No code changes in this pass — direction, system, and screen specs only, per the working agreement.

**Brief locked in:** modern, creative, advanced. Growth product — a stranger has to be able to land on this cold and get it. Bold & maximalist, not safe. Dark-first, light mode a full faithful adaptation. I have authority to propose real consolidation, and I've used it — several screens below assume [`BINGR_UI_AUDIT.md`](BINGR_UI_AUDIT.md)'s resolutions are accepted (nine tabs → five, three library tabs → one, Rankings/Stats folding into a profile hub). Where a screen depends on one of those, I say so.

---

## Table of contents

1. [Direction](#1-direction)
2. [Typography](#2-typography)
3. [Colour](#3-colour)
4. [Spacing](#4-spacing)
5. [Radii, borders, elevation](#5-radii-borders-elevation)
6. [Motion](#6-motion)
7. [Icons](#7-icons)
8. [Component specs](#8-component-specs)
9. [Screens](#9-screens)
10. [Open questions for you](#10-open-questions-for-you)

---

## 1. Direction

### Why not just "clean and minimal"

That's not a rejection of minimalism as a discipline — it's a rejection of minimalism as a *default*, which is what it's become in software. "Clean and minimal" is what you get when a team is afraid to make a specific choice, so they make no choice and call the absence of decision-making "elegant." It's also, bluntly, what every tracker app already looks like. Serializd is clean-and-minimal. A hundred Notion-adjacent side projects are clean-and-minimal. It photographs well in a screenshot and says nothing about who made it.

bingr's actual unfair advantage is that it's in a domain — film and TV — where the source material is already maximalist. Poster art is loud on purpose: it's trying to sell you two hours of your life in one image. A tracker app that mutes that down to fit inside a quiet grey system-UI grid is fighting its own content. The brief asked for a direction that "borrows from, rejects, and flatters" someone specific — here are three that take that seriously.

### Direction 1 — Night Market

**Borrows from:** East African hand-painted movie poster art — a real, specific, undersung visual tradition (video-den signage, matatu graffiti, market signage) — full-saturation color used without embarrassment, hand-lettered energy, hyperbolic composition, several loud colors coexisting in one frame on purpose.

**Rejects:** the Hollywood-lobby cliché (velvet rope, gold foil, Oscar-bait solemnity) and Silicon Valley SaaS restraint in equal measure. Nothing about this direction apologizes for being loud.

**Flatters:** someone who wants their taste to feel alive and social, proud of where the product is from, unbothered by film-snob seriousness. The "I just want to talk about what I watched with people who get it" user, not the archivist.

**Visual bet:** hyper-saturated color-blocked sections, a hand-lettering-adjacent display face for hero moments, poster collage that overlaps, bleeds, and rotates rather than sitting in a tidy grid.

### Direction 2 — Late Signal

**Borrows from:** broadcast and cinema signage — marquee lights, the specific late-night video-rental-store nostalgia, ticket-stub and boarding-pass card shapes, departures-board typographic rhythm (monospace numerals, tabular data).

**Rejects:** warmth as the primary mode. This is cooler, more exacting, more "collector" than "social."

**Flatters:** someone who thinks of themselves as having precise, slightly obsessive taste — the diary-keeper who remembers exactly which night they watched something and cares that the app remembers it too.

**Visual bet:** near-black backgrounds, one hot accent used sparingly against high-contrast neutrals, monospace numerals for stats and ratings, ticket/stub shapes, a subtle scanline/grain texture repeated as a signature motif.

### Direction 3 — Reel / Archive

**Borrows from:** film-festival identity systems, archival card-catalogue aesthetics, magazine editorial layout — pull quotes, oversized folio numbers, asymmetric grids.

**Rejects:** app chrome wherever it can — buttons-as-buttons get replaced by underline/label interactions where feasible; typographic hierarchy does the work UI chrome usually does.

**Flatters:** the person who thinks of bingr as their film journal, not their social app — stats-as-annual-report over feed-as-social-stream.

**Visual bet:** big serif or slab display type, asymmetric editorial grids on desktop, oversized numerals ("247 films this year" set enormous), the most restrained palette of the three — sophisticated-loud rather than saturated-loud.

### Recommendation: Night Market, with Late Signal's numeric discipline grafted on

Night Market is the right primary bet for the brief you actually gave me. It's the boldest of the three, which is what "not safe" asked for. It's the most genuinely distinctive against the named competitive set — Letterboxd is warm-editorial, Trakt is dense-functional, Serializd is modern-conservative, and *none* of them have gone anywhere near this territory, which means bingr doesn't read as "a bit more colorful than Letterboxd," it reads as its own thing. And critically, it makes the Nairobi origin load-bearing rather than trivia in a footer: "built in Nairobi" currently means a flag emoji and a copyright line; Night Market means the actual visual language is doing something no competitor's design team would have arrived at, because it's not drawing from the same reference pool they are. For a growth product, that's a real differentiator, not a nice-to-have.

But Night Market alone, unmoderated, risks feeling all-vibes-no-structure on the screens that are genuinely about data — Stats, Diary, the rating system. So I'm grafting in Late Signal's specific move for those screens: monospace numerals for stat totals, ratings, and dates, set against the same saturated palette. That combination — loud color and image work on the discovery/social surfaces, precise mono numerals on the data surfaces — is the synthesis I'm specifying below. Reel/Archive is the direction I'd reach for if you'd answered "personal tool, small," where restraint reads as confidence; for "growth product, bold," it undersells.

---

## 2. Typography

Three families, three distinct jobs — not a safe single-sans system, but each face earns its place rather than being decoration.

| Role | Typeface | Source | Why |
|---|---|---|---|
| **Display** | **Bricolage Grotesque** | Google Fonts, variable, free | Genuinely eclectic in its bolder weights — flared terminals, real character — designed explicitly for expressive use. Carries Night Market's energy without resorting to a literal hand-lettered/script face, which would age badly and hurt legibility. |
| **Body / UI** | **General Sans** | Fontshare, free | Clean, warm-neutral grotesk, highly legible at small mobile sizes. The workhorse — personality in this system comes from color, type scale, and motion, not from the body face fighting for attention. |
| **Numerals / data** | **Space Mono** | Google Fonts, free | Late Signal's contribution — tabular figures, ticket-stub character. Reserved *only* for ratings, stat totals, dates-in-compact-contexts, and episode codes (S02E04). Never used for prose. |

### Type scale

Base: 16px root. Display uses Bricolage Grotesque, Body uses General Sans, Mono uses Space Mono. All `letter-spacing` values are in `em`, negative tightens, positive (used only on the uppercase overline) loosens.

| Token | Size (px / rem) | Weight | Line-height | Letter-spacing | Usage |
|---|---|---|---|---|---|
| `display-2xl` | 56 / 3.5rem | 800 | 1.0 | -0.02em | Landing hero headline; Stats "Wrapped" hero number only. Never used twice on the same screen. |
| `display-xl` | 40 / 2.5rem | 700 | 1.05 | -0.015em | Title-detail page film title; landing section headers. |
| `display-lg` | 32 / 2rem | 700 | 1.1 | -0.01em | Section headers (e.g. "Trending this week"), auth screen headline. |
| `display-md` | 24 / 1.5rem | 600 | 1.2 | -0.005em | Card/modal titles, active-tab page headers. |
| `body-lg` | 17 / 1.0625rem | 400 (500 for emphasis) | 1.5 | 0 | Primary reading text — comment bodies, diary notes, bios. |
| `body-md` | 15 / 0.9375rem | 400 (500 for emphasis) | 1.5 | 0 | Default UI text — button labels, form labels, list-row titles. |
| `body-sm` | 13 / 0.8125rem | 400 (500 for emphasis) | 1.4 | 0 | Secondary/meta text — timestamps, byline text, helper copy. |
| `body-xs` | 11 / 0.6875rem | 600 | 1.3 | +0.02em, uppercase | Eyebrow labels, status badges, overline tags only. Never body prose. |
| `mono-lg` | 28 / 1.75rem | 700 | 1.0 | 0 | Stat hero numbers ("247 films"). |
| `mono-md` | 15 / 0.9375rem | 700 | 1.2 | 0 | Rating badges (`★ 8/10`), diary day-of-month numerals. |
| `mono-sm` | 12 / 0.75rem | 400 | 1.3 | +0.02em | Timecodes, episode codes, compact dates. |

**Rule:** display type is never used below 24px, and body type is never used above 17px — if something feels like it needs 20px body text, it's actually a `display-md` at 600 weight, not a stretched body style. This is the single most common way type scales get muddy in practice, so it's worth stating as a hard rule.

---

## 3. Colour

### On `#E8392A`

Drop it. Two independent problems, not one preference:

1. **It's already crowded territory.** Red/crimson is Netflix, and red-orange is Trakt's own accent — "brand red" in this exact competitive category is the least distinctive lane available, not the most.
2. **It collides with its own error state.** The current app's danger/error color is `#e24b4a` — close enough to the `#E8392A` accent that a destructive-action button and a "this is your brand" button read as nearly the same color. That's not a stylistic quibble, it's a genuine legibility/semantics problem: color is supposed to tell a user "this is safe to press" versus "this will delete something," and right now it barely can.

### The palette

**Primary — Magenta.** Underused in this specific competitive set (no major film-tracker or streaming brand sits here), reads as confident and current, and gives real breathing room from the error-red collision above. Two calibrated shades, not one — this matters and is explained below.

| Token | Hex | Use |
|---|---|---|
| `magenta-bright` | `#F5266E` | Text, links, icons, borders, small UI elements, decorative fills. **Not** for solid button backgrounds carrying text. |
| `magenta-deep` | `#C81E5C` | Solid-fill button backgrounds, anywhere white label text sits on top of the brand color. |

*Why two shades:* I calculated the actual contrast ratio of white text on `magenta-bright` — **3.90:1**. That fails WCAG AA for normal text (needs 4.5:1) and even fails for a 15px-bold button label (large-text exemption requires ~19px bold minimum, which button labels aren't). `magenta-deep` on the same white text measures **5.53:1** — comfortably passes. This is exactly the kind of thing that gets caught by an eyeballed "looks fine" pass and ships broken; running the actual numbers is why there are two tokens instead of one.

**Rating — Gold.** Fully separate hue from both magenta and the status colors below, so "this is a rating" never gets confused with "this is a status" or "this is the brand."

| Token | Hex | Use | Contrast on `bg-canvas` |
|---|---|---|---|
| `gold` | `#FFB627` | Star ratings — the *only* thing this hue is used for. Replaces both `#ef9f27` and `#ba7517` from the current app, which were splitting "rating gold" into two colors with no rule for which got which (see [`BINGR_UI_AUDIT.md`](BINGR_UI_AUDIT.md) CX2). | **11.25:1** — excellent |

**Status — three hues, deliberately not sharing territory with rating gold or brand magenta.**

| Token | Hex | Use |
|---|---|---|
| `status-watched` | `#22C55E` | Watched pill/badge (kept close to the current app's green — it was already correct). |
| `status-watching` | `#2DD4BF` | Watching pill/badge — teal, replaces the old amber which now collides with rating gold. |
| `status-watchlist` | `#6366F1` | Watchlist pill/badge — indigo. |

**Semantic.**

| Token | Hex | Use | Contrast on `bg-canvas` |
|---|---|---|---|
| `success` | `#22C55E` | Confirmation states — shares the watched-green intentionally, both mean "done, good." |
| `danger` | `#EF4444` | Destructive actions, error text. A true red, chosen specifically to no longer sit near the brand magenta — resolves the collision described above. | **5.25:1** — passes AA |
| `warning` | `#F59E0B` | Rare — rate-limit notices, "action needed" states. Visibly more orange than `gold` when placed side by side; the two are never adjacent in practice since gold is rating-only. |

### Neutrals — dark (primary)

Warm-tinted near-black, not true `#000000` — pure black flattens dark-mode elevation (nothing reads as "raised" if the floor is already the darkest possible value) and reads cheaper than a warm charcoal.

| Token | Hex | Use |
|---|---|---|
| `bg-canvas` | `#0C0A0B` | Page background. |
| `bg-surface` | `#161315` | Cards, standard elevated containers. |
| `bg-surface-2` | `#1F1B1E` | Modals, popovers, further-elevated surfaces. |
| `bg-input` | `#211D20` | Form fields. |
| `border-subtle` | `#241F22` | Default card/divider borders. |
| `border-emphasis` | `magenta-bright` at 1.5px | Focus rings, selected states. |
| `text-primary` | `#F5F1F2` | Primary text. **17.6:1** on `bg-canvas`. |
| `text-secondary` | `#B0A8AC` | Secondary/muted text. **8.5:1** on `bg-canvas`. |
| `text-tertiary` | `#827B7F` | Disabled/least-important text. **≈4.5:1** on `bg-surface` — at the AA boundary, so restrict this token to non-critical microcopy (placeholder text, disabled labels), never body content someone needs to read. |

### Neutrals — light (full adaptation, not an afterthought)

Warm off-white, matching the same warm-neutral direction as the dark palette rather than defaulting to stark white/grey.

| Token | Hex | Use |
|---|---|---|
| `bg-canvas` | `#FAF7F5` | Page background. |
| `bg-surface` | `#FFFFFF` | Cards. |
| `bg-surface-2` | `#F3EEEC` | Modals, popovers. |
| `bg-input` | `#F3EEEC` | Form fields. |
| `border-subtle` | `#E5DEDB` | Default borders. |
| `text-primary` | `#1A1517` | Primary text. **16.9:1** on `bg-canvas`. |
| `text-secondary` | `#5C5459` | Secondary text — target ≥4.5:1, verify with a contrast tool at implementation time (see note below). |
| `text-tertiary` | `#8C8388` | Disabled/least-important — same restricted-use rule as dark mode. |

Brand/status/semantic hues stay the **same hex values** in both themes — magenta, gold, and the status colors are calibrated against dark canvas above; on light canvas they get *more* contrast headroom, not less, since they're mid-saturation colors against a light background rather than needing to pop off black. I did not re-derive a second palette per theme — one palette, two neutral scaffolds, which is both simpler to implement and more consistent brand recognition across theme switches.

**Honesty note on scope:** I hand-computed WCAG contrast ratios (proper relative-luminance formula, not eyeballed) for the highest-stakes pairings above — primary/secondary/tertiary text in both themes, the magenta/white button-fill problem, gold-on-dark, and danger-red-on-dark. I did **not** hand-compute all ~40 possible remaining pairings (status colors on every surface variant, hover states, etc.) — that's real arithmetic risk to do by hand at that volume without a tool, and I'd rather tell you exactly what's verified versus what's designed-to-target than fake precision. Every value above was *chosen* to comfortably clear 4.5:1 against its intended surface; run a contrast-checker pass over the full matrix during implementation as a final gate, same as you'd do for any design system before shipping.

---

## 4. Spacing

One base unit, 4px, everything else a multiple of it. Twelve steps, semantically named, replacing the current ad hoc rem values (1rem/1.25rem/1.5rem/1.75rem/2rem/2.5rem chosen per-file with no shared logic).

| Token | Value | Typical use |
|---|---|---|
| `space-1` | 4px | Icon-to-label gaps, tight inline spacing |
| `space-2` | 8px | Compact padding, gap between related small elements |
| `space-3` | 12px | Default gap inside a card row |
| `space-4` | 16px | Standard card padding, default section gap |
| `space-5` | 20px | Section internal padding on larger cards |
| `space-6` | 24px | Card padding (roomier contexts), gap between distinct UI groups |
| `space-8` | 32px | Section-to-section gap on a page |
| `space-10` | 40px | Major section breaks |
| `space-12` | 48px | Page-top padding on mobile |
| `space-16` | 64px | Hero section padding, landing-page rhythm |
| `space-20` | 80px | Desktop hero padding |
| `space-24` | 96px | Largest desktop section breaks |

---

## 5. Radii, borders, elevation

### Radii

Four tokens replace the current 12 ungoverned values (2/3/4/5/6/8/10/12/14/16/18/20 — see [`BINGR_UI_AUDIT.md`](BINGR_UI_AUDIT.md) CX5).

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 8px | Inputs, small chips, provider-logo tiles |
| `radius-md` | 14px | Cards, standard containers, poster grid tiles |
| `radius-lg` | 24px | Modals, sheets, hero containers |
| `radius-pill` | 999px | Pill buttons, status badges |
| `radius-full` | 50% | Avatars, circular icon buttons |

### Borders

- `border-hairline`: 1px solid `border-subtle` — the only border weight for default card/input outlines.
- `border-emphasis`: 1.5px solid `magenta-bright` — focus rings, selected/active state. Nothing in the system uses a border heavier than 1.5px; weight comes from fill and elevation, not thick strokes.

### Elevation

Dark mode is the primary surface, and drop-shadows barely register on a dark background — real elevation there comes from **surface lightness steps**, which the neutral scale already provides (`bg-canvas` → `bg-surface` → `bg-surface-2`). Light mode gets real shadows, since that's the context where they actually read.

| Token | Dark-mode implementation | Light-mode implementation | Use |
|---|---|---|---|
| `elevation-0` | `bg-canvas`, no shadow | `bg-canvas`, no shadow | Page background |
| `elevation-1` | `bg-surface`, no shadow needed | `bg-surface` + `0 1px 2px rgba(26,21,23,.04), 0 1px 3px rgba(26,21,23,.08)` | Cards |
| `elevation-2` | `bg-surface-2` + 1px inset highlight `rgba(255,255,255,.06)` | `bg-surface-2` + `0 4px 16px rgba(26,21,23,.12)` | Modals, popovers |
| `elevation-glow` | `0 0 32px rgba(245,38,110,.25)` | same | **Brand moments only** — behind a hero poster, a selected/active state that should feel "charged." Used sparingly and deliberately, glow standing in for elevation is a maximalist move, not a default. |

---

## 6. Motion

### Durations

| Token | Value | Use |
|---|---|---|
| `duration-instant` | 80ms | Hover color shifts, press feedback |
| `duration-fast` | 150ms | Standard button/toggle transitions (matches the current app's existing `0.15s` instinct — that part was already right) |
| `duration-base` | 250ms | Card reveals, tab switches, modal content fade |
| `duration-slow` | 400ms | Sheet/modal enter-exit, page-level transitions |
| `duration-hero` | 600ms | Landing hero elements, onboarding beats, Stats Wrapped reveal — rare, high-impact moments only |

### Easings

| Token | Curve | Use |
|---|---|---|
| `ease-standard` | `cubic-bezier(.4,0,.2,1)` | Most transitions — color, opacity, simple transforms |
| `ease-emphasized` | `cubic-bezier(.2,0,0,1)` | Sheets/modals entering — fast start, gentle settle, reads more confident than a linear ease |
| `ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | **One signature interaction, deliberately not overused**: the rating-star tap and the follow-button toggle. A little overshoot gives tactile delight exactly where a user is making a small act of taste. |

### Explicit interaction map

| Interaction | Spec |
|---|---|
| Button press | scale to 0.97, `duration-instant` `ease-standard` |
| Tab switch (underline) | transform slide (not left/right, for perf), 200ms `ease-standard` |
| Bottom sheet enter/exit | translateY 100%→0, `duration-slow` `ease-emphasized` in; `duration-base` `ease-standard` out |
| Toast enter/exit | translateY + opacity, `duration-base` `ease-emphasized` in; `duration-fast` `ease-standard` out |
| Star rating tap | scale 1→1.3→1, 300ms `ease-spring` |
| Follow button toggle | background crossfade `duration-fast` `ease-standard` + check-icon scale-pulse 200ms `ease-spring` |
| Poster hover/press (grid) | scale 1→1.03 + `elevation-glow` fade-in, `duration-fast` `ease-standard` |
| Grid first-load stagger | opacity + 8px translateY per tile, `duration-base` `ease-standard`, 40ms stagger, **capped at the first 12 items** — never staggers on re-render, only true first paint |
| Skeleton shimmer | 1400ms linear, infinite |

---

## 7. Icons

`lucide-react` throughout, replacing every emoji currently used as a functional UI icon. Emoji stays *only* where it's genuinely expressive/human content (e.g., inside actual message text), never as a navigation or action icon.

| Emoji today | Meaning | Lucide icon |
|---|---|---|
| 🔍 | Discover / search | `Search` |
| — | Discover (nav icon, distinct from the search action) | `Compass` |
| 🌐 | Feed | `Rss` |
| 📊 | Stats | `BarChart3` |
| 🏆 | Rankings | `Trophy` |
| 📔 | Diary | `BookOpen` |
| 📋 | Lists | `Layers` |
| 🔖 | Watchlist | `Bookmark` |
| ▶ | Watching | `Play` |
| ✅ | Watched | `CheckCircle2` |
| 🎬 | Track everything / movie | `Clapperboard` |
| ⭐ | Rate & rank | `Star` |
| 📺 | Episode tracking | `Tv` |
| 🎥 | Find where to watch | `MonitorPlay` |
| 👤 | Edit profile | `UserRound` |
| 🪪 | View public profile | `IdCard` |
| ⚙️ | Admin panel | `Settings` |
| 💬 | Comments / feedback | `MessageCircle` |
| 🌟 | Supporters | `Sparkles` |
| 🔒 | Privacy / private | `Lock` |
| 📄 | Terms of Service | `FileText` |
| 🚪 | Sign out | `LogOut` |
| ⚠️ | Warnings, delete account | `AlertTriangle` |
| ☕ | Support (folded into menu — see §9 navigation) | `Coffee` |
| 👋 | Onboarding welcome | `PartyPopper` |
| 🔥 | Trending | `Flame` |
| 🎉 | Wrapped / celebration | `PartyPopper` |
| 📬 | Check your email | `Mail` |
| 🔑 | Forgot password | `KeyRound` |
| 🔐 | Reset password | `ShieldCheck` |
| ❌ | Error / failed | `XCircle` |
| ⏳ | Loading / deleting | `Loader2` (spin) |
| 🐛 | Bug report | `Bug` |
| 💡 | Feature request | `Lightbulb` |
| 🎬 (2nd use) | Missing content | `Film` |
| 🔁 | Rewatch | `Repeat2` |
| 🚩 | Report comment | `Flag` |
| 🗑️ | Delete | `Trash2` |
| ⋯ | More menu | `MoreHorizontal` |
| ✕ | Close / remove | `X` |
| ← | Back | `ArrowLeft` |
| ▼ | Expand | `ChevronDown` |
| 📤 | Export (was outbound-tray; corrected to match the actual action) | `Download` |
| 📦 | Full data export | `Package` |
| 🙏 | Feedback thanks | `HeartHandshake` |
| 👥 | Find people | `Users` |

---

## 8. Component specs

### Button

Single component, five variants, covering all seven visual species currently hand-typed across ~110 instances ([`BINGR_UI_AUDIT.md`](BINGR_UI_AUDIT.md) CX4).

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| `primary` | `magenta-deep` | white `text-primary`-on-dark equivalent | none | The one primary action on a screen (submit, follow, save) |
| `secondary` | `bg-input` | `text-primary` | `border-hairline` | Default secondary action |
| `ghost` | transparent | `text-secondary` | none | Tertiary/low-emphasis action (Cancel, Clear) |
| `danger` | transparent → `danger` on confirm step | `danger` | `border-hairline` at `danger` 30% opacity | Destructive actions |
| `icon` | transparent, `bg-input` on hover | `text-secondary` | none | Icon-only (remove ✕, menu ⋯) |

**Sizes:** `sm` (32px height, `body-sm`, `space-3` horizontal padding, `radius-sm`), `md` (40px height, `body-md`, `space-4` horizontal padding, `radius-sm`), `pill` (same heights, `radius-pill`, used for status/follow/filter actions specifically).

**States:** default → hover (background lightens 8%, `duration-instant`) → active/press (scale 0.97, `duration-instant`) → focus (2px `border-emphasis` ring, offset 2px, **always visible on keyboard focus, never suppressed**) → disabled (40% opacity, no hover/press response) → loading (label replaced by a 16px `Loader2` spin, button stays same width — no layout shift).

### Input

40px height, `radius-sm`, `bg-input` fill, `border-hairline`. Focus: border becomes `border-emphasis` (1.5px magenta), background unchanged. Error state: border becomes `danger`, helper text below in `danger` at `body-sm`. Placeholder text uses `text-tertiary`.

### Select

Same shell as Input. Custom chevron (`ChevronDown`, 16px, `text-secondary`) replacing the native browser arrow — the current app uses raw `<select>` styling, which looks inconsistent across browsers; a consistent custom indicator is cheap and closes that gap.

### Card

`bg-surface`, `radius-md`, `border-hairline`, `space-4` padding as the default (roomier contexts get `space-6`). This is the single container primitive — no more per-file reinvention of "card-like div."

### Modal / Sheet

Bottom sheet is the default shell everywhere (resolves [`BINGR_UI_AUDIT.md`](BINGR_UI_AUDIT.md) CX9's two-paradigm split). `bg-surface-2`, `radius-lg` top corners only, drag handle (4px × 40px, `border-subtle`, centered, `radius-pill`) at the top. Enter/exit per the motion spec in §6. `size` prop: `compact` (content-height, caps at 60vh), `full` (90vh, internal scroll) — covers everything from a quick confirm to Onboarding's multi-field form.

### Tab

Two contexts, two treatments:
- **Primary navigation** (see §9 — now a bottom bar, not a scroll strip): icon + `body-xs` label, active state = `magenta-bright` icon/label + a 2px top indicator bar in `magenta-bright`.
- **In-page tabs** (e.g. profile hub sections): `body-md` label only, active state = `magenta-bright` text + animated underline sliding between positions (`duration-base` `ease-standard`, transform-based per §6).

### Avatar

Three sizes only (`sm`=32, `md`=40, `lg`=64 — see [`BINGR_UI_AUDIT.md`](BINGR_UI_AUDIT.md) CX7), `radius-full`. Initials fallback uses `magenta-deep` background, white text, `mono-sm`/`mono-md`/`display-md` sized to the avatar. Real image avatars (future — see `BINGR_AUDIT_REPORT.md` §7.4 on the unused `avatar_url` column) get the same three sizes with `object-fit: cover`.

### Badge

`radius-pill`, `body-xs` (uppercase, +0.02em tracking), `space-2` horizontal / `space-1` vertical padding. Status badges use the solid-fill status colors from §3 (resolves CX8). Rating badges use `gold` background at 15% opacity with `gold` text, `mono-md`.

### Toast

`bg-surface-2`, `radius-md`, `elevation-2`, fixed bottom-center on mobile (above any bottom nav — see §9), max-width 90vw. Icon (contextual: `CheckCircle2` success, `XCircle` error, `Info` neutral) + `body-md` message + optional inline action (e.g. **Undo**, per CX10's resolution). Auto-dismiss 3.5s, pauses on hover/touch.

### Skeleton

`bg-surface-2` base with a `bg-input`-to-`bg-surface-2` shimmer gradient sweeping left-to-right, 1400ms linear infinite (§6). Shapes match the real content exactly (poster-tile skeletons are poster-tile-shaped, not generic bars) — this is what makes a skeleton feel considered rather than a lazy grey rectangle.

### Poster tile

The most important primitive in the system, given the content domain. Three sizes only ([`BINGR_UI_AUDIT.md`](BINGR_UI_AUDIT.md) CX1):

| Token | Dimensions | Radius | Context |
|---|---|---|---|
| `poster-sm` | 40×60 | `radius-sm` | List rows (diary, library, feed) |
| `poster-md` | `aspect-ratio 2/3`, fills grid column | `radius-md` | Discover/search grid, list-detail grid |
| `poster-lg` | 140×210 | `radius-md` | Title detail page hero |

All three: `object-fit: cover`, `background: bg-surface-2` while loading (paired with the skeleton above), and on `poster-md`/`poster-lg` a hover/press state of scale 1.03 + `elevation-glow` (§6) — the one place glow-as-elevation gets used routinely rather than as a rare accent, because it's the interaction that most directly rewards Night Market's "the art does the work" premise.

---

## 9. Screens

Mobile-first, 375px designed first, desktop described as expansion from it — not the reverse. Priority order as requested. Several of these assume [`BINGR_UI_AUDIT.md`](BINGR_UI_AUDIT.md)'s consolidations (RD1, RD2, RD6) are accepted; I've flagged each dependency.

### Navigation & header — the actual answer to the nine-tab strip

This is the single most consequential screen-level decision here, so it comes first, before the screens that live inside it.

**What's wrong today:** nine tabs in a horizontally-scrolling strip with no visual cue that tabs 5–9 exist off-screen. No hierarchy — Discover and Stats and Watched all read as equally important because they're all just... tabs. And the floating ☕ button sits bottom-right, which is exactly where a thumb naturally rests and exactly where any sane bottom navigation would also want to live — they're already fighting for the same real estate even before you fix anything else.

**The fix:** kill the horizontal tab strip. Replace it with a **fixed bottom navigation bar**, five destinations, icon + `body-xs` label, thumb-reachable by construction (this is *the* standard mobile pattern for exactly this reason — not a compromise, the correct default for a mobile-heavy audience):

`Compass` **Discover** · `Rss` **Feed** · `Bookmark` **Library** · `BookOpen` **Diary** · `UserRound` **You**

That's the full nine collapsed to five, using [`BINGR_UI_AUDIT.md`](BINGR_UI_AUDIT.md)'s RD2 (Watchlist/Watching/Watched → one Library) to drop two, and folding Rankings and Stats into the **You** hub (§9's Profile section below) rather than keeping them as siblings of Discover — they're about *your* data, they belong under *you*, not floating at the same navigational level as browsing trending titles.

The floating support button is retired entirely — not repositioned, retired. "Support bingr" moves into the **You** hub as a normal menu row (`Coffee` icon), which is exactly as discoverable as a menu item should be for something that isn't a primary task, and it stops competing with the bottom nav for the same thumb real estate.

**Header, above the bottom nav:** logo (tap → Discover, in-app navigate, not `window.location.href` — closes [`BINGR_UI_AUDIT.md`](BINGR_UI_AUDIT.md) GP8's related issue about the current logo-click being a full reload) + the unified search entry (resolves RD8 — one search, Titles and People as two result sections when there's a query) + avatar (opens the same **You** hub as the bottom-nav tab, so there's exactly one place profile/settings lives, reachable two ways, not two different partial menus).

**Desktop expansion:** bottom nav becomes a persistent left rail at ≥1024px (same five destinations, now with labels always visible, not icon-only) — header search moves inline into the top bar rather than needing a dedicated row.

### Title Detail Page

**Today:** functional but visually flat — poster + text block + status pills + a streaming-provider list, no sense of *occasion*. For the single highest-traffic screen in the app (every add-to-watchlist, every rating, every comment happens here), it currently looks like a form.

**375px redesign:**
- Full-bleed poster art as a **hero band** at the top — not a small thumbnail beside text, the poster fills the viewport width at `poster-lg`-adjacent scale, with a gradient (`bg-canvas` at 0% opacity at top fading to 100% at the bottom third) so the film title can sit *over* the art in `display-xl`, not beside it. This is the clearest single expression of "poster art does the work" in the whole redesign — Letterboxd and Trakt both keep the poster small and secondary to a text-first layout; this direction inverts that on purpose.
- Status pills (now solid-fill per CX8's resolution) sit directly below the title, in the gradient zone, so they read as part of the hero rather than a separate form section.
- Rating: the interactive `StarRating` component gets its own clearly-separated card immediately below the hero — this is a moment of deliberate friction-reduction (the single most important action on this page after "watched," it shouldn't be buried under streaming providers).
- Streaming providers as a horizontal-scroll chip row (currently a vertical stacked list) — more compact, more mobile-natural.
- Episode tracker (TV only) as its own full-width section below, using the season-tab pattern already in the app but restyled with `radius-pill` season chips and solid status-color progress fills.
- Comments at the bottom, using the corrected `<ConfirmDialog>` (CX10) for delete and the unified toast (CX11) for post confirmation.
- "Add to list" becomes a bottom-sheet picker (CX9's unified modal shell) instead of an inline dropdown — more thumb-friendly, consistent with every other picker in the system.

**Desktop expansion:** hero becomes a two-column layout — poster art on the left at fixed width, the gradient/title treatment adapts to a side-lit rather than bottom-lit gradient; everything else reflows into the right column at a wider measure.

### Discover

**375px redesign:** search bar sits directly under the header, full-width, `Search` icon leading. Below it, the trending grid — `poster-md` tiles at 3-per-row on 375px (currently the grid is `minmax(140px,1fr)`, auto-filling; I'd fix the column count explicitly at 3 for mobile rather than letting it auto-fill unpredictably at different viewport widths). Section headers get `display-lg` treatment with a `Flame` icon, not the current small bold text — this screen is the first thing an active user sees every session, it should feel like walking into something, not a settings list.

**The onboarding gap (GP2):** first session only, a skippable 3-beat overlay — beat 1 points at search ("Find anything"), beat 2 points at a poster tile's tap target ("Tap to rate, track, or add"), beat 3 points at the bottom nav's **You** tab ("Your stats live here"). Dismissible any time, never shown again after first dismissal or completion.

**Desktop expansion:** grid goes to 6-per-row, search bar moves into the header (per the nav section above) rather than taking a full row on its own.

### Library (post-consolidation)

**375px redesign — assumes RD2:** segmented control at the top (`All · Watchlist · Watching · Watched`, pill-style, horizontally scrollable if it doesn't fit — though at four items on 375px it should fit without scrolling), Movie/TV filter as a second row of smaller pill toggles, then a **new sort control** (closes GP5) using the same options `ExportPanel` already computes (rating/title/year/added) — one dropdown, affects both the view and what gets exported. A **new filter input** (closes GP4) sits above the list, live-filtering the already-loaded data client-side. List rows use `poster-sm` consistently (closes the four-way inconsistency in CX1) with the unified status-color pill treatment.

**Desktop expansion:** list becomes a denser table-like row (poster thumbnail, title, year, rating, status, remove — all in one line) rather than the mobile card-row, since desktop has room for tabular density that mobile doesn't.

### Public Profile

**375px redesign:** hero band similar in spirit to the title-detail page but built from the *user's* top-rated posters — a small collage strip (3–4 overlapping `poster-sm` tiles, slightly rotated, Night Market's collage instinct applied to a profile header instead of only to marketing) behind the avatar/name/stats block, rather than the current flat colored-background header. Follower/following counts become tap targets (closes GP1) opening the new `<FollowerListSheet>`. Tabs (Top Rated / Stats / Diary / Lists) use the in-page tab treatment from §8, and Top Rated reuses the unified `<RankedList>` from RD1 rather than its own implementation. Explicit back affordance added (closes GP8) — this page and Public List are the two most likely cold-landing pages in the whole app and currently the only two without one.

**Desktop expansion:** hero collage widens and can show more overlapping posters; tabs move to a left sidebar rather than a horizontal strip, content reflows into a wider single column.

### Stats (folded into the You hub — RD6)

**375px redesign:** the Wrapped hero stays the emotional high point — `display-2xl`/`mono-lg` numerals doing real work here, this is the one screen in the app where Late Signal's numeric-precision instinct should dominate over Night Market's color-first instinct, because the content *is* a data statement ("247 films this year") and wants to be read like one, set big and mono, against a `magenta-deep`-to-`bg-canvas` gradient card rather than the current flat gradient. Stat tiles below use consistent `mono-md` numerals (currently plain body text — a missed opportunity for the numeric-identity system). Rating distribution bars and Top 5 stay two-column on mobile only if they fit at `body-sm` scale; otherwise stack vertically first, two-column from tablet width up (the current app forces two columns at all widths, which is legitimately too cramped on a 360px phone — a real, non-cosmetic bug worth fixing regardless of the rest of this redesign).
**Desktop expansion:** three-column stat grid, Wrapped hero becomes a wide banner rather than a stacked card.

### Feed

**375px redesign:** becomes purely the activity stream (closes RD8/CX-adjacent "two jobs" problem) — `FindPeople`'s search box is removed from this screen entirely; a "Suggested people" module stays (browse-only, no search input) with a clear "Search people →" link that opens the unified header search pre-scoped to People. Feed cards use the unified `<WatchLogCard variant="feed">` from RD5. Empty states (no-follows / no-activity) both keep real CTAs, now via the shared `<EmptyState>` component.

**Desktop expansion:** single centered column, capped at a comfortable reading width (~600px) rather than stretching full-width — this is a content stream, not a dashboard, and shouldn't behave like one on a wide viewport.

### Diary

**375px redesign:** month-grouped rows stay (that structure works), rebuilt on `<WatchLogCard variant="diary">` from RD5 for visual consistency with Feed. Day-of-month numeral gets `mono-md` treatment (currently plain bold text — same numeric-identity opportunity as Stats). Empty state gets a real CTA (closes GP6/CX3). Rows become tappable into an edit flow (closes GP7), not just delete.

**Desktop expansion:** two-column month layout at wide viewports (this screen has enough vertical density that a single column wastes horizontal space past ~900px).

### Lists

**375px redesign:** already the best-executed empty state in the current app (real CTA, clear copy) — keep that instinct, just restyle onto the shared `<EmptyState>`. List cards get poster-collage previews (3 small overlapping `poster-sm` corners of the list's contents) instead of the current text-only card, which currently gives zero visual sense of what's actually *in* a list before opening it — a real content-preview gap worth closing regardless of the broader visual direction.

**Desktop expansion:** grid of list cards, 3-per-row, same collage-preview treatment scaled up.

### Landing Page

**375px redesign — the biggest single gap closed (GP3):** hero is no longer text-and-emoji. It's a **poster collage field** — a dense, overlapping, slightly-rotated grid of real trending poster art (pulled from the same trending endpoint Discover already calls) filling most of the viewport behind/around the headline, with the `display-2xl` headline and CTA sitting in a `bg-canvas`-gradient-scrim zone over it. This is Night Market's thesis stated as loudly as possible in the one place a cold visitor forms their entire first impression. Feature bullets below get restyled onto the icon system (§7) instead of emoji. Stats bar keeps the TMDB attribution line added in the earlier UI-audit round.

**Desktop expansion:** collage field becomes wider and denser, headline moves to sit beside rather than over the collage at ≥1024px (enough horizontal room that overlap isn't necessary to make the point).

### Auth

**375px redesign (closes GP12):** currently a plain centered card with zero visual identity, on both `AuthPage` and by extension the reset/forgot flows. Give it a slim version of the landing hero's poster treatment — a muted, darkened poster collage strip along the top third of the screen (behind a strong gradient into `bg-canvas`, so it reads as atmosphere, not competing content), card floats below it. Google OAuth button and email form stay functionally identical — this is purely establishing mood before the form, not restructuring the flow.

**Desktop expansion:** collage strip becomes a full-height side panel (split-screen: art left, form right) rather than a top band — enough room at desktop width to do both without one crowding the other.

---

## 10. Open questions for you

A few things I made a call on but want to flag explicitly rather than bury the assumption:

1. **The bottom-nav "You" hub absorbing Rankings and Stats** is the single biggest structural change in here — it's the right IA call in my judgment (they're about your data, not peers of Discover), but it does mean two former top-level destinations become sub-sections of a third. If you want Rankings or Stats to keep top-level prominence instead, that changes the five-tab set and I'd want to redo the nav math rather than patch it.
2. **Poster-collage-as-hero** (landing, auth, profile) is repeated three times in this proposal. That's deliberate — a signature motif should recur, not appear once — but it's also the single most implementation-effort-heavy visual idea here (needs real poster data at render time, needs to look intentional rather than cluttered at every viewport). Worth confirming you want to commit to it in all three places versus just the landing page as the flagship instance.
3. **I dropped `#E8392A` entirely** rather than trying to save it as a secondary/tertiary color somewhere. If there's brand equity in that specific red I don't know about (merch, existing social presence, something external to the codebase), say so before we lock the magenta — it's a bigger swing than anything else in the color section.

Say the word on these three (or don't — I'll take silence as "proceed as written") and then we can talk implementation strategy: how a design system with exact tokens gets introduced into a codebase that currently has zero CSS files and ~929 inline style objects, which you flagged as the real decision to make deliberately rather than rush.
