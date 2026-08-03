-- ============================================================================
-- bingr — P0 security migration
-- Date:    2026-08-03
-- Audit:   BINGR_AUDIT_REPORT.md  (findings C2, C3, C5, C6, C7, C8, M9)
--
-- WHAT THIS FIXES
--   C2  Any authenticated user could set their own profiles.role = 'admin'
--   C3  Activity feed queries 400'd — no FK from diary/library to profiles
--   C5  Every user's diary was readable by anyone with the anon key
--   C6  bingr_comments.username was unvalidated — impersonation possible
--   C7  No server-side comment length or rate limiting
--   C8  Comment authors could not see or delete their own hidden comments
--   M9  bingr_feedback accepted unauthenticated inserts (spam vector)
--
-- HOW TO RUN
--   Supabase Dashboard → SQL Editor → paste → Run.
--   Every statement is idempotent; re-running is safe.
--   Section 0 is read-only — run it first and check the output before the rest.
--
-- ROLLBACK
--   See the commented block at the foot of this file.
-- ============================================================================


-- ============================================================================
-- 0. PRE-FLIGHT (read-only — inspect the results before continuing)
-- ============================================================================
-- Section 2 adds foreign keys to public.profiles. That will fail if any
-- diary/library row references a user with no profile row. Both counts must
-- be 0. If they are not, resolve the orphans first (they are almost certainly
-- rows belonging to deleted accounts and can be deleted).

select 'orphan_diary_rows' as check_name, count(*) as must_be_zero
from public.bingr_diary d
where not exists (select 1 from public.profiles p where p.id = d.user_id)
union all
select 'orphan_library_rows', count(*)
from public.bingr_library l
where not exists (select 1 from public.profiles p where p.id = l.user_id)
union all
-- Section 5 adds a length constraint. Existing rows must satisfy it.
select 'comments_violating_length', count(*)
from public.bingr_comments
where char_length(comment) not between 2 and 1000;

-- To clear orphans if the first two counts are non-zero, uncomment:
--   delete from public.bingr_diary d
--    where not exists (select 1 from public.profiles p where p.id = d.user_id);
--   delete from public.bingr_library l
--    where not exists (select 1 from public.profiles p where p.id = l.user_id);


-- ============================================================================
-- 1. C2 — Block privilege escalation via profiles.role
-- ============================================================================
-- Postgres has no column-level RLS, so the column is protected with a trigger.
-- Admins keep the ability to promote/demote (AdminPanel.promoteUser relies on
-- it); everyone else is rejected.
--
-- SECURITY DEFINER so the role lookup is not itself filtered by RLS.
-- A SELECT inside a BEFORE UPDATE trigger on the same table does not recurse.
--
-- auth.uid() IS NULL means the caller is service_role or a direct DB session
-- (migrations, the delete-account Edge Function). Anonymous callers never
-- reach this trigger: the profiles UPDATE policy requires auth.uid() = id,
-- which is NULL-false for anon, so zero rows are ever targeted.

create or replace function public.enforce_role_change_policy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  if new.role is distinct from old.role then
    if auth.uid() is null then
      return new;  -- service_role / direct DB session
    end if;

    select role into caller_role from public.profiles where id = auth.uid();

    if coalesce(caller_role, 'user') <> 'admin' then
      raise exception 'role may only be changed by an administrator'
        using errcode = '42501';  -- insufficient_privilege
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_role_change on public.profiles;
create trigger profiles_enforce_role_change
  before update on public.profiles
  for each row execute function public.enforce_role_change_policy();


-- ============================================================================
-- 2. C3 — Add the foreign keys the activity feed depends on
-- ============================================================================
-- useFeed.js embeds `profiles!inner(username, display_name)`. PostgREST
-- resolves embeds through foreign keys; user_id referenced auth.users, not
-- public.profiles, so both feed queries returned PGRST200 / HTTP 400.
--
-- profiles.id is already 1:1 with auth.users.id via handle_new_user(), so
-- this constraint is satisfiable. ON DELETE CASCADE matches the existing
-- auth.users FK, so deletion behaviour is unchanged.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bingr_diary_profile_fk'
  ) then
    alter table public.bingr_diary
      add constraint bingr_diary_profile_fk
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'bingr_library_profile_fk'
  ) then
    alter table public.bingr_library
      add constraint bingr_library_profile_fk
      foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

-- Ask PostgREST to reload its schema cache so the embeds resolve immediately.
notify pgrst, 'reload schema';


