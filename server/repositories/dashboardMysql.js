import { getPool } from '../db/pool.js';
import { toApiId } from '../utils/entityId.js';
import * as vehiclesMysql from './vehiclesMysql.js';
import * as announcementsMysql from './announcementsMysql.js';
import * as personnelsMysql from './personnelsMysql.js';
import { buildFullRequest } from './deliveryRequestsMysql.js';
import { buildFullDelivery, loadSubs } from './deliveriesMysql.js';

const deliveryExpenseExpr = `(
  (SELECT COALESCE(SUM(amount),0) FROM delivery_fuel f WHERE f.delivery_id = d.id) +
  (SELECT COALESCE(SUM(amt),0) FROM delivery_toll_fees t WHERE t.delivery_id = d.id) +
  (SELECT COALESCE(SUM(amt),0) FROM delivery_pier_expenses p WHERE p.delivery_id = d.id) +
  (SELECT COALESCE(SUM(amt),0) FROM delivery_repair_maintenance r WHERE r.delivery_id = d.id) +
  (SELECT COALESCE(SUM(amt),0) FROM delivery_meal_expenses m WHERE m.delivery_id = d.id) +
  (SELECT COALESCE(SUM(amt),0) FROM delivery_load_expenses l WHERE l.delivery_id = d.id) +
  (SELECT COALESCE(SUM(amt),0) FROM delivery_contingency c WHERE c.delivery_id = d.id)
)`;

const sumExpensesSince = async (pool, sinceDate) => {
  const [[r]] = await pool.query(
    `SELECT
      COALESCE(SUM((SELECT COALESCE(SUM(amount),0) FROM delivery_fuel f WHERE f.delivery_id = d.id)),0) AS fuel,
      COALESCE(SUM((SELECT COALESCE(SUM(amt),0) FROM delivery_toll_fees t WHERE t.delivery_id = d.id)),0) AS toll,
      COALESCE(SUM((SELECT COALESCE(SUM(amt),0) FROM delivery_pier_expenses p WHERE p.delivery_id = d.id)),0) AS pier,
      COALESCE(SUM((SELECT COALESCE(SUM(amt),0) FROM delivery_repair_maintenance r WHERE r.delivery_id = d.id)),0) AS repair,
      COALESCE(SUM((SELECT COALESCE(SUM(amt),0) FROM delivery_meal_expenses m WHERE m.delivery_id = d.id)),0) AS meal,
      COALESCE(SUM((SELECT COALESCE(SUM(amt),0) FROM delivery_load_expenses l WHERE l.delivery_id = d.id)),0) AS \`load\`,
      COALESCE(SUM((SELECT COALESCE(SUM(amt),0) FROM delivery_contingency c WHERE c.delivery_id = d.id)),0) AS contingency
    FROM deliveries d
    WHERE d.created_at >= ?`,
    [sinceDate],
  );
  const t = (n) => Number(n) || 0;
  return t(r.fuel) + t(r.toll) + t(r.pier) + t(r.repair) + t(r.meal) + t(r.load) + t(r.contingency);
};

const sumAllExpenses = async (pool) => {
  const since = new Date(0);
  return sumExpensesSince(pool, since);
};

