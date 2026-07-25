-- Session timing (2026-07-25): record when a collection session started and ended.
--
-- started_at = the moment the researcher begins DRAWING the map (leaving the
--   consent/info step for the draw step), not when the session first opened.
-- ended_at   = when they hit Save.
-- Both are captured client-side (same clock, so duration is consistent) and stored
-- in UTC; the admin console renders them in Memphis local time (America/Chicago).
--
-- Supersedes the old session_date column (kept, unused going forward, to avoid a
-- destructive drop) and the created_at-as-"submitted" display, which were redundant.

alter table public.drawn_boundaries
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz;

-- Backfill existing rows: best available approximation is the DB insert time.
update public.drawn_boundaries
  set started_at = coalesce(started_at, created_at),
      ended_at = coalesce(ended_at, created_at);
