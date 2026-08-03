-- ============================================================================
-- bingr — P1b: comment flags actually do something
-- Date:   2026-08-03
-- Audit:  BINGR_AUDIT_REPORT.md (finding M17)
--
-- Run this AFTER the earlier 2026-08-03 migrations.
--
-- WHY
--   flagComment() inserts into bingr_comment_flags then hides the comment in
--   local React state only (useComments.js) — it reappears on reload for
--   everyone including the reporter. bingr_comments.flag_count is never
--   incremented (stays 0 forever) and nothing auto-hides a heavily-reported
--   comment. Reporting a comment currently does nothing durable.
--
-- WHAT THIS DOES
--   A trigger on bingr_comment_flags increments flag_count on the parent
--   comment, and once a comment collects 3+ reports, flips its status to
--   'flagged'. The C8 migration's select policy already reads
--   `status = 'visible' or auth.uid() = user_id`, so a flagged comment
--   disappears from the public list immediately and automatically — no
--   client change needed for the hide itself. Admins can still see and
--   review it via "Admins can view all comments".
--
--   3 is a starting threshold, not a considered moderation policy — tune it
--   from the admin panel's flag-count data once real usage exists.
-- ============================================================================

create or replace function public.apply_comment_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.bingr_comments
     set flag_count = flag_count + 1
   where id = new.comment_id
  returning flag_count into new_count;

  if new_count >= 3 then
    update public.bingr_comments
       set status = 'flagged'
     where id = new.comment_id
       and status = 'visible';  -- don't override an admin's explicit 'hidden'
  end if;

  return new;
end;
$$;

drop trigger if exists comment_flag_applied on public.bingr_comment_flags;
create trigger comment_flag_applied
  after insert on public.bingr_comment_flags
  for each row execute function public.apply_comment_flag();

-- ============================================================================
-- POST-FLIGHT (read-only)
-- ============================================================================
select 'M17 flag trigger' as fix,
       case when exists (
         select 1 from pg_trigger where tgname = 'comment_flag_applied'
       ) then 'ok' else 'MISSING' end as status;

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- drop trigger if exists comment_flag_applied on public.bingr_comment_flags;
-- drop function if exists public.apply_comment_flag();
