-- Central Dogma Messenger
-- DNA (intent) -> mRNA (network transcript) -> Protein (rendered message)
-- Run in the Supabase SQL editor after enabling Auth.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.cell_type as enum ('epithelial', 'macrophage', 'oncogenic');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.vesicle_status as enum (
    'transcribing',
    'in_transit',
    'translating',
    'folded',
    'misfolded',
    'refolded',
    'phagocytosed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.vesicle_visibility as enum ('direct', 'feed');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- User cells (profiles)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique,
  display_name text not null,
  bio text,
  cell_type public.cell_type not null default 'epithelial',
  atp_balance integer not null default 240,
  polymerase_level smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint handle_format check (handle ~ '^[a-z0-9_]{3,24}$'),
  constraint atp_non_negative check (atp_balance >= 0),
  constraint polymerase_range check (polymerase_level between 0 and 3)
);

create index if not exists profiles_cell_type_idx on public.profiles (cell_type);

-- ---------------------------------------------------------------------------
-- IAP catalog + cytoplasm inventory
-- ---------------------------------------------------------------------------

create table if not exists public.organelle_catalog (
  slug text primary key,
  name text not null,
  tagline text not null,
  description text not null,
  price_atp integer not null check (price_atp >= 0),
  stackable boolean not null default true,
  max_quantity integer,
  effect jsonb not null default '{}'::jsonb
);

create table if not exists public.user_organelles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  organelle_slug text not null references public.organelle_catalog (slug),
  quantity integer not null default 0,
  acquired_at timestamptz not null default now(),
  primary key (user_id, organelle_slug),
  constraint organelle_qty_non_negative check (quantity >= 0)
);

create table if not exists public.atp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists atp_ledger_user_idx on public.atp_ledger (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Slides (conversation dishes) + vesicles (messages)
-- ---------------------------------------------------------------------------

create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_at timestamptz not null default now()
);

