// Shared CORS headers for the Edge Functions. React Native does not enforce CORS,
// but this keeps the functions usable from a browser (Expo web) too.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
