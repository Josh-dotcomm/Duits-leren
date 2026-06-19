import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useConversation, STATUS } from '../hooks/useConversation';
import { learnerProfile } from '../config/businessContext';
import { setModeForPlayback } from '../audio/audioMode';
import StatusPill from '../components/StatusPill';
import TranscriptBubble from '../components/TranscriptBubble';
import FeedbackCard from '../components/FeedbackCard';
import CallControls from '../components/CallControls';

// `setup` = { scenario, persona }; `onExit` returns to the Setup screen.
export default function CallScreen({ setup, onExit }) {
  const { status, turns, error, isBusy, startTalking, stopTalking, replay, reset } =
    useConversation(setup);
  const scrollRef = useRef(null);

  // Initialise the audio session once when the screen mounts.
  useEffect(() => {
    setModeForPlayback().catch(() => {});
  }, []);

  // Keep the newest turn in view.
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [turns]);

  const lastTurn = turns.length ? turns[turns.length - 1] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.persona} numberOfLines={1}>
              {setup.persona}
            </Text>
            <Text style={styles.scenario} numberOfLines={2}>
              {setup.scenario}
            </Text>
          </View>
          <Pressable
            onPress={onExit}
            disabled={isBusy}
            style={[styles.exitBtn, isBusy && styles.disabled]}
          >
            <Text style={styles.exitText}>⚙ Wijzig</Text>
          </Pressable>
        </View>
        <Text style={styles.context}>
          Jij: {learnerProfile.userName} · {learnerProfile.company}
        </Text>
        <View style={styles.statusWrap}>
          <StatusPill status={status} />
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {turns.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Start het gesprek 📞</Text>
            <Text style={styles.emptyBody}>
              Houd de microfoonknop ingedrukt, stel je voor in het Duits en laat los om
              te versturen. Je hoort eerst Nederlandse feedback, dan het juiste Duitse
              voorbeeld, en daarna het antwoord van de {setup.persona}.
            </Text>
            <Text style={styles.emptyHint}>
              Tip: zeg “Herhaal de zin maar dan goed” voor de juiste Duitse zin.
            </Text>
          </View>
        ) : (
          turns.map((turn) => (
            <View key={turn.id} style={styles.turn}>
              <TranscriptBubble side="you" name="Jij (DE)" text={turn.you} />
              <FeedbackCard
                feedbackDutch={turn.feedbackDutch}
                feedbackGermanExample={turn.feedbackGermanExample}
                processed={turn.done}
              />
              <TranscriptBubble side="partner" name={setup.persona} text={turn.reply} />
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.controls}>
        <CallControls
          status={status}
          isBusy={isBusy}
          onStartTalking={startTalking}
          onStopTalking={stopTalking}
          onReplay={() => replay(lastTurn)}
          onReset={reset}
          canReplay={!!lastTurn && lastTurn.done && status !== STATUS.RECORDING}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B1220',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  headerText: { flex: 1, paddingRight: 12 },
  persona: { color: '#F9FAFB', fontSize: 24, fontWeight: '800' },
  scenario: { color: '#9CA3AF', fontSize: 13, marginTop: 3 },
  exitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  exitText: { color: '#E5E7EB', fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  context: { color: '#6B7280', fontSize: 12, marginTop: 8 },
  statusWrap: { marginTop: 12 },
  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 6,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.5)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  errorText: { color: '#FCA5A5', fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  turn: { marginBottom: 14 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 12 },
  emptyTitle: { color: '#E5E7EB', fontSize: 22, fontWeight: '800', marginBottom: 10 },
  emptyBody: { color: '#9CA3AF', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  emptyHint: { color: '#6B7280', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 14 },
  controls: {
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0B1220',
  },
});
