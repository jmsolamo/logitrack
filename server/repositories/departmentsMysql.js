import { getPool } from '../db/pool.js';
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

export const listDepartments = async (pool) => {
  const [rows] = await pool.query('SELECT * FROM departments ORDER BY name ASC');
  return rows.map((r) => mapDepartment(r));
};

export const createDepartment = async (pool, { name }) => {
  const [r] = await pool.query('INSERT INTO departments (name) VALUES (?)', [name]);
  const [rows] = await pool.query('SELECT * FROM departments WHERE id = ?', [r.insertId]);
  return mapDepartment(rows[0]);
};

export const updateDepartmentByIdParam = async (pool, param, { name }) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [existing] = await pool.query(`SELECT id FROM departments WHERE ${lk.clause} LIMIT 1`, lk.params);
  if (!existing[0]) return null;
  const id = existing[0].id;
  await pool.query('UPDATE departments SET name = ? WHERE id = ?', [name, id]);
  const [rows] = await pool.query('SELECT * FROM departments WHERE id = ?', [id]);
  return mapDepartment(rows[0]);
};

export const deleteDepartmentByIdParam = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const [r] = await pool.query(`DELETE FROM departments WHERE ${lk.clause}`, lk.params);
  return r.affectedRows > 0;
};
