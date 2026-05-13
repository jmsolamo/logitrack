import { getPool } from '../db/pool.js';
import { toApiId } from '../utils/entityId.js';
import { idLookup } from '../utils/entityId.js';

const map = (r) =>
  r
    ? {
        _id: toApiId(r),
        plateNumber: r.plate_number,
        model: r.model,
        status: r.status,
        maintenanceReason: r.maintenance_reason,
        maintenanceStartDate: r.maintenance_start_date,
        maintenanceEndDate: r.maintenance_end_date,
        maintenanceCount: r.maintenance_count || 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    : null;

export const listVehicles = async (pool) => {
  const [rows] = await pool.query(`
    SELECT v.*, (SELECT COUNT(*) FROM vehicle_maintenance_logs l WHERE l.vehicle_id = v.id) as maintenance_count
    FROM vehicles v 
    ORDER BY v.created_at DESC
  `);
  return rows.map(map);
};

export const findByPlate = async (pool, plate) => {
  const [rows] = await pool.query('SELECT * FROM vehicles WHERE plate_number = ? LIMIT 1', [String(plate).toUpperCase()]);
  return rows[0] || null;
};

export const createVehicle = async (pool, body) => {
  const [r] = await pool.query(`INSERT INTO vehicles (plate_number, model) VALUES (?,?)`, [
    String(body.plateNumber).toUpperCase(),
    body.model,
  ]);
  const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [r.insertId]);
  return map(rows[0]);
};

export const updateVehicle = async (pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [ex] = await pool.query(`SELECT id FROM vehicles WHERE ${lk.clause} LIMIT 1`, lk.params);
  if (!ex[0]) return null;
  const id = ex[0].id;
  const sets = [];
  const vals = [];
  if (body.plateNumber !== undefined) {
    sets.push('plate_number = ?');
    vals.push(String(body.plateNumber).toUpperCase());
  }
  if (body.model !== undefined) {
    sets.push('model = ?');
    vals.push(body.model);
  }
  if (!sets.length) {
    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    return map(rows[0]);
  }
  vals.push(id);
  await pool.query(`UPDATE vehicles SET ${sets.join(', ')} WHERE id = ?`, vals);
  const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
  return map(rows[0]);
};

export const deleteVehicle = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const [r] = await pool.query(`DELETE FROM vehicles WHERE ${lk.clause}`, lk.params);
  return r.affectedRows > 0;
};

export const updateMaintenance = async (pool, param, updateData) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [ex] = await pool.query(`SELECT id, status FROM vehicles WHERE ${lk.clause} LIMIT 1`, lk.params);
  if (!ex[0]) return null;
  const id = ex[0].id;
  
  if (updateData.status === 'Maintenance' && ex[0].status !== 'Maintenance') {
    await pool.query(
      `INSERT INTO vehicle_maintenance_logs (vehicle_id, reason, start_date, end_date) VALUES (?, ?, ?, ?)`,
      [id, updateData.maintenanceReason || '', updateData.maintenanceStartDate || null, updateData.maintenanceEndDate || null]
    );
  }
  await pool.query(
    `UPDATE vehicles SET status = ?, maintenance_reason = ?, maintenance_start_date = ?, maintenance_end_date = ? WHERE id = ?`,
    [
      updateData.status,
      updateData.maintenanceReason ?? '',
      updateData.maintenanceStartDate ?? null,
      updateData.maintenanceEndDate ?? null,
      id,
    ],
  );
  const [rows] = await pool.query(`
    SELECT v.*, (SELECT COUNT(*) FROM vehicle_maintenance_logs l WHERE l.vehicle_id = v.id) as maintenance_count
    FROM vehicles v WHERE v.id = ?
  `, [id]);
  return map(rows[0]);
};

export const countVehicles = async (pool, whereSql, params = []) => {
  const [rows] = await pool.query(`SELECT COUNT(*) AS c FROM vehicles WHERE ${whereSql}`, params);
  return rows[0].c;
};

export const findVehiclesWhere = async (pool, whereSql, params = []) => {
  const [rows] = await pool.query(`SELECT * FROM vehicles WHERE ${whereSql} ORDER BY updated_at DESC`, params);
  return rows.map(map);
};

export const selectPlatesModels = async (pool) => {
  const [rows] = await pool.query('SELECT plate_number AS plateNumber, model FROM vehicles');
  return rows;
};

export const getMaintenanceLogsByMonth = async (pool) => {
  const [rows] = await pool.query(`
    SELECT 
      DATE_FORMAT(l.created_at, '%Y-%m') AS month,
      v.plate_number AS plateNumber,
      COUNT(*) AS count
    FROM vehicle_maintenance_logs l
    JOIN vehicles v ON v.id = l.vehicle_id
    GROUP BY DATE_FORMAT(l.created_at, '%Y-%m'), v.plate_number
    ORDER BY month ASC, count DESC
  `);
  return rows;
};
