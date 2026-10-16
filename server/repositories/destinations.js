import { getSupabase } from '../db/supabase.js';
import { toApiId, idLookup } from '../utils/entityId.js';

const map = (r) =>
  r
    ? {
        _id: toApiId(r),
        name: r.destination,
        customerSupplier: r.customer_supplier,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    : null;

export const listDestinations = async (_pool) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('destinations').select('*').order('destination', { ascending: true });
  if (error) throw error;
  return (data || []).map(map);
};

export const findByName = async (_pool, name) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .ilike('destination', String(name).trim())
    .maybeSingle();
  if (error) throw error;
  return data || null;
};

export const findByCombination = async (_pool, name, customerSupplier) => {
  const supabase = getSupabase();
  let q = supabase.from('destinations').select('*').ilike('destination', String(name).trim());
  if (customerSupplier) {
    q = q.eq('customer_supplier', customerSupplier);
  } else {
    q = q.is('customer_supplier', null);
  }
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return map(data);
};

export const createDestination = async (_pool, body) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('destinations')
    .insert({
      destination: String(body.name).toUpperCase(),
      customer_supplier: body.customerSupplier || null,
    })
    .select()
    .single();
  if (error) throw error;
  return map(data);
};

export const updateDestination = async (_pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('destinations')
    .update({
      destination: String(body.name).toUpperCase(),
      customer_supplier: body.customerSupplier || null,
    })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return map(data);
};

export const deleteDestination = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { error } = await supabase.from('destinations').delete().eq('id', id);
  if (error) throw error;
  return true;
};