create table if not exists public.slide_members (
  slide_id uuid not null references public.slides (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (slide_id, user_id)
);

create table if not exists public.vesicles (
  id uuid primary key default gen_random_uuid(),
  slide_id uuid references public.slides (id) on delete set null,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  dna_seed text not null,
  mrna_transcript jsonb not null,
  protein_result text,
  is_misfolded boolean not null default false,
  status public.vesicle_status not null default 'transcribing',
  visibility public.vesicle_visibility not null default 'direct',
  mutation_count integer not null default 0,
  transcription_fidelity numeric(6, 4) not null default 1,
  translation_latency_ms integer,
  translation_notes text[] not null default '{}',
  chaperone_applied boolean not null default false,
  created_at timestamptz not null default now(),
  translated_at timestamptz,
  constraint dna_not_empty check (char_length(trim(dna_seed)) > 0)
);

create index if not exists vesicles_recipient_idx on public.vesicles (recipient_id, created_at desc);
create index if not exists vesicles_sender_idx on public.vesicles (sender_id, created_at desc);
create index if not exists vesicles_feed_idx on public.vesicles (visibility, created_at desc);
create index if not exists vesicles_misfold_idx on public.vesicles (recipient_id) where is_misfolded;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_handle text;
begin
  next_handle := coalesce(
    new.raw_user_meta_data ->> 'handle',
    'cell_' || substr(new.id::text, 1, 8)
  );

  insert into public.profiles (id, handle, display_name, cell_type)
  values (
    new.id,
    next_handle,
    coalesce(new.raw_user_meta_data ->> 'display_name', next_handle),
    coalesce((new.raw_user_meta_data ->> 'cell_type')::public.cell_type, 'epithelial')
  );

  insert into public.user_organelles (user_id, organelle_slug, quantity)
  values
    (new.id, 'proofreading_polymerase', 0),
    (new.id, 'chaperone_protein', 1)
  on conflict do nothing;

  insert into public.atp_ledger (user_id, delta, reason)
  values (new.id, 240, 'zygotic endowment');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- IAP RPCs
-- ---------------------------------------------------------------------------

create or replace function public.purchase_organelle(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  item public.organelle_catalog%rowtype;
  cell public.profiles%rowtype;
  next_qty integer;
begin
  if actor is null then
    raise exception 'Not authenticated';
  end if;

  select * into item from public.organelle_catalog where slug = p_slug;
  if not found then
    raise exception 'Unknown organelle %', p_slug;
  end if;

  select * into cell from public.profiles where id = actor for update;
  if cell.atp_balance < item.price_atp then
    raise exception 'Insufficient ATP';
  end if;

  if p_slug = 'proofreading_polymerase' then
    if cell.polymerase_level >= 3 then
      raise exception 'Polymerase already at clamp saturation';
    end if;
    update public.profiles
      set atp_balance = atp_balance - item.price_atp,
          polymerase_level = polymerase_level + 1
      where id = actor;
    next_qty := cell.polymerase_level + 1;
  else
    insert into public.user_organelles (user_id, organelle_slug, quantity)
    values (actor, p_slug, 1)
    on conflict (user_id, organelle_slug)
    do update set quantity = public.user_organelles.quantity + 1
    returning quantity into next_qty;

    update public.profiles
      set atp_balance = atp_balance - item.price_atp
      where id = actor;
  end if;

  insert into public.atp_ledger (user_id, delta, reason, metadata)
  values (actor, -item.price_atp, 'iap:' || p_slug, jsonb_build_object('quantity', next_qty));

  return jsonb_build_object('ok', true, 'quantity', next_qty);
end;
$$;

create or replace function public.apply_chaperone(p_vesicle_id uuid)
returns public.vesicles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  stock integer;
  vesicle public.vesicles%rowtype;
begin
  if actor is null then
    raise exception 'Not authenticated';
  end if;

  select quantity into stock
  from public.user_organelles
  where user_id = actor and organelle_slug = 'chaperone_protein'
  for update;

  if coalesce(stock, 0) < 1 then
    raise exception 'No chaperone proteins in the cytosol';
  end if;

  select * into vesicle from public.vesicles where id = p_vesicle_id for update;
  if not found then
    raise exception 'Vesicle not found';
  end if;
  if vesicle.recipient_id <> actor and vesicle.sender_id <> actor then
    raise exception 'Vesicle is outside this cytoplasm';
  end if;
  if not vesicle.is_misfolded then
    raise exception 'Chain is already folded';
  end if;

  update public.user_organelles
    set quantity = quantity - 1
    where user_id = actor and organelle_slug = 'chaperone_protein';

  update public.vesicles
    set is_misfolded = false,
        status = 'refolded',
        chaperone_applied = true,
        protein_result = '↻ chaperone-refolded · ' || vesicle.dna_seed
    where id = p_vesicle_id
    returning * into vesicle;

  return vesicle;
end;
$$;

-- ---------------------------------------------------------------------------
-- Catalog seed
-- ---------------------------------------------------------------------------

insert into public.organelle_catalog (slug, name, tagline, description, price_atp, stackable, max_quantity, effect)
values
  (
    'proofreading_polymerase',
    'Proofreading Polymerase',
    '3′–5′ exonuclease clamp',
    'Lowers transcription error rate geometrically (×0.55 per level, max 3). Equipped polymerases proofread substitutions before the mRNA leaves the nucleus.',
    80,
    false,
    3,
    '{"kind":"polymerase_level","delta":1}'::jsonb
  ),
  (
    'chaperone_protein',
    'Chaperone Proteins',
    'Hsp70 / Hsp90 folding barrel',
    'Consumable. Binds a misfolded vesicle, hides hydrophobic patches, and rewrites protein_result from the original dna_seed. Clears is_misfolded.',
    35,
    true,
    null,
    '{"kind":"refold","consumes":1}'::jsonb
  )
on conflict (slug) do update
set
  name = excluded.name,
  tagline = excluded.tagline,
  description = excluded.description,
  price_atp = excluded.price_atp,
  effect = excluded.effect;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.organelle_catalog enable row level security;
alter table public.user_organelles enable row level security;
alter table public.atp_ledger enable row level security;
alter table public.slides enable row level security;
alter table public.slide_members enable row level security;
alter table public.vesicles enable row level security;

drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "catalog is readable" on public.organelle_catalog;
create policy "catalog is readable"
  on public.organelle_catalog for select
  to authenticated, anon
  using (true);

drop policy if exists "inventory is private" on public.user_organelles;
create policy "inventory is private"
  on public.user_organelles for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "ledger is private" on public.atp_ledger;
create policy "ledger is private"
  on public.atp_ledger for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "slide members read slides" on public.slides;
create policy "slide members read slides"
  on public.slides for select
  to authenticated
  using (
    exists (
      select 1 from public.slide_members m
      where m.slide_id = slides.id and m.user_id = auth.uid()
    )
  );

drop policy if exists "slide members read membership" on public.slide_members;
create policy "slide members read membership"
  on public.slide_members for select
  to authenticated
  using (user_id = auth.uid() or exists (
    select 1 from public.slide_members mine
    where mine.slide_id = slide_members.slide_id and mine.user_id = auth.uid()
  ));

drop policy if exists "vesicles for participants or feed" on public.vesicles;
create policy "vesicles for participants or feed"
  on public.vesicles for select
  to authenticated
  using (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
    or visibility = 'feed'
  );

drop policy if exists "senders insert vesicles" on public.vesicles;
create policy "senders insert vesicles"
  on public.vesicles for insert
  to authenticated
  with check (sender_id = auth.uid());

drop policy if exists "participants update vesicles" on public.vesicles;
create policy "participants update vesicles"
  on public.vesicles for update
  to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid())
  with check (sender_id = auth.uid() or recipient_id = auth.uid());

grant execute on function public.purchase_organelle(text) to authenticated;
grant execute on function public.apply_chaperone(uuid) to authenticated;