export const getMetrics = async (pool) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [delToday] = await pool.query(
    `SELECT d.* FROM deliveries d WHERE d.status = 'In Transit' AND d.date_from >= ? AND d.date_from <= ? ORDER BY d.created_at DESC`,
    [startOfToday, endOfToday],
  );
  const deliveriesTodayList = [];
  for (const row of delToday) {
    const subs = await loadSubs(pool, row.id);
    deliveriesTodayList.push(buildFullDelivery(row, subs));
  }

  const [pendReq] = await pool.query(
    `SELECT * FROM delivery_requests WHERE request_status = 'Pending' AND created_at >= ? AND created_at <= ? ORDER BY created_at DESC`,
    [startOfToday, endOfToday],
  );
  const pendingRequestsTodayList = [];
  for (const row of pendReq) {
    pendingRequestsTodayList.push(await buildFullRequest(pool, row));
  }

  const [[{ tc: totalUsers }]] = await pool.query('SELECT COUNT(*) AS tc FROM users');
  const [[{ tc: totalDeliveries }]] = await pool.query('SELECT COUNT(*) AS tc FROM deliveries');
  const [[{ tc: pendingRequests }]] = await pool.query(
    `SELECT COUNT(*) AS tc FROM delivery_requests WHERE request_status = 'Pending'`,
  );
  const [[{ tc: activeDeliveries }]] = await pool.query(
    `SELECT COUNT(*) AS tc FROM deliveries WHERE status IN ('Pending','In Transit')`,
  );
  const [[{ tc: pendingDeliveries }]] = await pool.query(`SELECT COUNT(*) AS tc FROM deliveries WHERE status = 'Pending'`);
  const [[{ tc: inTransitDeliveries }]] = await pool.query(`SELECT COUNT(*) AS tc FROM deliveries WHERE status = 'In Transit'`);
  const [[{ tc: completedDeliveries }]] = await pool.query(`SELECT COUNT(*) AS tc FROM deliveries WHERE status = 'Completed'`);
  const totalVehicles = await vehiclesMysql.countVehicles(pool, '1=1');
  const availableVehicles = await vehiclesMysql.countVehicles(pool, "status = 'Available'");
  const maintenanceVehicles = await vehiclesMysql.countVehicles(pool, "status = 'Maintenance'");
  const unavailableVehicles = await vehiclesMysql.countVehicles(pool, "status IN ('Unavailable','Booked')");
  const unavailableVehiclesList = await vehiclesMysql.findVehiclesWhere(pool, "status IN ('Maintenance','Unavailable','Booked')");

  const [[{ tc: approvedRequests }]] = await pool.query(
    `SELECT COUNT(*) AS tc FROM delivery_requests WHERE request_status = 'Approved'`,
  );
  const [[{ tc: declinedRequests }]] = await pool.query(
    `SELECT COUNT(*) AS tc FROM delivery_requests WHERE request_status = 'Declined'`,
  );
  const [[{ tc: approvedWithChangesRequests }]] = await pool.query(
    `SELECT COUNT(*) AS tc FROM delivery_requests WHERE request_status = 'Approved with Changes'`,
  );
  const totalAnnouncements = await announcementsMysql.countAnnouncements(pool);
  const totalPersonnel = await personnelsMysql.countPersonnels(pool);

  const [purchRows] = await pool.query('SELECT * FROM purchases');
  const allVehicles = await vehiclesMysql.selectPlatesModels(pool);
  const vehicleIdentifiers = [];
  allVehicles.forEach((v) => {
    if (v.plateNumber) vehicleIdentifiers.push(String(v.plateNumber).trim().toUpperCase());
    if (v.model) vehicleIdentifiers.push(String(v.model).trim().toUpperCase());
  });

  let totalPurchases = 0;
  let motorpoolPurchases = 0;
  let maintenancePurchases = 0;
  let vehiclePurchases = 0;
  let plantFacilitiesPurchases = 0;
  for (const p of purchRows) {
    let amount = 0;
    if (p.amount) {
      String(p.amount)
        .split(',')
        .forEach((v) => {
          amount += parseFloat(v.trim()) || 0;
        });
    }
    totalPurchases += amount;
    const cat = p.category ? String(p.category).trim().toUpperCase() : '';
    if (cat === '00012 - MOTORPOOL') motorpoolPurchases += amount;
    else if (cat === '4078 - PLANT & FACILITIES') plantFacilitiesPurchases += amount;
    else if (cat === '100E - MAINTENANCE') maintenancePurchases += amount;
    else if (cat.includes('VEHICLE') || vehicleIdentifiers.some((id) => id && cat.includes(id))) vehiclePurchases += amount;
  }

  const totalExpenses = await sumAllExpenses(pool);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.setDate() - 7);
  const weeklyExpenses = await sumExpensesSince(pool, oneWeekAgo);
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const monthlyExpenses = await sumExpensesSince(pool, oneMonthAgo);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const yearlyExpenses = await sumExpensesSince(pool, oneYearAgo);

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const [monthlyTrendRows] = await pool.query(
    `SELECT MONTH(d.created_at) AS m, SUM(${deliveryExpenseExpr}) AS totalExpenses
     FROM deliveries d
     WHERE d.created_at >= ?
     GROUP BY YEAR(d.created_at), MONTH(d.created_at)`,
    [startOfYear],
  );
  const monthlyExpensesTrend = Array.from({ length: 12 }, (_, i) => {
    const row = monthlyTrendRows.find((x) => x.m === i + 1);
    return row ? Number(row.totalExpenses) || 0 : 0;
  });

  const [topJo] = await pool.query(
    `SELECT jo.value AS name, SUM(${deliveryExpenseExpr}) AS value
     FROM delivery_job_orders jo
     INNER JOIN deliveries d ON d.id = jo.delivery_id
     WHERE jo.value IS NOT NULL AND TRIM(jo.value) <> ''
     GROUP BY jo.value
     ORDER BY value DESC
     LIMIT 5`,
  );

  return {
    totalUsers,
    totalDeliveries,
    pendingRequests,
    activeDeliveries,
    completedDeliveries,
    totalVehicles,
    availableVehicles,
    maintenanceVehicles,
    unavailableVehicles,
    unavailableVehiclesList,
    approvedRequests,
    totalAnnouncements,
    totalPersonnel,
    totalPurchases,
    totalExpenses,
    weeklyExpenses,
    monthlyExpenses,
    yearlyExpenses,
    monthlyExpensesTrend,
    topJobOrders: topJo.map((x) => ({ name: x.name, value: Number(x.value) || 0 })),
    logisticsPurchases: vehiclePurchases + motorpoolPurchases,
    plantFacilitiesPurchases,
    maintenancePurchases,
    pendingDeliveries,
    inTransitDeliveries,
    declinedRequests,
    approvedWithChangesRequests,
    deliveriesToday: deliveriesTodayList.length,
    pendingRequestsToday: pendingRequestsTodayList.length,
    recentDeliveriesToday: deliveriesTodayList,
    recentPendingRequestsToday: pendingRequestsTodayList,
  };
};

