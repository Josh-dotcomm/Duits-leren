import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { theme } from '../config/theme';
import { useAuth } from '../hooks/useAuth';
import { supabaseConfigured } from '../api/supabase';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async () => {
    setError('');
    setNotice('');
    if (!email.trim() || !password) {
      setError('Vul e-mail en wachtwoord in.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error: e } = await signIn(email, password);
        if (e) setError(e.message);
      } else {
        const { data, error: e } = await signUp(email, password);
        if (e) {
          setError(e.message);
        } else if (!data.session) {
          setNotice('Account aangemaakt. Bevestig je e-mail en log daarna in.');
          setMode('signin');
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Business German Coach</Text>
          <Text style={styles.subtitle}>
            {mode === 'signin' ? 'Log in om te oefenen' : 'Maak een account aan'}
          </Text>

          {!supabaseConfigured ? (
            <View style={styles.warn}>
              <Text style={styles.warnText}>
                Supabase is niet geconfigureerd. Zet EXPO_PUBLIC_SUPABASE_URL en
                EXPO_PUBLIC_SUPABASE_ANON_KEY in je .env en herstart de server.
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="naam@bedrijf.nl"
            placeholderTextColor={theme.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={[styles.label, styles.labelSpaced]}>Wachtwoord</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Minimaal 6 tekens"
            placeholderTextColor={theme.textFaint}
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={busy}
            style={[styles.button, busy && styles.disabled]}
          >
            {busy ? (
              <ActivityIndicator color={theme.onAccent} />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'signin' ? 'Inloggen' : 'Account aanmaken'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
              setNotice('');
            }}
            style={styles.switch}
          >
            <Text style={styles.switchText}>
              {mode === 'signin'
                ? 'Nog geen account? Maak er een aan'
                : 'Al een account? Log in'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 28 },
  title: { color: theme.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: theme.textMuted, fontSize: 15, marginTop: 4, marginBottom: 24 },
  warn: {
    backgroundColor: theme.dangerSoft,
    borderColor: 'rgba(178,58,46,0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  warnText: { color: theme.danger, fontSize: 12, lineHeight: 18 },
  label: { color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  labelSpaced: { marginTop: 16 },
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
  error: { color: theme.danger, fontSize: 13, marginTop: 14 },
  notice: { color: theme.success, fontSize: 13, marginTop: 14 },
  button: {
    marginTop: 24,
    backgroundColor: theme.accent,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: theme.onAccent, fontSize: 17, fontWeight: '800' },
  switch: { marginTop: 18, alignItems: 'center' },
  switchText: { color: theme.accentDark, fontSize: 14, fontWeight: '600' },
});
