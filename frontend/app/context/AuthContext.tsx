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
  // ... other fields
}

interface AuthContextType {
  user: User | null;
  profile: MemberProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {}, // placeholder
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (session: Session) => {
        try {
            const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const baseUrl = rawUrl.replace(/\/api\/?$/, ''); // Remove /api if present
            
            console.log('[AuthContext] Fetching Profile from:', `${baseUrl}/api/auth/me`);
            const res = await fetch(`${baseUrl}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (mounted) setProfile(data);
            } else {
                console.error("Failed to fetch profile:", res.statusText);
            }
        } catch (e) {
            console.error("Profile fetch error:", e);
        }
    };

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          if (mounted) setUser(session.user);
          await fetchProfile(session);
        } else {
          if (mounted) setUser(null);
          if (mounted) setProfile(null);
        }
      } catch (err) {
        console.error('Auth Init Error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Logic for handling auth state changes
      if (session?.user) {
          setUser(session.user);
          // Only fetch profile if not already loaded or if user changed
          if (!profile || profile.auth_user_id !== session.user.id) {
               await fetchProfile(session);
          }
          setLoading(false);
      } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
