import { supabase } from './supabase';

// The dictionary is a single shared table: base rows (created_by null, seeded)
// plus team additions. Everyone reads everything; you can only edit/delete your
// own additions (enforced by RLS).

export async function fetchDictionary() {
  const { data, error } = await supabase
    .from('dictionary_entries')
    .select('id, type, dutch, german, article, category, created_by')
    .order('type', { ascending: true })
    .order('category', { ascending: true })
    .order('dutch', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addEntry({ type, dutch, german, article = '', category = '' }) {
  const { data: u } = await supabase.auth.getUser();
  const created_by = u?.user?.id;
  const { data, error } = await supabase
    .from('dictionary_entries')
    .insert({ type, dutch, german, article, category, created_by })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('dictionary_entries').delete().eq('id', id);
  if (error) throw error;
}
