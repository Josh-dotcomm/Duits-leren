# Business German Coach 🇩🇪📞

A hands-free, **phone-call-style** language trainer for **Business German**. Before
each call you pick a **scenario** and an **AI persona**; then you hold the mic,
speak German, and on release the app transcribes you, corrects you like a strict
tutor (in Dutch), shows the correct German phrasing, and answers back in character
as your chosen persona — all read aloud with the right voice per language.

Built for Hillco / "Family Chicken" sales conversations, but fully retargetable.

## How it works

```
Setup (scenario + persona)  ──►  injected into the LLM system prompt
        │
You hold the mic and speak (German)
   ─ release ─►  record (expo-av)
   ─►  Groq Whisper                  ─►  German transcript
   ─►  Groq Llama (JSON mode)        ─►  { feedback_dutch, feedback_german_example, reply }
   ─►  expo-speech (per-language)    ─►  NL feedback → DE example → DE reply
```

### Dynamic setup (no hardcoded persona)
The Setup screen has two fields (with tap-to-fill suggestion chips):
- **Scenario** — the goal of the call (e.g. "Bellen over een monsterpakket").
- **AI persona** — who the AI plays (e.g. "Supermarktmanager", "Inkoper", "Poortwachter").

Both are injected into the system prompt; the AI **strictly** stays in that persona
and asks the questions that role would ask for that scenario.

### Push-to-talk (no send button)
The mic button is **hold-to-talk**: press and hold to record, **release to send**.
There is no separate "send" — releasing immediately ships the audio to Whisper.

### Three-field response + per-language TTS
The LLM returns three strings, kept in separate languages on purpose:

| Key                       | Language | Read by | Purpose |
| ------------------------- | -------- | ------- | ------- |
| `feedback_dutch`          | Dutch    | `nl-NL` | The explanation/correction (no German words). |
| `feedback_german_example` | German   | `de-DE` | The single corrected model phrase. |
| `reply`                   | German   | `de-DE` | The persona's in-character answer. |

Because German never appears in the Dutch field, the Dutch voice never has to
mangle German words. The three parts are spoken **sequentially**, swapping the
TTS voice between them.

### Better voices
`src/audio/voices.js` calls `Speech.getAvailableVoicesAsync()` once and picks the
best installed voice per language — preferring **Enhanced** quality and the exact
locale (`nl-NL`, `de-DE`) — then passes that `voice` to every `Speech.speak`. If no
enhanced voice is installed it falls back to the OS default.

## Tech stack (all free)

- **React Native + Expo** (SDK 51)
- **STT:** Groq Whisper (`whisper-large-v3`)
- **LLM:** Groq Llama (`llama-3.3-70b-versatile`)
- **TTS:** `expo-speech` (native on-device voices — free, offline)
- **Audio:** `expo-av`

## Setup

1. **Install dependencies**
   ```bash
   npm install
   npx expo install --fix      # align native module versions with the Expo SDK
   ```
2. **Add your Groq API key** (free at <https://console.groq.com/keys>)
   ```bash
   cp .env.example .env
   # EXPO_PUBLIC_GROQ_API_KEY=gsk_...
   ```
   > ⚠️ `EXPO_PUBLIC_` vars are bundled into the app and are **not secret**. Fine for
   > internal/testing use; proxy through a backend for a public production app.
3. **Run it**
   ```bash
   npx expo start          # open in Expo Go; grant microphone permission
   ```

## Project structure

```
App.js                         # router: SetupScreen → CallScreen
src/
├─ config/
│  ├─ businessContext.js        # learnerProfile + setup defaults & suggestions
│  └─ prompts.js                # buildSystemPrompt({scenario, persona, learner})
├─ api/groq.js                  # Whisper STT + Llama chat (3-key JSON)
├─ audio/
│  ├─ audioMode.js              # audio session (record vs. playback)
│  ├─ recorder.js               # start/stop recording → file URI
│  ├─ voices.js                 # enhanced nl-NL / de-DE voice selection
│  └─ speech.js                 # speak NL feedback → DE example → DE reply
├─ state/conversationStore.js   # bounded message history for the LLM
├─ hooks/useConversation.js     # state machine + push-to-talk
├─ screens/
│  ├─ SetupScreen.js            # pre-call scenario + persona picker
│  └─ CallScreen.js             # the "phone call" UI
└─ components/                  # StatusPill, TranscriptBubble, FeedbackCard, CallControls
```

## Background audio

This build targets **Expo Go**, so audio works in the foreground. Locked-screen
recording needs a custom dev build: the iOS `UIBackgroundModes` and Android
foreground-service config are already in `app.json` — build a dev client
(`npx expo run:ios` / `run:android`) and set `staysActiveInBackground: true` in
`src/audio/audioMode.js`. (iOS still restricts continuous locked-screen mic capture.)

## Notes

- **Model/latency tuning:** in `src/api/groq.js`, swap `LLM_MODEL` to
  `llama-3.1-8b-instant` or `STT_MODEL` to `whisper-large-v3-turbo` for lower latency.
- **No promises:** the persona is instructed never to put firm Family Chicken
  prices, stock, or delivery commitments into the learner's mouth.
