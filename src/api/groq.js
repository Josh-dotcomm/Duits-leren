// ---------------------------------------------------------------------------
// Groq integration: Whisper STT + chat completion. Two modes:
//
// - Proxy (default, used by the APK): no client key, so calls go through the
//   Supabase Edge Functions 'transcribe' and 'chat', which hold the Groq key
//   server-side. The key is therefore never shipped in the app and cannot be
//   extracted from the bundle and abused.
// - Direct (local dev only): if EXPO_PUBLIC_GROQ_API_KEY is set in a local .env,
//   the app talks to Groq directly. That key stays on your machine, never in git
//   or the APK.
// Docs: https://console.groq.com/docs
// ---------------------------------------------------------------------------

import { GROQ_API_KEY } from '../config/secrets';
import { supabase } from './supabase';

const GROQ_BASE = 'https://api.groq.com/openai/v1';

// Direct-mode model settings (proxy mode decides these server-side instead).
const STT_MODEL = process.env.EXPO_PUBLIC_GROQ_STT_MODEL || 'whisper-large-v3';
const LLM_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || 'openai/gpt-oss-120b';
// reasoning_effort for gpt-oss ('low' | 'medium' | 'high'). 'low' keeps token use
// far under the free per-minute limit (TPM) while staying accurate for short
// spoken-sentence corrections. Raise via EXPO_PUBLIC_GROQ_REASONING only if you
// have headroom (then raise max_tokens too).
const REASONING_EFFORT = process.env.EXPO_PUBLIC_GROQ_REASONING || 'low';

function hasClientKey() {
  const k = GROQ_API_KEY;
  return !!k && k !== 'PASTE_YOUR_GROQ_KEY_HERE' && k !== 'your_groq_api_key_here';
}

// Pull a readable message out of a Supabase Functions error.
async function readFnError(error) {
  try {
    if (error?.context && typeof error.context.json === 'function') {
      const b = await error.context.json();
      if (b?.error) {
        return typeof b.error === 'string' ? b.error : b.error.message || JSON.stringify(b.error);
      }
    }
  } catch (_) {
    /* fall through */
  }
  return error?.message || 'onbekende fout';
}

// Transcribe a recorded audio file (local file:// URI) to text.
// `language` biases Whisper: 'de' for the German call, 'nl' for Dutch dictation.
export async function transcribeAudio(uri, { language = 'de' } = {}) {
  const form = new FormData();
  // React Native FormData accepts a { uri, name, type } file descriptor.
  form.append('file', { uri, name: 'speech.m4a', type: 'audio/m4a' });
  form.append('language', language);

  // Proxy mode: hand the audio to the Edge Function (Groq key stays server-side).
  if (!hasClientKey()) {
    const { data, error } = await supabase.functions.invoke('transcribe', { body: form });
    if (error) throw new Error(`Transcriptie mislukt: ${await readFnError(error)}`);
    return (data?.text || '').trim();
  }

  // Direct mode (local dev with a key).
  form.append('model', STT_MODEL);
  form.append('response_format', 'json');
  form.append('temperature', '0');
  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getApiKey()}` },
    body: form,
  });
  if (!res.ok) {
    const detail = await safeError(res);
    throw new Error(`Whisper-transcriptie mislukt (${res.status}): ${detail}`);
  }
  const data = await res.json();
  return (data.text || '').trim();
}

// Send the conversation to the LLM and get back
// { feedback_dutch, feedback_german_example, reply }.
export async function chatComplete(messages) {
  // Proxy mode: the Edge Function picks the model and holds the key.
  if (!hasClientKey()) {
    const { data, error } = await supabase.functions.invoke('chat', { body: { messages } });
    if (error) throw new Error(`LLM-aanvraag mislukt: ${await readFnError(error)}`);
    const content = data?.choices?.[0]?.message?.content ?? '';
    return parseStructuredResponse(content);
  }

  // Direct mode (local dev with a key).
  const body = {
    model: LLM_MODEL,
    messages,
    temperature: 0.3,
    // Small cap: with low reasoning the answer is short, and a big cap would
    // reserve tokens against the free per-minute limit for no reason.
    max_tokens: 1024,
    response_format: { type: 'json_object' },
  };
  if (LLM_MODEL.includes('gpt-oss')) {
    body.reasoning_effort = REASONING_EFFORT;
  }
  const res = await fetchWithRetry(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getApiKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await safeError(res);
    throw new Error(`LLM-aanvraag mislukt (${res.status}): ${detail}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  return parseStructuredResponse(content);
}

function getApiKey() {
  if (!hasClientKey()) {
    throw new Error(
      'Geen Groq-sleutel en geen proxy beschikbaar. Deploy de Supabase Edge Functions, of zet EXPO_PUBLIC_GROQ_API_KEY in .env voor lokaal testen.'
    );
  }
  return GROQ_API_KEY;
}

// Robustly turn the model output into { feedback_dutch, feedback_german_example,
// reply }, even if the model wraps the JSON in stray text.
function parseStructuredResponse(content) {
  const empty = { feedback_dutch: '', feedback_german_example: '', reply: '' };
  if (!content) return empty;

  try {
    return normalize(JSON.parse(content));
  } catch (_) {
    // Try to salvage the first {...} block.
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return normalize(JSON.parse(content.slice(start, end + 1)));
      } catch (_) {
        /* fall through */
      }
    }
    // Last resort: treat the whole thing as the spoken (German) reply.
    return { ...empty, reply: content.trim() };
  }
}

function normalize(obj) {
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  return {
    feedback_dutch: str(obj.feedback_dutch),
    feedback_german_example: str(obj.feedback_german_example),
    reply: str(obj.reply),
  };
}

async function safeError(res) {
  try {
    const body = await res.json();
    return body?.error?.message || JSON.stringify(body);
  } catch (_) {
    return res.statusText || 'onbekende fout';
  }
}

// Retries on 429 (per-minute rate limit), waiting the server-suggested time (or a
// short backoff) so a busy minute does not surface as an error.
async function fetchWithRetry(url, options, retries = 2) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429 || attempt >= retries) return res;
    const headerWait = Number(res.headers.get('retry-after'));
    const waitMs = Math.min(headerWait || (attempt + 1) * 4, 15) * 1000;
    await new Promise((r) => setTimeout(r, waitMs));
  }
}
