# Expo + Supabase

## Connect your Supabase project

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings** → **API**.
2. Copy the **Project URL** and **anon / public** key.
3. Paste them into `lib/supabase.js`:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

Auth sessions are stored with **Expo SecureStore** (device keychain / Keystore).

## Run

```bash
npm start
```

## Import

```js
import { supabase } from './lib/supabase';
```

## PostGIS drifts (nearby notes)

1. Open Supabase → **SQL Editor** → New query.
2. Paste everything in `supabase/drifts_postgis.sql` and click **Run**.
3. Call nearby search from the app (15 meters):

```js
const { data, error } = await supabase.rpc('nearby_drifts', {
  p_lat: 37.7749,
  p_long: -122.4194,
});
```

Create a drift:

```js
const { data, error } = await supabase.rpc('create_drift', {
  p_body: 'Hello from here',
  p_lat: 37.7749,
  p_long: -122.4194,
});
```
