-- ============================================================================
-- bingr — P1d: Watchlist as an independent flag, not a status value
-- Date:   2026-08-04
--
-- WHY
--   status was a single mutually-exclusive field (watched/watching/
--   watchlist) — marking something Watching or Watched silently dropped it
--   off your Watchlist. Real user testing on the deployed app: Watchlist
--   should be its own "want to watch" flag, independent of progress, so a
--   title can be watchlisted AND currently watching/watched at once.
--
--   watchlisted is nullable-free (default false) so every existing row
--   reads correctly with no backfill gap. status keeps its column and
--   values for watched/watching; 'watchlist' is retired as a status value
--   and backfilled into the new flag below.
-- ============================================================================

alter table public.bingr_library
  add column if not exists watchlisted boolean not null default false;

update public.bingr_library
  set watchlisted = true, status = null
  where status = 'watchlist';

-- ============================================================================
-- POST-FLIGHT (read-only)
-- ============================================================================
select 'p1d bingr_library.watchlisted' as fix,
       case when exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'bingr_library' and column_name = 'watchlisted'
       ) then 'ok' else 'MISSING' end as status
union all
select 'p1d no rows left with status=watchlist',
       case when not exists (
         select 1 from public.bingr_library where status = 'watchlist'
       ) then 'ok' else 'STILL PRESENT' end;

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- update public.bingr_library set status = 'watchlist' where watchlisted and status is null;
-- alter table public.bingr_library drop column if exists watchlisted;
