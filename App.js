import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import SetupScreen from './src/screens/SetupScreen';
import CallScreen from './src/screens/CallScreen';

export default function App() {
  // Pre-call setup ({ scenario, persona }) gates the call screen. Returning to
  // setup (onExit) clears it, which remounts CallScreen fresh for the next call.
  const [setup, setSetup] = useState(null);

  return (
    <>
      <StatusBar style="light" />
      {setup ? (
        <CallScreen setup={setup} onExit={() => setSetup(null)} />
      ) : (
        <SetupScreen onStart={setSetup} />
      )}
    </>
  );
}
