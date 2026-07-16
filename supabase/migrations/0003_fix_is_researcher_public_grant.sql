-- Functions default-grant EXECUTE to the PUBLIC pseudo-role at creation time, which
-- anon/authenticated inherit regardless of role-specific revokes. Revoke from PUBLIC
-- directly, then re-grant only to authenticated (required by the RLS insert/update
-- policies, which run as that role).
revoke execute on function public.is_researcher() from public;
grant execute on function public.is_researcher() to authenticated;
