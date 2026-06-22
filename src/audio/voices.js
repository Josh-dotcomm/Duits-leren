import * as Speech from 'expo-speech';

// Auto-picked best voices (cached after first device query) and the user's
// manual overrides chosen on the Profiel tab.
let autoCache = null;
let overrides = {}; // { nl?: identifier, de?: identifier }

// Set by App from persisted preferences, and by the Profiel tab when changed.
export function setVoicePreferences(prefs) {
  overrides = { ...(prefs || {}) };
}

export async function listVoices() {
  try {
    return await Speech.getAvailableVoicesAsync();
  } catch (_) {
    return [];
  }
}

// All installed voices grouped by the two languages we use.
export async function getVoicesByLanguage() {
  const all = await listVoices();
  return {
    nl: all.filter((v) => (v.language || '').toLowerCase().startsWith('nl')),
    de: all.filter((v) => (v.language || '').toLowerCase().startsWith('de')),
  };
}

// Returns { nl, de } voice identifiers used for playback. A user override wins
// per language; otherwise we fall back to the auto-selected best voice (or
// undefined, which lets expo-speech use the OS default for that language).
export async function getPreferredVoices() {
  if (!autoCache) {
    const all = await listVoices();
    autoCache = {
      nl: pickBest(all, 'nl', 'nl-NL'),
      de: pickBest(all, 'de', 'de-DE'),
    };
  }
  return {
    nl: overrides.nl || autoCache.nl,
    de: overrides.de || autoCache.de,
  };
}

// Score candidates: prefer (1) enhanced/premium quality and (2) the exact
// regional locale (nl-NL over nl-BE, de-DE over de-AT). Returns the identifier.
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
