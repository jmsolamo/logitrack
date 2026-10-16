import { getPool } from '../db/pool.js';
import { toApiId, idLookup } from '../utils/entityId.js';

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

const mapMainRowToDeliveryBase = (r) => ({
  _id: toApiId(r),
  referenceNo: r.reference_no,
  deliveryType: r.delivery_type,
  dateFrom: r.date_from,
  dateTo: r.date_to,
  vehicleEquipment: r.vehicle_equipment,
  tnvsProvider: r.tnvs_provider,
  totalBudget: Number(r.total_budget),
  requestedBy: r.requested_by,
  status: r.status,
  departureDate: r.departure_date,
  arrivalDate: r.arrival_date,
  deliveryCharge: Number(r.delivery_charge),
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const sumArray = (arr, key) => (arr || []).reduce((s, x) => s + (Number(x?.[key]) || 0), 0);

export const buildFullDelivery = (main, subs) => {
  const d = { ...mapMainRowToDeliveryBase(main) };
  d.purpose = subs.purposes.map((x) => x.value);
  d.activity = subs.activities.map((x) => x.value);
  d.destination = subs.destinations.map((x) => x.value);
  d.driver = subs.drivers.map((x) => x.value);
  d.helper = subs.helpers.map((x) => x.value);
  d.jobOrderNo = subs.jobOrders.map((x) => x.value);
  d.customerSupplier = subs.customers.map((x) => x.value);
  d.timeline = subs.timeline.map((t) => ({
    type: t.event_type,
    destination: t.destination,
    timestamp: t.event_time,
    destinationIndex: t.destination_index,
  }));
  d.fuel = subs.fuel.map((f) => ({
    liters: Number(f.liters),
    price: Number(f.price || 0),
    amount: Number(f.amount),
    gasStation: f.gas_station,
    invoiceNo: f.invoice_no,
    paymentType: f.payment_type,
    date: f.expense_date,
  }));
  const mapExpense = (rows) =>
    rows.map((x) => ({
      details: x.details,
      amt: Number(x.amt),
      date: x.expense_date,
    }));
  d.tollFee = mapExpense(subs.toll);
  d.pierExpenses = mapExpense(subs.pier);
  d.repairAndMaintenance = mapExpense(subs.repair);
  d.mealExpenses = mapExpense(subs.meal);
  d.loadExpenses = mapExpense(subs.load);
  d.contingency = mapExpense(subs.contingency);

  const totalExpenses =
    sumArray(d.fuel, 'amount') +
    sumArray(d.tollFee, 'amt') +
    sumArray(d.pierExpenses, 'amt') +
    sumArray(d.repairAndMaintenance, 'amt') +
    sumArray(d.mealExpenses, 'amt') +
    sumArray(d.loadExpenses, 'amt') +
    sumArray(d.contingency, 'amt');
  d.totalExpenses = Number(totalExpenses.toFixed(2));
  let duration = 0;
  if (d.deliveryType === 'Itinerary') duration = 1;
  else if (d.dateFrom && d.dateTo) {
    const ms = new Date(d.dateTo) - new Date(d.dateFrom);
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
    duration = days > 0 ? days : 0;
  }
  d.duration = duration;
  return d;
};

export const loadSubs = async (conn, deliveryId) => {
  const results = await Promise.all([
    conn.query('SELECT value FROM delivery_purposes WHERE delivery_id = ?', [deliveryId]),
    conn.query('SELECT value FROM delivery_activities WHERE delivery_id = ?', [deliveryId]),
    conn.query('SELECT value FROM delivery_destinations WHERE delivery_id = ?', [deliveryId]),
    conn.query('SELECT value FROM delivery_drivers WHERE delivery_id = ?', [deliveryId]),
    conn.query('SELECT value FROM delivery_helpers WHERE delivery_id = ?', [deliveryId]),
    conn.query('SELECT value FROM delivery_job_orders WHERE delivery_id = ?', [deliveryId]),
    conn.query('SELECT value FROM delivery_customer_suppliers WHERE delivery_id = ?', [deliveryId]),
    conn.query(
      'SELECT event_type, destination, event_time, destination_index FROM delivery_timeline WHERE delivery_id = ?',
      [deliveryId],
    ),
    conn.query(
      'SELECT liters, price, amount, gas_station, invoice_no, payment_type, expense_date FROM delivery_fuel WHERE delivery_id = ?',
      [deliveryId],
    ),
    conn.query('SELECT details, amt, expense_date FROM delivery_toll_fees WHERE delivery_id = ?', [deliveryId]),
    conn.query('SELECT details, amt, expense_date FROM delivery_pier_expenses WHERE delivery_id = ?', [deliveryId]),
    conn.query('SELECT details, amt, expense_date FROM delivery_repair_maintenance WHERE delivery_id = ?', [deliveryId]),
    conn.query('SELECT details, amt, expense_date FROM delivery_meal_expenses WHERE delivery_id = ?', [deliveryId]),
    conn.query('SELECT details, amt, expense_date FROM delivery_load_expenses WHERE delivery_id = ?', [deliveryId]),
    conn.query('SELECT details, amt, expense_date FROM delivery_contingency WHERE delivery_id = ?', [deliveryId]),
  ]);
  const [
    purposes,
    activities,
    destinations,
    drivers,
    helpers,
    jobOrders,
    customers,
    timeline,
    fuel,
    toll,
    pier,
    repair,
    meal,
    load,
    contingency,
  ] = results.map((r) => r[0]);
  return {
    purposes: purposes,
    activities: activities,
    destinations: destinations,
    drivers: drivers,
    helpers: helpers,
    jobOrders: jobOrders,
    customers: customers,
    timeline: timeline,
    fuel: fuel,
    toll: toll,
    pier: pier,
    repair: repair,
    meal: meal,
    load: load,
    contingency: contingency,
  };
};

export const clearDeliveryChildren = async (conn, deliveryId) => {
  const tables = [
    'delivery_purposes',
    'delivery_activities',
    'delivery_destinations',
    'delivery_drivers',
    'delivery_helpers',
    'delivery_job_orders',
    'delivery_customer_suppliers',
    'delivery_timeline',
    'delivery_fuel',
    'delivery_toll_fees',
    'delivery_pier_expenses',
    'delivery_repair_maintenance',
    'delivery_meal_expenses',
    'delivery_load_expenses',
    'delivery_contingency',
  ];
  for (const t of tables) {
    await conn.query(`DELETE FROM \`${t}\` WHERE delivery_id = ?`, [deliveryId]);
  }
};

export const insertDeliveryChildren = async (conn, deliveryId, body) => {
  const insList = async (table, values) => {
    for (const value of asStringArray(values)) {
      if (String(value).trim() === '') continue;
      await conn.query(`INSERT INTO \`${table}\` (delivery_id, value) VALUES (?, ?)`, [deliveryId, String(value).trim()]);
    }
  };
  await insList('delivery_purposes', body.purpose);
  await insList('delivery_activities', body.activity);
  await insList('delivery_destinations', body.destination);
  await insList('delivery_drivers', body.driver);
  await insList('delivery_helpers', body.helper);
  await insList('delivery_job_orders', body.jobOrderNo);
  await insList('delivery_customer_suppliers', body.customerSupplier);

  const timeline = Array.isArray(body.timeline) ? body.timeline : [];
  for (const t of timeline) {
    const et = t.type === 'arrival' ? 'arrival' : 'departure';
    await conn.query(
      `INSERT INTO delivery_timeline (delivery_id, event_type, destination, event_time, destination_index) VALUES (?,?,?,?,?)`,
      [deliveryId, et, t.destination ?? null, toDateOrNull(t.timestamp), t.destinationIndex ?? null],
    );
  }

  const fuelArr = Array.isArray(body.fuel) ? body.fuel : [];
  for (const f of fuelArr) {
    await conn.query(
      `INSERT INTO delivery_fuel (delivery_id, liters, price, amount, gas_station, invoice_no, payment_type, expense_date) VALUES (?,?,?,?,?,?,?,?)`,
      [
        deliveryId,
        Number(f.liters) || 0,
        Number(f.price) || 0,
        Number(f.amount) || 0,
        f.gasStation ?? null,
        f.invoiceNo ?? null,
        f.paymentType ?? null,
        toDateOrNull(f.date),
      ],
    );
  }

  const insExp = async (table, arr) => {
    const rows = Array.isArray(arr) ? arr : [];
    for (const row of rows) {
      await conn.query(`INSERT INTO \`${table}\` (delivery_id, details, amt, expense_date) VALUES (?,?,?,?)`, [
        deliveryId,
        row.details ?? null,
        Number(row.amt) || 0,
        toDateOrNull(row.date),
      ]);
    }
  };
  await insExp('delivery_toll_fees', body.tollFee);
  await insExp('delivery_pier_expenses', body.pierExpenses);
  await insExp('delivery_repair_maintenance', body.repairAndMaintenance);
  await insExp('delivery_meal_expenses', body.mealExpenses);
  await insExp('delivery_load_expenses', body.loadExpenses);
  await insExp('delivery_contingency', body.contingency);
};

export const getDeliveryNumericId = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [rows] = await pool.query(`SELECT id FROM deliveries WHERE ${lk.clause} LIMIT 1`, lk.params);
  return rows[0]?.id ?? null;
};

export const findDeliveryByReferenceNo = async (pool, referenceNo) => {
  if (!referenceNo) return null;
  const [main] = await pool.query('SELECT * FROM deliveries WHERE reference_no = ? LIMIT 1', [String(referenceNo).trim().toUpperCase()]);
  const row = main[0];
  if (!row) return null;
  const subs = await loadSubs(pool, row.id);
  return buildFullDelivery(row, subs);
};

export const findDeliveryByIdParam = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [main] = await pool.query(`SELECT * FROM deliveries WHERE ${lk.clause} LIMIT 1`, lk.params);
  const row = main[0];
  if (!row) return null;
  const subs = await loadSubs(pool, row.id);
  return buildFullDelivery(row, subs);
};

