import { getPool } from '../db/pool.js';
import { toApiId } from '../utils/entityId.js';
import { idLookup } from '../utils/entityId.js';

const toDateOrNull = (v) => {
  if (v == null || v === '') return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const asStringArray = (v) => {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim() === '') return [];
  return [v];
};

const clearRequestChildren = async (conn, requestId) => {
  const tables = [
    'delivery_request_purposes',
    'delivery_request_activities',
    'delivery_request_destinations',
    'delivery_request_job_orders',
    'delivery_request_customer_suppliers',
    'delivery_request_drivers',
    'delivery_request_helpers',
  ];
  for (const t of tables) {
    await conn.query(`DELETE FROM \`${t}\` WHERE delivery_request_id = ?`, [requestId]);
  }
};

const insertRequestChildren = async (conn, requestId, body) => {
  const ins = async (table, field) => {
    let i = 0;
    for (const value of asStringArray(body[field])) {
      if (String(value).trim() === '') continue;
      await conn.query(`INSERT INTO \`${table}\` (delivery_request_id, value) VALUES (?,?)`, [
        requestId,
        String(value).trim(),
      ]);
    }
  };
  await ins('delivery_request_purposes', 'purpose');
  await ins('delivery_request_activities', 'activity');
  await ins('delivery_request_destinations', 'destination');
  await ins('delivery_request_job_orders', 'jobOrderNo');
  await ins('delivery_request_customer_suppliers', 'customerSupplier');
  await ins('delivery_request_drivers', 'driver');
  await ins('delivery_request_helpers', 'helper');
};

const loadRequestSubs = async (conn, requestId) => {
  const results = await Promise.all([
    conn.query('SELECT value FROM delivery_request_purposes WHERE delivery_request_id = ?', [requestId]),
    conn.query('SELECT value FROM delivery_request_activities WHERE delivery_request_id = ?', [requestId]),
    conn.query('SELECT value FROM delivery_request_destinations WHERE delivery_request_id = ?', [requestId]),
    conn.query('SELECT value FROM delivery_request_job_orders WHERE delivery_request_id = ?', [requestId]),
    conn.query('SELECT value FROM delivery_request_customer_suppliers WHERE delivery_request_id = ?', [requestId]),
    conn.query('SELECT value FROM delivery_request_drivers WHERE delivery_request_id = ?', [requestId]),
    conn.query('SELECT value FROM delivery_request_helpers WHERE delivery_request_id = ?', [requestId]),
  ]);
  const [purposes, activities, destinations, jobOrders, customers, drivers, helpers] = results.map((r) => r[0]);
  return { purposes, activities, destinations, jobOrders, customers, drivers, helpers };
};

