-- Pulse schema: profiles, groups, goals, check-ins, reactions, storage.
--
-- Design notes:
--   * v1 assumes one active group per user (soft rule enforced in
--     redeem_group_invite(), not a DB constraint) — easy to relax later.
--   * group_members / group_invites have NO direct client-facing INSERT
--     policy. Membership is only ever created via the handle_new_group
--     trigger (group owner) or the redeem_group_invite() function (joining
--     member), and invite codes only via create_group_invite(). This keeps
--     the "can I join/see this invite" logic centralized and avoids a
--     check-then-insert race between concurrent joiners.
--   * check_ins.group_id / check_ins.run_number are denormalized copies of
--     goals.group_id / goals.run_number at insert time, so RLS and feed
--     queries never need to join through goals.
--
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF
-- EXISTS throughout.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper: generic updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_url text;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Creates the matching profiles row the moment a new auth.users row exists —
-- i.e. at signup itself, not "whenever the client happens to have an active
-- session and remembers to upsert one". Client-side profile creation is
-- fragile (skipped entirely if email confirmation is pending, or if that
-- code path just doesn't run for some reason), which silently leaves a user
-- with no profiles row at all. Every downstream profiles UPDATE (e.g.
-- marking onboarding complete) then matches zero rows forever, with no
-- error, trapping that account in an unfixable "never completes onboarding"
-- loop. This trigger removes that dependency entirely.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- One-time backfill: create the missing profiles row for any account that
-- signed up before this trigger existed (this is what unsticks an already
-- stuck "never completes onboarding" account — safe to re-run, no-op once
-- every user has a row).
insert into public.profiles (id, display_name)
select u.id, u.raw_user_meta_data->>'display_name'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ---------------------------------------------------------------------------
-- groups / group_members / group_invites
-- ---------------------------------------------------------------------------

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_id_idx on public.group_members(user_id);

create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  max_uses int,
  use_count int not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists group_invites_group_id_idx on public.group_invites(group_id);

-- Helper used throughout RLS policies below.
create or replace function public.is_group_member(check_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = check_group_id and user_id = auth.uid()
  );
$$;

-- Auto-add the creator as owner the moment a group is created, so there is
-- no client-facing INSERT policy needed on group_members for this path.
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

-- Creates (and, if one already exists, replaces) the active invite code for
-- a group. Owner-only; centralizes code generation + uniqueness retry so the
-- client never has to handle collisions.
create or replace function public.create_group_invite(p_group_id uuid)
returns text
language plpgsql
security definer
-- Needs both schemas: public for the app's own tables, extensions because
-- that's where Supabase installs pgcrypto by default — gen_random_bytes()
-- below silently fails to resolve ("function does not exist") if extensions
-- isn't on the path, since SECURITY DEFINER pins search_path for the call
-- regardless of the caller's own path.
set search_path = public, extensions
as $$
declare
  v_code text;
  v_attempt int := 0;
begin
  if not exists (
    select 1 from public.groups where id = p_group_id and owner_id = auth.uid()
  ) then
    raise exception 'not_group_owner';
  end if;

  update public.group_invites
  set revoked_at = now()
  where group_id = p_group_id and revoked_at is null;

  loop
    v_attempt := v_attempt + 1;
    v_code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));

    begin
      insert into public.group_invites (group_id, code, created_by)
      values (p_group_id, v_code, auth.uid());
      return v_code;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise exception 'could_not_generate_invite_code';
      end if;
    end;
  end loop;
end;
$$;

-- Validates + redeems an invite code, switching the caller's group
-- membership to the target group. Security definer because a non-member
-- must be able to look up a code by value without an RLS SELECT policy on
-- group_invites (which is deliberately member-only).
create or replace function public.redeem_group_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
begin
  select * into v_invite
  from public.group_invites
  where code = upper(p_code)
    and revoked_at is null
    and (expires_at is null or expires_at > now())
    and (max_uses is null or use_count < max_uses)
  for update;

  if not found then
    raise exception 'invalid_or_expired_invite';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_invite.group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  update public.group_invites
  set use_count = use_count + 1
  where id = v_invite.id;

  return v_invite.group_id;
end;
$$;

