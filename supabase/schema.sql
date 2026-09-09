-- Drift notes schema for Supabase + PostGIS
-- Enable PostGIS in the dashboard (Database → Extensions) before running.

create extension if not exists postgis;

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  content text not null check (char_length(content) > 0 and char_length(content) <= 280),
  created_at timestamptz not null default now(),
  first_read_at timestamptz,
  echo_count integer not null default 0 check (echo_count >= 0),
  is_dormant boolean not null default true,
  location geography(point, 4326)
    generated always as (
      st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
    ) stored
);

create index if not exists notes_location_idx on public.notes using gist (location);
create index if not exists notes_user_id_idx on public.notes (user_id);
create index if not exists notes_first_read_at_idx on public.notes (first_read_at);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pages integer not null default 3 check (pages >= 0 and pages <= 5),
  pages_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.note_reads (
  note_id uuid not null references public.notes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  read_at timestamptz not null default now(),
  echoed boolean not null default false,
  primary key (note_id, user_id)
);

create table if not exists public.echoes (
  note_id uuid not null references public.notes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (note_id, user_id)
);

alter table public.notes enable row level security;
alter table public.profiles enable row level security;
alter table public.note_reads enable row level security;
alter table public.echoes enable row level security;

-- Profiles: own row only
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Notes: creators can insert; anyone authenticated can select non-expired
create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id);

create policy "notes_select_authenticated" on public.notes
  for select using (auth.role() = 'authenticated');

create policy "notes_update_authenticated" on public.notes
  for update using (auth.role() = 'authenticated');

create policy "notes_delete_system" on public.notes
  for delete using (auth.uid() = user_id);

create policy "reads_own" on public.note_reads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "echoes_own" on public.echoes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Nearby notes within radius_m meters of (lat, lon)
create or replace function public.nearby_notes(
  lat double precision,
  lon double precision,
  radius_m double precision default 15
)
returns setof public.notes
language sql
stable
security invoker
as $$
  select n.*
  from public.notes n
  where
    (
      n.first_read_at is null
      or n.first_read_at + interval '24 hours' + (n.echo_count * interval '7 days') > now()
    )
    and st_dwithin(
      n.location,
      st_setsrid(st_makepoint(lon, lat), 4326)::geography,
      radius_m
    );
$$;

-- Bootstrap profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mark first read + wake from dormancy
create or replace function public.mark_note_read(p_note_id uuid)
returns public.notes
language plpgsql
security invoker
as $$
declare
  n public.notes;
begin
  update public.notes
  set
    first_read_at = coalesce(first_read_at, now()),
    is_dormant = false
  where id = p_note_id
  returning * into n;

  insert into public.note_reads (note_id, user_id)
  values (p_note_id, auth.uid())
  on conflict (note_id, user_id) do nothing;

  return n;
end;
$$;

-- Echo extends life by 7 days
create or replace function public.echo_note(p_note_id uuid)
returns public.notes
language plpgsql
security invoker
as $$
declare
  n public.notes;
begin
  insert into public.echoes (note_id, user_id)
  values (p_note_id, auth.uid())
  on conflict do nothing;

  if found then
    update public.notes
    set echo_count = echo_count + 1
    where id = p_note_id
    returning * into n;

    update public.note_reads
    set echoed = true
    where note_id = p_note_id and user_id = auth.uid();
  else
    select * into n from public.notes where id = p_note_id;
  end if;

  return n;
end;
$$;

-- Purge notes past decay (call via cron / Edge Function)
create or replace function public.purge_expired_notes()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.notes
  where first_read_at is not null
    and first_read_at + interval '24 hours' + (echo_count * interval '7 days') <= now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
-- Also see supabase/drifts.sql for the drifts table + drop_drift RPC.
