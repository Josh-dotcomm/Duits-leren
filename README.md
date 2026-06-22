# Business German Coach 🇩🇪📞

A hands-free, **phone-call-style** language trainer for **Business German**. Fill a
persistent **Knowledge Base** with your company info, set your **profile**, pick a
**scenario** and an **AI persona**, then tap the mic and speak German. The AI plays a
tough buyer that uses your Knowledge Base to grill you, while a Dutch coach corrects
your German — read aloud with the right on-device voice per language.

## How it works

```
Profiel (naam/bedrijf) ─┐
Kennisbank (AsyncStorage)┼─►  injected into the LLM system prompt
Setup (scenario+persona)─┘
        │
Tap mic → speak German → tap again
   ─►  Groq Whisper                  ─►  German transcript
   ─►  Groq Llama (JSON mode)        ─►  { feedback_dutch, feedback_german_example, reply }
   ─►  expo-speech (per-language)    ─►  NL feedback → DE example → DE reply
```

Three tabs (bottom bar): **Gesprek**, **Kennisbank**, **Profiel**.

### Tap-to-toggle recording
Tap the mic once to start recording, tap again to stop and auto-send. No
press-and-hold, no separate send button.

### Knowledge Base (persistent, dictatable)
A large field where you paste — or **dictate** (Groq Whisper, Dutch) — your company
info, methods and USPs. Saved locally via `@react-native-async-storage/async-storage`
and injected into the prompt. The AI uses it to test you and never ends the call.

### Profile (no hardcoded data)
Your name / company / role live on the **Profiel** tab (persisted), not in the code,
and feed the German self-introduction etiquette in the prompt.

### Three-field response + per-language TTS
| Key | Language | Read by |
| --- | --- | --- |
| `feedback_dutch` | Dutch | `nl-NL` voice |
| `feedback_german_example` | German | `de-DE` voice |
| `reply` | German | `de-DE` voice |

Keeping the languages in separate fields means a Dutch voice never has to read German.

### Voice selection (on-device)
TTS uses the device's own voices (free, offline). The app auto-picks the best
installed nl-NL / de-DE voice (preferring **Enhanced** quality), and the **Profiel**
tab has a picker to choose and preview a specific voice per language.

> For the best quality, install an **Enhanced/Premium** voice on your device:
> **iOS** — Settings ▸ Accessibility ▸ Spoken Content ▸ Voices.
> **Android** — Settings ▸ System ▸ Languages ▸ Text-to-speech output (pick/-upgrade the engine & voice data).

## Tech stack (all free)

- **React Native + Expo** (SDK 51)
- **UI:** `react-native-svg` icons + a light, Anthropic-inspired theme (`src/config/theme.js`)
- **Local storage:** `@react-native-async-storage/async-storage`
- **STT:** Groq Whisper (`whisper-large-v3`)
- **LLM:** Groq Llama (`llama-3.3-70b-versatile`)
- **TTS:** `expo-speech` (native on-device voices)
- **Audio:** `expo-av`

## Setup

```bash
npm install
npx expo install --fix            # align native module versions with the Expo SDK
cp .env.example .env              # set EXPO_PUBLIC_GROQ_API_KEY=gsk_...
npx expo start                    # open in Expo Go; grant microphone permission
```

> ⚠️ `EXPO_PUBLIC_` vars are bundled into the app and are **not secret**. Fine for
> internal/testing use; proxy through a backend for a public production app.

## Project structure

```
App.js                         # 3-tab shell + persistence (KB, profile, voices)
src/
├─ config/
│  ├─ theme.js                  # Anthropic-inspired light palette (single source)
│  ├─ businessContext.js        # defaults + scenario/persona suggestions
│  └─ prompts.js                # buildSystemPrompt({scenario, persona, knowledgeBaseText, learner})
├─ api/groq.js                  # Whisper STT (language-aware) + Llama chat (3-key JSON)
├─ audio/
│  ├─ audioMode.js              # audio session (record vs. playback)
│  ├─ recorder.js               # start/stop recording → file URI
│  ├─ voices.js                 # voice selection + user overrides
│  └─ speech.js                 # speak NL feedback → DE example → DE reply
├─ storage/
│  ├─ knowledgeBase.js          # AsyncStorage: knowledge base
│  └─ profile.js                # AsyncStorage: profile + voice preferences
├─ hooks/
│  ├─ useConversation.js        # call state machine + tap-to-toggle
│  └─ useDictation.js           # dictate-into-field (Whisper) for the Kennisbank
├─ screens/
│  ├─ SetupScreen.js            # scenario + persona
│  ├─ CallScreen.js             # the "phone call" UI
│  ├─ KnowledgeBaseScreen.js    # paste/dictate & persist company info
│  └─ ProfileScreen.js          # name/company/role + voice picker
└─ components/                  # icons (SVG), TabBar, StatusPill, TranscriptBubble, FeedbackCard, CallControls
```

## Background audio

Targets **Expo Go** (foreground audio). The iOS `UIBackgroundModes` and Android
foreground-service config are in `app.json`; for locked-screen audio build a dev
client (`npx expo run:ios` / `run:android`) and set `staysActiveInBackground: true`
in `src/audio/audioMode.js`. (iOS still restricts continuous locked-screen mic.)

## Notes

- **Model/latency tuning:** in `src/api/groq.js`, swap `LLM_MODEL` to
  `llama-3.1-8b-instant` or `STT_MODEL` to `whisper-large-v3-turbo` for lower latency.
- **No promises:** the persona never invents firm prices, stock or delivery on the
  learner's behalf — it pushes the learner to state and defend those themselves.