-- Leaves the caller's current group, if any. A regular member just drops
-- their membership row. An owner leaving hands ownership to the
-- longest-tenured remaining member (so the group keeps working); if the
-- owner is the only member, the group itself is deleted (group_members /
-- group_invites cascade; goals/check_ins keep their history via
-- "on delete set null" on group_id). This is what makes "create/join a
-- different group later" actually possible once someone already has one —
-- the one-active-group rule otherwise leaves no way back.
create or replace function public.leave_group(p_group_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_role text;
  v_next_owner uuid;
begin
  select group_id, role into v_group_id, v_role
  from public.group_members
  where user_id = auth.uid()
    and (p_group_id is null or group_id = p_group_id)
  order by joined_at asc
  limit 1;

  if v_group_id is null then
    raise exception 'not_in_a_group';
  end if;

  if v_role = 'owner' then
    select user_id into v_next_owner
    from public.group_members
    where group_id = v_group_id and user_id <> auth.uid()
    order by joined_at asc
    limit 1;

    if v_next_owner is not null then
      update public.group_members set role = 'owner' where group_id = v_group_id and user_id = v_next_owner;
      update public.groups set owner_id = v_next_owner where id = v_group_id;
      delete from public.group_members where group_id = v_group_id and user_id = auth.uid();
    else
      delete from public.groups where id = v_group_id;
    end if;
  else
    delete from public.group_members where user_id = auth.uid();
  end if;
end;
$$;

create or replace function public.delete_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
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
end;
$$;

grant execute on function public.delete_group(uuid) to authenticated;

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

-- ---------------------------------------------------------------------------
-- goals (replaces user_goals)
-- ---------------------------------------------------------------------------

drop table if exists public.user_goals cascade;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  category text not null check (category in ('fitness', 'learning', 'reading', 'mindset')),
  title text not null,
  is_custom boolean not null default false,
  duration_days int not null,
  is_active boolean not null default false,
  is_archived boolean not null default false,
  run_number int not null default 0,
  run_started_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goals_group_id_idx on public.goals(group_id);

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- check_ins
-- ---------------------------------------------------------------------------

drop table if exists public.check_ins cascade;

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  run_number int not null default 0,
  check_in_date date not null,
  caption text not null,
  photo_path text,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, goal_id, check_in_date)
);

alter table public.check_ins add column if not exists edited_at timestamptz;

create table if not exists public.check_in_events (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid references public.check_ins(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'updated', 'deleted')),
  caption text,
  photo_path text,
  created_at timestamptz not null default now()
);

create index if not exists check_in_events_user_id_created_idx on public.check_in_events(user_id, created_at desc);

create index if not exists check_ins_group_id_date_idx on public.check_ins(group_id, check_in_date desc);
create index if not exists check_ins_goal_id_idx on public.check_ins(goal_id);

-- ---------------------------------------------------------------------------
-- reactions
-- ---------------------------------------------------------------------------

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.check_ins(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (check_in_id, user_id)
);

create index if not exists reactions_check_in_id_idx on public.reactions(check_in_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
alter table public.goals enable row level security;
alter table public.check_ins enable row level security;
alter table public.check_in_events enable row level security;
alter table public.reactions enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_co_members" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_select_co_members"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid() and gm2.user_id = profiles.id
    )
  );

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- groups
drop policy if exists "groups_select_member" on public.groups;
drop policy if exists "groups_insert_self_owner" on public.groups;
drop policy if exists "groups_update_owner" on public.groups;
drop policy if exists "groups_delete_owner" on public.groups;

create policy "groups_select_member"
  on public.groups for select
  using (owner_id = auth.uid() or public.is_group_member(id));

create policy "groups_insert_self_owner"
  on public.groups for insert
  with check (owner_id = auth.uid());

create policy "groups_update_owner"
  on public.groups for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "groups_delete_owner"
  on public.groups for delete
  using (owner_id = auth.uid());

-- group_members (no INSERT policy: see handle_new_group / redeem_group_invite)
drop policy if exists "group_members_select_member" on public.group_members;
drop policy if exists "group_members_delete_self_or_owner" on public.group_members;

create policy "group_members_select_member"
  on public.group_members for select
  using (public.is_group_member(group_id));

create policy "group_members_delete_self_or_owner"
  on public.group_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.group_members owner_row
      where owner_row.group_id = group_members.group_id
        and owner_row.user_id = auth.uid()
        and owner_row.role = 'owner'
    )
  );

-- group_invites (no INSERT/UPDATE policy: see create_group_invite/redeem_group_invite)
drop policy if exists "group_invites_select_member" on public.group_invites;

create policy "group_invites_select_member"
  on public.group_invites for select
  using (public.is_group_member(group_id));

-- goals
drop policy if exists "goals_select_own" on public.goals;
drop policy if exists "goals_select_group" on public.goals;
drop policy if exists "goals_insert_own" on public.goals;
drop policy if exists "goals_update_own" on public.goals;
drop policy if exists "goals_delete_own" on public.goals;

create policy "goals_select_own"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "goals_select_group"
  on public.goals for select
  using (group_id is not null and public.is_group_member(group_id));

