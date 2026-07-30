-- Safe migration: installs only the group deletion RPC.
-- Run this in the Supabase SQL editor for the production project.

create or replace function public.delete_group_v2(p_group_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_deleted_count integer;
begin
  if p_group_id is null then
    raise exception 'missing_group_id';
  end if;

  select owner_id into v_owner_id
  from public.groups
  where id = p_group_id;

  if v_owner_id is null then
    raise exception 'group_not_found';
  end if;

  if v_owner_id <> auth.uid() then
    raise exception 'not_group_owner';
  end if;

  delete from public.groups
  where id = p_group_id and owner_id = auth.uid();

  get diagnostics v_deleted_count = row_count;

  if v_deleted_count <> 1 then
    raise exception 'group_delete_failed';
  end if;

  return true;
end;
$$;

grant execute on function public.delete_group_v2(uuid) to authenticated;

create or replace function public.force_delete_group(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_deleted_count integer;
begin
  if p_group_id is null then
    raise exception 'missing_group_id';
  end if;

  select owner_id into v_owner_id
  from public.groups
  where id = p_group_id;

  if v_owner_id is null then
    raise exception 'group_not_found';
  end if;

  if v_owner_id <> auth.uid() then
    raise exception 'not_group_owner';
  end if;

  begin
    update public.check_ins
    set group_id = null
    where group_id = p_group_id;
  exception when others then
    delete from public.check_ins
    where group_id = p_group_id;
  end;

  begin
    update public.goals
    set group_id = null
    where group_id = p_group_id;
  exception when others then
    delete from public.goals
    where group_id = p_group_id;
  end;

  delete from public.group_invites
  where group_id = p_group_id;

  delete from public.group_members
  where group_id = p_group_id;

  delete from public.groups
  where id = p_group_id and owner_id = auth.uid();

  get diagnostics v_deleted_count = row_count;

  if v_deleted_count <> 1 then
    raise exception 'group_delete_failed';
  end if;

  return 'deleted';
end;
$$;

grant execute on function public.force_delete_group(uuid) to authenticated;
