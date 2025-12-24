'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

// Define the shape of our Member Profile
export interface MemberProfile {
  id: string;
  auth_user_id: string;
  email: string;
  display_name: string; // Standardized
  name: string; // API contract
  full_name: string; // Legacy/DB
  avatar_url?: string | null; // From API contract
  role: 'admin' | 'member' | 'guest';
  is_admin: boolean;
  status: string;
}

interface AuthContextType {
  user: User | null;
  profile: MemberProfile | null;
  loading: boolean;
  authInitialized: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  authInitialized: false,
  signOut: async () => {}, // placeholder
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authInitialized, setAuthInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Initialize Auth Listener & Session
  // This effect runs ONCE on mount to set up Supabase auth
  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Initializing...');

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('[Auth] Error getting session:', error);
          }
          
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setAuthInitialized(true);
          console.log(initialSession ? '[Auth] Session recovered' : '[Auth] No session found');
        }
      } catch (err) {
        console.error('[Auth] Critical init error:', err);
        if (mounted) setAuthInitialized(true);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log(`[Auth] State change: ${event}`);
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Strict cleanup on sign out
        if (event === 'SIGNED_OUT' || !newSession) {
          setProfile(null);
          // We don't set authInitialized to false, as auth is still "initialized" (just empty)
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch Profile Effect
  // logic: Run only when auth is initialized. 
  // If session exists -> fetch profile.
  // If no session -> valid "guest" state, stop loading.
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      // guard: wait for init
      if (!authInitialized) return;

      // guard: if no session, we are done loading (guest mode)
      if (!session) {
        if (mounted) setLoading(false);
        return;
      }

      // guard: if strictly no access token, treated same as no session
      if (!session.access_token) {
        if (mounted) setLoading(false);
        return;
      }

      // guard: if profile already matches current user, don't re-fetch
      // This prevents loops and redundant calls
      if (profile && profile.auth_user_id === session.user.id) {
        if (mounted) setLoading(false);
        return;
      }

      console.log('[Auth] Valid session, fetching profile...');
      
      try {
        const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const baseUrl = rawUrl.replace(/\/api\/?$/, ''); // Remove /api if present
        
        const res = await fetch(`${baseUrl}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            if (mounted) {
                setProfile(data);
                console.log('[Auth] Profile loaded');
            }
        } else {
            if (res.status === 401) {
                console.warn('[Auth] Profile unauthorized (401), signing out to clear state');
                // Critical: Force signout on 401 to prevent infinite error loops
                await supabase.auth.signOut();
                if (mounted) {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                }
            } else {
                console.warn(`[Auth] Profile fetch failed: ${res.status}`);
            }
        }
      } catch (e) {
          console.error('[Auth] Profile fetch exception:', e);
      } finally {
          if (mounted) setLoading(false);
      }
    };

    fetchProfile();
  // We explicitly depend on session.access_token to trigger retry on token refresh
  // We rely on 'profile' check inside to prevent loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authInitialized, session?.access_token, session?.user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // derived state will update via onAuthStateChange, but we can optimistically clear
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, authInitialized, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
