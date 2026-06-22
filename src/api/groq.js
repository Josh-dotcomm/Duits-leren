// ---------------------------------------------------------------------------
// Groq API integration (free tier): Whisper STT + chat completion.
// Docs: https://console.groq.com/docs
// ---------------------------------------------------------------------------

import { GROQ_API_KEY } from '../config/secrets';

const GROQ_BASE = 'https://api.groq.com/openai/v1';

// STT model. whisper-large-v3 is the most accurate; swap to
// 'whisper-large-v3-turbo' for lower latency. Override with EXPO_PUBLIC_GROQ_STT_MODEL.
const STT_MODEL = process.env.EXPO_PUBLIC_GROQ_STT_MODEL || 'whisper-large-v3';

// LLM. openai/gpt-oss-120b reasons internally before it answers, which makes it
// markedly better at catching and self-correcting German grammar than the older
// Llama models. Override with EXPO_PUBLIC_GROQ_MODEL (e.g. 'llama-3.3-70b-versatile'
// for lower latency, or 'llama-3.1-8b-instant' for maximum speed).
const LLM_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || 'openai/gpt-oss-120b';

// gpt-oss models accept reasoning_effort ('low' | 'medium' | 'high'). 'high'
// gives the most accurate, self-checked grammar corrections (the feedback loop is
// the whole point), at the cost of some latency. Lower it via EXPO_PUBLIC_GROQ_REASONING.
const REASONING_EFFORT = process.env.EXPO_PUBLIC_GROQ_REASONING || 'high';

function getApiKey() {
  const key = GROQ_API_KEY;
  if (!key || key === 'PASTE_YOUR_GROQ_KEY_HERE' || key === 'your_groq_api_key_here') {
    throw new Error(
      'Geen Groq API-sleutel gevonden. Vul GROQ_API_KEY in src/config/secrets.js in, of zet EXPO_PUBLIC_GROQ_API_KEY in .env.'
    );
  }
  return key;
}

// Transcribe a recorded audio file (local file:// URI) to text.
// `language` biases Whisper: 'de' for the German call, 'nl' for Dutch dictation.
export async function transcribeAudio(uri, { language = 'de' } = {}) {
  const apiKey = getApiKey();

  const form = new FormData();
  // React Native FormData accepts a { uri, name, type } file descriptor.
  form.append('file', {
    uri,
    name: 'speech.m4a',
    type: 'audio/m4a',
  });
  form.append('model', STT_MODEL);
  form.append('language', language);
  form.append('response_format', 'json');
  form.append('temperature', '0');

  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      // NB: do NOT set Content-Type; fetch adds the multipart boundary itself.
    },
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
  const apiKey = getApiKey();

  // Reasoning models (gpt-oss) spend completion tokens on internal reasoning, so
  // give the response generous headroom and pass reasoning_effort for those models.
  const body = {
    model: LLM_MODEL,
    messages,
    temperature: 0.3,
    // High enough that internal reasoning (gpt-oss) never truncates the JSON answer.
    max_tokens: 4096,
    // Forces strict JSON output that matches our 3-key contract.
    response_format: { type: 'json_object' },
  };
  if (LLM_MODEL.includes('gpt-oss')) {
    body.reasoning_effort = REASONING_EFFORT;
  }

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
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
