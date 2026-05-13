import { getPool } from '../db/pool.js';
import { toApiId } from '../utils/entityId.js';
import { idLookup } from '../utils/entityId.js';

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

export const listPersonnels = async (pool) => {
  const [rows] = await pool.query('SELECT * FROM personnels ORDER BY created_at DESC');
  return rows.map(map);
};

export const createPersonnel = async (pool, body) => {
  const [r] = await pool.query(`INSERT INTO personnels (firstname, lastname, position) VALUES (?,?,?)`, [
    body.firstname,
    body.lastname,
    body.position,
  ]);
  const [rows] = await pool.query('SELECT * FROM personnels WHERE id = ?', [r.insertId]);
  return map(rows[0]);
};

export const updatePersonnel = async (pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [ex] = await pool.query(`SELECT id FROM personnels WHERE ${lk.clause} LIMIT 1`, lk.params);
  if (!ex[0]) return null;
  const id = ex[0].id;
  await pool.query(`UPDATE personnels SET firstname = ?, lastname = ?, position = ? WHERE id = ?`, [
    body.firstname,
    body.lastname,
    body.position,
    id,
  ]);
  const [rows] = await pool.query('SELECT * FROM personnels WHERE id = ?', [id]);
  return map(rows[0]);
};

export const deletePersonnel = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const [r] = await pool.query(`DELETE FROM personnels WHERE ${lk.clause}`, lk.params);
  return r.affectedRows > 0;
};

export const countPersonnels = async (pool) => {
  const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM personnels');
  return r.c;
};
