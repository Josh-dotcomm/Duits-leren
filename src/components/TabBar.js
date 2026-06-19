import React from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';

const TABS = [
  { key: 'call', label: 'Gesprek', icon: '📞' },
  { key: 'kb', label: 'Kennisbank', icon: '📚' },
];

// Persistent bottom tab bar to switch between the call flow and the knowledge base.
export default function TabBar({ activeTab, onChange }) {
  return (
    <View style={styles.bar}>
      {TABS.map((t) => {
        const active = t.key === activeTab;
        return (
          <Pressable key={t.key} style={styles.tab} onPress={() => onChange(t.key)}>
            <Text style={[styles.icon, active && styles.activeIcon]}>{t.icon}</Text>
            <Text style={[styles.label, active && styles.activeLabel]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#0E1626',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20, opacity: 0.5 },
  activeIcon: { opacity: 1 },
  label: { color: '#6B7280', fontSize: 11, fontWeight: '700', marginTop: 2 },
  activeLabel: { color: '#3B82F6' },
});