create policy "goals_insert_own"
  on public.goals for insert
  with check (
    auth.uid() = user_id
    and (
      group_id is null
      or exists (
        select 1 from public.groups g
        where g.id = group_id and g.owner_id = auth.uid()
      )
    )
  );

create policy "goals_update_own"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      group_id is null
      or exists (
        select 1 from public.groups g
        where g.id = group_id and g.owner_id = auth.uid()
      )
    )
  );

create policy "goals_delete_own"
  on public.goals for delete
  using (auth.uid() = user_id);

-- check_ins
drop policy if exists "check_ins_select_own" on public.check_ins;
drop policy if exists "check_ins_select_group" on public.check_ins;
drop policy if exists "check_ins_insert_own" on public.check_ins;
drop policy if exists "check_ins_update_own" on public.check_ins;
drop policy if exists "check_ins_delete_own" on public.check_ins;

create policy "check_ins_select_own"
  on public.check_ins for select
  using (auth.uid() = user_id);

create policy "check_ins_select_group"
  on public.check_ins for select
  using (group_id is not null and public.is_group_member(group_id));

create policy "check_ins_insert_own"
  on public.check_ins for insert
  with check (auth.uid() = user_id and (group_id is null or public.is_group_member(group_id)));

create policy "check_ins_update_own"
  on public.check_ins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and (group_id is null or public.is_group_member(group_id)));

create policy "check_ins_delete_own"
  on public.check_ins for delete
  using (auth.uid() = user_id);

-- check_in_events
drop policy if exists "check_in_events_select_own" on public.check_in_events;
drop policy if exists "check_in_events_insert_own" on public.check_in_events;

create policy "check_in_events_select_own"
  on public.check_in_events for select
  using (auth.uid() = user_id);

create policy "check_in_events_insert_own"
  on public.check_in_events for insert
  with check (auth.uid() = user_id);

-- reactions
drop policy if exists "reactions_select_visible" on public.reactions;
drop policy if exists "reactions_insert_visible" on public.reactions;
drop policy if exists "reactions_delete_own" on public.reactions;

create policy "reactions_select_visible"
  on public.reactions for select
  using (
    exists (
      select 1 from public.check_ins c
      where c.id = reactions.check_in_id
        and (c.user_id = auth.uid() or (c.group_id is not null and public.is_group_member(c.group_id)))
    )
  );

create policy "reactions_insert_visible"
  on public.reactions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.check_ins c
      where c.id = reactions.check_in_id
        and (c.user_id = auth.uid() or (c.group_id is not null and public.is_group_member(c.group_id)))
    )
  );

create policy "reactions_delete_own"
  on public.reactions for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Realtime: publish check_ins/reactions so group members see live updates.
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.check_ins;
exception when duplicate_object then
  null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.reactions;
exception when duplicate_object then
  null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: private bucket for check-in photos.
-- Path convention: {group_id}/{user_id}/{check_in_id}.jpg, or
-- solo/{user_id}/{check_in_id}.jpg for check-ins with no group.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('check-in-photos', 'check-in-photos', false)
on conflict (id) do nothing;

-- Handles both path shapes above; the group segment isn't always a uuid
-- (the "solo" literal), so this can't be inlined directly into a policy
-- expression without risking a cast error on every non-group path.
create or replace function public.can_access_check_in_photo(object_name text, want_write boolean)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_group_segment text := (storage.foldername(object_name))[1];
  v_user_segment text := (storage.foldername(object_name))[2];
begin
  if v_group_segment = 'solo' then
    return v_user_segment = auth.uid()::text;
  end if;

  if not public.is_group_member(v_group_segment::uuid) then
    return false;
  end if;

  if want_write then
    return v_user_segment = auth.uid()::text;
  end if;

  return true;
exception when invalid_text_representation then
  return false;
end;
$$;

drop policy if exists "check_in_photos_select_group" on storage.objects;
drop policy if exists "check_in_photos_insert_own" on storage.objects;
drop policy if exists "check_in_photos_update_own" on storage.objects;
drop policy if exists "check_in_photos_delete_own" on storage.objects;

create policy "check_in_photos_select_group"
  on storage.objects for select
  using (
    bucket_id = 'check-in-photos'
    and public.can_access_check_in_photo(name, false)
  );

create policy "check_in_photos_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'check-in-photos'
    and public.can_access_check_in_photo(name, true)
  );

create policy "check_in_photos_update_own"
  on storage.objects for update
  using (
    bucket_id = 'check-in-photos'
    and public.can_access_check_in_photo(name, true)
  );

create policy "check_in_photos_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'check-in-photos'
    and public.can_access_check_in_photo(name, true)
  );
