import { supabase } from './supabase';

// Per-user learning progress. `ref` identifies a dictionary item ('db:<uuid>').
// status becomes 'known' after a few correct answers; otherwise 'learning'.

export async function fetchProgress() {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return {};
  const { data, error } = await supabase
    .from('progress')
    .select('ref, status, seen_count, correct_count')
    .eq('user_id', u.user.id);
  if (error) throw error;
  const map = {};
  (data || []).forEach((r) => {
    map[r.ref] = r;
  });
  return map;
}

export async function recordResult(ref, correct) {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return;
  const uid = u.user.id;
  const { data: existing } = await supabase
    .from('progress')
    .select('seen_count, correct_count')
    .eq('user_id', uid)
    .eq('ref', ref)
    .maybeSingle();
  const seen = (existing?.seen_count || 0) + 1;
  const corr = (existing?.correct_count || 0) + (correct ? 1 : 0);
  const status = corr >= 3 ? 'known' : 'learning';
  const { error } = await supabase
    .from('progress')
    .upsert(
      {
        user_id: uid,
        ref,
        seen_count: seen,
        correct_count: corr,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,ref' }
    );
  if (error) throw error;
}
