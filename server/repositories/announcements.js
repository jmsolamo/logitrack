import { getPool } from '../db/pool.js';
import { toApiId } from '../utils/entityId.js';
import { idLookup } from '../utils/entityId.js';

const loadRoles = async (conn, announcementId) => {
  const [rows] = await conn.query(
    'SELECT role_name FROM announcement_target_roles WHERE announcement_id = ?',
    [announcementId],
  );
  return rows.map((r) => r.role_name);
};

const buildAnnouncement = async (conn, row) => {
  if (!row) return null;
  const roles = await loadRoles(conn, row.id);
  return {
    _id: toApiId(row),
    title: row.title,
    content: row.content,
    targetRoles: roles.length ? roles : ['requestor', 'manager', 'admin'],
    startDate: row.start_date,
    endDate: row.end_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const findActiveForRole = async (pool, role) => {
  const now = new Date();
  const [rows] = await pool.query(
    `SELECT a.* FROM announcements a
     INNER JOIN announcement_target_roles r ON r.announcement_id = a.id
     WHERE a.start_date <= ? AND a.end_date >= ? AND r.role_name = ?
     ORDER BY a.created_at DESC`,
    [now, now, role],
  );
  const out = [];
  for (const row of rows) {
    out.push(await buildAnnouncement(pool, row));
  }
  return out;
};

export const listAllForAdmin = async (pool) => {
  const [rows] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
  const out = [];
  for (const row of rows) {
    out.push(await buildAnnouncement(pool, row));
  }
  return out;
};

export const listForRoleAll = async (pool, role) => {
  const [rows] = await pool.query(
    `SELECT DISTINCT a.* FROM announcements a
     INNER JOIN announcement_target_roles r ON r.announcement_id = a.id
     WHERE r.role_name = ?
     ORDER BY a.created_at DESC`,
    [role],
  );
  const out = [];
  for (const row of rows) {
    out.push(await buildAnnouncement(pool, row));
  }
  return out;
};

export const createAnnouncement = async (pool, body, createdByUsername) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO announcements (title, content, start_date, end_date, created_by) VALUES (?,?,?,?,?)`,
      [body.title, body.content, new Date(body.startDate), new Date(body.endDate), createdByUsername],
    );
    const id = r.insertId;
    const roles = Array.isArray(body.targetRoles) && body.targetRoles.length ? body.targetRoles : ['requestor', 'manager', 'admin'];
    for (const role of roles) {
      await conn.query(`INSERT INTO announcement_target_roles (announcement_id, role_name) VALUES (?,?)`, [id, role]);
    }
    await conn.commit();
    const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    return buildAnnouncement(pool, rows[0]);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

export const updateAnnouncement = async (pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const conn = await pool.getConnection();
  try {
    const [ex] = await conn.query(`SELECT id FROM announcements WHERE ${lk.clause} LIMIT 1`, lk.params);
    if (!ex[0]) return null;
    const id = ex[0].id;
    await conn.beginTransaction();
    if (body.title || body.content || body.startDate || body.endDate) {
      await conn.query(
        `UPDATE announcements SET title = COALESCE(?, title), content = COALESCE(?, content), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date) WHERE id = ?`,
        [
          body.title ?? null,
          body.content ?? null,
          body.startDate ? new Date(body.startDate) : null,
          body.endDate ? new Date(body.endDate) : null,
          id,
        ],
      );
    }
    if (body.targetRoles) {
      await conn.query('DELETE FROM announcement_target_roles WHERE announcement_id = ?', [id]);
      for (const role of body.targetRoles) {
        await conn.query(`INSERT INTO announcement_target_roles (announcement_id, role_name) VALUES (?,?)`, [id, role]);
      }
    }
    await conn.commit();
    const [rows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    return buildAnnouncement(pool, rows[0]);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

export const deleteAnnouncement = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const [r] = await pool.query(`DELETE FROM announcements WHERE ${lk.clause}`, lk.params);
  return r.affectedRows > 0;
};

export const countAnnouncements = async (pool) => {
  const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM announcements');
  return r.c;
};
