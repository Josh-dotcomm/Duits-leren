import * as Speech from 'expo-speech';
import { setModeForPlayback } from './audioMode';

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

// Core flow: first read the Dutch feedback (if any), THEN the German reply.
// `onStage` lets the UI reflect which part is currently being spoken.
export async function speakFeedbackThenReply(feedback, reply, { onStage } = {}) {
  Speech.stop();
  await setModeForPlayback();

  if (feedback && feedback.trim()) {
    onStage?.('feedback');
    await speakAsync(feedback, { language: 'nl-NL', rate: 1.0, pitch: 1.0 });
  }

  if (reply && reply.trim()) {
    onStage?.('reply');
    // Slightly slower German so the learner can follow the model pronunciation.
    await speakAsync(reply, { language: 'de-DE', rate: 0.95, pitch: 1.0 });
  }
}

export function stopSpeaking() {
  Speech.stop();
}
