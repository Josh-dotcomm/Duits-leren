import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
} from 'react-native';
import { theme } from '../config/theme';
import { addEntry, deleteEntry } from '../api/dictionary';
import { CloseIcon, PlusIcon, TrashIcon } from '../components/icons';

const ARTICLES = ['', 'der', 'die', 'das'];

// The custom branch dictionary. Shows the shared base list plus team additions,
// lets you add new words/sentences, and delete your own additions.
export default function DictionaryScreen({ visible, onClose, entries, loading, loadError, userId, onChanged }) {
  const [tab, setTab] = useState('word'); // 'word' | 'sentence'
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  // add-form state
  const [nl, setNl] = useState('');
  const [de, setDe] = useState('');
  const [article, setArticle] = useState('');
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => e.type === tab)
      .filter((e) =>
        !q ||
        (e.dutch || '').toLowerCase().includes(q) ||
        (e.german || '').toLowerCase().includes(q)
      );
  }, [entries, tab, query]);

  const resetForm = () => {
    setNl('');
    setDe('');
    setArticle('');
    setCategory('');
    setError('');
  };

  const submit = async () => {
    if (!nl.trim() || !de.trim()) {
      setError('Vul beide talen in.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await addEntry({
        type: tab,
        dutch: nl.trim(),
        german: de.trim(),
        article: tab === 'word' ? article : '',
        category: category.trim(),
      });
      resetForm();
      setAdding(false);
      await onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await deleteEntry(id);
      await onChanged?.();
    } catch (e) {
      setError(e.message);
    }
  };

  const renderItem = ({ item }) => {
    const mine = item.created_by && item.created_by === userId;
    return (
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.de}>
            {item.type === 'word' && item.article ? `${item.article} ` : ''}
            {item.german}
          </Text>
          <Text style={styles.nl}>{item.dutch}</Text>
        </View>
        {item.category ? <Text style={styles.cat}>{item.category}</Text> : null}
        {mine ? (
          <Pressable hitSlop={8} onPress={() => remove(item.id)} style={styles.del}>
            <TrashIcon size={16} color={theme.danger} />
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Woordenboek</Text>
          <Pressable hitSlop={8} onPress={onClose} style={styles.close}>
            <CloseIcon size={22} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.segment}>
          {[
            { k: 'word', label: 'Woorden' },
            { k: 'sentence', label: 'Zinnen' },
          ].map((s) => (
            <Pressable
              key={s.k}
              onPress={() => setTab(s.k)}
              style={[styles.segBtn, tab === s.k && styles.segActive]}
            >
              <Text style={[styles.segText, tab === s.k && styles.segTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.toolbar}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Zoeken"
            placeholderTextColor={theme.textFaint}
            autoCapitalize="none"
          />
          <Pressable onPress={() => setAdding((v) => !v)} style={styles.addToggle}>
            <PlusIcon size={18} color={theme.onAccent} />
          </Pressable>
        </View>

        {adding ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={nl}
              onChangeText={setNl}
              placeholder="Nederlands"
              placeholderTextColor={theme.textFaint}
            />
            <TextInput
              style={styles.input}
              value={de}
              onChangeText={setDe}
              placeholder="Duits"
              placeholderTextColor={theme.textFaint}
            />
            {tab === 'word' ? (
              <View style={styles.articleRow}>
                {ARTICLES.map((a) => (
                  <Pressable
                    key={a || 'geen'}
                    onPress={() => setArticle(a)}
                    style={[styles.articleBtn, article === a && styles.articleActive]}
                  >
                    <Text style={[styles.articleText, article === a && styles.articleTextActive]}>
                      {a || 'geen'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="Categorie (optioneel)"
              placeholderTextColor={theme.textFaint}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable onPress={submit} disabled={busy} style={[styles.save, busy && styles.disabled]}>
              {busy ? (
                <ActivityIndicator color={theme.onAccent} />
              ) : (
                <Text style={styles.saveText}>Toevoegen</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {loadError ? <Text style={styles.loadError}>Laden mislukt: {loadError}</Text> : null}

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.empty}>Niets gevonden.</Text>}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { color: theme.text, fontSize: 24, fontWeight: '800' },
  close: { padding: 4 },
  segment: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  segBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceAlt,
  },
  segActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  segText: { color: theme.textMuted, fontSize: 14, fontWeight: '700' },
  segTextActive: { color: theme.onAccent },
  toolbar: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 8 },
  search: {
    flex: 1,
    backgroundColor: theme.inputBg,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    color: theme.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addToggle: {
    width: 44,
    borderRadius: 12,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    gap: 8,
  },
  input: {
    backgroundColor: theme.inputBg,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    color: theme.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  articleRow: { flexDirection: 'row', gap: 8 },
  articleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceAlt,
  },
  articleActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  articleText: { color: theme.textMuted, fontSize: 13, fontWeight: '700' },
  articleTextActive: { color: theme.onAccent },
  error: { color: theme.danger, fontSize: 13 },
  save: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  saveText: { color: theme.onAccent, fontSize: 15, fontWeight: '800' },
  listContent: { padding: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  rowText: { flex: 1 },
  de: { color: theme.text, fontSize: 16, fontWeight: '600' },
  nl: { color: theme.textMuted, fontSize: 13, marginTop: 2 },
  cat: { color: theme.textFaint, fontSize: 11, marginLeft: 8 },
  del: { padding: 6, marginLeft: 6 },
  empty: { color: theme.textFaint, fontSize: 14, textAlign: 'center', marginTop: 24 },
  loadError: { color: theme.danger, fontSize: 13, paddingHorizontal: 20, paddingBottom: 8, lineHeight: 19 },
});
