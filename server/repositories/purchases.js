import { getPool } from '../db/pool.js';
import { toApiId } from '../utils/entityId.js';
import { idLookup } from '../utils/entityId.js';

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

export const listPurchases = async (pool) => {
  const [rows] = await pool.query('SELECT * FROM purchases ORDER BY date DESC, created_at DESC');
  return rows.map(map);
};

export const createPurchase = async (pool, body) => {
  const [r] = await pool.query(
    `INSERT INTO purchases (date, category, items, qty, amount, item_dates, item_amounts, supplier, invoice_no, purchased_by, budget, used_for_note)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      body.date,
      body.category,
      body.items,
      body.qty,
      body.amount,
      body.itemDates ?? null,
      body.itemAmounts ?? null,
      body.supplier ?? null,
      body.invoiceNo ?? null,
      body.purchasedBy ?? null,
      body.budget != null && body.budget !== '' ? Number(body.budget) : null,
      body.usedForNote ?? null,
    ],
  );
  const [rows] = await pool.query('SELECT * FROM purchases WHERE id = ?', [r.insertId]);
  return map(rows[0]);
};

export const updatePurchase = async (pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [ex] = await pool.query(`SELECT id FROM purchases WHERE ${lk.clause} LIMIT 1`, lk.params);
  if (!ex[0]) return null;
  const id = ex[0].id;
  const fields = [
    'date',
    'category',
    'items',
    'qty',
    'amount',
    'itemDates',
    'itemAmounts',
    'supplier',
    'invoiceNo',
    'purchasedBy',
    'budget',
    'usedForNote',
  ];
  const colMap = {
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
    budget: 'budget',
    usedForNote: 'used_for_note',
  };
  const sets = [];
  const vals = [];
  for (const k of fields) {
    if (body[k] !== undefined) {
      sets.push(`${colMap[k]} = ?`);
      vals.push(k === 'budget' && body[k] !== '' && body[k] != null ? Number(body[k]) : body[k] ?? null);
    }
  }
  if (sets.length) {
    vals.push(id);
    await pool.query(`UPDATE purchases SET ${sets.join(', ')} WHERE id = ?`, vals);
  }
  const [rows] = await pool.query('SELECT * FROM purchases WHERE id = ?', [id]);
  return map(rows[0]);
};

export const deletePurchase = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const [r] = await pool.query(`DELETE FROM purchases WHERE ${lk.clause}`, lk.params);
  return r.affectedRows > 0;
};
