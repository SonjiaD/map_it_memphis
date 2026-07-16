-- handle_new_user is trigger-only; never meant to be called as a public RPC.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- is_researcher() is used internally by RLS insert/update policies (which run as
-- `authenticated`), so that grant must stay. anon never needs to call it directly.
revoke execute on function public.is_researcher() from anon;
