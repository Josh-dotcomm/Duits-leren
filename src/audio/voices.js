import * as Speech from 'expo-speech';

// We query the device's installed voices once and cache the best identifier for
// each language, so playback doesn't pay that cost on every utterance.
let cache = null;

// Returns { nl, de } — voice identifiers, or undefined to fall back to the OS
// default for that language.
export async function getPreferredVoices() {
  if (cache) return cache;

  let voices = [];
  try {
    voices = await Speech.getAvailableVoicesAsync();
  } catch (_) {
    voices = [];
  }

  cache = {
    nl: pickBest(voices, 'nl', 'nl-NL'),
    de: pickBest(voices, 'de', 'de-DE'),
  };
  return cache;
}

// Forget the cached selection (e.g. if the user installs new voices).
export function resetVoiceCache() {
  cache = null;
}

// Score candidates so we prefer (1) enhanced/premium quality and (2) the exact
// regional locale (nl-NL over nl-BE, de-DE over de-AT), then return the best
// voice's identifier.
function pickBest(voices, langPrefix, exactLocale) {
  const candidates = (voices || []).filter((v) =>
    (v.language || '').toLowerCase().startsWith(langPrefix)
  );
  if (candidates.length === 0) return undefined;

  const score = (v) => {
    let s = 0;
    if (v.quality === Speech.VoiceQuality.Enhanced) s += 2;
    if ((v.language || '').toLowerCase() === exactLocale.toLowerCase()) s += 1;
    return s;
  };

  candidates.sort((a, b) => score(b) - score(a));
  return candidates[0].identifier;
}