export const getCharts = async (pool) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const [delByMonth] = await pool.query(
    `SELECT YEAR(created_at) AS y, MONTH(created_at) AS m, COUNT(*) AS cnt FROM deliveries WHERE created_at >= ? GROUP BY y, m ORDER BY y, m`,
    [sixMonthsAgo],
  );
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const deliveriesTrend = delByMonth.map((d) => ({
    name: `${monthNames[d.m - 1]} ${d.y}`,
    count: d.cnt,
  }));

  const [statusDist] = await pool.query('SELECT status AS name, COUNT(*) AS value FROM deliveries GROUP BY status');
  const statusDistribution = statusDist.map((d) => ({ name: d.name || 'Unknown', value: d.value }));

  const [topVeh] = await pool.query(
    `SELECT vehicle_equipment AS name, COUNT(*) AS count FROM deliveries WHERE vehicle_equipment IS NOT NULL AND TRIM(vehicle_equipment) <> '' GROUP BY vehicle_equipment ORDER BY count DESC LIMIT 5`,
  );

  const [[e]] = await pool.query(
    `SELECT
      (SELECT COALESCE(SUM(amount),0) FROM delivery_fuel) AS Fuel,
      (SELECT COALESCE(SUM(amt),0) FROM delivery_toll_fees) AS Toll,
      (SELECT COALESCE(SUM(amt),0) FROM delivery_pier_expenses) AS Pier,
      (SELECT COALESCE(SUM(amt),0) FROM delivery_repair_maintenance) AS Repair,
      (SELECT COALESCE(SUM(amt),0) FROM delivery_meal_expenses) AS Meal,
      (SELECT COALESCE(SUM(amt),0) FROM delivery_load_expenses) AS \`Load\`,
      (SELECT COALESCE(SUM(amt),0) FROM delivery_contingency) AS Contingency`,
  );
  const expenseBreakdown = [];
  if (Number(e.Fuel) > 0) expenseBreakdown.push({ name: 'Fuel', value: Number(e.Fuel) });
  if (Number(e.Toll) > 0) expenseBreakdown.push({ name: 'Toll Fees', value: Number(e.Toll) });
  if (Number(e.Pier) > 0) expenseBreakdown.push({ name: 'Pier/Shipping', value: Number(e.Pier) });
  if (Number(e.Repair) > 0) expenseBreakdown.push({ name: 'Repair & Maint.', value: Number(e.Repair) });
  if (Number(e.Meal) > 0) expenseBreakdown.push({ name: 'Meals', value: Number(e.Meal) });
  if (Number(e.Load) > 0) expenseBreakdown.push({ name: 'Load/Labor', value: Number(e.Load) });
  if (Number(e.Contingency) > 0) expenseBreakdown.push({ name: 'Contingency', value: Number(e.Contingency) });

  return {
    deliveriesTrend,
    statusDistribution,
    topVehicles: topVeh.map((d) => ({ name: d.name || 'Unassigned', count: d.count })),
    expenseBreakdown,
  };
};

