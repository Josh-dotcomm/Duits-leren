import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
} from 'react-native';
import * as Speech from 'expo-speech';
import { theme } from '../config/theme';
import { getPreferredVoices } from '../audio/voices';
import { stopSpeaking } from '../audio/speech';
import { startRecording, stopRecording } from '../audio/recorder';
import { transcribeAudio } from '../api/groq';
import { fetchProgress, recordResult } from '../api/progress';
import { BookIcon, PlayIcon, MicIcon, StopIcon, CheckIcon, CloseIcon, RepeatIcon } from '../components/icons';

const refOf = (e) => `db:${e.id}`;
const norm = (s) => (s || '').trim().toLowerCase();
const ARTICLES = ['der', 'die', 'das'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const germanOf = (e) => (e.type === 'word' && e.article ? `${e.article} ` : '') + e.german;

function ModeHeader({ title, onBack }) {
  return (
    <View style={styles.modeHeader}>
      <Pressable hitSlop={8} onPress={onBack} style={styles.backBtn}>
        <CloseIcon size={20} color={theme.text} />
      </Pressable>
      <Text style={styles.modeTitle}>{title}</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

function Done({ onBack }) {
  return (
    <View style={styles.center}>
      <Text style={styles.doneText}>Klaar. Goed gedaan.</Text>
      <Pressable onPress={onBack} style={styles.primary}>
        <Text style={styles.primaryText}>Terug</Text>
      </Pressable>
    </View>
  );
}

// ---- Flashcards: both directions, shuffled, self-rated ----
function Flashcards({ items, onBack }) {
  const [deck, setDeck] = useState(() => shuffle(items));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [front, setFront] = useState('nl');

  useEffect(() => {
    setFlipped(false);
    setFront(Math.random() < 0.5 ? 'nl' : 'de');
  }, [i, deck]);

  const card = deck[i];
  if (!card) return <Done onBack={onBack} />;

  const de = germanOf(card);
  const frontText = front === 'nl' ? card.dutch : de;
  const backText = front === 'nl' ? de : card.dutch;

  const answer = async (correct) => {
    try { await recordResult(refOf(card), correct); } catch (_) {}
    if (i + 1 < deck.length) setI(i + 1);
    else { setDeck(shuffle(items)); setI(0); }
  };

  return (
    <View style={styles.modeBody}>
      <ModeHeader title={`Flashcards ${i + 1}/${deck.length}`} onBack={onBack} />
      <Pressable style={styles.card} onPress={() => setFlipped((f) => !f)}>
        <Text style={styles.cardLang}>{(flipped ? backText === card.dutch : frontText === card.dutch) ? 'NL' : 'DE'}</Text>
        <Text style={styles.cardText}>{flipped ? backText : frontText}</Text>
        <Text style={styles.cardHint}>{flipped ? '' : 'Tik om te draaien'}</Text>
      </Pressable>
      {flipped ? (
        <View style={styles.rateRow}>
          <Pressable style={[styles.rateBtn, styles.rateBad]} onPress={() => answer(false)}>
            <RepeatIcon size={18} color={theme.onAccent} />
            <Text style={styles.rateText}>Nogmaals</Text>
          </Pressable>
          <Pressable style={[styles.rateBtn, styles.rateGood]} onPress={() => answer(true)}>
            <CheckIcon size={18} color={theme.onAccent} />
            <Text style={styles.rateText}>Ken ik</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.spacerNote}>Bedenk de vertaling, tik dan op de kaart.</Text>
      )}
    </View>
  );
}

// ---- Fill-in: article (der/die/das) or type the German word ----
function FillIn({ words, onBack }) {
  const [deck] = useState(() => shuffle(words));
  const [i, setI] = useState(0);
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null); // 'correct' | 'wrong'

  const item = deck[i];
  if (!item) return <Done onBack={onBack} />;

  const isArticle = ARTICLES.includes(item.article);

  const check = async (val) => {
    let correct;
    if (isArticle) {
      correct = val === item.article;
    } else {
      const options = item.german.split('/').map(norm);
      correct = options.includes(norm(val));
    }
    setResult(correct ? 'correct' : 'wrong');
    try { await recordResult(refOf(item), correct); } catch (_) {}
  };

  const next = () => {
    setResult(null);
    setValue('');
    if (i + 1 < deck.length) setI(i + 1);
    else onBack();
  };

  return (
    <View style={styles.modeBody}>
      <ModeHeader title={`Invuloefening ${i + 1}/${deck.length}`} onBack={onBack} />
      <Text style={styles.prompt}>{item.dutch}</Text>
      {isArticle ? (
        <>
          <Text style={styles.subPrompt}>Kies het lidwoord bij: {item.german}</Text>
          <View style={styles.articleRow}>
            {ARTICLES.map((a) => (
              <Pressable
                key={a}
                disabled={!!result}
                onPress={() => check(a)}
                style={[
                  styles.articleBtn,
                  result && a === item.article && styles.articleOk,
                  result === 'wrong' && a !== item.article && styles.articleDim,
                ]}
              >
                <Text style={styles.articleText}>{a}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.subPrompt}>Typ het Duitse woord</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            editable={!result}
            placeholder="Duits"
            placeholderTextColor={theme.textFaint}
            autoCapitalize="none"
            onSubmitEditing={() => value.trim() && check(value)}
          />
          {!result ? (
            <Pressable
              style={[styles.primary, !value.trim() && styles.disabled]}
              disabled={!value.trim()}
              onPress={() => check(value)}
            >
              <Text style={styles.primaryText}>Controleer</Text>
            </Pressable>
          ) : null}
        </>
      )}

      {result ? (
        <View style={styles.feedback}>
          <Text style={result === 'correct' ? styles.fbOk : styles.fbBad}>
            {result === 'correct' ? 'Goed' : 'Fout'}
          </Text>
          <Text style={styles.fbAnswer}>{germanOf(item)}</Text>
          <Pressable style={styles.primary} onPress={next}>
            <Text style={styles.primaryText}>Volgende</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

// ---- Shadowing: hear the German sentence, repeat it, self-rate ----
function Shadowing({ sentences, onBack }) {
  const [deck] = useState(() => shuffle(sentences));
  const [i, setI] = useState(0);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [heard, setHeard] = useState('');

  const item = deck[i];
  if (!item) return <Done onBack={onBack} />;

  const play = async () => {
    const voices = await getPreferredVoices();
    Speech.stop();
    Speech.speak(item.german, { language: 'de-DE', voice: voices.de, rate: 0.95 });
  };

  const toggleRec = async () => {
    if (recording) {
      setRecording(false);
      setBusy(true);
      try {
        const uri = await stopRecording();
        setHeard(uri ? await transcribeAudio(uri, { language: 'de' }) : '');
      } catch (_) {
      } finally {
        setBusy(false);
      }
    } else {
      setHeard('');
      stopSpeaking();
      try {
        await startRecording();
        setRecording(true);
      } catch (_) {}
    }
  };

  const rate = async (correct) => {
    try { await recordResult(refOf(item), correct); } catch (_) {}
    setHeard('');
    if (i + 1 < deck.length) setI(i + 1);
    else onBack();
  };

  return (
    <View style={styles.modeBody}>
      <ModeHeader title={`Shadowing ${i + 1}/${deck.length}`} onBack={onBack} />
      <View style={styles.card}>
        <Text style={styles.cardText}>{item.german}</Text>
        <Text style={styles.cardSub}>{item.dutch}</Text>
      </View>

      <View style={styles.rateRow}>
        <Pressable style={[styles.rateBtn, styles.rateNeutral]} onPress={play}>
          <PlayIcon size={18} color={theme.onAccent} />
          <Text style={styles.rateText}>Beluister</Text>
        </Pressable>
        <Pressable
          style={[styles.rateBtn, recording ? styles.rateBad : styles.rateNeutral]}
          onPress={busy ? undefined : toggleRec}
        >
          {busy ? (
            <ActivityIndicator color={theme.onAccent} />
          ) : recording ? (
            <StopIcon size={18} color={theme.onAccent} />
          ) : (
            <MicIcon size={18} color={theme.onAccent} strokeWidth={2.2} />
          )}
          <Text style={styles.rateText}>{recording ? 'Stop' : 'Naspreken'}</Text>
        </Pressable>
      </View>

      {heard ? <Text style={styles.heard}>Gehoord: {heard}</Text> : null}

      <View style={styles.rateRow}>
        <Pressable style={[styles.rateBtn, styles.rateBad]} onPress={() => rate(false)}>
          <Text style={styles.rateText}>Nogmaals</Text>
        </Pressable>
        <Pressable style={[styles.rateBtn, styles.rateGood]} onPress={() => rate(true)}>
          <Text style={styles.rateText}>Goed</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---- Hub ----
export default function LearnScreen({ dictionary, onOpenDictionary }) {
  const [mode, setMode] = useState('hub');
  const [knownCount, setKnownCount] = useState(null);

  const words = useMemo(() => dictionary.filter((e) => e.type === 'word'), [dictionary]);
  const sentences = useMemo(() => dictionary.filter((e) => e.type === 'sentence'), [dictionary]);

  useEffect(() => {
    if (mode !== 'hub') return;
    fetchProgress()
      .then((m) => setKnownCount(Object.values(m).filter((r) => r.status === 'known').length))
      .catch(() => setKnownCount(null));
  }, [mode]);

  if (mode === 'flash') return wrap(<Flashcards items={dictionary} onBack={() => setMode('hub')} />);
  if (mode === 'fill') return wrap(<FillIn words={words} onBack={() => setMode('hub')} />);
  if (mode === 'shadow') return wrap(<Shadowing sentences={sentences} onBack={() => setMode('hub')} />);

  const empty = dictionary.length === 0;

  return wrap(
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Leren</Text>
      <Text style={styles.lead}>
        {empty
          ? 'Het woordenboek laadt of is leeg.'
          : `${dictionary.length} items in het woordenboek${knownCount != null ? `, ${knownCount} beheerst` : ''}.`}
      </Text>

      <HubCard title="Flashcards" sub="Woorden en zinnen, beide kanten op" disabled={empty} onPress={() => setMode('flash')} />
      <HubCard title="Invuloefening" sub="Lidwoord en woordkeuze" disabled={words.length === 0} onPress={() => setMode('fill')} />
      <HubCard title="Shadowing" sub="Beluister en spreek de zin na" disabled={sentences.length === 0} onPress={() => setMode('shadow')} />

      <Pressable style={styles.dictRow} onPress={onOpenDictionary}>
        <BookIcon size={18} color={theme.accent} />
        <Text style={styles.dictText}>Woordenboek openen</Text>
      </Pressable>
    </ScrollView>
  );
}

function HubCard({ title, sub, onPress, disabled }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={[styles.hubCard, disabled && styles.disabled]}>
      <Text style={styles.hubTitle}>{title}</Text>
      <Text style={styles.hubSub}>{sub}</Text>
    </Pressable>
  );
}

function wrap(children) {
  return <SafeAreaView style={styles.safe}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  content: { padding: 24 },
  title: { color: theme.text, fontSize: 26, fontWeight: '800', marginTop: 12 },
  lead: { color: theme.textMuted, fontSize: 14, marginTop: 4, marginBottom: 20 },
  hubCard: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  hubTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  hubSub: { color: theme.textMuted, fontSize: 13, marginTop: 4 },
  dictRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingVertical: 12 },
  dictText: { color: theme.accentDark, fontSize: 15, fontWeight: '700' },
  modeBody: { flex: 1, padding: 20 },
  modeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { color: theme.text, fontSize: 16, fontWeight: '800' },
  card: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLang: { color: theme.textFaint, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  cardText: { color: theme.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  cardSub: { color: theme.textMuted, fontSize: 15, textAlign: 'center', marginTop: 10 },
  cardHint: { color: theme.textFaint, fontSize: 12, marginTop: 14 },
  spacerNote: { color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 20 },
  rateRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  rateBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateGood: { backgroundColor: theme.success },
  rateBad: { backgroundColor: theme.accentDark },
  rateNeutral: { backgroundColor: theme.accent },
  rateText: { color: theme.onAccent, fontSize: 15, fontWeight: '800' },
  prompt: { color: theme.text, fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subPrompt: { color: theme.textMuted, fontSize: 14, marginBottom: 14 },
  articleRow: { flexDirection: 'row', gap: 10 },
  articleBtn: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleOk: { backgroundColor: theme.success, borderColor: theme.success },
  articleDim: { opacity: 0.4 },
  articleText: { color: theme.text, fontSize: 18, fontWeight: '800' },
  input: {
    backgroundColor: theme.inputBg,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    color: theme.text,
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedback: { marginTop: 18, alignItems: 'center' },
  fbOk: { color: theme.success, fontSize: 18, fontWeight: '800' },
  fbBad: { color: theme.danger, fontSize: 18, fontWeight: '800' },
  fbAnswer: { color: theme.text, fontSize: 18, fontWeight: '600', marginTop: 6, marginBottom: 14 },
  heard: { color: theme.textMuted, fontSize: 14, marginTop: 14, fontStyle: 'italic' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  doneText: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 18 },
  primary: {
    backgroundColor: theme.accent,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryText: { color: theme.onAccent, fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.5 },
});
