-- ============================================================================
-- bingr — P1e: capture context on feedback submissions
-- Date:   2026-08-05
--
-- WHY
--   Feedback had no way to know what screen someone was on or what
--   browser/device they were using when something went wrong — captured
--   automatically at submit time (src/components/FeedbackModal.jsx), not
--   asked of the user, so the form itself stays exactly as short as before.
-- ============================================================================

alter table public.bingr_feedback
  add column if not exists page_context text,
  add column if not exists user_agent text;

-- ============================================================================
-- POST-FLIGHT (read-only)
-- ============================================================================
select 'p1e bingr_feedback.page_context' as fix,
       case when exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'bingr_feedback' and column_name = 'page_context'
       ) then 'ok' else 'MISSING' end as status
union all
select 'p1e bingr_feedback.user_agent',
       case when exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'bingr_feedback' and column_name = 'user_agent'
       ) then 'ok' else 'MISSING' end;

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- alter table public.bingr_feedback drop column if exists page_context;
-- alter table public.bingr_feedback drop column if exists user_agent;
