// ---------------------------------------------------------------------------
// Client API config.
//
// Supabase URL + publishable (anon) key are SAFE to ship in a client app: access
// is guarded by row-level security on the server, not by hiding the key. They are
// hardcoded here so the app and the APK work without a .env.
//
// The Groq key is intentionally NOT hardcoded: anything shipped in the app can be
// extracted from the bundle. In production the Groq key lives server-side in the
// Supabase Edge Functions ('chat' and 'transcribe'); the app calls those instead.
// For quick local development you may set EXPO_PUBLIC_GROQ_API_KEY in a local .env
// (gitignored, never shipped) to call Groq directly.
// ---------------------------------------------------------------------------

export const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hxnsecgtgpjflkhijidx.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_0NW6k8wt1urhdJAH8n5pMg_CCbuF1nt';
