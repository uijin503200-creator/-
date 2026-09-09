import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Paste your Supabase project credentials here:
// Project Settings → API in the Supabase dashboard
const SUPABASE_URL = 'https://ruzovjdulrrgjowrenig.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1em92amR1bHJyZ2pvd3JlbmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MzExMjQsImV4cCI6MjEwNDUwNzEyNH0.LgbkU3Tj1R6ol5eiyJg84Ok4ROBV612jyOdah0KcOlU';

/**
 * Expo SecureStore adapter for Supabase Auth.
 * Persists session tokens in the device keychain / Keystore
 * instead of plain AsyncStorage.
 */
const ExpoSecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
