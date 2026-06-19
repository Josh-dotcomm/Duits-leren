import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { STATUS } from '../hooks/useConversation';

const META = {
  [STATUS.IDLE]: { label: 'Klaar — tik om te spreken', color: '#3B82F6', busy: false },
  [STATUS.RECORDING]: { label: 'Aan het opnemen…', color: '#EF4444', busy: false },
  [STATUS.TRANSCRIBING]: { label: 'Transcriberen…', color: '#F59E0B', busy: true },
  [STATUS.THINKING]: { label: 'Aan het nadenken…', color: '#A855F7', busy: true },
  [STATUS.SPEAKING]: { label: 'Aan het afspelen…', color: '#10B981', busy: true },
  [STATUS.ERROR]: { label: 'Er ging iets mis', color: '#EF4444', busy: false },
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
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  spinner: { marginRight: 8 },
  label: { fontSize: 13, fontWeight: '600' },
});
