import { getPool } from '../db/pool.js';
import { toApiId } from '../utils/entityId.js';
import { idLookup } from '../utils/entityId.js';

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

export const listCharges = async (pool) => {
  const [rows] = await pool.query('SELECT * FROM delivery_charges ORDER BY created_at DESC');
  return rows.map(map);
};

export const calculateDeliveryCharge = async (pool, plateNumber, destinations) => {
  if (!plateNumber || !destinations || !destinations.length) return 0;
  const plate = String(plateNumber).toUpperCase();
  const upper = destinations.map((d) => String(d).toUpperCase());
  const placeholders = upper.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT destination, charge FROM delivery_charges WHERE plate_number = ? AND destination IN (${placeholders})`,
    [plate, ...upper],
  );
  let total = 0;
  for (const dest of destinations) {
    const u = String(dest).toUpperCase();
    const m = rows.find((c) => c.destination === u);
    if (m) total += Number(m.charge);
  }
  return total;
};

export const createCharge = async (pool, body) => {
  const [r] = await pool.query(
    `INSERT INTO delivery_charges (plate_number, destination, charge) VALUES (?,?,?)`,
    [String(body.plateNumber).toUpperCase(), String(body.destination).toUpperCase(), Number(body.charge)],
  );
  const [rows] = await pool.query('SELECT * FROM delivery_charges WHERE id = ?', [r.insertId]);
  return map(rows[0]);
};

export const updateCharge = async (pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [rows] = await pool.query(`SELECT id FROM delivery_charges WHERE ${lk.clause} LIMIT 1`, lk.params);
  if (!rows[0]) return null;
  const id = rows[0].id;
  await pool.query(`UPDATE delivery_charges SET plate_number = ?, destination = ?, charge = ? WHERE id = ?`, [
    String(body.plateNumber).toUpperCase(),
    String(body.destination).toUpperCase(),
    Number(body.charge),
    id,
  ]);
  const [out] = await pool.query('SELECT * FROM delivery_charges WHERE id = ?', [id]);
  return map(out[0]);
};

export const deleteCharge = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const [r] = await pool.query(`DELETE FROM delivery_charges WHERE ${lk.clause}`, lk.params);
  return r.affectedRows > 0;
};
