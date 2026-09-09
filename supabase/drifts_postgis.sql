-- =============================================================================
-- Drifts + PostGIS setup for Supabase
-- Paste this ENTIRE script into: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- 1) Enable PostGIS (geography / distance in meters)
create extension if not exists postgis with schema extensions;

-- 2) Table: drifts (notes left in the real world)
create table if not exists public.drifts (
  id uuid primary key default gen_random_uuid(),

  -- The note text
  body text not null,

  -- How many times this drift has been "echoed"
  echoes integer not null default 0 check (echoes >= 0),

  -- Geographic point (WGS84). Use geography so ST_DWithin uses meters.
  location geography(Point, 4326) not null,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.drifts is 'Location-based notes (drifts) discoverable nearby via PostGIS.';
comment on column public.drifts.body is 'The note text.';
comment on column public.drifts.echoes is 'Echo / reaction count.';
comment on column public.drifts.location is 'WGS84 point stored as geography for meter-based distance queries.';

-- Keep updated_at fresh on every row change
create or replace function public.set_drifts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists drifts_set_updated_at on public.drifts;
create trigger drifts_set_updated_at
before update on public.drifts
for each row
execute function public.set_drifts_updated_at();

-- Spatial index (makes nearby searches fast)
create index if not exists drifts_location_gix
  on public.drifts
  using gist (location);

-- 3) RPC: find drifts within 15 meters of the caller's lat/long
-- Call from the app like:
--   supabase.rpc('nearby_drifts', { p_lat: 37.77, p_long: -122.42 })
--
-- IMPORTANT: PostGIS points are (longitude, latitude) — long first, lat second.
create or replace function public.nearby_drifts(
  p_lat double precision,
  p_long double precision
)
returns table (
  id uuid,
  body text,
  echoes integer,
  lat double precision,
  long double precision,
  created_at timestamptz,
  updated_at timestamptz,
  distance_meters double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    d.id,
    d.body,
    d.echoes,
    -- Expose readable lat/long for the app (not the raw geography blob)
    st_y(d.location::geometry) as lat,
    st_x(d.location::geometry) as long,
    d.created_at,
    d.updated_at,
    st_distance(
      d.location,
      st_setsrid(st_makepoint(p_long, p_lat), 4326)::geography
    ) as distance_meters
  from public.drifts as d
  where st_dwithin(
    d.location,
    st_setsrid(st_makepoint(p_long, p_lat), 4326)::geography,
    15  -- meters
  )
  order by distance_meters asc;
$$;

comment on function public.nearby_drifts(double precision, double precision) is
  'Returns drifts within 15 meters of the given WGS84 latitude/longitude.';

-- Allow the anon + authenticated roles to call this RPC from the Expo app
grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.drifts to anon, authenticated;
grant execute on function public.nearby_drifts(double precision, double precision)
  to anon, authenticated;

-- 4) Row Level Security (recommended on Supabase)
-- These beginner-friendly policies allow anyone with your anon key to
-- read drifts and insert new ones. Tighten later when you add auth.
alter table public.drifts enable row level security;

drop policy if exists "Anyone can read drifts" on public.drifts;
create policy "Anyone can read drifts"
  on public.drifts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can insert drifts" on public.drifts;
create policy "Anyone can insert drifts"
  on public.drifts
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anyone can update echoes" on public.drifts;
create policy "Anyone can update echoes"
  on public.drifts
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- Optional helper: insert a drift with plain lat/long (easier than raw geography)
create or replace function public.create_drift(
  p_body text,
  p_lat double precision,
  p_long double precision
)
returns public.drifts
language sql
volatile
security invoker
set search_path = public, extensions
as $$
  insert into public.drifts (body, location)
  values (
    p_body,
    st_setsrid(st_makepoint(p_long, p_lat), 4326)::geography
  )
  returning *;
$$;

grant execute on function public.create_drift(text, double precision, double precision)
  to anon, authenticated;
