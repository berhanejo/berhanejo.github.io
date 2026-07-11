-- Minimal Supabase schema for Pulse

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id text not null,
  category text not null,
  title text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_goal_id uuid references public.user_goals(id) on delete cascade,
  check_in_date date not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, user_goal_id, check_in_date)
);

alter table public.profiles enable row level security;
alter table public.user_goals enable row level security;
alter table public.check_ins enable row level security;

-- Profiles policies
create policy if not exists "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy if not exists "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy if not exists "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- User goals policies
create policy if not exists "user_goals_select_own"
  on public.user_goals for select
  using (auth.uid() = user_id);

create policy if not exists "user_goals_insert_own"
  on public.user_goals for insert
  with check (auth.uid() = user_id);

create policy if not exists "user_goals_update_own"
  on public.user_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "user_goals_delete_own"
  on public.user_goals for delete
  using (auth.uid() = user_id);

-- Check-ins policies
create policy if not exists "check_ins_select_own"
  on public.check_ins for select
  using (auth.uid() = user_id);

create policy if not exists "check_ins_insert_own"
  on public.check_ins for insert
  with check (auth.uid() = user_id);

create policy if not exists "check_ins_update_own"
  on public.check_ins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "check_ins_delete_own"
  on public.check_ins for delete
  using (auth.uid() = user_id);
