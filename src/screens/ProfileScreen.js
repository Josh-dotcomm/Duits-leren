import React, { useEffect, useState } from 'react';
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
import * as Speech from 'expo-speech';
import { theme } from '../config/theme';
import { getVoicesByLanguage } from '../audio/voices';
import { CheckIcon, PlayIcon } from '../components/icons';

const SAMPLES = {
  nl: { language: 'nl-NL', text: 'Hallo, dit is een voorbeeld van deze stem.' },
  de: { language: 'de-DE', text: 'Guten Tag, das ist ein Beispiel dieser Stimme.' },
};

function qualityLabel(v) {
  return v.quality === Speech.VoiceQuality.Enhanced ? 'Verbeterd' : 'Standaard';
}

function VoiceRow({ label, sub, selected, onSelect, onPreview }) {
  return (
    <Pressable style={[styles.voiceRow, selected && styles.voiceRowActive]} onPress={onSelect}>
      <View style={styles.check}>{selected ? <CheckIcon size={16} color={theme.accent} /> : null}</View>
      <View style={styles.voiceText}>
        <Text style={styles.voiceName} numberOfLines={1}>{label}</Text>
        {sub ? <Text style={styles.voiceSub}>{sub}</Text> : null}
      </View>
      {onPreview ? (
        <Pressable hitSlop={8} onPress={onPreview} style={styles.playBtn}>
          <PlayIcon size={16} color={theme.textMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function VoiceSection({ title, lang, voices, selectedId, onChange }) {
  const preview = (voiceId) => {
    Speech.stop();
    Speech.speak(SAMPLES[lang].text, { language: SAMPLES[lang].language, voice: voiceId });
  };
  return (
    <View style={styles.voiceSection}>
      <Text style={styles.voiceTitle}>{title}</Text>
      <VoiceRow
        label="Automatisch (beste)"
        selected={!selectedId}
        onSelect={() => onChange(undefined)}
      />
      {voices.map((v) => (
        <VoiceRow
          key={v.identifier}
          label={v.name || v.identifier}
          sub={`${v.language} · ${qualityLabel(v)}`}
          selected={selectedId === v.identifier}
          onSelect={() => onChange(v.identifier)}
          onPreview={() => preview(v.identifier)}
        />
      ))}
      {voices.length === 0 ? (
        <Text style={styles.voiceEmpty}>Geen stemmen gevonden op dit toestel.</Text>
      ) : null}
    </View>
  );
}

// Profiel tab: name / company / role (de-hardcoded, persisted) plus the on-device
// TTS voice picker. `onSave(profile, voicePrefs)` lifts both up to the app.
export default function ProfileScreen({ profile, voicePrefs, onSave }) {
  const [name, setName] = useState(profile.name || '');
  const [company, setCompany] = useState(profile.company || '');
  const [role, setRole] = useState(profile.role || '');
  const [prefs, setPrefs] = useState(voicePrefs || {});
  const [voices, setVoices] = useState({ nl: [], de: [] });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getVoicesByLanguage().then(setVoices);
  }, []);

  const touch = () => saved && setSaved(false);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave({ name: name.trim(), company: company.trim(), role: role.trim() }, prefs);
    setSaving(false);
    setSaved(ok);
  };

  const setVoice = (lang, id) => {
    setPrefs((p) => ({ ...p, [lang]: id }));
    touch();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Profiel</Text>

          <Text style={styles.label}>Naam</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(t) => { setName(t); touch(); }}
            placeholder="Je (achter)naam"
            placeholderTextColor={theme.textFaint}
          />

          <Text style={[styles.label, styles.labelSpaced]}>Bedrijf</Text>
          <TextInput
            style={styles.input}
            value={company}
            onChangeText={(t) => { setCompany(t); touch(); }}
            placeholder="Je bedrijf"
            placeholderTextColor={theme.textFaint}
          />

          <Text style={[styles.label, styles.labelSpaced]}>Functie (optioneel)</Text>
          <TextInput
            style={styles.input}
            value={role}
            onChangeText={(t) => { setRole(t); touch(); }}
            placeholder="Bijv. accountmanager"
            placeholderTextColor={theme.textFaint}
          />

          <Text style={[styles.label, styles.labelSpaced]}>Stemmen</Text>
          <Text style={styles.hint}>
            Installeer een verbeterde stem in je toestelinstellingen voor de beste kwaliteit.
          </Text>
          <VoiceSection
            title="Nederlands (feedback)"
            lang="nl"
            voices={voices.nl}
            selectedId={prefs.nl}
            onChange={(id) => setVoice('nl', id)}
          />
          <VoiceSection
            title="Duits (voorbeeld + antwoord)"
            lang="de"
            voices={voices.de}
            selectedId={prefs.de}
            onChange={(id) => setVoice('de', id)}
          />

          <Pressable onPress={handleSave} disabled={saving} style={[styles.saveBtn, saving && styles.disabled]}>
            <Text style={styles.saveText}>{saving ? 'Opslaan…' : saved ? 'Opgeslagen' : 'Opslaan'}</Text>
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
  title: { color: theme.text, fontSize: 26, fontWeight: '800', marginTop: 12, marginBottom: 20 },
  label: { color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  labelSpaced: { marginTop: 20 },
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
  hint: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  voiceSection: { marginBottom: 8 },
  voiceTitle: { color: theme.textMuted, fontSize: 12, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  voiceRowActive: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  check: { width: 22, alignItems: 'center' },
  voiceText: { flex: 1, paddingHorizontal: 6 },
  voiceName: { color: theme.text, fontSize: 14, fontWeight: '600' },
  voiceSub: { color: theme.textFaint, fontSize: 11, marginTop: 1 },
  playBtn: { padding: 6 },
  voiceEmpty: { color: theme.textFaint, fontSize: 12, fontStyle: 'italic', paddingVertical: 4 },
  saveBtn: {
    marginTop: 24,
    backgroundColor: theme.accent,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  saveText: { color: theme.onAccent, fontSize: 17, fontWeight: '800' },
});
