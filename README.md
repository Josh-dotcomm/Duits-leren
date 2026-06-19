# Business German Coach 🇩🇪📞

A hands-free, **phone-call-style** language trainer for **Business German**. You fill
a persistent **Knowledge Base** with your company info, pick a **scenario** and an
**AI persona**, then hold the mic and speak German. The AI plays a tough buyer who
uses your Knowledge Base to grill you, while a Dutch coach corrects your German — all
read aloud with the right voice per language.

Built for Hillco / "Family Chicken" sales conversations, but fully retargetable.

## How it works

```
Kennisbank (saved to AsyncStorage) ─┐
Setup (scenario + persona) ────────┼─►  injected into the LLM system prompt
                                     │
You hold the mic and speak (German) ┘
   ─ release ─►  record (expo-av)
   ─►  Groq Whisper                  ─►  German transcript
   ─►  Groq Llama (JSON mode)        ─►  { feedback_dutch, feedback_german_example, reply }
   ─►  expo-speech (per-language)    ─►  NL feedback → DE example → DE reply
```

The app has two tabs (bottom bar): **Gesprek** (the call flow) and **Kennisbank**.

### Knowledge Base (persistent)
The Kennisbank tab is a large multiline field where you paste all your company
information, working methods and USPs. It's saved locally with
`@react-native-async-storage/async-storage`, so it survives app restarts, and is
injected into the system prompt on each call.

### Aggressive, continuous roleplay
The AI **is the buyer/persona** — you are selling to it. It uses the Knowledge Base
to test you: specific questions about your methods, challenges to your USPs, and
realistic objections. It **never ends the call** and always closes its reply with a
question, counter-argument or new demand, forcing you to keep talking.

### Dynamic setup (no hardcoded persona)
Two fields with tap-to-fill chips: **Scenario** (goal of the call) and **AI persona**
(who the AI plays). Both are injected into the system prompt.

### Push-to-talk (no send button)
The mic button is **hold-to-talk**: press and hold to record, **release to send**.

### Three-field response + per-language TTS
The LLM returns three strings, kept in separate languages on purpose:

| Key                       | Language | Read by | Purpose |
| ------------------------- | -------- | ------- | ------- |
| `feedback_dutch`          | Dutch    | `nl-NL` | The explanation/correction (no German words). |
| `feedback_german_example` | German   | `de-DE` | The single corrected model phrase. |
| `reply`                   | German   | `de-DE` | The persona's in-character answer (ends with a question/demand). |

### Better voices
`src/audio/voices.js` calls `Speech.getAvailableVoicesAsync()` once and picks the best
installed voice per language (preferring **Enhanced** quality + exact locale), falling
back to the OS default.

## Tech stack (all free)

- **React Native + Expo** (SDK 51)
- **Local storage:** `@react-native-async-storage/async-storage`
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
App.js                         # 2-tab shell (Gesprek / Kennisbank) + KB persistence
src/
├─ config/
│  ├─ businessContext.js        # learnerProfile + setup defaults & suggestions
│  └─ prompts.js                # buildSystemPrompt({scenario, persona, knowledgeBaseText, learner})
├─ api/groq.js                  # Whisper STT + Llama chat (3-key JSON)
├─ audio/
│  ├─ audioMode.js              # audio session (record vs. playback)
│  ├─ recorder.js               # start/stop recording → file URI
│  ├─ voices.js                 # enhanced nl-NL / de-DE voice selection
│  └─ speech.js                 # speak NL feedback → DE example → DE reply
├─ storage/knowledgeBase.js     # AsyncStorage load/save of the Kennisbank
├─ state/conversationStore.js   # bounded message history for the LLM
├─ hooks/useConversation.js     # state machine + push-to-talk
├─ screens/
│  ├─ SetupScreen.js            # pre-call scenario + persona picker
│  ├─ CallScreen.js             # the "phone call" UI
│  └─ KnowledgeBaseScreen.js    # paste & persist company info / USPs
└─ components/                  # StatusPill, TranscriptBubble, FeedbackCard, CallControls, TabBar
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
- **No promises:** the persona is instructed never to invent firm Family Chicken
  prices, stock, or delivery commitments — it pushes the learner to defend their own.
