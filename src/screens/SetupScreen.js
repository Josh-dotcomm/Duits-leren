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

function Chip({ text, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{text}</Text>
    </Pressable>
  );
}

// Pre-call setup: choose the scenario (goal of the call) and the AI persona.
// These are injected into the LLM system prompt by useConversation/buildSystemPrompt.
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
          <Text style={styles.title}>Business German Coach</Text>
          <Text style={styles.subtitle}>Stel je gesprek in voordat je belt.</Text>

          <Text style={styles.label}>Scenario — wat is het doel van dit gesprek?</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={scenario}
            onChangeText={setScenario}
            placeholder="bijv. Bellen over een monsterpakket"
            placeholderTextColor="#6B7280"
            multiline
          />
          <View style={styles.chips}>
            {scenarioSuggestions.map((s) => (
              <Chip key={s} text={s} active={scenario === s} onPress={() => setScenario(s)} />
            ))}
          </View>

          <Text style={[styles.label, styles.labelSpaced]}>AI-persona — wie speelt de AI?</Text>
          <TextInput
            style={styles.input}
            value={persona}
            onChangeText={setPersona}
            placeholder="bijv. Supermarktmanager"
            placeholderTextColor="#6B7280"
          />
          <View style={styles.chips}>
            {personaSuggestions.map((p) => (
              <Chip key={p} text={p} active={persona === p} onPress={() => setPersona(p)} />
            ))}
          </View>

          <Pressable onPress={onOpenKnowledgeBase} style={styles.kbRow}>
            <Text style={[styles.kbStatus, hasKnowledgeBase ? styles.kbOn : styles.kbOff]}>
              {hasKnowledgeBase
                ? '✓ Kennisbank actief — de AI test je hierop'
                : '⚠ Geen kennisbank — tik om in te vullen voor scherpere vragen'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onStart({ scenario: scenario.trim(), persona: persona.trim() })}
            disabled={!canStart}
            style={[styles.startBtn, !canStart && styles.startDisabled]}
          >
            <Text style={styles.startText}>Gesprek starten →</Text>
          </Pressable>

          <Text style={styles.note}>
            De AI speelt strikt deze persona, test je op de kennisbank en blijft
            doorvragen — het gesprek stopt nooit vanzelf.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B1220',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  flex: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  title: { color: '#F9FAFB', fontSize: 26, fontWeight: '800', marginTop: 12 },
  subtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 4, marginBottom: 24 },
  label: { color: '#E5E7EB', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  labelSpaced: { marginTop: 24 },
  input: {
    backgroundColor: '#111827',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 12,
    color: '#F9FAFB',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  chipText: { color: '#D1D5DB', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  kbRow: { marginTop: 24 },
  kbStatus: { fontSize: 13, fontWeight: '600' },
  kbOn: { color: '#6EE7B7' },
  kbOff: { color: '#FBBF24' },
  startBtn: {
    marginTop: 16,
    backgroundColor: '#10B981',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startDisabled: { backgroundColor: '#374151' },
  startText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  note: { color: '#6B7280', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 16 },
});
