import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { STATUS } from '../hooks/useConversation';
import { theme } from '../config/theme';
import { MicIcon, StopIcon, RepeatIcon, CloseIcon } from './icons';

// Bottom control bar. In manual mode the mic is tap-to-toggle (tap to record, tap
// to stop and send). In hands-free mode the conversation runs by itself: tap once
// to start listening, then silence auto-sends and the AI's answer auto-resumes the
// mic. A red square appears while the AI is speaking to interrupt it.
export default function CallControls({
  status,
  handsFree,
  handsFreeActive,
  onToggle,
  onStopPlayback,
  onToggleHandsFree,
  onReplay,
  onReset,
  canReplay,
}) {
  const recording = status === STATUS.RECORDING;
  const speaking = status === STATUS.SPEAKING;
  const processing = status === STATUS.TRANSCRIBING || status === STATUS.THINKING;

  const micPress = speaking ? onStopPlayback : processing ? undefined : onToggle;

  let hint;
  if (handsFree) {
    if (recording) hint = 'Luisteren, praat maar. Tik om nu te versturen';
    else if (speaking) hint = 'Tik om te onderbreken en te praten';
    else if (processing) hint = 'Even geduld...';
    else hint = 'Tik om handsfree te starten';
  } else {
    if (recording) hint = 'Tik om te stoppen';
    else if (speaking) hint = 'Tik om te onderbreken';
    else if (processing) hint = 'Even geduld...';
    else hint = 'Tik om te spreken';
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onToggleHandsFree}
        style={[styles.handsfree, handsFree && styles.handsfreeOn]}
      >
        <Text style={[styles.handsfreeText, handsFree && styles.handsfreeTextOn]}>
          Handsfree {handsFree ? 'aan' : 'uit'}
        </Text>
      </Pressable>

      <View style={styles.sideRow}>
        <Pressable
          onPress={onReplay}
          disabled={!canReplay}
          style={[styles.secondary, !canReplay && styles.disabled]}
        >
          <RepeatIcon size={15} color={theme.textMuted} />
          <Text style={styles.secondaryText}>Herhaal</Text>
        </Pressable>
        <Pressable onPress={onReset} style={styles.secondary}>
          <CloseIcon size={15} color={theme.textMuted} />
          <Text style={styles.secondaryText}>Nieuw gesprek</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={micPress}
        disabled={processing}
        style={({ pressed }) => [
          styles.mic,
          pressed && !processing && styles.micPressed,
          recording && styles.micRecording,
          speaking && styles.micStop,
          processing && styles.micBusy,
        ]}
      >
        {processing ? (
          <ActivityIndicator color={theme.onAccent} />
        ) : recording || speaking ? (
          <StopIcon size={26} color={theme.onAccent} />
        ) : (
          <MicIcon size={28} color={theme.onAccent} strokeWidth={2.2} />
        )}
      </Pressable>

      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, paddingBottom: 10, alignItems: 'center' },
  handsfree: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    marginBottom: 12,
  },
  handsfreeOn: { backgroundColor: theme.accentSoft, borderColor: theme.accent },
  handsfreeText: { color: theme.textMuted, fontSize: 12, fontWeight: '700' },
  handsfreeTextOn: { color: theme.accentDark },
  sideRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 14 },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.borderStrong,
  },
  secondaryText: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  mic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micPressed: { backgroundColor: theme.accentDark, transform: [{ scale: 0.96 }] },
  micRecording: { backgroundColor: theme.accentDark },
  micStop: { backgroundColor: theme.danger },
  micBusy: { backgroundColor: theme.textFaint },
  hint: { color: theme.textMuted, fontSize: 13, fontWeight: '600', marginTop: 10, textAlign: 'center', paddingHorizontal: 16 },
});