export const getActivity = async (pool) => {
  const [recentSignups] = await pool.query(
    'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC LIMIT 5',
  );
  const [recentDeliveries] = await pool.query(
    'SELECT id, reference_no, status, created_at FROM deliveries ORDER BY created_at DESC LIMIT 5',
  );
  const [recentRequests] = await pool.query(
    'SELECT * FROM delivery_requests ORDER BY created_at DESC LIMIT 5',
  );

  const activities = [];
  recentSignups.forEach((u) => {
    activities.push({
      id: `user-${toApiId(u)}`,
      type: 'user',
      title: 'New User Registration',
      description: `${u.username} registered as a ${u.role}.`,
      timestamp: u.created_at,
      status: 'Pending',
    });
  });
  recentDeliveries.forEach((d) => {
    activities.push({
      id: `del-${toApiId(d)}`,
      type: 'delivery',
      title: 'Delivery Update',
      description: `Delivery ${d.reference_no} is currently ${d.status}.`,
      timestamp: d.created_at,
      status: d.status,
    });
  });
  for (const r of recentRequests) {
    const full = await buildFullRequest(pool, r);
    activities.push({
      id: `req-${full._id}`,
      type: 'request',
      title: 'New Delivery Request',
      description: `Request ${full.referenceNo} submitted by ${full.requestedBy}.`,
      timestamp: full.createdAt,
      status: full.requestStatus,
    });
  }
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return activities.slice(0, 10);
};

