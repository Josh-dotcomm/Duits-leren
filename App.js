import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SetupScreen from './src/screens/SetupScreen';
import CallScreen from './src/screens/CallScreen';
import KnowledgeBaseScreen from './src/screens/KnowledgeBaseScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import DictionaryScreen from './src/screens/DictionaryScreen';
import LearnScreen from './src/screens/LearnScreen';
import TabBar from './src/components/TabBar';
import { theme } from './src/config/theme';
import { defaultProfile } from './src/config/businessContext';
import { loadKnowledgeBase, saveKnowledgeBase } from './src/storage/knowledgeBase';
import { loadProfile, saveProfile, loadVoicePrefs, saveVoicePrefs } from './src/storage/profile';
import { setVoicePreferences } from './src/audio/voices';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { fetchDictionary } from './src/api/dictionary';
import { supabaseConfigured } from './src/api/supabase';

// The signed-in app: tabs + the dictionary modal.
function AuthedApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('call'); // 'call' | 'learn' | 'kb' | 'profile'
  const [setup, setSetup] = useState(null);
  const [knowledgeBaseText, setKnowledgeBaseText] = useState('');
  const [profile, setProfile] = useState(defaultProfile);
  const [voicePrefs, setVoicePrefs] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [dictionary, setDictionary] = useState([]);
  const [dictLoading, setDictLoading] = useState(true);
  const [dictError, setDictError] = useState('');
  const [dictVisible, setDictVisible] = useState(false);

  const refreshDictionary = async () => {
    try {
      setDictLoading(true);
      setDictError('');
      setDictionary(await fetchDictionary());
    } catch (e) {
      setDictError(e?.message || 'Het woordenboek kon niet geladen worden.');
    } finally {
      setDictLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const [kb, prof, vp] = await Promise.all([
        loadKnowledgeBase(),
        loadProfile(),
        loadVoicePrefs(),
      ]);
      setKnowledgeBaseText(kb);
      setProfile(prof);
      setVoicePrefs(vp);
      setVoicePreferences(vp);
      setLoaded(true);
    })();
    refreshDictionary();
  }, []);

  // Snapshot KB + profile + dictionary into the call config when a call starts.
  const startCall = (cfg) =>
    setSetup({ ...cfg, knowledgeBaseText, profile, dictionary });

  const handleSaveProfile = async (nextProfile, nextVoicePrefs) => {
    setProfile(nextProfile);
    setVoicePrefs(nextVoicePrefs);
    setVoicePreferences(nextVoicePrefs);
    const [a, b] = await Promise.all([
      saveProfile(nextProfile),
      saveVoicePrefs(nextVoicePrefs),
    ]);
    return a && b;
  };

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <View style={[styles.fill, activeTab !== 'call' && styles.hidden]}>
          {setup ? (
            <CallScreen setup={setup} onExit={() => setSetup(null)} />
          ) : (
            <SetupScreen
              onStart={startCall}
              hasKnowledgeBase={!!knowledgeBaseText.trim()}
              onOpenKnowledgeBase={() => setActiveTab('kb')}
              onOpenDictionary={() => setDictVisible(true)}
            />
          )}
        </View>

        <View style={[styles.fill, activeTab !== 'learn' && styles.hidden]}>
          <LearnScreen
            dictionary={dictionary}
            userId={user?.id}
            loading={dictLoading}
            error={dictError}
            configured={supabaseConfigured}
            onRetry={refreshDictionary}
            onOpenDictionary={() => setDictVisible(true)}
          />
        </View>

        <View style={[styles.fill, activeTab !== 'kb' && styles.hidden]}>
          <KnowledgeBaseScreen
            value={knowledgeBaseText}
            onChange={setKnowledgeBaseText}
            onSave={saveKnowledgeBase}
          />
        </View>

        <View style={[styles.fill, activeTab !== 'profile' && styles.hidden]}>
          {loaded ? (
            <ProfileScreen profile={profile} voicePrefs={voicePrefs} onSave={handleSaveProfile} />
          ) : null}
        </View>
      </View>

      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      <DictionaryScreen
        visible={dictVisible}
        onClose={() => setDictVisible(false)}
        entries={dictionary}
        loading={dictLoading}
        loadError={dictError}
        userId={user?.id}
        onChanged={refreshDictionary}
      />
    </View>
  );
}

// Decides between splash, login and the app based on the auth session.
function Root() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }
  return session ? <AuthedApp /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Root />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  body: { flex: 1 },
  fill: { flex: 1 },
  hidden: { display: 'none' },
  splash: { flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
});
