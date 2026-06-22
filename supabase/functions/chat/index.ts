// Edge Function: proxies the Groq chat completion so the Groq API key stays
// server-side. Only signed-in app users can call it (the JWT is verified).
//
// Deploy:  supabase functions deploy chat
// Secret:  supabase secrets set GROQ_API_KEY=gsk_...
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const LLM_MODEL = Deno.env.get('GROQ_MODEL') ?? 'openai/gpt-oss-120b';
const REASONING = Deno.env.get('GROQ_REASONING') ?? 'low';

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Verify the caller is a signed-in user of this project (not the anon key).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Niet ingelogd.' }, 401);

    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) return json({ error: 'GROQ_API_KEY niet ingesteld op de server.' }, 500);

    const { messages } = await req.json();
    if (!Array.isArray(messages)) return json({ error: 'messages ontbreekt.' }, 400);

    const body: Record<string, unknown> = {
      model: LLM_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    };
    if (LLM_MODEL.includes('gpt-oss')) body.reasoning_effort = REASONING;

    // Retry on 429 (per-minute rate limit) instead of failing the turn.
    const payload = JSON.stringify(body);
    let res: Response | undefined;
    for (let attempt = 0; attempt <= 2; attempt++) {
      res = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: payload,
      });
      if (res.status !== 429 || attempt === 2) break;
      const wait = Number(res.headers.get('retry-after')) || (attempt + 1) * 4;
      await new Promise((r) => setTimeout(r, Math.min(wait, 15) * 1000));
    }
    const data = await res!.json();
    if (!res!.ok) return json({ error: data?.error?.message || `Groq-fout (${res!.status})` }, res!.status);
    return json(data, 200);
  } catch (e) {
    return json({ error: (e as Error)?.message ?? String(e) }, 500);
  }
});
