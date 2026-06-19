import { useCallback, useMemo, useRef, useState } from 'react';
import { startRecording, stopRecording, isRecording } from '../audio/recorder';
import { transcribeAudio, chatComplete } from '../api/groq';
import { speakSequence, stopSpeaking } from '../audio/speech';
import { buildSystemPrompt } from '../config/prompts';
import { learnerProfile } from '../config/businessContext';
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

// `setup` = { scenario, persona } chosen on the Setup screen.
export function useConversation(setup) {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [turns, setTurns] = useState([]); // [{ id, you, feedbackDutch, feedbackGermanExample, reply, done }]
  const [error, setError] = useState(null);

  const historyRef = useRef([]);
  const releasedRef = useRef(false); // push-to-talk: did the user release before recording started?
  const processingRef = useRef(false); // ensures a recording is processed exactly once

  const systemPrompt = useMemo(
    () =>
      buildSystemPrompt({
        scenario: setup.scenario,
        persona: setup.persona,
        learner: learnerProfile,
      }),
    [setup.scenario, setup.persona]
  );

  // stop recording -> transcribe -> LLM -> speak. Runs at most once per turn.
  const processRecording = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
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
      setTurns((prev) => [
        ...prev,
        { id, you: youText, feedbackDutch: '', feedbackGermanExample: '', reply: '', done: false },
      ]);

      // 2) LLM (Groq Llama) -> { feedback_dutch, feedback_german_example, reply }.
      setStatus(STATUS.THINKING);
      historyRef.current = appendUserTurn(historyRef.current, youText);
      const messages = buildMessages(systemPrompt, historyRef.current);
      const res = await chatComplete(messages);
      const feedbackDutch = res.feedback_dutch;
      const feedbackGermanExample = res.feedback_german_example;
      const reply = res.reply;

      historyRef.current = appendAssistantTurn(historyRef.current, reply);
      setTurns((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, feedbackDutch, feedbackGermanExample, reply, done: true }
            : t
        )
      );

      // 3) Text-to-speech: NL feedback -> DE example -> DE reply (per-voice).
      setStatus(STATUS.SPEAKING);
      await speakSequence({ feedbackDutch, feedbackGermanExample, reply });
      setStatus(STATUS.IDLE);
    } catch (e) {
      setError(e.message);
      setStatus(STATUS.ERROR);
    } finally {
      processingRef.current = false;
    }
  }, [systemPrompt]);

  // Push-to-talk: press-in -> start recording.
  const startTalking = useCallback(async () => {
    try {
      setError(null);
      stopSpeaking();
      releasedRef.current = false;
      setStatus(STATUS.RECORDING);
      await startRecording();
      // If the user already released while the recorder was starting, send now.
      if (releasedRef.current) {
        await processRecording();
      }
    } catch (e) {
      setError(e.message);
      setStatus(STATUS.ERROR);
    }
  }, [processRecording]);

  // Push-to-talk: press-out (release) -> stop and auto-send.
  const stopTalking = useCallback(() => {
    releasedRef.current = true;
    // Only send if recording actually started; otherwise startTalking handles it.
    if (isRecording()) {
      processRecording();
    }
  }, [processRecording]);

  // Replay a previous turn's audio (NL feedback -> DE example -> DE reply).
  const replay = useCallback((turn) => {
    if (!turn) return;
    setStatus(STATUS.SPEAKING);
    speakSequence({
      feedbackDutch: turn.feedbackDutch,
      feedbackGermanExample: turn.feedbackGermanExample,
      reply: turn.reply,
    }).finally(() => setStatus(STATUS.IDLE));
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

  return { status, turns, error, isBusy, startTalking, stopTalking, replay, reset };
}
