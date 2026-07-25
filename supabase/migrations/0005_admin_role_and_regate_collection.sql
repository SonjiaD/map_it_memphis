-- Roles & request-access model (stakeholder re-architecture, step 1).
--
-- New model:
--   * Anyone can sign up, but a new account is a PENDING request (is_researcher and
--     is_admin both false) and cannot collect.
--   * A super-admin (is_admin) approves collectors by flipping their is_researcher.
--   * Approved collectors (is_researcher) and admins may collect; nobody else can.
--
-- This reverses migration 0004, which had opened collection to any authenticated
-- account for early testing.

-- Super-admin flag. Only ever set by another admin or the service role / dashboard.
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Helper mirroring is_researcher(): security definer so policies can call it without
-- recursing back through profiles' own RLS.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

grant execute on function public.is_admin() to anon, authenticated;

-- profiles: admins can see every profile and approve/revoke roles (used by the admin
-- console in step 2). Regular users still only read their own row and have no update
-- path, so they cannot self-grant researcher/admin.
create policy "admin read all profiles" on public.profiles
  for select using (public.is_admin());
create policy "admin update profiles" on public.profiles
  for update using (public.is_admin());

-- Re-gate collection: approved collectors (is_researcher) or admins only.
-- drawn_boundaries
drop policy if exists "authenticated insert own boundaries" on public.drawn_boundaries;
create policy "approved insert own boundaries" on public.drawn_boundaries
  for insert to authenticated
  with check ((public.is_researcher() or public.is_admin()) and researcher_id = auth.uid());

drop policy if exists "authenticated update own boundaries" on public.drawn_boundaries;
create policy "approved update own boundaries" on public.drawn_boundaries
  for update to authenticated
  using ((public.is_researcher() or public.is_admin()) and researcher_id = auth.uid());

-- asset_pins
drop policy if exists "authenticated insert own pins" on public.asset_pins;
create policy "approved insert own pins" on public.asset_pins
  for insert to authenticated
  with check ((public.is_researcher() or public.is_admin()) and researcher_id = auth.uid());

drop policy if exists "authenticated update own pins" on public.asset_pins;
create policy "approved update own pins" on public.asset_pins
  for update to authenticated
  using ((public.is_researcher() or public.is_admin()) and researcher_id = auth.uid());
