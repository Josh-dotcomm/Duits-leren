import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

// Shared audio-session settings.
//
// NOTE on background audio: `staysActiveInBackground` is false here because this
// build targets Expo Go, which cannot keep the mic/audio alive on a locked
// screen. To enable true background audio, build a custom dev client
// (`npx expo run:ios` / `run:android` or EAS), then set this to `true`; the
// iOS UIBackgroundModes and Android foreground-service entries are already
// declared in app.json. See the README "Background audio" section.
const base = {
  staysActiveInBackground: false,
  playsInSilentModeIOS: true,
  interruptionModeIOS: InterruptionModeIOS.DoNotMix,
  interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
};

// iOS lowers playback volume and routes to the earpiece while
// `allowsRecordingIOS` is true, so we toggle it per phase: record vs. speak.
export function setModeForRecording() {
  return Audio.setAudioModeAsync({ ...base, allowsRecordingIOS: true });
}

export function setModeForPlayback() {
  return Audio.setAudioModeAsync({ ...base, allowsRecordingIOS: false });
}
