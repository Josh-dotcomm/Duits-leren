import * as Speech from 'expo-speech';
import { setModeForPlayback } from './audioMode';
import { getPreferredVoices } from './voices';

// Speak a single utterance and resolve when it finishes (or errors/stops).
function speakAsync(text, options = {}) {
  return new Promise((resolve) => {
    if (!text || !text.trim()) {
      resolve();
      return;
    }
    Speech.speak(text, {
      ...options,
      onDone: resolve,
      onStopped: resolve,
      onError: () => resolve(),
    });
  });
}

// Plays the three response parts sequentially, switching the TTS voice/engine
// per language so German is never read by a Dutch voice (or vice versa):
//   1. feedback_dutch          -> nl-NL voice
//   2. feedback_german_example -> de-DE voice
//   3. reply                   -> de-DE voice
// `onStage` reports which part is currently being spoken.
export async function speakSequence(
  { feedbackDutch, feedbackGermanExample, reply },
  { onStage } = {}
) {
  Speech.stop();
  await setModeForPlayback();

  // Enhanced/high-quality device voices when available (falls back to default).
  const voices = await getPreferredVoices();

  if (feedbackDutch && feedbackDutch.trim()) {
    onStage?.('feedback_dutch');
    await speakAsync(feedbackDutch, {
      language: 'nl-NL',
      voice: voices.nl,
      rate: 1.0,
      pitch: 1.0,
    });
  }

  if (feedbackGermanExample && feedbackGermanExample.trim()) {
    onStage?.('feedback_german_example');
    await speakAsync(feedbackGermanExample, {
      language: 'de-DE',
      voice: voices.de,
      rate: 0.95,
      pitch: 1.0,
    });
  }

  if (reply && reply.trim()) {
    onStage?.('reply');
    await speakAsync(reply, {
      language: 'de-DE',
      voice: voices.de,
      rate: 0.95,
      pitch: 1.0,
    });
  }
}

export function stopSpeaking() {
  Speech.stop();
}
