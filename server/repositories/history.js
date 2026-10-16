import { getPool } from '../db/pool.js';

export const insertLoginHistory = async (pool, logData) => {
  const { username, status, reason, ipAddress } = logData;
  const [result] = await pool.query(
    'INSERT INTO login_history (username, status, reason, ip_address) VALUES (?, ?, ?, ?)',
    [username, status, reason || null, ipAddress || null]
  );
  return result;
};

export const getLoginHistory = async (pool, limit = 100) => {
  const [rows] = await pool.query(
    'SELECT * FROM login_history ORDER BY created_at DESC LIMIT ?',
    [Number(limit)]
  );
  return rows;
};

export const clearLoginHistory = async (pool) => {
  const [result] = await pool.query('TRUNCATE TABLE login_history');
  return result;
};
