-- Confidentiality lockdown (stakeholder re-architecture, step 4).
--
-- The public may no longer read individual resident maps or asset pins. Only
-- admins (every row, via the policy from migration 0006) and the collector who
-- submitted a row (their own) can. The public-facing output is the single
-- published average, which stays publicly readable via published_averages.

-- drawn_boundaries: remove public read; keep collector-own read (admins covered
-- by "admin read all boundaries" from 0006).
drop policy if exists "public read published boundaries" on public.drawn_boundaries;
create policy "collector read own boundaries" on public.drawn_boundaries
  for select using (researcher_id = auth.uid());

-- asset_pins: remove public read; admins read all, collectors read their own.
drop policy if exists "public read published pins" on public.asset_pins;
create policy "admin read all pins" on public.asset_pins
  for select using (public.is_admin());
create policy "collector read own pins" on public.asset_pins
  for select using (researcher_id = auth.uid());
