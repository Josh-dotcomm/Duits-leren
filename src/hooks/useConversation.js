import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { startRecording, stopRecording } from '../audio/recorder';
import { transcribeAudio, chatComplete } from '../api/groq';
import { speakSequence, stopSpeaking } from '../audio/speech';
import { buildSystemPrompt } from '../config/prompts';
import { defaultProfile } from '../config/businessContext';
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

// Hands-free tuning. SILENCE_MS = how long the speaker must be quiet before we
// auto-send; SILENCE_THRESHOLD_DB = the dBFS level below which audio counts as
// silence (raise toward -30 for a noisy car); RESUME_DELAY_MS = small pause after
// the AI finishes talking before the mic reopens, so it does not catch the tail.
const SILENCE_MS = 2500;
const SILENCE_THRESHOLD_DB = -40;
const RESUME_DELAY_MS = 500;

let turnCounter = 0;

// `setup` = { scenario, persona, knowledgeBaseText, profile, dictionary } from the app.
export function useConversation(setup) {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [turns, setTurns] = useState([]); // [{ id, you, feedbackDutch, feedbackGermanExample, reply, done }]
  const [error, setError] = useState(null);
  const [handsFree, setHandsFreeState] = useState(true); // hands-free conversation (car mode)
  const [sessionActive, setSessionActiveState] = useState(false); // hands-free loop running

  const historyRef = useRef([]);
  const processingRef = useRef(false); // ensures a recording is processed exactly once
  const handsFreeRef = useRef(true); // mirror for use inside callbacks
  const sessionRef = useRef(false); // mirror for use inside callbacks
  const startRecRef = useRef(null); // latest startRec, for use in timers/handlers
  const processRef = useRef(null); // latest processRecording

  const setSession = useCallback((val) => {
    sessionRef.current = val;
    setSessionActiveState(val);
  }, []);

  const systemPrompt = useMemo(
    () =>
      buildSystemPrompt({
        scenario: setup.scenario,
        persona: setup.persona,
        knowledgeBaseText: setup.knowledgeBaseText,
        learner: setup.profile || defaultProfile,
        dictionary: setup.dictionary || [],
      }),
    [setup.scenario, setup.persona, setup.knowledgeBaseText, setup.profile, setup.dictionary]
  );

  // stop recording -> transcribe -> LLM -> speak. Runs at most once per turn.
  const processRecording = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      setStatus(STATUS.TRANSCRIBING);
      const uri = await stopRecording();

      // Resume listening (hands-free) if nothing usable was captured.
      if (!uri) {
        processingRef.current = false;
        if (sessionRef.current) startRecRef.current?.(true);
        else setStatus(STATUS.IDLE);
        return;
      }

      // 1) Speech-to-text (Groq Whisper, German).
      const youText = await transcribeAudio(uri, { language: 'de' });
      if (!youText) {
        processingRef.current = false;
        if (sessionRef.current) startRecRef.current?.(true);
        else setStatus(STATUS.IDLE);
        return;
      }

      // Show what you said immediately (optimistic).
      const id = ++turnCounter;
      setTurns((prev) => [
        ...prev,
        { id, you: youText, feedbackDutch: '', feedbackGermanExample: '', reply: '', done: false },
      ]);

      // 2) LLM (Groq) -> { feedback_dutch, feedback_german_example, reply }.
      setStatus(STATUS.THINKING);
      historyRef.current = appendUserTurn(historyRef.current, youText);
      const messages = buildMessages(systemPrompt, historyRef.current);
      const res = await chatComplete(messages);
      const { feedback_dutch: feedbackDutch, feedback_german_example: feedbackGermanExample, reply } = res;

      historyRef.current = appendAssistantTurn(historyRef.current, reply);
      setTurns((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, feedbackDutch, feedbackGermanExample, reply, done: true } : t
        )
      );

      // 3) Text-to-speech: NL feedback -> DE example -> DE reply (per-voice).
      setStatus(STATUS.SPEAKING);
      await speakSequence({ feedbackDutch, feedbackGermanExample, reply });

      // Hands-free: after the AI finishes, reopen the mic for the next turn.
      processingRef.current = false;
      if (sessionRef.current) {
        setTimeout(() => {
          if (sessionRef.current) startRecRef.current?.(true);
        }, RESUME_DELAY_MS);
      } else {
        setStatus(STATUS.IDLE);
      }
      return;
    } catch (e) {
      setError(e.message);
      setStatus(STATUS.ERROR);
      setSession(false); // stop the loop on a hard error
    } finally {
      processingRef.current = false;
    }
  }, [systemPrompt, setSession]);

  // Begin a recording. `auto` enables silence detection (hands-free auto-send).
  const startRec = useCallback(async (auto) => {
    try {
      setError(null);
      stopSpeaking();
      setStatus(STATUS.RECORDING);
      await startRecording(
        auto
          ? {
              onSilence: () => processRef.current?.(),
              silenceMs: SILENCE_MS,
              thresholdDb: SILENCE_THRESHOLD_DB,
            }
          : {}
      );
    } catch (e) {
      setError(e.message);
      setStatus(STATUS.ERROR);
      setSession(false);
    }
  }, [setSession]);

  // Keep refs pointed at the latest callbacks for use in timers/handlers.
  useEffect(() => {
    processRef.current = processRecording;
  }, [processRecording]);
  useEffect(() => {
    startRecRef.current = startRec;
  }, [startRec]);

  const setHandsFree = useCallback(
    (val) => {
      setHandsFreeState(val);
      handsFreeRef.current = val;
      if (!val) {
        // Turning hands-free off ends any running loop and returns to manual.
        setSession(false);
        stopSpeaking();
        stopRecording().catch(() => {});
        setStatus(STATUS.IDLE);
      }
    },
    [setSession]
  );

  // The mic button.
  const toggleRecording = useCallback(() => {
    if (handsFreeRef.current) {
      if (status === STATUS.RECORDING) {
        processRecording(); // "I'm done", send now instead of waiting for silence
      } else if (status === STATUS.IDLE || status === STATUS.ERROR) {
        setSession(true);
        startRec(true); // start the hands-free listening loop
      }
      // SPEAKING is handled by stopPlayback; TRANSCRIBING/THINKING are ignored.
      return;
    }
    // Manual mode: tap to start, tap again to stop and send.
    if (status === STATUS.RECORDING) processRecording();
    else if (status === STATUS.IDLE || status === STATUS.ERROR) startRec(false);
  }, [status, processRecording, startRec, setSession]);

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
    setSession(false);
    stopSpeaking();
    stopRecording().catch(() => {});
    historyRef.current = [];
    setTurns([]);
    setError(null);
    setStatus(STATUS.IDLE);
  }, [setSession]);

  // Interrupt playback (red stop button). In hands-free this means "let me talk":
  // stop the AI and reopen the mic. In manual mode it just stops and idles.
  const stopPlayback = useCallback(() => {
    stopSpeaking();
    if (handsFreeRef.current && sessionRef.current) {
      setTimeout(() => {
        if (sessionRef.current) startRecRef.current?.(true);
      }, 150);
    } else {
      setStatus(STATUS.IDLE);
    }
  }, []);

  const isBusy =
    status === STATUS.TRANSCRIBING ||
    status === STATUS.THINKING ||
    status === STATUS.SPEAKING;

  return {
    status,
    turns,
    error,
    isBusy,
    handsFree,
    handsFreeActive: sessionActive,
    toggleRecording,
    stopPlayback,
    replay,
    reset,
    setHandsFree,
  };
}
