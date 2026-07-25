-- Realtime publication swap, completing the confidentiality lockdown (step 4).
--
-- Supabase Realtime's postgres_changes broadcasts do not enforce table RLS by
-- default, so leaving drawn_boundaries on the realtime publication would let any
-- anon client listen for individual-boundary INSERTs over the websocket even
-- though REST reads are now blocked (migration 0007). The live public map no
-- longer subscribes to raw submissions at all, so drop it. The public map now
-- subscribes to published_averages instead, which IS meant to be public.

alter publication supabase_realtime drop table public.drawn_boundaries;
alter publication supabase_realtime add table public.published_averages;
