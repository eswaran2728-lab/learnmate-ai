-- Toonify database schema (run in the Supabase SQL editor or as a migration).
-- Phase 1 scope: profiles, jobs, usage tracking foundations, storage bucket.
-- The backend currently tracks jobs in memory (Phase 2 feasibility proof);
-- Phase 3 moves job rows into this table — the columns mirror the in-memory
-- job store 1:1 so that swap is mechanical.

-- ============ profiles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  -- Free-tier conversions per month; enforced server-side in Phase 5.
  monthly_credit_limit integer not null default 5,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ jobs ============
create table if not exists public.jobs (
  id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  style_id text not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'done', 'failed')),
  progress real not null default 0,
  -- Storage object path of the finished video (bucket key, not a signed URL).
  result_path text,
  error text,
  -- Cost analytics foundations (Phase 6): frames processed and wall time.
  frame_count integer,
  processing_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_user_id_created_at_idx on public.jobs (user_id, created_at desc);

alter table public.jobs enable row level security;

-- Users see only their own jobs. Writes go through the backend using the
-- service-role key, so no insert/update policies for regular users.
create policy "Users can read own jobs"
  on public.jobs for select
  using (auth.uid() = user_id);

-- Monthly usage per user (free-tier metering, enforced in Phase 5).
create or replace view public.monthly_usage as
select
  user_id,
  date_trunc('month', created_at) as month,
  count(*) filter (where status <> 'failed') as conversions
from public.jobs
group by user_id, date_trunc('month', created_at);

-- ============ storage ============
insert into storage.buckets (id, name, public)
values ('toonify-videos', 'toonify-videos', false)
on conflict (id) do nothing;

-- The backend uploads results with the service-role key and hands the app
-- signed URLs, so the bucket stays private with no user-facing policies.
