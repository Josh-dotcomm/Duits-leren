import { Audio } from 'expo-av';
import { setModeForRecording } from './audioMode';

// Single in-flight recording. expo-av allows only one active recording at a time.
let activeRecording = null;

// HIGH_QUALITY gives an .m4a (AAC) on both platforms; metering is enabled so the
// hands-free mode can detect when the speaker goes quiet.
const RECORDING_OPTIONS = {
  ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

export async function requestMicPermission() {
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}

// Start capturing microphone audio. When `onSilence` is provided (hands-free
// mode) it fires once after the speaker has talked and then stayed quiet for
// `silenceMs`. `thresholdDb` is the dBFS level below which audio counts as
// silence; raise it (for example -30) in noisy places like a moving car.
export async function startRecording({
  onSilence,
  silenceMs = 2500,
  thresholdDb = -40,
  maxMs = 30000,
} = {}) {
  if (activeRecording) {
    // Defensive: clean up a leftover recording before starting a new one.
    await stopRecording().catch(() => {});
  }

  const granted = await requestMicPermission();
  if (!granted) {
    throw new Error('Microfoon-toestemming geweigerd. Sta de microfoon toe in de instellingen.');
  }

  await setModeForRecording();

  const onStatus = onSilence
    ? makeSilenceDetector(onSilence, silenceMs, thresholdDb, maxMs)
    : undefined;

  const { recording } = await Audio.Recording.createAsync(
    RECORDING_OPTIONS,
    onStatus,
    onStatus ? 150 : undefined
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

// Builds a recording-status handler that calls onSilence exactly once: after the
// user has actually spoken (level above the threshold) and then been quiet for
// `silenceMs`, or after a hard `maxMs` safety cap.
function makeSilenceDetector(onSilence, silenceMs, thresholdDb, maxMs) {
  const start = Date.now();
  let lastLoud = start;
  let spoke = false;
  let fired = false;
  return (status) => {
    if (fired || !status?.isRecording) return;
    const now = Date.now();
    const level = typeof status.metering === 'number' ? status.metering : -160;
    if (level > thresholdDb) {
      lastLoud = now;
      spoke = true;
    }
    const quietLongEnough = spoke && now - lastLoud >= silenceMs;
    const tooLong = now - start >= maxMs;
    if (quietLongEnough || tooLong) {
      fired = true;
      onSilence();
    }
  };
}
