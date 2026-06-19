import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useConversation, STATUS } from '../hooks/useConversation';
import { businessContext } from '../config/businessContext';
import { setModeForPlayback } from '../audio/audioMode';
import StatusPill from '../components/StatusPill';
import TranscriptBubble from '../components/TranscriptBubble';
import FeedbackCard from '../components/FeedbackCard';
import CallControls from '../components/CallControls';

export default function CallScreen() {
  const { status, turns, error, isBusy, toggle, replay, reset } = useConversation(businessContext);
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
        <Text style={styles.partner}>{businessContext.partnerName}</Text>
        <Text style={styles.role}>{businessContext.partnerRole}</Text>
        <Text style={styles.context}>
          Jij: {businessContext.userName} · {businessContext.company}
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
            <Text style={styles.emptyTitle}>Bel Hansi 📞</Text>
            <Text style={styles.emptyBody}>
              Tik op “Spreken”, stel je voor in het Duits en begin het
              verkoopgesprek. Je krijgt eerst Nederlandse feedback, daarna het
              antwoord van Hansi.
            </Text>
            <Text style={styles.emptyHint}>
              Tip: zeg “Herhaal de zin maar dan goed” om de juiste Duitse zin te
              horen.
            </Text>
          </View>
        ) : (
          turns.map((turn) => (
            <View key={turn.id} style={styles.turn}>
              <TranscriptBubble side="you" name="Jij (DE)" text={turn.you} />
              <FeedbackCard feedback={turn.feedback} processed={turn.done} />
              <TranscriptBubble
                side="partner"
                name={`${businessContext.partnerName} (DE)`}
                text={turn.reply}
              />
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.controls}>
        <CallControls
          status={status}
          isBusy={isBusy}
          onToggle={toggle}
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
  partner: { color: '#F9FAFB', fontSize: 30, fontWeight: '800' },
  role: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  context: { color: '#6B7280', fontSize: 12, marginTop: 6 },
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
