import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Shows the Dutch coaching feedback for a turn. When the turn has been processed
// and there are no corrections, shows a small positive confirmation instead.
export default function FeedbackCard({ feedback, processed }) {
  if (feedback && feedback.trim()) {
    return (
      <View style={styles.card}>
        <Text style={styles.heading}>🇳🇱 Feedback</Text>
        <Text style={styles.body}>{feedback}</Text>
      </View>
    );
  }
  if (processed) {
    return (
      <View style={styles.okChip}>
        <Text style={styles.okText}>✓ Geen correcties — goed gezegd!</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.55)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginVertical: 6,
  },
  heading: { color: '#F59E0B', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  body: { color: '#FDE68A', fontSize: 15, lineHeight: 21 },
  okChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.5)',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginVertical: 6,
  },
  okText: { color: '#6EE7B7', fontSize: 12, fontWeight: '600' },
});
