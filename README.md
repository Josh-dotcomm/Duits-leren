# Business German Coach

A hands-free, phone-call-style trainer for **Business German**, aimed at B2B sales in the
German hospitality / food-service sector (Gastronomie, Imbiss, Grosshandel, horeca). You
fill a persistent Knowledge Base with your company info, set your profile, pick a scenario
and an AI persona, then tap the mic and speak German. The AI plays a tough buyer that uses
your Knowledge Base to test you, while a Dutch coach corrects your German, read aloud with
the right on-device voice per language.

## How it works

```
Profiel (naam/bedrijf)      injected
Kennisbank (AsyncStorage)   into the
Setup (scenario+persona)    system prompt
        |
Tap mic, speak German, tap again
   -> Groq Whisper                German transcript
   -> Groq Llama (JSON mode)      { feedback_dutch, feedback_german_example, reply }
   -> expo-speech (per language)  NL feedback, then DE example, then DE reply
```

Three tabs (bottom bar): Gesprek, Kennisbank, Profiel.

### Tap-to-toggle recording
Tap the mic once to start recording, tap again to stop and auto-send. No press-and-hold,
no separate send button.

### Knowledge Base (persistent, dictatable)
A field where you paste or dictate (Groq Whisper, Dutch) your company info, methods and
USPs. Saved locally via `@react-native-async-storage/async-storage` and injected into the
prompt. The AI uses it to test you and never ends the call.

### Profile (no hardcoded data)
Your name, company and role live on the Profiel tab (persisted), not in code, and feed the
German self-introduction etiquette in the prompt.

### Three-field response + per-language TTS

| Key | Language | Read by |
| --- | --- | --- |
| `feedback_dutch` | Dutch | nl-NL voice |
| `feedback_german_example` | German | de-DE voice |
| `reply` | German | de-DE voice |

Keeping the languages in separate fields means a Dutch voice never has to read German.

### Grammar rigor
The coach prompt enforces an explicit checklist (articles and gender, the four cases,
case after prepositions and verbs, adjective endings, determiners, verb position) so
errors like ein/einen and der/die/das are corrected, not glossed over.

### Voice selection (on-device)
TTS uses the device's own voices (free, offline). The app auto-picks the best installed
nl-NL / de-DE voice (preferring Enhanced quality), and the Profiel tab has a picker to
choose and preview a specific voice per language. For best quality, install an
Enhanced/Premium voice (iOS: Settings, Accessibility, Spoken Content, Voices; Android:
Settings, System, Languages, Text-to-speech output).

## Tech stack (all free)

- React Native + Expo (SDK 51)
- `react-native-svg` icons + a light, Anthropic-inspired theme (`src/config/theme.js`)
- Local storage: `@react-native-async-storage/async-storage`
- STT: Groq Whisper (`whisper-large-v3`)
- LLM: Groq (`openai/gpt-oss-120b` by default; set `EXPO_PUBLIC_GROQ_MODEL` to change)
- TTS: `expo-speech` (native on-device voices)
- Audio: `expo-av`

## Setup

```bash
npm install
npx expo install --fix            # align native module versions with the Expo SDK
cp .env.example .env              # optional: EXPO_PUBLIC_GROQ_API_KEY for direct local mode
npx expo start                    # open in Expo Go; grant microphone permission
```

## Keeping the Groq key server-side

Anything shipped inside the app can be extracted from the bundle, so the Groq key must not
live in the client. Two thin Supabase Edge Functions (`supabase/functions/chat` and
`supabase/functions/transcribe`) proxy Groq and hold the key server-side; the app calls them
with the signed-in user's token, so only your users can use it.

One-time deploy:

```bash
npm i -g supabase
supabase login
supabase link --project-ref hxnsecgtgpjflkhijidx
supabase secrets set GROQ_API_KEY=gsk_your_real_key
supabase functions deploy chat
supabase functions deploy transcribe
```

For local development you can instead set `EXPO_PUBLIC_GROQ_API_KEY` in `.env` to call Groq
directly; that key stays on your machine and is never shipped in the build.

## Project structure

```
App.js                         3-tab shell + persistence (KB, profile, voices)
src/
  config/
    theme.js                   Anthropic-inspired light palette (single source)
    businessContext.js         defaults + scenario/persona suggestions
    prompts.js                 buildSystemPrompt({scenario, persona, knowledgeBaseText, learner})
  api/groq.js                  Whisper STT (language-aware) + Llama chat (3-key JSON)
  audio/
    audioMode.js               audio session (record vs. playback)
    recorder.js                start/stop recording, returns file URI
    voices.js                  voice selection + user overrides
    speech.js                  speak NL feedback, DE example, DE reply
  storage/
    knowledgeBase.js           AsyncStorage: knowledge base
    profile.js                 AsyncStorage: profile + voice preferences
  hooks/
    useConversation.js         call state machine + tap-to-toggle
    useDictation.js            dictate-into-field (Whisper) for the Kennisbank
  screens/
    SetupScreen.js             scenario + persona
    CallScreen.js              the call UI
    KnowledgeBaseScreen.js     paste/dictate & persist company info
    ProfileScreen.js           name/company/role + voice picker
  components/                  icons (SVG), TabBar, StatusPill, TranscriptBubble, FeedbackCard, CallControls
```

## Background audio

Targets Expo Go (foreground audio). The iOS `UIBackgroundModes` and Android
foreground-service config are in `app.json`; for locked-screen audio build a dev client
(`npx expo run:ios` / `run:android`) and set `staysActiveInBackground: true` in
`src/audio/audioMode.js`. (iOS still restricts continuous locked-screen mic.)

## Notes

- Model/latency tuning: set `EXPO_PUBLIC_GROQ_MODEL` (e.g. `llama-3.3-70b-versatile` for
  lower latency, `llama-3.1-8b-instant` for max speed) and `EXPO_PUBLIC_GROQ_REASONING`
  (low/medium/high, gpt-oss only) in `.env`. Default is `openai/gpt-oss-120b` at low,
  which keeps token use within the free per-minute limit (TPM).
- API keys: Supabase URL + anon key are baked into `src/config/secrets.js` (safe to ship).
  The Groq key is NOT shipped; in production the app calls Supabase Edge Functions that hold
  it server-side. See "Keeping the Groq key server-side".
- Dictionary: if the seeded base words do not show, run `supabase/policies.sql` once in the
  Supabase SQL editor (adds a permissive SELECT so signed-in users read the whole list).
- No promises: the persona never invents firm prices, stock or delivery on the learner's
  behalf; it pushes the learner to state and defend those themselves.
