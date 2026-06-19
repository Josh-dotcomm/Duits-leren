import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SetupScreen from './src/screens/SetupScreen';
import CallScreen from './src/screens/CallScreen';
import KnowledgeBaseScreen from './src/screens/KnowledgeBaseScreen';
import TabBar from './src/components/TabBar';
import { loadKnowledgeBase, saveKnowledgeBase } from './src/storage/knowledgeBase';

export default function App() {
  const [activeTab, setActiveTab] = useState('call'); // 'call' | 'kb'
  const [setup, setSetup] = useState(null); // { scenario, persona, knowledgeBaseText }
  const [knowledgeBaseText, setKnowledgeBaseText] = useState('');

  // Load the persisted knowledge base once on startup.
  useEffect(() => {
    loadKnowledgeBase().then(setKnowledgeBaseText);
  }, []);

  // Snapshot the current knowledge base into the call config when a call starts.
  const startCall = (cfg) => setSetup({ ...cfg, knowledgeBaseText });

  // Both tabs stay mounted (toggled with display:none) so an in-progress call —
  // and its push-to-talk / TTS state — survives switching to the Kennisbank.
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
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
      </View>

      <TabBar activeTab={activeTab} onChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1220' },
  body: { flex: 1 },
  fill: { flex: 1 },
  hidden: { display: 'none' },
});
