import { getSupabase } from '../db/supabase.js';
import { toApiId, idLookup } from '../utils/entityId.js';

const map = (r) =>
  r
    ? {
        _id: toApiId(r),
        date: r.date,
        category: r.category,
        items: r.items,
        qty: r.qty,
        amount: r.amount,
        itemDates: r.item_dates,
        itemAmounts: r.item_amounts,
        supplier: r.supplier,
        invoiceNo: r.invoice_no,
        purchasedBy: r.purchased_by,
        budget: r.budget != null ? Number(r.budget) : undefined,
        usedForNote: r.used_for_note,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    : null;

export const listPurchases = async (_pool) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(map);
};

export const createPurchase = async (_pool, body) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('purchases').insert({
    date: body.date,
    category: body.category,
    items: body.items,
    qty: body.qty,
    amount: body.amount,
    item_dates: body.itemDates ?? null,
    item_amounts: body.itemAmounts ?? null,
    supplier: body.supplier ?? null,
    invoice_no: body.invoiceNo ?? null,
    purchased_by: body.purchasedBy ?? null,
    budget: body.budget != null && body.budget !== '' ? Number(body.budget) : null,
    used_for_note: body.usedForNote ?? null,
  }).select().single();
  if (error) throw error;
  return map(data);
};

export const updatePurchase = async (_pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const updates = {};
  const stringFields = {
    date: 'date',
    category: 'category',
    items: 'items',
    qty: 'qty',
    amount: 'amount',
    itemDates: 'item_dates',
    itemAmounts: 'item_amounts',
    supplier: 'supplier',
    invoiceNo: 'invoice_no',
    purchasedBy: 'purchased_by',
    usedForNote: 'used_for_note',
  };
  for (const [k, col] of Object.entries(stringFields)) {
    if (body[k] !== undefined) updates[col] = body[k] ?? null;
  }
  if (body.budget !== undefined) {
    updates.budget = body.budget != null && body.budget !== '' ? Number(body.budget) : null;
  }
  const { data, error } = await supabase.from('purchases').update(updates).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return map(data);
};

export const deletePurchase = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { error } = await supabase.from('purchases').delete().eq('id', id);
  if (error) throw error;
  return true;
};
