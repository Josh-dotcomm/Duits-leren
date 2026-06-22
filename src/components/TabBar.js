import React from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { theme } from '../config/theme';
import { PhoneIcon, BookIcon, UserIcon } from './icons';

const TABS = [
  { key: 'call', label: 'Gesprek', Icon: PhoneIcon },
  { key: 'kb', label: 'Kennisbank', Icon: BookIcon },
  { key: 'profile', label: 'Profiel', Icon: UserIcon },
];

// Persistent bottom tab bar: switch between the call flow, the knowledge base
// and the profile.
export default function TabBar({ activeTab, onChange }) {
  return (
    <View style={styles.bar}>
      {TABS.map(({ key, label, Icon }) => {
        const active = key === activeTab;
        const color = active ? theme.accent : theme.textFaint;
        return (
          <Pressable key={key} style={styles.tab} onPress={() => onChange(key)}>
            <Icon size={22} color={color} strokeWidth={active ? 2.4 : 2} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '700', marginTop: 3 },
});
