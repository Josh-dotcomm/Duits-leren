import React from 'react';
import { StatusBar } from 'expo-status-bar';
import CallScreen from './src/screens/CallScreen';

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <CallScreen />
    </>
  );
}
