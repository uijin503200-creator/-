import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ensureSession, fetchProfile } from '@/lib/notes-service';
import { isDemoMode } from '@/lib/supabase';
import type { UserProfile } from '@/lib/types';

type AuthState = {
  userId: string | null;
  profile: UserProfile | null;
  loading: boolean;
  demoMode: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const next = await fetchProfile(userId);
    setProfile(next);
  }, [userId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const id = await ensureSession();
        if (!alive) return;
        setUserId(id);
        const next = await fetchProfile(id);
        if (!alive) return;
        setProfile(next);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(
    () => ({ userId, profile, loading, demoMode: isDemoMode, refreshProfile }),
    [userId, profile, loading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}