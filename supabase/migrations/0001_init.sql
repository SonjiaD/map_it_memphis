-- MAPP It Memphis initial schema.
-- Two-tier access: public read of published data, researcher-only writes.
-- is_researcher is never user-settable; only flippable via the dashboard/service role.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  is_researcher boolean not null default false,
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_researcher() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select is_researcher from public.profiles where id = auth.uid()), false) $$;

create table public.drawn_boundaries (
  id uuid primary key default gen_random_uuid(),
  researcher_id uuid not null references public.profiles(id),
  geometry jsonb not null,
  respondent_age_range text,
  years_in_neighborhood text,
  respondent_relationship text,
  consent_given boolean not null default false,
  session_date date not null default current_date,
  notes text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.asset_pins (
  id uuid primary key default gen_random_uuid(),
  boundary_id uuid references public.drawn_boundaries(id) on delete cascade,
  researcher_id uuid not null references public.profiles(id),
  lat double precision not null,
  lng double precision not null,
  category text not null,
  name text,
  why_it_matters text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Schema only for now; UI lands in a later phase.
create table public.oral_histories (
  id uuid primary key default gen_random_uuid(),
  researcher_id uuid not null references public.profiles(id),
  boundary_id uuid references public.drawn_boundaries(id) on delete set null,
  lat double precision,
  lng double precision,
  title text not null,
  interviewee_name text,
  transcript_excerpt text,
  audio_url text,
  duration_seconds integer,
  recorded_on date,
  consent_given boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.drawn_boundaries enable row level security;
alter table public.asset_pins enable row level security;
alter table public.oral_histories enable row level security;

-- profiles: read own row only. No insert/update/delete policy for regular users at
-- all (the signup trigger runs as security definer and bypasses RLS to create the
-- row); is_researcher can only ever be flipped via the dashboard or service role.
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

-- drawn_boundaries
create policy "public read published boundaries" on public.drawn_boundaries
  for select using (is_published or researcher_id = auth.uid());
create policy "researcher insert own boundaries" on public.drawn_boundaries
  for insert with check (public.is_researcher() and researcher_id = auth.uid());
create policy "researcher update own boundaries" on public.drawn_boundaries
  for update using (public.is_researcher() and researcher_id = auth.uid());

-- asset_pins
create policy "public read published pins" on public.asset_pins
  for select using (is_published or researcher_id = auth.uid());
create policy "researcher insert own pins" on public.asset_pins
  for insert with check (public.is_researcher() and researcher_id = auth.uid());
create policy "researcher update own pins" on public.asset_pins
  for update using (public.is_researcher() and researcher_id = auth.uid());

-- oral_histories
create policy "public read published oral histories" on public.oral_histories
  for select using (is_published or researcher_id = auth.uid());
create policy "researcher insert own oral histories" on public.oral_histories
  for insert with check (public.is_researcher() and researcher_id = auth.uid());
create policy "researcher update own oral histories" on public.oral_histories
  for update using (public.is_researcher() and researcher_id = auth.uid());

-- Live consensus heatmap (Phase 7): public map subscribes to inserts.
alter publication supabase_realtime add table public.drawn_boundaries;
