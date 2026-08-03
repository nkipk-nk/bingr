-- ============================================================================
-- bingr — P1c: store real TMDB runtime for accurate watch-time stats
-- Date:   2026-08-03
-- Audit:  BINGR_AUDIT_REPORT.md (finding m12)
--
-- WHY
--   stats.js estimates total watch time using flat averages
--   (AVG_MOVIE_RUNTIME = 110min, AVG_EPISODE_RUNTIME = 42min) even though
--   TMDB returns each title's real runtime — it was already being fetched in
--   DetailPanel for display and simply discarded afterwards.
--
--   Both new columns are nullable and additive: existing rows read as NULL,
--   and stats.js falls back to the averages for any row that doesn't have a
--   real value yet (older entries, or entries added from a context — like
--   the Discover grid's quick-add buttons — where full TMDB details weren't
--   loaded). No backfill needed or attempted.
-- ============================================================================

alter table public.bingr_library
  add column if not exists runtime_minutes integer;

alter table public.bingr_episodes
  add column if not exists runtime_minutes integer;

-- ============================================================================
-- POST-FLIGHT (read-only)
-- ============================================================================
select 'm12 bingr_library.runtime_minutes' as fix,
       case when exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'bingr_library' and column_name = 'runtime_minutes'
       ) then 'ok' else 'MISSING' end as status
union all
select 'm12 bingr_episodes.runtime_minutes',
       case when exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'bingr_episodes' and column_name = 'runtime_minutes'
       ) then 'ok' else 'MISSING' end;

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- alter table public.bingr_library drop column if exists runtime_minutes;
-- alter table public.bingr_episodes drop column if exists runtime_minutes;
