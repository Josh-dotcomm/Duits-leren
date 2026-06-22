import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/secrets';

const url = SUPABASE_URL;
const anonKey = SUPABASE_ANON_KEY;

// Credentials are baked into src/config/secrets.js, so this is normally true;
// kept so the UI can still warn if someone blanks them out.
export const supabaseConfigured = !!(url && anonKey);

export const supabase = createClient(
  url,
  anonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // no URL-based sessions in React Native
    },
  }
);

// Keep the access token fresh while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
