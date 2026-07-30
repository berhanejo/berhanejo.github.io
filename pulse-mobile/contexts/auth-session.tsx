import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthSessionContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

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

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (__DEV__) {
        console.log('[auth] state change:', event, Boolean(nextSession));
      }
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
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

        // display_name travels in the user metadata so the on_auth_user_created
        // DB trigger can pick it up when it creates the profiles row — this
        // happens server-side at signup regardless of whether a client
        // session exists yet (e.g. email confirmation pending), unlike a
        // client-side upsert which can silently never run.
        const { error } = await supabase.auth.signUp({
          email: cleanedEmail,
          password,
          options: {
            data: { display_name: displayName.trim() || null },
          },
        });

        if (__DEV__) {
          console.log('[auth] signUp result error:', error?.message ?? 'none');
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
      requestPasswordReset: async (email: string) => {
        if (!isSupabaseConfigured) {
          return { error: 'Supabase is not configured.' };
        }

        const cleanedEmail = email.trim().toLowerCase();
        const { error } = await supabase.auth.resetPasswordForEmail(cleanedEmail, {
          redirectTo: Linking.createURL('/auth/reset-password'),
        });

        return { error: error?.message ?? null };
      },
      updatePassword: async (newPassword: string) => {
        if (!isSupabaseConfigured) {
          return { error: 'Supabase is not configured.' };
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (!error) {
          setIsPasswordRecovery(false);
        }

        return { error: error?.message ?? null };
      },
      isPasswordRecovery,
    }),
    [isLoading, isPasswordRecovery, session]
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
