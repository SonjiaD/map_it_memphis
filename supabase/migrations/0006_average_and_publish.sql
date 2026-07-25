-- Averaging + publish (stakeholder re-architecture, step 3).
--
-- Admins curate which submitted maps count toward the community average
-- (included_in_average) and publish a single averaged shape. The published average
-- is the public-facing output; individual maps stay private (public-side swap and
-- the full confidentiality lockdown land in step 4).

-- Per-submission curation flag the admin toggles in the map-review console.
alter table public.drawn_boundaries
  add column if not exists included_in_average boolean not null default true;

-- The single published community-average map (one current row per neighborhood; we
-- keep history by inserting a new row each publish and reading the latest).
create table if not exists public.published_averages (
  id uuid primary key default gen_random_uuid(),
  neighborhood text not null default 'soulsville',
  geometry jsonb not null,               -- GeoJSON Polygon/MultiPolygon of the averaged shape
  threshold real not null,               -- agreement threshold used (e.g. 0.5 = majority)
  source_count integer not null,         -- how many maps were averaged
  published_by uuid references public.profiles(id),
  published_at timestamptz not null default now()
);

alter table public.published_averages enable row level security;

-- Public may read the published average (this is the public output).
create policy "public read published averages" on public.published_averages
  for select using (true);

-- Only admins publish.
create policy "admin insert published averages" on public.published_averages
  for insert to authenticated with check (public.is_admin());

-- Admins can see and curate every submission (the map-review console needs all
-- rows, and to toggle included_in_average on maps they did not collect themselves).
create policy "admin read all boundaries" on public.drawn_boundaries
  for select using (public.is_admin());
create policy "admin update boundaries" on public.drawn_boundaries
  for update using (public.is_admin());
