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

// Lets stopSpeaking() cancel an in-flight sequence: each speakSequence claims the
// current token; stopSpeaking() bumps it so the running sequence sees a mismatch
// and stops before starting the next part (instead of rolling on to the reply).
let activeToken = 0;

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
  const token = ++activeToken;
  await setModeForPlayback();

  // Enhanced/high-quality device voices when available (falls back to default).
  const voices = await getPreferredVoices();

  const speakPart = async (text, options, stage) => {
    if (token !== activeToken) return; // cancelled by stopSpeaking()
    if (!text || !text.trim()) return;
    onStage?.(stage);
    await speakAsync(text, options);
  };

  await speakPart(
    feedbackDutch,
    { language: 'nl-NL', voice: voices.nl, rate: 1.0, pitch: 1.0 },
    'feedback_dutch'
  );
  await speakPart(
    feedbackGermanExample,
    { language: 'de-DE', voice: voices.de, rate: 0.95, pitch: 1.0 },
    'feedback_german_example'
  );
  await speakPart(
    reply,
    { language: 'de-DE', voice: voices.de, rate: 0.95, pitch: 1.0 },
    'reply'
  );
}

// Stop the current utterance and cancel any remaining parts of the sequence.
export function stopSpeaking() {
  activeToken++;
  Speech.stop();
}
