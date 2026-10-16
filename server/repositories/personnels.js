import { getSupabase } from '../db/supabase.js';
import { toApiId, idLookup } from '../utils/entityId.js';

const map = (r) =>
  r
    ? {
        _id: toApiId(r),
        firstname: r.firstname,
        lastname: r.lastname,
        position: r.position,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    : null;

export const listPersonnels = async (_pool) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('personnels').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(map);
};

export const createPersonnel = async (_pool, body) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('personnels').insert({
    firstname: body.firstname,
    lastname: body.lastname,
    position: body.position,
  }).select().single();
  if (error) throw error;
  return map(data);
};

export const updatePersonnel = async (_pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { data, error } = await supabase.from('personnels').update({
    firstname: body.firstname,
    lastname: body.lastname,
    position: body.position,
  }).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return map(data);
};

export const deletePersonnel = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { error } = await supabase.from('personnels').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const countPersonnels = async (_pool) => {
  const supabase = getSupabase();
  const { count, error } = await supabase.from('personnels').select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
};
