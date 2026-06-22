import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { STATUS } from '../hooks/useConversation';
import { theme } from '../config/theme';
import { MicIcon, StopIcon, RepeatIcon, CloseIcon } from './icons';

// Bottom control bar. The mic is TAP-TO-TOGGLE: tap once to start recording,
// tap again to stop and auto-send. No press-and-hold, no separate send button.
export default function CallControls({
  status,
  isBusy,
  onToggle,
  onStopPlayback,
  onReplay,
  onReset,
  canReplay,
}) {
  const recording = status === STATUS.RECORDING;
  const speaking = status === STATUS.SPEAKING;
  const processing = isBusy && !speaking; // transcribing or thinking: not interruptible

  let hint = 'Tik om te spreken';
  if (recording) hint = 'Tik om te stoppen';
  else if (speaking) hint = 'Tik om te onderbreken';
  else if (processing) hint = 'Even geduld...';

  return (
    <View style={styles.wrap}>
      <View style={styles.sideRow}>
        <Pressable
          onPress={onReplay}
          disabled={!canReplay || isBusy}
          style={[styles.secondary, (!canReplay || isBusy) && styles.disabled]}
        >
          <RepeatIcon size={15} color={theme.textMuted} />
          <Text style={styles.secondaryText}>Herhaal</Text>
        </Pressable>
        <Pressable
          onPress={onReset}
          disabled={isBusy}
          style={[styles.secondary, isBusy && styles.disabled]}
        >
          <CloseIcon size={15} color={theme.textMuted} />
          <Text style={styles.secondaryText}>Nieuw gesprek</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={speaking ? onStopPlayback : processing ? undefined : onToggle}
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
  hint: { color: theme.textMuted, fontSize: 13, fontWeight: '600', marginTop: 10 },
});