export const listAllDeliveries = async (pool) => {
  const [rows] = await pool.query('SELECT * FROM deliveries ORDER BY created_at DESC');
  const out = [];
  for (const r of rows) {
    const subs = await loadSubs(pool, r.id);
    out.push(buildFullDelivery(r, subs));
  }
  return out;
};

export const listDeliveriesSummary = async (pool, limit = 5) => {
  const [rows] = await pool.query(
    `SELECT id, reference_no, delivery_type, date_from, date_to, vehicle_equipment, status FROM deliveries ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
  const enriched = [];
  for (const r of rows) {
    const subs = await loadSubs(pool, r.id);
    const d = {
      _id: toApiId(r),
      referenceNo: r.reference_no,
      destination: subs.destinations.map((x) => x.value),
      vehicleEquipment: r.vehicle_equipment,
      status: r.status,
      dateFrom: r.date_from,
      dateTo: r.date_to,
      purpose: subs.purposes.map((x) => x.value),
    };
    enriched.push(d);
  }
  return enriched;
};

export const countDeliveries = async (pool, status = null) => {
  if (!status) {
    const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM deliveries');
    return r.c;
  }
  const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM deliveries WHERE status = ?', [status]);
  return r.c;
};

export const runAutoStatusUpdates = async (pool) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  await pool.query(
    `UPDATE deliveries SET status = 'Completed' WHERE status IN ('Pending','In Transit') AND (
      (date_to IS NOT NULL AND date_to < ?)
      OR (date_to IS NULL AND date_from IS NOT NULL AND date_from < ?)
    )`,
    [startOfToday, startOfToday],
  );
  await pool.query(`UPDATE deliveries SET status = 'In Transit' WHERE status = 'Pending' AND date_from IS NOT NULL AND date_from <= ?`, [
    endOfToday,
  ]);
};

export const latestReferenceNo = async (pool, patternPrefix) => {
  const like = `${patternPrefix}%`;
  const [rows] = await pool.query(
    `SELECT reference_no FROM deliveries WHERE reference_no LIKE ? ORDER BY reference_no DESC LIMIT 1`,
    [like],
  );
  return rows[0]?.reference_no ?? null;
};

export const insertDelivery = async (pool, body, referenceNo, deliveryCharge) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO deliveries (reference_no, delivery_type, date_from, date_to, vehicle_equipment, tnvs_provider, total_budget, requested_by, status, departure_date, arrival_date, delivery_charge, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        referenceNo.toUpperCase(),
        body.deliveryType ?? null,
        toDateOrNull(body.dateFrom),
        toDateOrNull(body.dateTo),
        body.vehicleEquipment ?? null,
        body.tnvsProvider ?? null,
        Number(body.totalBudget) || 0,
        body.requestedBy ?? null,
        body.status || 'Pending',
        toDateOrNull(body.departureDate),
        toDateOrNull(body.arrivalDate),
        Number(deliveryCharge) || 0,
        body.notes ?? null,
      ],
    );
    const id = r.insertId;
    await insertDeliveryChildren(conn, id, body);
    await conn.commit();
    return findDeliveryByIdParam(pool, String(id));
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

export const updateDeliveryFull = async (pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const conn = await pool.getConnection();
  try {
    const [existing] = await conn.query(`SELECT id FROM deliveries WHERE ${lk.clause} LIMIT 1`, lk.params);
    const row = existing[0];
    if (!row) return null;
    const id = row.id;

    await conn.beginTransaction();
    await conn.query(
      `UPDATE deliveries SET
        delivery_type = ?, date_from = ?, date_to = ?, vehicle_equipment = ?, tnvs_provider = ?,
        total_budget = ?, requested_by = ?, status = ?, departure_date = ?, arrival_date = ?,
        delivery_charge = ?, notes = ?
       WHERE id = ?`,
      [
        body.deliveryType ?? null,
        toDateOrNull(body.dateFrom),
        toDateOrNull(body.dateTo),
        body.vehicleEquipment ?? null,
        body.tnvsProvider ?? null,
        Number(body.totalBudget) || 0,
        body.requestedBy ?? null,
        body.status || 'Pending',
        toDateOrNull(body.departureDate),
        toDateOrNull(body.arrivalDate),
        Number(body.deliveryCharge) || 0,
        body.notes ?? null,
        id,
      ],
    );
    await clearDeliveryChildren(conn, id);
    await insertDeliveryChildren(conn, id, body);
    await conn.commit();
    return findDeliveryByIdParam(pool, String(id));
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

export const deleteDeliveryByParam = async (pool, param) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const [r] = await pool.query(`DELETE FROM deliveries WHERE ${lk.clause}`, lk.params);
  return r.affectedRows > 0;
};

export const findOverlappingPendingDeliveries = async (pool, vehiclePlate, requestDateFrom, requestDateTo) => {
  const rf = new Date(requestDateFrom);
  rf.setHours(0, 0, 0, 0);
  const rt = requestDateTo ? new Date(requestDateTo) : new Date(requestDateFrom);
  rt.setHours(23, 59, 59, 999);

  const [rows] = await pool.query(
    `SELECT * FROM deliveries
     WHERE vehicle_equipment = ? AND status = 'Pending'
     AND (
       (date_to IS NOT NULL AND date_from IS NOT NULL AND date_to >= ? AND date_from <= ?)
       OR ((date_to IS NULL) AND date_from IS NOT NULL AND date_from >= ? AND date_from <= ?)
     )`,
    [vehiclePlate, rf, rt, rf, rt],
  );

  const out = [];
  for (const r of rows) {
    const subs = await loadSubs(pool, r.id);
    out.push(buildFullDelivery(r, subs));
  }
  return out;
};

export const mergeArraysPreserve = (a, b) => [...(a || []), ...(b || [])].filter(Boolean);
