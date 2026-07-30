import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase env missing: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your env.'
  );
}

const authOptions =
  Platform.OS === 'web'
    ? {
        autoRefreshToken: true,
        persistSession: true,
        // Needed so a password-reset (or email-confirmation) link's
        // #access_token=...&type=recovery URL fragment is picked up
        // automatically when it lands back on the web app.
        detectSessionInUrl: true,
      }
    : {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: require('@react-native-async-storage/async-storage').default,
      };

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: authOptions,
  }
);
