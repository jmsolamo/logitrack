import bcrypt from 'bcryptjs';
import { getPool } from '../db/pool.js';
import { toApiId } from '../utils/entityId.js';
import { idLookup } from '../utils/entityId.js';

const mapUser = (r) =>
  r
    ? {
        _id: toApiId(r),
        id: r.id,
        username: r.username,
        plainPassword: r.plain_password,
        department: r.department,
        role: r.role,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    : null;

export const findUserByUsername = async (pool, username) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  return rows[0] || null;
};

export const findUserByIdParam = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [rows] = await pool.query(`SELECT * FROM users WHERE ${lk.clause} LIMIT 1`, lk.params);
  return rows[0] || null;
};

export const comparePassword = async (plain, passwordHash) => bcrypt.compare(plain, passwordHash);

export const hashPassword = async (plain) => bcrypt.hash(plain, 10);

export const listUsers = async (pool) => {
  const [rows] = await pool.query(
    'SELECT id, username, plain_password, department, role, created_at, updated_at FROM users ORDER BY created_at DESC'
  );
  return rows.map((r) => mapUser(r));
};

export const createUser = async (pool, { username, password, department, role }) => {
  const hash = await hashPassword(password);
  const [r] = await pool.query(
    `INSERT INTO users (username, password_hash, plain_password, department, role) VALUES (?,?,?,?,?)`,
    [username, hash, password, department || '', role || 'requestor'],
  );
  const [rows] = await pool.query('SELECT id, username, plain_password, department, role, created_at, updated_at FROM users WHERE id = ?', [
    r.insertId,
  ]);
  return mapUser(rows[0]);
};

export const updateUserByIdParam = async (pool, param, { username, password, department, role }) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [existing] = await pool.query(`SELECT id FROM users WHERE ${lk.clause} LIMIT 1`, lk.params);
  if (!existing[0]) return null;
  const id = existing[0].id;
  const sets = [];
  const vals = [];
  if (username !== undefined) {
    sets.push('username = ?');
    vals.push(username);
  }
  if (password !== undefined) {
    sets.push('password_hash = ?');
    vals.push(await hashPassword(password));
    sets.push('plain_password = ?');
    vals.push(password);
  }
  if (department !== undefined) {
    sets.push('department = ?');
    vals.push(department);
  }
  if (role !== undefined) {
    sets.push('role = ?');
    vals.push(role);
  }
  if (!sets.length) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return mapUser(rows[0]);
  }
  vals.push(id);
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return mapUser(rows[0]);
};

export const deleteUserByIdParam = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const [r] = await pool.query(`DELETE FROM users WHERE ${lk.clause}`, lk.params);
  return r.affectedRows > 0;
};

export const seedDefaultAdmin = async () => {
  const pool = getPool();
  const existing = await findUserByUsername(pool, 'logistic-department');
  if (existing) return;
  const hash = await hashPassword('123456');
  await pool.query(
    `INSERT INTO users (username, password_hash, plain_password, department, role) VALUES (?,?,?,?,?)`,
    ['logistic-department', hash, '123456', 'logistic', 'admin'],
  );
};