const mapMain = (r, subs) => ({
  _id: toApiId(r),
  referenceNo: r.reference_no,
  deliveryType: r.delivery_type,
  dateFrom: r.date_from,
  dateTo: r.date_to,
  vehicleEquipment: r.vehicle_equipment,
  tnvsProvider: r.tnvs_provider,
  requestedBy: r.requested_by,
  department: r.user_department || null,
  dateSubmitted: r.date_submitted,
  notes: r.notes,
  totalBudget: Number(r.total_budget),
  requestedByUserId: r.requested_by_user_id,
  requestStatus: r.request_status,
  declineReason: r.decline_reason,
  reviewedBy: r.reviewed_by,
  reviewedAt: r.reviewed_at,
  reviewerStatus: r.reviewer_status,
  reviewerNotes: r.reviewer_notes,
  reviewerReviewedBy: r.reviewer_reviewed_by,
  reviewerReviewedAt: r.reviewer_reviewed_at,
  originalVehicle: r.original_vehicle,
  vehicleChanged: !!r.vehicle_changed,
  vehicleChangeReason: r.vehicle_change_reason,
  deliveryReferenceNo: r.delivery_reference_no,
  combinedWithDelivery: !!r.combined_with_delivery,
  purpose: subs.purposes.map((x) => x.value),
  activity: subs.activities.map((x) => x.value),
  destination: subs.destinations.map((x) => x.value),
  jobOrderNo: subs.jobOrders.map((x) => x.value),
  customerSupplier: subs.customers.map((x) => x.value),
  driver: subs.drivers.map((x) => x.value),
  helper: subs.helpers.map((x) => x.value),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const buildFullRequest = async (pool, row) => {
  if (!row) return null;
  const subs = await loadRequestSubs(pool, row.id);
  return mapMain(row, subs);
};

export const findRequestByIdParam = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [rows] = await pool.query(
    `SELECT dr.*, u.department AS user_department FROM delivery_requests dr LEFT JOIN users u ON dr.requested_by_user_id = CAST(u.id AS CHAR) WHERE dr.${lk.clause} LIMIT 1`,
    lk.params
  );
  if (!rows[0]) return null;
  return buildFullRequest(pool, rows[0]);
};

export const latestRequestReferenceNo = async (pool, patternPrefix) => {
  const like = `${patternPrefix}%`;
  const [rows] = await pool.query(
    `SELECT reference_no FROM delivery_requests WHERE reference_no LIKE ? ORDER BY reference_no DESC LIMIT 1`,
    [like],
  );
  return rows[0]?.reference_no ?? null;
};

export const countPending = async (pool) => {
  const [[r]] = await pool.query(`SELECT COUNT(*) AS c FROM delivery_requests WHERE request_status = 'Pending'`);
  return r.c;
};

export const listMyRequests = async (pool, userId) => {
  const [rows] = await pool.query(
    `SELECT dr.*, u.department AS user_department 
     FROM delivery_requests dr 
     LEFT JOIN users u ON dr.requested_by_user_id = CAST(u.id AS CHAR) 
     WHERE dr.requested_by_user_id = ? 
     ORDER BY dr.created_at DESC`,
    [userId],
  );
  const out = [];
  for (const row of rows) {
    out.push(await buildFullRequest(pool, row));
  }
  return out;
};

export const listRequestsFiltered = async (pool, filter) => {
  const clauses = [];
  const params = [];
  if (filter.requestStatus) {
    if (Array.isArray(filter.requestStatus)) {
      clauses.push(`dr.request_status IN (${filter.requestStatus.map(() => '?').join(',')})`);
      params.push(...filter.requestStatus);
    } else {
      clauses.push('dr.request_status = ?');
      params.push(filter.requestStatus);
    }
  }
  if (filter.reviewerStatus) {
    if (Array.isArray(filter.reviewerStatus)) {
      clauses.push(`dr.reviewer_status IN (${filter.reviewerStatus.map(() => '?').join(',')})`);
      params.push(...filter.reviewerStatus);
    } else {
      clauses.push('dr.reviewer_status = ?');
      params.push(filter.reviewerStatus);
    }
  }
  if (filter.deliveryReferenceNo) {
    clauses.push('dr.delivery_reference_no = ?');
    params.push(filter.deliveryReferenceNo);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT dr.*, u.department AS user_department 
     FROM delivery_requests dr 
     LEFT JOIN users u ON dr.requested_by_user_id = CAST(u.id AS CHAR) 
     ${where} 
     ORDER BY dr.created_at DESC`,
    params
  );
  const out = [];
  for (const row of rows) {
    out.push(await buildFullRequest(pool, row));
  }
  return out;
};

export const createRequest = async (pool, body, referenceNo) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO delivery_requests (
        reference_no, delivery_type, date_from, date_to, vehicle_equipment, tnvs_provider, requested_by, date_submitted, notes, total_budget,
        requested_by_user_id, request_status, decline_reason, reviewed_by, reviewed_at, reviewer_status, reviewer_notes, reviewer_reviewed_by, reviewer_reviewed_at,
        original_vehicle, vehicle_changed, vehicle_change_reason, delivery_reference_no, combined_with_delivery
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        referenceNo,
        body.deliveryType ?? null,
        toDateOrNull(body.dateFrom),
        toDateOrNull(body.dateTo),
        body.vehicleEquipment ?? null,
        body.tnvsProvider ?? null,
        body.requestedBy ?? null,
        new Date(),
        body.notes ?? null,
        Number(body.totalBudget) || 0,
        body.requestedByUserId ?? null,
        body.requestStatus || 'Pending',
        null,
        null,
        null,
        body.reviewerStatus || 'Pending',
        null,
        null,
        null,
        body.originalVehicle ?? null,
        body.vehicleChanged ? 1 : 0,
        body.vehicleChangeReason ?? null,
        body.deliveryReferenceNo ? String(body.deliveryReferenceNo).trim() : null,
        body.combinedWithDelivery ? 1 : 0,
      ],
    );
    const id = r.insertId;
    await insertRequestChildren(conn, id, body);
    await conn.commit();
    const [rows] = await pool.query('SELECT * FROM delivery_requests WHERE id = ?', [id]);
    return buildFullRequest(pool, rows[0]);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

export const saveRequest = async (pool, requestObj) => {
  const lk = idLookup(requestObj._id);
  if (!lk) return null;
  const [ex] = await pool.query(`SELECT id FROM delivery_requests WHERE ${lk.clause} LIMIT 1`, lk.params);
  if (!ex[0]) return null;
  const id = ex[0].id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `UPDATE delivery_requests SET
        reference_no = ?, delivery_type = ?, date_from = ?, date_to = ?, vehicle_equipment = ?, tnvs_provider = ?, requested_by = ?, notes = ?, total_budget = ?,
        requested_by_user_id = ?, request_status = ?, decline_reason = ?, reviewed_by = ?, reviewed_at = ?, reviewer_status = ?, reviewer_notes = ?,
        reviewer_reviewed_by = ?, reviewer_reviewed_at = ?, original_vehicle = ?, vehicle_changed = ?, vehicle_change_reason = ?, delivery_reference_no = ?, combined_with_delivery = ?
       WHERE id = ?`,
      [
        requestObj.referenceNo,
        requestObj.deliveryType ?? null,
        toDateOrNull(requestObj.dateFrom),
        toDateOrNull(requestObj.dateTo),
        requestObj.vehicleEquipment ?? null,
        requestObj.tnvsProvider ?? null,
        requestObj.requestedBy ?? null,
        requestObj.notes ?? null,
        Number(requestObj.totalBudget) || 0,
        requestObj.requestedByUserId ?? null,
        requestObj.requestStatus,
        requestObj.declineReason ?? null,
        requestObj.reviewedBy ?? null,
        toDateOrNull(requestObj.reviewedAt),
        requestObj.reviewerStatus,
        requestObj.reviewerNotes ?? null,
        requestObj.reviewerReviewedBy ?? null,
        toDateOrNull(requestObj.reviewerReviewedAt),
        requestObj.originalVehicle ?? null,
        requestObj.vehicleChanged ? 1 : 0,
        requestObj.vehicleChangeReason ?? null,
        requestObj.deliveryReferenceNo ? String(requestObj.deliveryReferenceNo).trim() : null,
        requestObj.combinedWithDelivery ? 1 : 0,
        id,
      ],
    );
    await clearRequestChildren(conn, id);
    await insertRequestChildren(conn, id, requestObj);
    await conn.commit();
    const [rows] = await pool.query('SELECT * FROM delivery_requests WHERE id = ?', [id]);
    return buildFullRequest(pool, rows[0]);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

export const patchRequestScalars = async (pool, param, patch) => {
  const req = await findRequestByIdParam(pool, param);
  if (!req) return null;
  Object.assign(req, patch);
  return saveRequest(pool, req);
};

export const deleteRequest = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const [r] = await pool.query(`DELETE FROM delivery_requests WHERE ${lk.clause}`, lk.params);
  return r.affectedRows > 0;
};

export const listSchedulesData = async (pool) => {
  const [pending] = await pool.query(
    `SELECT id, vehicle_equipment, date_from, date_to, request_status FROM delivery_requests WHERE request_status = 'Pending'`,
  );
  const [approved] = await pool.query(
    `SELECT id, vehicle_equipment, date_from, date_to, request_status, delivery_reference_no FROM delivery_requests WHERE request_status IN ('Approved','Approved with Changes')`,
  );
  return { pending, approved };
};