export const getUserMetrics = async (pool, userId, username, role) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Subquery to find deliveries linked to this user's requests
  const userDeliverySub = `d.reference_no IN (SELECT delivery_reference_no FROM delivery_requests WHERE requested_by_user_id = ? AND delivery_reference_no IS NOT NULL)`;

  // Deliveries for this user (or all if reviewer)
  let delToday;
  if (role === 'manager') {
    [delToday] = await pool.query(
      `SELECT d.* FROM deliveries d WHERE d.status IN ('Pending','In Transit') AND d.date_from >= ? AND d.date_from <= ? ORDER BY d.created_at DESC`,
      [startOfToday, endOfToday]
    );
  } else {
    [delToday] = await pool.query(
      `SELECT d.* FROM deliveries d WHERE (d.requested_by = ? OR ${userDeliverySub}) AND d.status IN ('Pending','In Transit') AND d.date_from >= ? AND d.date_from <= ? ORDER BY d.created_at DESC`,
      [username, userId, startOfToday, endOfToday]
    );
  }
  const deliveriesTodayList = [];
  for (const row of delToday) {
    const subs = await loadSubs(pool, row.id);
    deliveriesTodayList.push(buildFullDelivery(row, subs));
  }

  // Requests for this user (or all if reviewer)
  let pendReq;
  if (role === 'manager') {
    [pendReq] = await pool.query(
      `SELECT * FROM delivery_requests WHERE request_status IN ('Approved', 'Approved with Changes') AND reviewer_status = 'Pending' AND created_at >= ? AND created_at <= ? ORDER BY created_at DESC`,
      [startOfToday, endOfToday]
    );
  } else {
    [pendReq] = await pool.query(
      `SELECT * FROM delivery_requests WHERE requested_by_user_id = ? AND request_status = 'Pending' AND created_at >= ? AND created_at <= ? ORDER BY created_at DESC`,
      [userId, startOfToday, endOfToday]
    );
  }
  const pendingRequestsTodayList = [];
  for (const row of pendReq) {
    pendingRequestsTodayList.push(await buildFullRequest(pool, row));
  }

  let totalDeliveries, pendingDeliveries, inTransitDeliveries, completedDeliveries;
  if (role === 'manager') {
    [[{ tc: totalDeliveries }]] = await pool.query('SELECT COUNT(*) AS tc FROM deliveries');
  } else {
    [[{ tc: totalDeliveries }]] = await pool.query(
      `SELECT COUNT(*) AS tc FROM deliveries d WHERE d.requested_by = ? OR ${userDeliverySub}`,
      [username, userId]
    );
  }
  let pendingRequests;
  if (role === 'manager') {
    [[{ tc: pendingRequests }]] = await pool.query(`SELECT COUNT(*) AS tc FROM delivery_requests WHERE request_status IN ('Approved', 'Approved with Changes') AND reviewer_status = 'Pending'`);
  } else {
    [[{ tc: pendingRequests }]] = await pool.query(
      `SELECT COUNT(*) AS tc FROM delivery_requests WHERE requested_by_user_id = ? AND request_status = 'Pending'`,
      [userId]
    );
  }
  if (role === 'manager') {
    [[{ tc: pendingDeliveries }]] = await pool.query(`SELECT COUNT(*) AS tc FROM deliveries WHERE status = 'Pending'`);
    [[{ tc: inTransitDeliveries }]] = await pool.query(`SELECT COUNT(*) AS tc FROM deliveries WHERE status = 'In Transit'`);
    [[{ tc: completedDeliveries }]] = await pool.query(`SELECT COUNT(*) AS tc FROM deliveries WHERE status = 'Completed'`);
  } else {
    [[{ tc: pendingDeliveries }]] = await pool.query(
      `SELECT COUNT(*) AS tc FROM deliveries d WHERE (d.requested_by = ? OR ${userDeliverySub}) AND d.status = 'Pending'`,
      [username, userId]
    );
    [[{ tc: inTransitDeliveries }]] = await pool.query(
      `SELECT COUNT(*) AS tc FROM deliveries d WHERE (d.requested_by = ? OR ${userDeliverySub}) AND d.status = 'In Transit'`,
      [username, userId]
    );
    [[{ tc: completedDeliveries }]] = await pool.query(
      `SELECT COUNT(*) AS tc FROM deliveries d WHERE (d.requested_by = ? OR ${userDeliverySub}) AND d.status = 'Completed'`,
      [username, userId]
    );
  }

  // Fleet remains company-wide
  const totalVehicles = await vehiclesMysql.countVehicles(pool, '1=1');
  const availableVehicles = await vehiclesMysql.countVehicles(pool, "status = 'Available'");
  const maintenanceVehicles = await vehiclesMysql.countVehicles(pool, "status = 'Maintenance'");
  const unavailableVehicles = await vehiclesMysql.countVehicles(pool, "status IN ('Unavailable','Booked')");
  const unavailableVehiclesList = await vehiclesMysql.findVehiclesWhere(pool, "status IN ('Maintenance','Unavailable','Booked')");

  let approvedRequests, declinedRequests, approvedWithChangesRequests;
  if (role === 'manager') {
    [[{ tc: approvedRequests }]] = await pool.query(`SELECT COUNT(*) AS tc FROM delivery_requests WHERE request_status = 'Approved'`);
    [[{ tc: declinedRequests }]] = await pool.query(`SELECT COUNT(*) AS tc FROM delivery_requests WHERE request_status = 'Declined'`);
    [[{ tc: approvedWithChangesRequests }]] = await pool.query(`SELECT COUNT(*) AS tc FROM delivery_requests WHERE request_status = 'Approved with Changes'`);
  } else {
    [[{ tc: approvedRequests }]] = await pool.query(
      `SELECT COUNT(*) AS tc FROM delivery_requests WHERE requested_by_user_id = ? AND request_status = 'Approved'`,
      [userId]
    );
    [[{ tc: declinedRequests }]] = await pool.query(
      `SELECT COUNT(*) AS tc FROM delivery_requests WHERE requested_by_user_id = ? AND request_status = 'Declined'`,
      [userId]
    );
    [[{ tc: approvedWithChangesRequests }]] = await pool.query(
      `SELECT COUNT(*) AS tc FROM delivery_requests WHERE requested_by_user_id = ? AND request_status = 'Approved with Changes'`,
      [userId]
    );
  }

  // Request Update History — recent requests with any status, ordered by last update
  let historyRows;
  if (role === 'manager') {
    [historyRows] = await pool.query(
      `SELECT * FROM delivery_requests WHERE request_status IN ('Approved', 'Approved with Changes') AND reviewer_status = 'Pending' ORDER BY COALESCE(reviewed_at, updated_at, created_at) DESC`
    );
  } else {
    [historyRows] = await pool.query(
      `SELECT * FROM delivery_requests WHERE requested_by_user_id = ? ORDER BY COALESCE(reviewed_at, updated_at, created_at) DESC LIMIT 15`,
      [userId]
    );
  }
  const requestUpdateHistory = [];
  for (const row of historyRows) {
    requestUpdateHistory.push(await buildFullRequest(pool, row));
  }

  return {
    totalDeliveries,
    pendingRequests,
    completedDeliveries,
    totalVehicles,
    availableVehicles,
    maintenanceVehicles,
    unavailableVehicles,
    unavailableVehiclesList,
    approvedRequests,
    pendingDeliveries,
    inTransitDeliveries,
    declinedRequests,
    approvedWithChangesRequests,
    deliveriesToday: deliveriesTodayList.length,
    pendingRequestsToday: pendingRequestsTodayList.length,
    recentDeliveriesToday: deliveriesTodayList,
    recentPendingRequestsToday: pendingRequestsTodayList,
    requestUpdateHistory,
  };
};

