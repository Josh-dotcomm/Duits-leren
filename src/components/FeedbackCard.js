import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

// Shows the Dutch coaching explanation and the corrected German example as two
// visually distinct blocks (they are also read by two different TTS voices).
// When the turn is processed and there's nothing to correct, shows a positive chip.
export default function FeedbackCard({ feedbackDutch, feedbackGermanExample, processed }) {
  const hasDutch = !!(feedbackDutch && feedbackDutch.trim());
  const hasGerman = !!(feedbackGermanExample && feedbackGermanExample.trim());

  if (hasDutch || hasGerman) {
    return (
      <View style={styles.card}>
        <Text style={styles.heading}>Feedback</Text>
        {hasDutch ? <Text style={styles.dutch}>{feedbackDutch}</Text> : null}
        {hasGerman ? (
          <View style={styles.germanBlock}>
            <Text style={styles.germanLabel}>Beter (DE)</Text>
            <Text style={styles.german}>{feedbackGermanExample}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (processed) {
    return (
      <View style={styles.okChip}>
        <Text style={styles.okText}>Geen correcties</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: theme.accentSoft,
    borderColor: 'rgba(217,119,87,0.4)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginVertical: 6,
  },
  heading: {
    color: theme.accentDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dutch: { color: theme.text, fontSize: 15, lineHeight: 21 },
  germanBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(25,25,25,0.10)',
  },
  germanLabel: { color: theme.accentDark, fontSize: 11, fontWeight: '800', marginBottom: 3 },
  german: { color: theme.text, fontSize: 16, fontWeight: '600', lineHeight: 22 },
  okChip: {
    alignSelf: 'flex-start',
    backgroundColor: theme.successSoft,
    borderColor: 'rgba(63,122,83,0.4)',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginVertical: 6,
  },
  okText: { color: theme.success, fontSize: 12, fontWeight: '700' },
});
