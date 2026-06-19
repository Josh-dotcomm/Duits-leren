import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
} from 'react-native';

// The Kennisbank: a large multiline field where the user pastes all their
// company info, working methods and USPs. Persisted via AsyncStorage by the
// parent (App), which passes the value + change/save handlers in.
export default function KnowledgeBaseScreen({ value, onChange, onSave }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(value);
    setSaving(false);
    setSaved(ok);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Kennisbank</Text>
          <Text style={styles.subtitle}>
            Plak hier alle bedrijfsinformatie, werkwijzen en USP's (bijv. het
            “Family Chicken”-document). De AI gebruikt dit om je tijdens het gesprek
            kritisch te testen. Het wordt lokaal op dit apparaat bewaard.
          </Text>
        </View>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(t) => {
            onChange(t);
            if (saved) setSaved(false);
          }}
          placeholder="Plak hier: bedrijfsinfo, werkwijzen, USP's, prijsbeleid, certificeringen, veelgestelde vragen…"
          placeholderTextColor="#6B7280"
          multiline
          textAlignVertical="top"
          scrollEnabled
        />

        <View style={styles.footer}>
          <Text style={styles.count}>{value ? value.length : 0} tekens</Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.disabled]}
          >
            <Text style={styles.saveText}>{saving ? 'Opslaan…' : 'Opslaan'}</Text>
          </Pressable>
        </View>
        {saved ? <Text style={styles.savedNote}>✓ Opgeslagen op dit apparaat</Text> : null}
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  title: { color: '#F9FAFB', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#9CA3AF', fontSize: 13, lineHeight: 19, marginTop: 6 },
  input: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: '#111827',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 12,
    color: '#F9FAFB',
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
  },
  count: { color: '#6B7280', fontSize: 12 },
  saveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  disabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  savedNote: { color: '#6EE7B7', fontSize: 12, textAlign: 'right', paddingHorizontal: 20, paddingTop: 8 },
});
