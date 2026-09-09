-- Drifts: primary drop table with explicit PostGIS geography
-- Run after the base schema (notes/profiles). Requires PostGIS.

create table if not exists public.drifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) > 0 and char_length(content) <= 150),
  latitude double precision not null,
  longitude double precision not null,
  location geography(point, 4326) not null,
  created_at timestamptz not null default now(),
  first_read_at timestamptz,
  echo_count integer not null default 0 check (echo_count >= 0),
  is_dormant boolean not null default true
);

create index if not exists drifts_location_idx on public.drifts using gist (location);
create index if not exists drifts_user_id_idx on public.drifts (user_id);
create index if not exists drifts_created_at_idx on public.drifts (created_at desc);

alter table public.drifts enable row level security;

create policy "drifts_insert_own" on public.drifts
  for insert with check (auth.uid() = user_id);

create policy "drifts_select_authenticated" on public.drifts
  for select using (auth.role() = 'authenticated');

create policy "drifts_update_authenticated" on public.drifts
  for update using (auth.role() = 'authenticated');

create policy "drifts_delete_own" on public.drifts
  for delete using (auth.uid() = user_id);

-- Insert a drift at exact GPS coords; location is set via PostGIS.
create or replace function public.drop_drift(
  p_content text,
  p_lat double precision,
  p_lon double precision
)
returns public.drifts
language plpgsql
security invoker
as $$
declare
  d public.drifts;
  pages_left integer;
  cleaned text := trim(p_content);
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if cleaned is null or char_length(cleaned) = 0 or char_length(cleaned) > 150 then
    raise exception 'Drift must be 1–150 characters';
  end if;

  select pages into pages_left
  from public.profiles
  where id = auth.uid()
  for update;

  if coalesce(pages_left, 0) <= 0 then
    raise exception 'No pages left. Wait for one to return.';
  end if;

  insert into public.drifts (
    user_id,
    content,
    latitude,
    longitude,
    location,
    is_dormant
  )
  values (
    auth.uid(),
    cleaned,
    p_lat,
    p_lon,
    st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography,
    true
  )
  returning * into d;

  -- Keep notes in sync so nearby discovery / echo still work.
  insert into public.notes (
    id,
    user_id,
    latitude,
    longitude,
    content,
    is_dormant
  )
  values (
    d.id,
    d.user_id,
    d.latitude,
    d.longitude,
    d.content,
    true
  );

  update public.profiles
  set pages = pages - 1,
      pages_updated_at = now()
  where id = auth.uid();

  return d;
end;
$$;

-- Nearby drifts within radius (PostGIS)
create or replace function public.nearby_drifts(
  lat double precision,
  lon double precision,
  radius_m double precision default 15
)
returns setof public.drifts
language sql
stable
security invoker
as $$
  select d.*
  from public.drifts d
  where
    (
      d.first_read_at is null
      or d.first_read_at + interval '24 hours' + (d.echo_count * interval '7 days') > now()
    )
    and st_dwithin(
      d.location,
      st_setsrid(st_makepoint(lon, lat), 4326)::geography,
      radius_m
    );
$$;
