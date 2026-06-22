// Edge Function: proxies Groq Whisper transcription so the Groq API key stays
// server-side. Only signed-in app users can call it (the JWT is verified).
//
// Deploy:  supabase functions deploy transcribe
// Secret:  supabase secrets set GROQ_API_KEY=gsk_...
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const STT_MODEL = Deno.env.get('GROQ_STT_MODEL') ?? 'whisper-large-v3';

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Niet ingelogd.' }, 401);

    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) return json({ error: 'GROQ_API_KEY niet ingesteld op de server.' }, 500);

    const inForm = await req.formData();
    const file = inForm.get('file');
    const language = (inForm.get('language') as string) || 'de';
    if (!(file instanceof File)) return json({ error: 'Geen audio ontvangen.' }, 400);

    const outForm = new FormData();
    outForm.append('file', file, file.name || 'speech.m4a');
    outForm.append('model', STT_MODEL);
    outForm.append('language', language);
    outForm.append('response_format', 'json');
    outForm.append('temperature', '0');

    const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: outForm,
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data?.error?.message || `Groq-fout (${res.status})` }, res.status);
    return json(data, 200);
  } catch (e) {
    return json({ error: (e as Error)?.message ?? String(e) }, 500);
  }
});
