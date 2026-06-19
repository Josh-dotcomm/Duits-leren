import AsyncStorage from '@react-native-async-storage/async-storage';

// Single local key for the user's pasted company knowledge base. Persists
// between app restarts (and survives Expo Go reloads) on the device.
const KEY = '@bgc/knowledgeBase';

export async function loadKnowledgeBase() {
  try {
    return (await AsyncStorage.getItem(KEY)) ?? '';
  } catch (_) {
    return '';
  }
}

// Returns true on success so the UI can show a confirmation.
export async function saveKnowledgeBase(text) {
  try {
    await AsyncStorage.setItem(KEY, text ?? '');
    return true;
  } catch (_) {
    return false;
  }
}
