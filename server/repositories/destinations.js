import { getPool } from '../db/pool.js';
import { toApiId } from '../utils/entityId.js';
import { idLookup } from '../utils/entityId.js';

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

export const listDestinations = async (pool) => {
  const [rows] = await pool.query('SELECT * FROM destinations ORDER BY destination ASC');
  return rows.map(map);
};

export const findByName = async (pool, name) => {
  const [rows] = await pool.query('SELECT * FROM destinations WHERE destination = ? LIMIT 1', [String(name).toUpperCase()]);
  return rows[0] || null;
};

export const findByCombination = async (pool, name, customerSupplier) => {
  const [rows] = await pool.query(
    'SELECT * FROM destinations WHERE destination = ? AND customer_supplier <=> ? LIMIT 1',
    [String(name).toUpperCase(), customerSupplier || null]
  );
  return map(rows[0]);
};

export const createDestination = async (pool, body) => {
  const [r] = await pool.query(`INSERT INTO destinations (destination, customer_supplier) VALUES (?, ?)`, [
    String(body.name).toUpperCase(),
    body.customerSupplier || null
  ]);
  const [rows] = await pool.query('SELECT * FROM destinations WHERE id = ?', [r.insertId]);
  return map(rows[0]);
};

export const updateDestination = async (pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [ex] = await pool.query(`SELECT id FROM destinations WHERE ${lk.clause} LIMIT 1`, lk.params);
  if (!ex[0]) return null;
  const id = ex[0].id;
  await pool.query(`UPDATE destinations SET destination = ?, customer_supplier = ? WHERE id = ?`, [
    String(body.name).toUpperCase(),
    body.customerSupplier || null,
    id
  ]);
  const [rows] = await pool.query('SELECT * FROM destinations WHERE id = ?', [id]);
  return map(rows[0]);
};

export const deleteDestination = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const [r] = await pool.query(`DELETE FROM destinations WHERE ${lk.clause}`, lk.params);
  return r.affectedRows > 0;
};
