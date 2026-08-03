-- ============================================================================
-- bingr — P1a: public read access to bingr_library
-- Date:   2026-08-03
-- Audit:  BINGR_AUDIT_REPORT.md (finding C10 — surfaced while building the
--         profile-visibility toggle for M16)
--
-- Run this AFTER 20260803_p0_security.sql and 20260803_p0b_admin_write.sql.
--
-- WHY
--   bingr_library has never had a public SELECT policy — only the row owner
--   can read their own rows (auth.uid() = user_id, implicitly, since no
--   broader policy exists at all — DDL is untracked, see M12).
--
--   UserProfilePage.jsx queries bingr_library for the "🏆 Top Rated" tab and
--   the movie/TV/rated counts on every /@username page, using whatever auth
--   context the *viewer* has. With no public policy, that query has always
--   returned zero rows for anyone but the profile owner — before this
--   migration, a public profile's ratings were invisible to literally
--   everyone else, always, regardless of the profile_public toggle.
--
--   Wrapped in Promise.allSettled (UserProfilePage.jsx:41-44), so this failed
--   completely silently: the page just renders "No ratings yet" — the same
--   confidently-wrong-empty-state pattern as C3.
--
--   Verified live before this migration: seeded a library row for one test
--   account, read as a *different authenticated* user (not anon) — still [].
--
-- SCOPE
--   Deliberately mirrors the diary policy from C5: visible to the owner, or
--   to anyone when the owner's profile is public. Ratings are meant to be
--   shown on the public profile precisely when profile_public = true, so
--   this is not a new exposure — it is turning on a feature that has never
--   worked, gated by the same privacy control users already see in the UI.
-- ============================================================================

drop policy if exists "Library visible to owner or when profile is public" on public.bingr_library;

create policy "Library visible to owner or when profile is public"
  on public.bingr_library for select
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = bingr_library.user_id
        and p.profile_public = true
    )
  );

-- ============================================================================
-- POST-FLIGHT (read-only)
-- ============================================================================
select 'C10 library select policy' as fix,
       case when exists (
         select 1 from pg_policies
         where tablename = 'bingr_library'
           and policyname = 'Library visible to owner or when profile is public'
       ) then 'ok' else 'MISSING' end as status;

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- drop policy if exists "Library visible to owner or when profile is public" on public.bingr_library;
