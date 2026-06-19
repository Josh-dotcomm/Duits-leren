import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { STATUS } from '../hooks/useConversation';

// Bottom control bar. The mic is PUSH-TO-TALK: hold to record, release to send.
// There is no separate "send" button — releasing auto-sends the audio.
export default function CallControls({
  status,
  isBusy,
  onStartTalking,
  onStopTalking,
  onReplay,
  onReset,
  canReplay,
}) {
  const recording = status === STATUS.RECORDING;

  let hint = 'Houd ingedrukt om te spreken';
  if (recording) hint = 'Laat los om te versturen';
  else if (isBusy) hint = 'Even geduld…';

  return (
    <View style={styles.wrap}>
      <View style={styles.sideRow}>
        <Pressable
          onPress={onReplay}
          disabled={!canReplay || isBusy}
          style={[styles.secondary, (!canReplay || isBusy) && styles.disabled]}
        >
          <Text style={styles.secondaryText}>↺ Herhaal</Text>
        </Pressable>
        <Pressable
          onPress={onReset}
          disabled={isBusy}
          style={[styles.secondary, isBusy && styles.disabled]}
        >
          <Text style={styles.secondaryText}>✕ Nieuw gesprek</Text>
        </Pressable>
      </View>

      <Pressable
        onPressIn={isBusy ? undefined : onStartTalking}
        onPressOut={isBusy ? undefined : onStopTalking}
        disabled={isBusy}
        style={({ pressed }) => [
          styles.mic,
          recording && styles.micRecording,
          isBusy && styles.micBusy,
          pressed && !isBusy && styles.micPressed,
        ]}
      >
        {isBusy ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <Text style={styles.micIcon}>{recording ? '●' : '🎙'}</Text>
        )}
      </Pressable>

      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 10, paddingBottom: 12, alignItems: 'center' },
  sideRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  secondary: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  secondaryText: { color: '#E5E7EB', fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  mic: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  micPressed: { backgroundColor: '#059669', transform: [{ scale: 0.96 }] },
  micRecording: { backgroundColor: '#EF4444', transform: [{ scale: 1.06 }] },
  micBusy: { backgroundColor: '#374151' },
  micIcon: { fontSize: 36, color: '#fff' },
  hint: { color: '#9CA3AF', fontSize: 14, fontWeight: '600', marginTop: 12 },
});
