import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthSessionContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      if (__DEV__) {
        console.log('[auth] supabase not configured');
      }
      setSession(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }

        if (error) {
          if (__DEV__) {
            console.warn('[auth] getSession error:', error.message);
          }
          setSession(null);
        } else {
          if (__DEV__) {
            console.log('[auth] session restored:', Boolean(data.session));
          }
          setSession(data.session ?? null);
        }
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }
        if (__DEV__) {
          console.warn('[auth] getSession exception:', error);
        }
        setSession(null);
        setIsLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (__DEV__) {
        console.log('[auth] state change:', _event, Boolean(nextSession));
      }
      setSession(nextSession ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signIn: async (email: string, password: string) => {
        if (!isSupabaseConfigured) {
          return {
            error:
              'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env and restart Expo.',
          };
        }

        const cleanedEmail = email.trim().toLowerCase();
        if (__DEV__) {
          console.log('[auth] signIn attempt for:', cleanedEmail);
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: cleanedEmail,
          password,
        });

        if (__DEV__) {
          console.log('[auth] signIn result error:', error?.message ?? 'none');
        }

        if (error?.message?.toLowerCase().includes('email not confirmed')) {
          return { error: 'Email is not confirmed yet. Check your inbox and confirm your email first.' };
        }

        return { error: error?.message ?? null };
      },
      signUp: async (email: string, password: string, displayName: string) => {
        if (!isSupabaseConfigured) {
          return {
            error:
              'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env and restart Expo.',
          };
        }

        const cleanedEmail = email.trim().toLowerCase();
        if (__DEV__) {
          console.log('[auth] signUp attempt for:', cleanedEmail);
        }

        const { error } = await supabase.auth.signUp({
          email: cleanedEmail,
          password,
        });

        if (__DEV__) {
          console.log('[auth] signUp result error:', error?.message ?? 'none');
        }

        if (!error) {
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData.session?.user?.id;

          if (userId) {
            const { error: profileError } = await supabase.from('profiles').upsert({
              id: userId,
              display_name: displayName.trim() || null,
            });

            if (profileError && __DEV__) {
              console.warn('[auth] profile upsert error:', profileError.message);
            }
          }
        }

        return { error: error?.message ?? null };
      },
      signOut: async () => {
        if (__DEV__) {
          console.log('[auth] signOut attempt');
        }

        const { error } = await supabase.auth.signOut({ scope: 'local' });

        if (error && __DEV__) {
          console.warn('[auth] signOut error:', error.message);
        }

        // Ensure local state is reset even if the auth event is delayed.
        setSession(null);
        setIsLoading(false);
      },
    }),
    [isLoading, session]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider');
  }

  return context;
}
