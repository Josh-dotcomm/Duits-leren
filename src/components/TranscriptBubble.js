import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// A single chat bubble. `side` is "you" (right, learner) or "partner" (left, Hansi).
export default function TranscriptBubble({ side, name, text }) {
  if (!text) return null;
  const isYou = side === 'you';
  return (
    <View style={[styles.row, isYou ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isYou ? styles.you : styles.partner]}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', marginVertical: 4 },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '85%', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  you: { backgroundColor: '#1D4ED8', borderBottomRightRadius: 4 },
  partner: { backgroundColor: '#1F2937', borderBottomLeftRadius: 4 },
  name: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', marginBottom: 3 },
  text: { color: '#F9FAFB', fontSize: 16, lineHeight: 22 },
});
