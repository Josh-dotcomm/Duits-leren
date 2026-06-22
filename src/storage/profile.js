import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultProfile } from '../config/businessContext';

// Local persistence for the user profile (name / company / role) and the
// chosen TTS voices. Kept separate from the knowledge base.
const PROFILE_KEY = '@bgc/profile';
const VOICES_KEY = '@bgc/voicePrefs';

export async function loadProfile() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : { ...defaultProfile };
  } catch (_) {
    return { ...defaultProfile };
  }
}

export async function saveProfile(profile) {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile ?? {}));
    return true;
  } catch (_) {
    return false;
  }
}

// Voice preferences: { nl: <voiceIdentifier|undefined>, de: <voiceIdentifier|undefined> }.
export async function loadVoicePrefs() {
  try {
    const raw = await AsyncStorage.getItem(VOICES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

export async function saveVoicePrefs(prefs) {
  try {
    await AsyncStorage.setItem(VOICES_KEY, JSON.stringify(prefs ?? {}));
    return true;
  } catch (_) {
    return false;
  }
}