-- ============================================================================
-- 3. C5 — Diary respects profiles.profile_public
-- ============================================================================
-- Was: using (true) — every diary entry, including free-text personal notes,
-- was readable by anyone holding the (publicly embedded) anon key.
--
-- auth.uid() is wrapped in a scalar subquery so Postgres evaluates it once
-- per statement rather than once per row.

drop policy if exists "Public diary visible to all" on public.bingr_diary;

create policy "Diary visible to owner or when profile is public"
  on public.bingr_diary for select
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = bingr_diary.user_id
        and p.profile_public = true
    )
  );

create index if not exists idx_profiles_public
  on public.profiles(id) where profile_public = true;


-- ============================================================================
-- 4. C6 — Bind comment authorship to the authenticated user
-- ============================================================================
-- The old policy checked auth.uid() = user_id but left `username` as
-- unvalidated free text, so a comment could be posted under any handle —
-- including an admin's — and the UI renders it as the author and links to
-- /@that-username.

drop policy if exists "Logged in users can post comments" on public.bingr_comments;

create policy "Logged in users can post comments"
  on public.bingr_comments for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and username = (
      select p.username from public.profiles p where p.id = (select auth.uid())
    )
  );


-- ============================================================================
-- 5. C7 — Server-side comment length and rate limiting
-- ============================================================================
-- moderation.js runs only in the browser and is bypassed by any direct
-- PostgREST call. Verified during the audit: 3,000-character comments stored,
-- 8 rapid inserts all accepted.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bingr_comments_length_ck'
  ) then
    alter table public.bingr_comments
      add constraint bingr_comments_length_ck
      check (char_length(comment) between 2 and 1000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'bingr_diary_notes_length_ck'
  ) then
    alter table public.bingr_diary
      add constraint bingr_diary_notes_length_ck
      check (notes is null or char_length(notes) <= 1000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_bio_length_ck'
  ) then
    alter table public.profiles
      add constraint profiles_bio_length_ck
      check (bio is null or char_length(bio) <= 300);
  end if;
end $$;

-- Mirrors moderation.js: 5 comments per rolling minute.
-- Client-side checkCommentRateLimit() stays as the instant-feedback path;
-- this is the one that actually holds.
create or replace function public.enforce_comment_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.bingr_comments
  where user_id = new.user_id
    and created_at > now() - interval '1 minute';

  if recent_count >= 5 then
    raise exception 'You are commenting too quickly. Please wait a moment.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists bingr_comments_rate_limit on public.bingr_comments;
create trigger bingr_comments_rate_limit
  before insert on public.bingr_comments
  for each row execute function public.enforce_comment_rate_limit();

create index if not exists idx_comments_user_created
  on public.bingr_comments(user_id, created_at desc);


-- ============================================================================
-- 6. C8 — Authors can see (and therefore delete) their own hidden comments
-- ============================================================================
-- Postgres applies SELECT policies to rows targeted by a DELETE that has a
-- WHERE clause. With the old policy (status = 'visible'), an admin-hidden
-- comment became invisible AND undeletable by its author — while PostgREST
-- still returned 204, so the app reported success.

drop policy if exists "Anyone can view visible comments" on public.bingr_comments;

create policy "View visible comments or own"
  on public.bingr_comments for select
  using (
    status = 'visible'
    or (select auth.uid()) = user_id
  );

-- Index now needs to cover the status filter (was: tmdb_id, media_type, created_at).
create index if not exists idx_comments_title_visible
  on public.bingr_comments(tmdb_id, media_type, created_at desc)
  where status = 'visible';


-- ============================================================================
-- 7. M9 — Feedback requires authentication
-- ============================================================================
-- Was: with check (true) — anyone with the anon key could insert unlimited
-- rows. FeedbackModal is only reachable from the signed-in user menu
-- (App.jsx:492), so no reachable UI path is lost.

drop policy if exists "Users can submit feedback" on public.bingr_feedback;

create policy "Authenticated users can submit feedback"
  on public.bingr_feedback for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bingr_feedback_message_length_ck'
  ) then
    alter table public.bingr_feedback
      add constraint bingr_feedback_message_length_ck
      check (char_length(message) between 10 and 2000);
  end if;
end $$;