export const getUserCharts = async (pool, userId, username) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const userDeliverySub = `d.reference_no IN (SELECT delivery_reference_no FROM delivery_requests WHERE requested_by_user_id = ? AND delivery_reference_no IS NOT NULL)`;

  // Delivery trend (last 6 months) for this user
  const [delByMonth] = await pool.query(
    `SELECT YEAR(d.created_at) AS y, MONTH(d.created_at) AS m, COUNT(*) AS cnt
     FROM deliveries d
     WHERE (d.requested_by = ? OR ${userDeliverySub}) AND d.created_at >= ?
     GROUP BY y, m ORDER BY y, m`,
    [username, userId, sixMonthsAgo],
  );
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const deliveriesTrend = delByMonth.map((d) => ({
    name: `${monthNames[d.m - 1]} ${d.y}`,
    count: d.cnt,
  }));

  // Delivery status distribution for this user
  const [statusDist] = await pool.query(
    `SELECT d.status AS name, COUNT(*) AS value FROM deliveries d WHERE d.requested_by = ? OR ${userDeliverySub} GROUP BY d.status`,
    [username, userId],
  );
  const statusDistribution = statusDist.map((d) => ({ name: d.name || 'Unknown', value: d.value }));

  // Request status distribution for this user
  const [reqStatusDist] = await pool.query(
    'SELECT request_status AS name, COUNT(*) AS value FROM delivery_requests WHERE requested_by_user_id = ? GROUP BY request_status',
    [userId],
  );
  const requestStatusDistribution = reqStatusDist.map((d) => ({ name: d.name || 'Unknown', value: d.value }));

  // Monthly delivery frequency (current year) for this user
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const [monthlyRows] = await pool.query(
    `SELECT MONTH(d.created_at) AS m, COUNT(*) AS cnt
     FROM deliveries d
     WHERE (d.requested_by = ? OR ${userDeliverySub}) AND d.created_at >= ?
     GROUP BY MONTH(d.created_at)`,
    [username, userId, startOfYear],
  );
  const monthlyDeliveries = Array.from({ length: 12 }, (_, i) => {
    const row = monthlyRows.find((x) => x.m === i + 1);
    return { name: monthNames[i], count: row ? row.cnt : 0 };
  });

  return {
    deliveriesTrend,
    statusDistribution,
    requestStatusDistribution,
    monthlyDeliveries,
  };
};
