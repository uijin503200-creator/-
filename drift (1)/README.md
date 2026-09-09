# Drift

Minimalist, anonymous, location-bound notes.

Walk within **15 meters** of a note to read it. Notes sleep until first read, then decay in 24 hours — unless readers **Echo** them (+7 days each).

## Stack

- Expo Router + React Native Reanimated
- Supabase (PostGIS nearby query, RLS, anonymous auth)
- Demo mode when `EXPO_PUBLIC_SUPABASE_*` is unset (local AsyncStorage + simulated plaza)

## Run

```bash
npm install
npx expo start
```

Web preview uses a demo location near Union Square so you can walk toward seeded notes without GPS.

## Supabase

1. Create a project and enable the **PostGIS** extension.
2. Run `supabase/schema.sql` in the SQL editor.
3. Enable **Anonymous Sign-Ins** (Authentication → Providers).
4. Copy URL + anon key:

```bash
cp .env.example .env
# EXPO_PUBLIC_SUPABASE_URL=...
# EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Schedule `select public.purge_expired_notes();` (pg_cron or Edge Function) to permanently delete decayed notes.

Also run `supabase/drifts.sql` for the `drifts` table and `drop_drift` RPC (PostGIS `location` via `ST_MakePoint`).

## Mechanics

| Rule | Behavior |
|------|----------|
| Scarcity | Limited **Pages** (max 5); dropping a note spends one; regenerates every 12h |
| Anonymity | Global auth (anonymous / SMS / OAuth via Supabase); no public username or avatar |
| Distance | Passive `expo-location` poll + Haversine / PostGIS; ≤15m triggers heartbeat haptics |
| Dormancy | `is_dormant` until first read stamps `first_read_at` |
| Decay | Deletes 24h after first read + `echo_count × 7 days` |
| Echo | One echo per reader; extends survival |

## Agent skills

Engineering workflows from [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) are installed at `.cursor/skills/` (mirrored in `.agents/skills/`). Refresh with:

```bash
npx skills add addyosmani/agent-skills -y
cp -a .agents/skills/. .cursor/skills/
```

Real-browser CDP control from [browser-use/browser-harness](https://github.com/browser-use/browser-harness):

```bash
npx skills add browser-use/browser-harness -y
cp -a .agents/skills/browser-harness .cursor/skills/
```

## Screens

