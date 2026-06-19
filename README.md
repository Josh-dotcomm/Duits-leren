# Business German Coach 🇩🇪📞

A hands-free, **phone-call-style** language trainer for **Business German**. You
speak German into your phone; the app transcribes it, corrects you like a strict
tutor (in Dutch), and answers back in character as a German business contact
("Hansi") — all out loud, like a real call.

Built for Hillco / "Family Chicken" sales conversations, but fully retargetable
via a single config file.

## How it works

```
You speak (German)
   → record (expo-av)
   → Groq Whisper        → German transcript
   → Groq Llama (JSON)   → { feedback (NL), reply (DE) }
   → expo-speech         → speaks feedback in Dutch, then reply in German
```

The LLM always returns **two** things:

| Key        | Language | Purpose                                                                 |
| ---------- | -------- | ----------------------------------------------------------------------- |
| `feedback` | Dutch    | Strict corrections: grammar, vocabulary, STT mishearings, **German business etiquette** (e.g. never call yourself "Herr ...", use "von der Firma" not "vom"). |
| `reply`    | German   | The natural, in-character answer from your conversation partner.        |

Say a Dutch meta-command like **“Herhaal de zin maar dan goed”** and the coach
switches to tutor mode for that turn (gives you the correct German sentence and
stays silent as Hansi).

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
   # align native module versions with the Expo SDK:
   npx expo install --fix
   ```

2. **Add your Groq API key** (free at <https://console.groq.com/keys>)
   ```bash
   cp .env.example .env
   # then edit .env and set:
   # EXPO_PUBLIC_GROQ_API_KEY=gsk_...
   ```
   > ⚠️ `EXPO_PUBLIC_` variables are bundled into the app and are **not secret**.
   > Fine for internal/testing use. For a public production app, proxy Groq
   > through your own backend and keep the key server-side.

3. **Run it**
   ```bash
   npx expo start
   ```
   Open in **Expo Go** (scan the QR code) or an emulator. Grant microphone
   permission on first use.

## Context injection

Everything about *who you are* and *what you're practising* lives in
`src/config/businessContext.js`:

```js
export const businessContext = {
  userName: 'Sonnevelt',
  company: 'Family Chicken',
  goal: 'Professionele zakelijke communicatie en verkoop in Duitsland.',
  partnerName: 'Hansi',
  partnerRole: 'Einkäufer bei einem deutschen Lebensmittelgroßhändler.',
  scenario: 'Ein telefonisches Verkaufsgespräch über Geflügelprodukte ...',
};
```

This object is merged into the LLM system prompt in `src/config/prompts.js`.
Change the values to retarget the trainer to a different person, company,
partner, or scenario.

## Background audio

This build targets **Expo Go**, so audio works while the app is in the
foreground. **Locked-screen / background recording is not possible in Expo Go.**

The native config for background audio is **already in `app.json`**
(`ios.infoPlist.UIBackgroundModes: ["audio"]` and the Android foreground-service
permissions). To enable it:

1. Build a custom dev client instead of using Expo Go:
   ```bash
   npx expo run:ios      # or: npx expo run:android   (or use EAS Build)
   ```
2. In `src/audio/audioMode.js`, set `staysActiveInBackground: true`.

> iOS restricts continuous microphone capture while the screen is locked even
> with a dev build; background audio **playback** is the reliable part. Plan the
> UX around press-to-talk in the foreground.

## Project structure

```
App.js                         # entry → CallScreen
app.json                       # Expo config + iOS/Android audio permissions
src/
├─ config/
│  ├─ businessContext.js        # CONTEXT INJECTION (edit me)
│  └─ prompts.js                # buildSystemPrompt() — the dual-response contract
├─ api/groq.js                  # Whisper STT + Llama chat (JSON mode)
├─ audio/
│  ├─ audioMode.js              # audio session (record vs. playback)
│  ├─ recorder.js               # start/stop recording → file URI
│  └─ speech.js                 # speak NL feedback, then DE reply
├─ state/conversationStore.js   # bounded message history for the LLM
├─ hooks/useConversation.js     # state machine: idle→recording→…→speaking
├─ screens/CallScreen.js        # the "phone call" UI
└─ components/                  # StatusPill, TranscriptBubble, FeedbackCard, CallControls
```

## Notes / next steps

- **Model choice:** swap `LLM_MODEL` to `llama-3.1-8b-instant` in
  `src/api/groq.js` for lower latency, or `STT_MODEL` to
  `whisper-large-v3-turbo` for faster transcription.
- **No promises:** Hansi is prompted never to put firm Family Chicken prices,
  stock, or delivery commitments into your mouth — those stay with the human.
