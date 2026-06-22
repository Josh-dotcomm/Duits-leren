import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SetupScreen from './src/screens/SetupScreen';
import CallScreen from './src/screens/CallScreen';
import KnowledgeBaseScreen from './src/screens/KnowledgeBaseScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TabBar from './src/components/TabBar';
import { theme } from './src/config/theme';
import { defaultProfile } from './src/config/businessContext';
import { loadKnowledgeBase, saveKnowledgeBase } from './src/storage/knowledgeBase';
import { loadProfile, saveProfile, loadVoicePrefs, saveVoicePrefs } from './src/storage/profile';
import { setVoicePreferences } from './src/audio/voices';

export default function App() {
  const [activeTab, setActiveTab] = useState('call'); // 'call' | 'kb' | 'profile'
  const [setup, setSetup] = useState(null); // { scenario, persona, knowledgeBaseText, profile }
  const [knowledgeBaseText, setKnowledgeBaseText] = useState('');
  const [profile, setProfile] = useState(defaultProfile);
  const [voicePrefs, setVoicePrefs] = useState({});
  const [loaded, setLoaded] = useState(false);

  // Load all persisted data once on startup.
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
      setVoicePreferences(vp); // tell the TTS layer which voices to use
      setLoaded(true);
    })();
  }, []);

  // Snapshot the current knowledge base + profile into the call config.
  const startCall = (cfg) => setSetup({ ...cfg, knowledgeBaseText, profile });

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

  // Both/all tabs stay mounted (toggled with display:none) so an in-progress
  // call (and its recording / TTS state) survives switching tabs.
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <View style={[styles.fill, activeTab !== 'call' && styles.hidden]}>
          {setup ? (
            <CallScreen setup={setup} onExit={() => setSetup(null)} />
          ) : (
            <SetupScreen
              onStart={startCall}
              hasKnowledgeBase={!!knowledgeBaseText.trim()}
              onOpenKnowledgeBase={() => setActiveTab('kb')}
            />
          )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  body: { flex: 1 },
  fill: { flex: 1 },
  hidden: { display: 'none' },
});