-- ============================================================================
-- 8. M21 / C4 hardening — capture username + country at signup, server-side
-- ============================================================================
-- useAuth.signUp now passes username and country_code through signUp metadata
-- (auth.users.raw_user_meta_data). Consuming them here means the profile is
-- correct the moment the row is created, with no authenticated client write
-- required — so this keeps working if email confirmation is ever re-enabled.
--
-- Falls back to the previous tmp_<uuid> placeholder for OAuth signups, which
-- carry no username and are routed to OnboardingModal by username_set = false.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_username text := nullif(trim(new.raw_user_meta_data->>'username'), '');
  meta_country  text := nullif(trim(new.raw_user_meta_data->>'country_code'), '');
begin
  insert into public.profiles (id, username, username_set, country_code)
  values (
    new.id,
    coalesce(meta_username, 'tmp_' || substr(replace(new.id::text, '-', ''), 1, 12)),
    meta_username is not null,
    meta_country
  )
  on conflict (id) do nothing;
  return new;
exception
  when unique_violation then
    -- Username taken between the client's availability check and here.
    -- Fall back to the placeholder; OnboardingModal will prompt for another.
    insert into public.profiles (id, username, username_set, country_code)
    values (
      new.id,
      'tmp_' || substr(replace(new.id::text, '-', ''), 1, 12),
      false,
      meta_country
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Usernames must be unique for the availability check and /@handle routes to
-- mean anything. Created concurrently-safe; will fail loudly if duplicates
-- already exist (none did at audit time).
create unique index if not exists idx_profiles_username_unique
  on public.profiles(lower(username));


-- ============================================================================
-- 9. POST-FLIGHT (read-only — all rows should report 'ok')
-- ============================================================================
select 'C2 role trigger' as fix,
       case when exists (select 1 from pg_trigger
                         where tgname = 'profiles_enforce_role_change')
            then 'ok' else 'MISSING' end as status
union all
select 'C3 diary->profiles FK',
       case when exists (select 1 from pg_constraint
                         where conname = 'bingr_diary_profile_fk')
            then 'ok' else 'MISSING' end
union all
select 'C3 library->profiles FK',
       case when exists (select 1 from pg_constraint
                         where conname = 'bingr_library_profile_fk')
            then 'ok' else 'MISSING' end
union all
select 'C5 diary policy replaced',
       case when not exists (select 1 from pg_policies
                             where tablename = 'bingr_diary'
                               and policyname = 'Public diary visible to all')
            then 'ok' else 'OLD POLICY STILL PRESENT' end
union all
select 'C7 comment length check',
       case when exists (select 1 from pg_constraint
                         where conname = 'bingr_comments_length_ck')
            then 'ok' else 'MISSING' end
union all
select 'C7 rate-limit trigger',
       case when exists (select 1 from pg_trigger
                         where tgname = 'bingr_comments_rate_limit')
            then 'ok' else 'MISSING' end
union all
select 'C8 comment select policy',
       case when exists (select 1 from pg_policies
                         where tablename = 'bingr_comments'
                           and policyname = 'View visible comments or own')
            then 'ok' else 'MISSING' end
union all
select 'M9 feedback insert policy',
       case when exists (select 1 from pg_policies
                         where tablename = 'bingr_feedback'
                           and policyname = 'Authenticated users can submit feedback')
            then 'ok' else 'MISSING' end;


-- ============================================================================
-- ROLLBACK (only if something goes wrong — restores the previous behaviour,
-- including the vulnerabilities. Do not leave the system in this state.)
-- ============================================================================
-- drop trigger if exists profiles_enforce_role_change on public.profiles;
-- drop function if exists public.enforce_role_change_policy();
-- alter table public.bingr_diary   drop constraint if exists bingr_diary_profile_fk;
-- alter table public.bingr_library drop constraint if exists bingr_library_profile_fk;
-- drop policy if exists "Diary visible to owner or when profile is public" on public.bingr_diary;
-- create policy "Public diary visible to all" on public.bingr_diary for select using (true);
-- drop policy if exists "Logged in users can post comments" on public.bingr_comments;
-- create policy "Logged in users can post comments" on public.bingr_comments
--   for insert with check (auth.uid() = user_id);
-- alter table public.bingr_comments drop constraint if exists bingr_comments_length_ck;
-- drop trigger if exists bingr_comments_rate_limit on public.bingr_comments;
-- drop function if exists public.enforce_comment_rate_limit();
-- drop policy if exists "View visible comments or own" on public.bingr_comments;
-- create policy "Anyone can view visible comments" on public.bingr_comments
--   for select using (status = 'visible');
-- drop policy if exists "Authenticated users can submit feedback" on public.bingr_feedback;
-- create policy "Users can submit feedback" on public.bingr_feedback
--   for insert with check (true);
