import { getSupabase } from '../db/supabase.js';
import { toApiId, idLookup } from '../utils/entityId.js';

const mapDepartment = (r) =>
  r
    ? {
        _id: toApiId(r),
        id: r.id,
        name: r.name,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    : null;

export const listDepartments = async (_pool) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('departments').select('*').order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapDepartment);
};

export const createDepartment = async (_pool, { name }) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('departments').insert({ name }).select().single();
  if (error) throw error;
  return mapDepartment(data);
};

export const updateDepartmentByIdParam = async (_pool, param, { name }) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { data, error } = await supabase.from('departments').update({ name }).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return mapDepartment(data);
};

export const deleteDepartmentByIdParam = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw error;
  return true;
};
