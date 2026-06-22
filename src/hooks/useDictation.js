import { useCallback, useRef, useState } from 'react';
import { startRecording, stopRecording } from '../audio/recorder';
import { transcribeAudio } from '../api/groq';
import { stopSpeaking } from '../audio/speech';

// Reusable "dictate into a text field" toggle: tap to start, tap to stop, then
// the transcript (Groq Whisper) is handed to `onText`. Used by the Kennisbank.
export const DICT_STATUS = {
  IDLE: 'idle',
  RECORDING: 'recording',
  TRANSCRIBING: 'transcribing',
  ERROR: 'error',
};

export function useDictation({ language = 'nl', onText }) {
  const [status, setStatus] = useState(DICT_STATUS.IDLE);
  const [error, setError] = useState(null);
  const processingRef = useRef(false);

  const finish = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      setStatus(DICT_STATUS.TRANSCRIBING);
      const uri = await stopRecording();
      if (!uri) {
        setStatus(DICT_STATUS.IDLE);
        return;
      }
      const text = await transcribeAudio(uri, { language });
      if (text) onText?.(text);
      setStatus(DICT_STATUS.IDLE);
    } catch (e) {
      setError(e.message);
      setStatus(DICT_STATUS.ERROR);
    } finally {
      processingRef.current = false;
    }
  }, [language, onText]);

  const toggle = useCallback(() => {
    if (status === DICT_STATUS.RECORDING) {
      finish();
    } else if (status === DICT_STATUS.IDLE || status === DICT_STATUS.ERROR) {
      (async () => {
        try {
          setError(null);
          stopSpeaking();
          setStatus(DICT_STATUS.RECORDING);
          await startRecording();
        } catch (e) {
          setError(e.message);
          setStatus(DICT_STATUS.ERROR);
        }
      })();
    }
  }, [status, finish]);

  return {
    status,
    error,
    toggle,
    isRecording: status === DICT_STATUS.RECORDING,
    isTranscribing: status === DICT_STATUS.TRANSCRIBING,
  };
}
