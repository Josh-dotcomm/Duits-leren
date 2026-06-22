import { Audio } from 'expo-av';
import { setModeForRecording } from './audioMode';

// Single in-flight recording. expo-av allows only one active recording at a time.
let activeRecording = null;

export async function requestMicPermission() {
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}

// Start capturing microphone audio. Resolves once recording is live.
export async function startRecording() {
  if (activeRecording) {
    // Defensive: clean up a leftover recording before starting a new one.
    await stopRecording().catch(() => {});
  }

  const granted = await requestMicPermission();
  if (!granted) {
    throw new Error('Microfoon-toestemming geweigerd. Sta de microfoon toe in de instellingen.');
  }

  await setModeForRecording();

  // HIGH_QUALITY produces an .m4a (AAC) file on both iOS and Android,
  // which matches the audio/m4a upload type we send to Whisper.
  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  activeRecording = recording;
}

// Stop the recording and return the local file URI (or null if nothing recorded).
export async function stopRecording() {
  if (!activeRecording) return null;

  const recording = activeRecording;
  activeRecording = null;

  try {
    await recording.stopAndUnloadAsync();
  } catch (_) {
    // Already stopped/unloaded; ignore.
  }
  return recording.getURI();
}
