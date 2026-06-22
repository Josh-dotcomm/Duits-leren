import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { STATUS } from '../hooks/useConversation';
import { theme } from '../config/theme';

const META = {
  [STATUS.IDLE]: { label: 'Klaar', color: theme.textMuted, busy: false },
  [STATUS.RECORDING]: { label: 'Opnemen', color: theme.accentDark, busy: false },
  [STATUS.TRANSCRIBING]: { label: 'Transcriberen', color: theme.accent, busy: true },
  [STATUS.THINKING]: { label: 'Nadenken', color: theme.accent, busy: true },
  [STATUS.SPEAKING]: { label: 'Afspelen', color: theme.success, busy: true },
  [STATUS.ERROR]: { label: 'Fout', color: theme.danger, busy: false },
};

export default function StatusPill({ status }) {
  const meta = META[status] || META[STATUS.IDLE];
  return (
    <View style={[styles.pill, { borderColor: meta.color }]}>
      {meta.busy ? (
        <ActivityIndicator size="small" color={meta.color} style={styles.spinner} />
      ) : (
        <View style={[styles.dot, { backgroundColor: meta.color }]} />
      )}
      <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: theme.surface,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  spinner: { marginRight: 8 },
  label: { fontSize: 13, fontWeight: '600' },
});
