import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
} from 'react-native';
import {
  defaultCallSetup,
  scenarioSuggestions,
  personaSuggestions,
} from '../config/businessContext';
import { theme } from '../config/theme';

function Chip({ text, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{text}</Text>
    </Pressable>
  );
}

// Pre-call setup: choose the scenario (goal of the call) and the AI persona.
export default function SetupScreen({ onStart, hasKnowledgeBase, onOpenKnowledgeBase }) {
  const [scenario, setScenario] = useState(defaultCallSetup.scenario);
  const [persona, setPersona] = useState(defaultCallSetup.persona);

  const canStart = scenario.trim().length > 0 && persona.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Nieuw gesprek</Text>

          <Text style={styles.label}>Scenario</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={scenario}
            onChangeText={setScenario}
            placeholder="Doel van het gesprek"
            placeholderTextColor={theme.textFaint}
            multiline
          />
          <View style={styles.chips}>
            {scenarioSuggestions.map((s) => (
              <Chip key={s} text={s} active={scenario === s} onPress={() => setScenario(s)} />
            ))}
          </View>

          <Text style={[styles.label, styles.labelSpaced]}>AI-persona</Text>
          <TextInput
            style={styles.input}
            value={persona}
            onChangeText={setPersona}
            placeholder="Wie speelt de AI?"
            placeholderTextColor={theme.textFaint}
          />
          <View style={styles.chips}>
            {personaSuggestions.map((p) => (
              <Chip key={p} text={p} active={persona === p} onPress={() => setPersona(p)} />
            ))}
          </View>

          <Pressable onPress={onOpenKnowledgeBase} style={styles.kbRow}>
            <Text style={[styles.kbStatus, hasKnowledgeBase ? styles.kbOn : styles.kbOff]}>
              {hasKnowledgeBase ? 'Kennisbank actief' : 'Geen kennisbank — tik om in te vullen'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onStart({ scenario: scenario.trim(), persona: persona.trim() })}
            disabled={!canStart}
            style={[styles.startBtn, !canStart && styles.startDisabled]}
          >
            <Text style={styles.startText}>Gesprek starten</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  flex: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  title: { color: theme.text, fontSize: 26, fontWeight: '800', marginTop: 12, marginBottom: 24 },
  label: { color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  labelSpaced: { marginTop: 24 },
  input: {
    backgroundColor: theme.inputBg,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    color: theme.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 56, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    backgroundColor: theme.surfaceAlt,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  chipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  chipText: { color: theme.textMuted, fontSize: 13 },
  chipTextActive: { color: theme.onAccent, fontWeight: '700' },
  kbRow: { marginTop: 24 },
  kbStatus: { fontSize: 13, fontWeight: '600' },
  kbOn: { color: theme.success },
  kbOff: { color: theme.accentDark },
  startBtn: {
    marginTop: 20,
    backgroundColor: theme.accent,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startDisabled: { backgroundColor: theme.textFaint },
  startText: { color: theme.onAccent, fontSize: 17, fontWeight: '800' },
});
