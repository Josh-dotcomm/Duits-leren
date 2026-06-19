// ---------------------------------------------------------------------------
// Groq API integration (free tier): Whisper STT + Llama chat completion.
// Docs: https://console.groq.com/docs
// ---------------------------------------------------------------------------

const GROQ_BASE = 'https://api.groq.com/openai/v1';

// STT model. whisper-large-v3 is the most accurate for German; swap to
// 'whisper-large-v3-turbo' for lower latency if you prefer speed over accuracy.
const STT_MODEL = 'whisper-large-v3';

// LLM. 70b-versatile gives the best grammar/culture corrections and is still
// very fast on Groq. For maximum speed (at some quality cost) use
// 'llama-3.1-8b-instant'.
const LLM_MODEL = 'llama-3.3-70b-versatile';

function getApiKey() {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!key || key === 'your_groq_api_key_here') {
    throw new Error(
      'Geen Groq API-sleutel gevonden. Maak een ".env" met EXPO_PUBLIC_GROQ_API_KEY en herstart de server.'
    );
  }
  return key;
}

// Transcribe a recorded audio file (local file:// URI) to German text.
export async function transcribeAudio(uri) {
  const apiKey = getApiKey();

  const form = new FormData();
  // React Native FormData accepts a { uri, name, type } file descriptor.
  form.append('file', {
    uri,
    name: 'speech.m4a',
    type: 'audio/m4a',
  });
  form.append('model', STT_MODEL);
  form.append('language', 'de'); // bias Whisper towards German
  form.append('response_format', 'json');
  form.append('temperature', '0');

  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      // NB: do NOT set Content-Type — fetch adds the multipart boundary itself.
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

// Send the conversation to the LLM and get back { feedback, reply }.
export async function chatComplete(messages) {
  const apiKey = getApiKey();

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 700,
      // Forces strict JSON output that matches our { feedback, reply } contract.
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const detail = await safeError(res);
    throw new Error(`LLM-aanvraag mislukt (${res.status}): ${detail}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  return parseDualResponse(content);
}

// Robustly turn the model output into { feedback, reply }, even if the model
// wraps the JSON in stray text.
function parseDualResponse(content) {
  const fallback = { feedback: '', reply: '' };
  if (!content) return fallback;

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
    // Last resort: treat the whole thing as the spoken reply.
    return { feedback: '', reply: content.trim() };
  }
}

function normalize(obj) {
  return {
    feedback: typeof obj.feedback === 'string' ? obj.feedback.trim() : '',
    reply: typeof obj.reply === 'string' ? obj.reply.trim() : '',
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
