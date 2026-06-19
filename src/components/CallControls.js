import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { STATUS } from '../hooks/useConversation';

// Bottom control bar: the big press-to-talk button plus replay / reset.
export default function CallControls({ status, isBusy, onToggle, onReplay, onReset, canReplay }) {
  const recording = status === STATUS.RECORDING;

  let mainLabel = 'Spreken';
  let mainColor = '#10B981';
  if (recording) {
    mainLabel = 'Stop & verstuur';
    mainColor = '#EF4444';
  } else if (isBusy) {
    mainLabel = 'Bezig…';
    mainColor = '#374151';
  }

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
        onPress={onToggle}
        disabled={isBusy}
        style={[styles.mainButton, { backgroundColor: mainColor }]}
      >
        {isBusy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.mainIcon}>{recording ? '■' : '🎙'}</Text>
        )}
        <Text style={styles.mainLabel}>{mainLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, paddingBottom: 8 },
  sideRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 },
  secondary: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  secondaryText: { color: '#E5E7EB', fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  mainButton: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mainIcon: { fontSize: 22, color: '#fff' },
  mainLabel: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
