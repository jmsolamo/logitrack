import { getSupabase } from '../db/supabase.js';
import { toApiId, idLookup } from '../utils/entityId.js';

const map = (r) =>
  r
    ? {
        _id: toApiId(r),
        plateNumber: r.plate_number,
        destination: r.destination,
        charge: Number(r.charge),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    : null;

export const listCharges = async (_pool) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('delivery_charges').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(map);
};

export const calculateDeliveryCharge = async (_pool, plateNumber, destinations) => {
  if (!plateNumber || !destinations || !destinations.length) return 0;
  const plate = String(plateNumber).toUpperCase();
  const upper = destinations.map((d) => String(d).toUpperCase());
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('delivery_charges')
    .select('destination, charge')
    .eq('plate_number', plate)
    .in('destination', upper);
  if (error) throw error;
  let total = 0;
  for (const dest of destinations) {
    const u = String(dest).toUpperCase();
    const m = (data || []).find((c) => c.destination === u);
    if (m) total += Number(m.charge);
  }
  return total;
};

export const createCharge = async (_pool, body) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('delivery_charges').insert({
    plate_number: String(body.plateNumber).toUpperCase(),
    destination: String(body.destination).toUpperCase(),
    charge: Number(body.charge),
  }).select().single();
  if (error) throw error;
  return map(data);
};

export const updateCharge = async (_pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const updates = {};
  if (body.plateNumber !== undefined) updates.plate_number = String(body.plateNumber).toUpperCase();
  if (body.destination !== undefined) updates.destination = String(body.destination).toUpperCase();
  if (body.charge !== undefined) updates.charge = Number(body.charge);
  const { data, error } = await supabase.from('delivery_charges').update(updates).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return map(data);
};

export const deleteCharge = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { error } = await supabase.from('delivery_charges').delete().eq('id', id);
  if (error) throw error;
  return true;
};
