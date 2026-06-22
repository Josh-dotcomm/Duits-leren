// ---------------------------------------------------------------------------
// Hardcoded API config so the built APK works out of the box, without a .env
// on the device. EXPO_PUBLIC_* env vars still OVERRIDE these when present
// (handy for local development or rotating a key without editing code).
//
// Supabase URL + publishable (anon) key are safe to ship inside a client app:
// access is guarded by row-level security on the server, not by hiding the key.
//
// The Groq key is inlined into the JS bundle either way, so it is extractable
// from the APK. Paste your real key in GROQ_API_KEY below to bake it into the
// build; keep this repository private once you do.
// ---------------------------------------------------------------------------

export const GROQ_API_KEY =
  process.env.EXPO_PUBLIC_GROQ_API_KEY || 'PASTE_YOUR_GROQ_KEY_HERE';

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hxnsecgtgpjflkhijidx.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_0NW6k8wt1urhdJAH8n5pMg_CCbuF1nt';
