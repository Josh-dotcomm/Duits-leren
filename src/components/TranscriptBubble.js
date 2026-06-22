import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

// A single chat bubble. `side` is "you" (right, learner) or "partner" (left, AI).
export default function TranscriptBubble({ side, name, text }) {
  if (!text) return null;
  const isYou = side === 'you';
  return (
    <View style={[styles.row, isYou ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isYou ? styles.you : styles.partner]}>
        <Text style={[styles.name, isYou ? styles.nameYou : styles.namePartner]}>{name}</Text>
        <Text style={[styles.text, isYou ? styles.textYou : styles.textPartner]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', marginVertical: 4 },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '85%', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  you: { backgroundColor: theme.accent, borderBottomRightRadius: 4 },
  partner: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderBottomLeftRadius: 4,
  },
  name: { fontSize: 11, fontWeight: '700', marginBottom: 3 },
  nameYou: { color: 'rgba(255,255,255,0.8)' },
  namePartner: { color: theme.textFaint },
  text: { fontSize: 16, lineHeight: 22 },
  textYou: { color: theme.onAccent },
  textPartner: { color: theme.text },
});
