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
