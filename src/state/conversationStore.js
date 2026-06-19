// Lightweight helpers for the running conversation history that we send to the
// LLM. We keep history bounded so latency stays low and we stay well within the
// model's context window.

const MAX_MESSAGES = 12; // ~6 exchanges of user + assistant turns

// Append the learner's (German) turn.
export function appendUserTurn(history, germanText) {
  return [...history, { role: 'user', content: germanText }].slice(-MAX_MESSAGES);
}

// Append the partner's German reply ONLY (not the Dutch feedback), so the model
// continues the in-character conversation naturally. Empty replies (e.g. after a
// tutor-mode meta-command) are not added.
export function appendAssistantTurn(history, replyGerman) {
  if (!replyGerman || !replyGerman.trim()) return history;
  return [...history, { role: 'assistant', content: replyGerman }].slice(-MAX_MESSAGES);
}

// Prepend the system prompt to produce the final messages array for Groq.
export function buildMessages(systemPrompt, history) {
  return [{ role: 'system', content: systemPrompt }, ...history];
}
