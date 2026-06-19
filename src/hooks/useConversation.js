import { useCallback, useMemo, useRef, useState } from 'react';
import { startRecording, stopRecording } from '../audio/recorder';
import { transcribeAudio, chatComplete } from '../api/groq';
import { speakFeedbackThenReply, stopSpeaking } from '../audio/speech';
import { buildSystemPrompt } from '../config/prompts';
import { businessContext } from '../config/businessContext';
import {
  appendUserTurn,
  appendAssistantTurn,
  buildMessages,
} from '../state/conversationStore';

// Phases of the "phone call" loop.
export const STATUS = {
  IDLE: 'idle',
  RECORDING: 'recording',
  TRANSCRIBING: 'transcribing',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

let turnCounter = 0;

export function useConversation(context = businessContext) {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [turns, setTurns] = useState([]); // [{ id, you, reply, feedback }]
  const [error, setError] = useState(null);

  // History sent to the LLM (kept in a ref so callbacks stay stable).
  const historyRef = useRef([]);
  const systemPrompt = useMemo(() => buildSystemPrompt(context), [context]);

  const begin = useCallback(async () => {
    try {
      setError(null);
      stopSpeaking();
      setStatus(STATUS.RECORDING);
      await startRecording();
    } catch (e) {
      setError(e.message);
      setStatus(STATUS.ERROR);
    }
  }, []);

  const end = useCallback(async () => {
    try {
      setStatus(STATUS.TRANSCRIBING);
      const uri = await stopRecording();
      if (!uri) {
        setStatus(STATUS.IDLE);
        return;
      }

      // 1) Speech-to-text (Groq Whisper).
      const youText = await transcribeAudio(uri);
      if (!youText) {
        setStatus(STATUS.IDLE);
        return;
      }

      // Show what you said immediately (optimistic).
      const id = ++turnCounter;
      setTurns((prev) => [...prev, { id, you: youText, reply: '', feedback: '', done: false }]);

      // 2) LLM (Groq Llama) -> { feedback, reply }.
      setStatus(STATUS.THINKING);
      historyRef.current = appendUserTurn(historyRef.current, youText);
      const messages = buildMessages(systemPrompt, historyRef.current);
      const { feedback, reply } = await chatComplete(messages);

      historyRef.current = appendAssistantTurn(historyRef.current, reply);
      setTurns((prev) =>
        prev.map((t) => (t.id === id ? { ...t, reply, feedback, done: true } : t))
      );

      // 3) Text-to-speech: Dutch feedback first, then German reply.
      setStatus(STATUS.SPEAKING);
      await speakFeedbackThenReply(feedback, reply);
      setStatus(STATUS.IDLE);
    } catch (e) {
      setError(e.message);
      setStatus(STATUS.ERROR);
    }
  }, [systemPrompt]);

  // Tap the call button: toggles between starting and stopping a turn.
  const toggle = useCallback(() => {
    if (status === STATUS.RECORDING) {
      end();
    } else if (status === STATUS.IDLE || status === STATUS.ERROR) {
      begin();
    }
    // While transcribing/thinking/speaking, taps are ignored (busy).
  }, [status, begin, end]);

  // Replay a previous turn's audio (feedback + reply).
  const replay = useCallback((turn) => {
    if (!turn) return;
    setStatus(STATUS.SPEAKING);
    speakFeedbackThenReply(turn.feedback, turn.reply).finally(() =>
      setStatus(STATUS.IDLE)
    );
  }, []);

  const reset = useCallback(() => {
    stopSpeaking();
    historyRef.current = [];
    setTurns([]);
    setError(null);
    setStatus(STATUS.IDLE);
  }, []);

  const isBusy =
    status === STATUS.TRANSCRIBING ||
    status === STATUS.THINKING ||
    status === STATUS.SPEAKING;

  return { status, turns, error, isBusy, begin, end, toggle, replay, reset };
}
