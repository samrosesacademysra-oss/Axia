import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'Admin';
  avatar?: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  isSupabaseAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_ADMIN_KEY = 'axia_current_admin';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            setUser({
              id: data.session.user.id,
              email: data.session.user.email || 'admin@axiadistributions.com',
              name: data.session.user.user_metadata?.full_name || 'Admin',
              role: 'Admin',
            });
            setLoading(false);
            return;
          }

          // Listen for Supabase auth state changes
          const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              setUser({
                id: session.user.id,
                email: session.user.email || 'admin@axiadistributions.com',
                name: session.user.user_metadata?.full_name || 'Admin',
                role: 'Admin',
              });
            } else {
              setUser(null);
            }
          });

          setLoading(false);
          return () => {
            authListener.subscription.unsubscribe();
          };
        } catch (err) {
          console.warn('Supabase auth init error:', err);
        }
      }

      // Local admin session fallback
      try {
        const stored = localStorage.getItem(LOCAL_ADMIN_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          // Default initial session for immediate access
          const defaultAdmin: AdminUser = {
            id: 'admin-01',
            email: 'admin@axiadistributions.com',
            name: 'Kwame Mensah (Admin)',
            role: 'Admin',
          };
          localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(defaultAdmin));
          setUser(defaultAdmin);
        }
      } catch {
        setUser(null);
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const signIn = async (email: string, password?: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: password || '',
        });
        if (error) {
          return { error: error.message };
        }
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || 'Admin',
            role: 'Admin',
          });
          return {};
        }
      } catch (err: unknown) {
        return { error: (err as Error).message || 'Authentication failed' };
      }
    }

    // Local admin sign-in validation
    if (!email || !email.includes('@')) {
      return { error: 'Please enter a valid admin email address' };
    }

    const admin: AdminUser = {
      id: 'admin-' + Date.now(),
      email,
      name: email.split('@')[0].replace('.', ' ').toUpperCase() + ' (Admin)',
      role: 'Admin',
    };
    localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(admin));
    setUser(admin);
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_ADMIN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        isSupabaseAuth: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
