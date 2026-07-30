-- Safe migration: installs a full workspace reset RPC for the signed-in user.
-- Run this in the Supabase SQL editor for the production project.
--
-- It keeps the auth account and profile row, but resets onboarding so the user
-- can start cleanly from the app's first setup flow again.

create or replace function public.reset_my_workspace()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  delete from public.reactions
  where user_id = v_user_id;

  delete from public.check_in_events
  where user_id = v_user_id;

  delete from public.check_ins
  where user_id = v_user_id;

  delete from public.goals
  where user_id = v_user_id;

  delete from public.groups
  where owner_id = v_user_id;

  delete from public.group_members
  where user_id = v_user_id;

  update public.profiles
  set onboarding_completed = false
  where id = v_user_id;

  return 'reset';
end;
$$;

grant execute on function public.reset_my_workspace() to authenticated;
