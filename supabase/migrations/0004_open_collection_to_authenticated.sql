-- Open field data collection to any signed-in account (testing / early pilot).
--
-- Previously only profiles.is_researcher accounts could insert boundaries and pins.
-- For now we let anyone with an account collect; what actually appears on the public
-- Explore map is still curated separately via the is_published flag (a coordinator
-- flips it on per submission in the dashboard). is_researcher is kept as a future
-- "reviewer" marker but no longer gates collection.
--
-- Note: is_published still defaults to true on these tables, so submissions show
-- immediately for now. To switch to review-before-display, change the column
-- default to false (submissions then stay hidden until a coordinator publishes them;
-- the submitter still sees their own via the existing SELECT policy).

-- drawn_boundaries: any authenticated user may insert/update their own rows
drop policy if exists "researcher insert own boundaries" on public.drawn_boundaries;
create policy "authenticated insert own boundaries" on public.drawn_boundaries
  for insert to authenticated
  with check (researcher_id = auth.uid());

drop policy if exists "researcher update own boundaries" on public.drawn_boundaries;
create policy "authenticated update own boundaries" on public.drawn_boundaries
  for update to authenticated
  using (researcher_id = auth.uid());

-- asset_pins: same
drop policy if exists "researcher insert own pins" on public.asset_pins;
create policy "authenticated insert own pins" on public.asset_pins
  for insert to authenticated
  with check (researcher_id = auth.uid());

drop policy if exists "researcher update own pins" on public.asset_pins;
create policy "authenticated update own pins" on public.asset_pins
  for update to authenticated
  using (researcher_id = auth.uid());
