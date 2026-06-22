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
import { setModeForPlayback } from '../audio/audioMode';
import { theme } from '../config/theme';
import StatusPill from '../components/StatusPill';
import TranscriptBubble from '../components/TranscriptBubble';
import FeedbackCard from '../components/FeedbackCard';
import CallControls from '../components/CallControls';

// `setup` = { scenario, persona, knowledgeBaseText, profile }; `onExit` returns
// to the Setup screen.
export default function CallScreen({ setup, onExit }) {
  const {
    status,
    turns,
    error,
    isBusy,
    handsFree,
    handsFreeActive,
    toggleRecording,
    stopPlayback,
    replay,
    reset,
    setHandsFree,
  } = useConversation(setup);
  const scrollRef = useRef(null);
  const profile = setup.profile || {};

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
  const youLabel = [profile.name, profile.company].filter(Boolean).join(' · ');

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
            <Text style={styles.exitText}>Wijzig</Text>
          </Pressable>
        </View>
        {youLabel ? <Text style={styles.context}>Jij: {youLabel}</Text> : null}
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
            <Text style={styles.emptyTitle}>Start het gesprek</Text>
            <Text style={styles.emptyBody}>Tik op de microfoon om te beginnen.</Text>
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
          handsFree={handsFree}
          handsFreeActive={handsFreeActive}
          onToggle={toggleRecording}
          onStopPlayback={stopPlayback}
          onToggleHandsFree={() => setHandsFree(!handsFree)}
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
    backgroundColor: theme.bg,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  headerText: { flex: 1, paddingRight: 12 },
  persona: { color: theme.text, fontSize: 22, fontWeight: '800' },
  scenario: { color: theme.textMuted, fontSize: 13, marginTop: 3 },
  exitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.borderStrong,
  },
  exitText: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  context: { color: theme.textFaint, fontSize: 12, marginTop: 8 },
  statusWrap: { marginTop: 12 },
  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 6,
    backgroundColor: theme.dangerSoft,
    borderColor: 'rgba(178,58,46,0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  errorText: { color: theme.danger, fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  turn: { marginBottom: 14 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 12 },
  emptyTitle: { color: theme.text, fontSize: 20, fontWeight: '800', marginBottom: 10 },
  emptyBody: { color: theme.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  controls: {
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.bg,
  },
});
