import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
} from 'react-native';
import { theme } from '../config/theme';
import { useDictation } from '../hooks/useDictation';
import { MicIcon, StopIcon } from '../components/icons';

// The Kennisbank: a large multiline field where the user pastes (or dictates)
// all their company info, working methods and USPs. Persisted via AsyncStorage
// by the parent (App).
export default function KnowledgeBaseScreen({ value, onChange, onSave }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Dictation: transcript is appended to the existing text (Dutch).
  const appendText = useCallback(
    (t) => {
      setSaved(false);
      onChange((prev) => (prev && prev.trim() ? `${prev.trimEnd()}\n${t}` : t));
    },
    [onChange]
  );
  const dictation = useDictation({ language: 'nl', onText: appendText });

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(value);
    setSaving(false);
    setSaved(ok);
  };

  let micHint = 'Inspreken';
  if (dictation.isRecording) micHint = 'Stop';
  else if (dictation.isTranscribing) micHint = '…';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Kennisbank</Text>
        </View>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(t) => {
            onChange(t);
            if (saved) setSaved(false);
          }}
          placeholder="Bedrijfsinfo, werkwijzen, USP's…"
          placeholderTextColor={theme.textFaint}
          multiline
          textAlignVertical="top"
          scrollEnabled
        />

        <View style={styles.footer}>
          <Pressable
            onPress={dictation.isTranscribing ? undefined : dictation.toggle}
            disabled={dictation.isTranscribing}
            style={[styles.micBtn, dictation.isRecording && styles.micBtnRecording]}
          >
            {dictation.isTranscribing ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : dictation.isRecording ? (
              <StopIcon size={16} color={theme.onAccent} />
            ) : (
              <MicIcon size={16} color={theme.accent} strokeWidth={2.2} />
            )}
            <Text style={[styles.micText, dictation.isRecording && styles.micTextRecording]}>
              {micHint}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.disabled]}
          >
            <Text style={styles.saveText}>{saving ? 'Opslaan…' : saved ? 'Opgeslagen' : 'Opslaan'}</Text>
          </Pressable>
        </View>
        {dictation.error ? <Text style={styles.error}>{dictation.error}</Text> : null}
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  title: { color: theme.text, fontSize: 24, fontWeight: '800' },
  input: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: theme.inputBg,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    color: theme.text,
    fontSize: 15,
    lineHeight: 21,
    padding: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  micBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderStrong,
  },
  micBtnRecording: { backgroundColor: theme.accentDark, borderColor: theme.accentDark },
  micText: { color: theme.accent, fontSize: 14, fontWeight: '700' },
  micTextRecording: { color: theme.onAccent },
  saveBtn: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  disabled: { opacity: 0.5 },
  saveText: { color: theme.onAccent, fontSize: 16, fontWeight: '800' },
  error: { color: theme.danger, fontSize: 12, paddingHorizontal: 20, paddingTop: 6 },
});
