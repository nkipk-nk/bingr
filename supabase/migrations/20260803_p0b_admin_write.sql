-- ============================================================================
-- bingr — P0b: admin write access to profiles
-- Date:   2026-08-03
-- Audit:  BINGR_AUDIT_REPORT.md (finding C9)
--
-- Run this AFTER 20260803_p0_security.sql.
--
-- WHY
--   Verifying the C2 fix surfaced a separate, pre-existing bug: the only
--   UPDATE policy on public.profiles is self-update (auth.uid() = id), so an
--   admin's write to another user's row matches zero rows. PostgREST returns
--   200/[] with no error, and useAdmin.promoteUser checks only `error` before
--   optimistically flipping local state — so "Make admin" appears to work in
--   the UI and silently reverts on reload.
--
--   Verified live, before this migration:
--     PATCH /profiles?id=eq.<other-user> {"role":"admin"}  (as admin)
--       -> HTTP 204, role unchanged
--     PATCH /profiles?id=eq.<other-user> {"bio":"probe"}   (as admin)
--       -> HTTP 200, []            ← zero rows, no error
--
--   AdminPanel user management has therefore never functioned.
--
-- SAFETY
--   This grants admins UPDATE on any profile. It does NOT reopen C2: the
--   profiles_enforce_role_change trigger from the previous migration still
--   gates the role column on the caller genuinely being an admin, so ordinary
--   users remain unable to promote themselves through this policy.
-- ============================================================================


-- Reusable admin check. SECURITY DEFINER so the lookup is not itself subject
-- to RLS, and STABLE so the planner can hoist it out of per-row evaluation.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Admins can update any profile" on public.profiles;

create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- ============================================================================
-- POST-FLIGHT (read-only)
-- ============================================================================
select 'C9 admin update policy' as fix,
       case when exists (
         select 1 from pg_policies
         where tablename = 'profiles'
           and policyname = 'Admins can update any profile'
       ) then 'ok' else 'MISSING' end as status
union all
select 'C2 trigger still present',
       case when exists (
         select 1 from pg_trigger where tgname = 'profiles_enforce_role_change'
       ) then 'ok' else 'MISSING — C2 IS REOPEN, DO NOT LEAVE IN THIS STATE' end;


-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- drop policy if exists "Admins can update any profile" on public.profiles;
-- drop function if exists public.is_admin();
