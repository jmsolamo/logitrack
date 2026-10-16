import { getSupabase } from '../db/supabase.js';
import { toApiId } from '../utils/entityId.js';
import { buildFullRequest } from './deliveryRequests.js';
import { buildFullDelivery, loadSubs } from './deliveries.js';

export const getMetrics = async (_pool) => {
  const supabase = getSupabase();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const stIso = startOfToday.toISOString();
  const endIso = endOfToday.toISOString();

  const [
    usersCountRes,
    delCountRes,
    pendingReqRes,
    activeDelRes,
    pendingDelRes,
    inTransitDelRes,
    completedDelRes,
    approvedReqRes,
    declinedReqRes,
    approvedWithChangesReqRes,
    annCountRes,
    persCountRes,
    delTodayRes,
    pendReqTodayRes,
    purchRowsRes,
    vehiclesRes,
    jobOrdersRes,
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('deliveries').select('*', { count: 'exact', head: true }),
    supabase.from('delivery_requests').select('*', { count: 'exact', head: true }).eq('request_status', 'Pending'),
    supabase.from('deliveries').select('*', { count: 'exact', head: true }).in('status', ['Pending', 'In Transit']),
    supabase.from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'In Transit'),
    supabase.from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'Completed'),
    supabase.from('delivery_requests').select('*', { count: 'exact', head: true }).eq('request_status', 'Approved'),
    supabase.from('delivery_requests').select('*', { count: 'exact', head: true }).eq('request_status', 'Declined'),
    supabase.from('delivery_requests').select('*', { count: 'exact', head: true }).eq('request_status', 'Approved with Changes'),
    supabase.from('announcements').select('*', { count: 'exact', head: true }),
    supabase.from('personnels').select('*', { count: 'exact', head: true }),
    supabase.from('deliveries').select('*').eq('status', 'In Transit').gte('date_from', stIso).lte('date_from', endIso).order('created_at', { ascending: false }),
    supabase.from('delivery_requests').select('*').eq('request_status', 'Pending').gte('created_at', stIso).lte('created_at', endIso).order('created_at', { ascending: false }),
    supabase.from('purchases').select('*'),
    supabase.from('vehicles').select('*'),
    supabase.from('delivery_job_orders').select('value, delivery_id'),
  ]);

  const deliveriesTodayList = [];
  for (const row of delTodayRes.data || []) {
    const subs = await loadSubs(null, row.id);
    deliveriesTodayList.push(buildFullDelivery(row, subs));
  }

  const pendingRequestsTodayList = [];
  for (const row of pendReqTodayRes.data || []) {
    pendingRequestsTodayList.push(await buildFullRequest(null, row));
  }

  const allVehicles = vehiclesRes.data || [];
  const totalVehicles = allVehicles.length;
  const availableVehicles = allVehicles.filter((v) => v.status === 'Available').length;
  const maintenanceVehicles = allVehicles.filter((v) => v.status === 'Maintenance').length;
  const unavailableVehicles = allVehicles.filter((v) => v.status === 'Unavailable' || v.status === 'Booked').length;
  const unavailableVehiclesList = allVehicles
    .filter((v) => ['Maintenance', 'Unavailable', 'Booked'].includes(v.status))
    .map((r) => ({
      _id: toApiId(r),
      plateNumber: r.plate_number,
      model: r.model,
      status: r.status,
      maintenanceReason: r.maintenance_reason,
    }));

  const vehicleIdentifiers = [];
  allVehicles.forEach((v) => {
    if (v.plate_number) vehicleIdentifiers.push(String(v.plate_number).trim().toUpperCase());
    if (v.model) vehicleIdentifiers.push(String(v.model).trim().toUpperCase());
  });

  let totalPurchases = 0;
  let motorpoolPurchases = 0;
  let maintenancePurchases = 0;
  let vehiclePurchases = 0;
  let plantFacilitiesPurchases = 0;
  for (const p of purchRowsRes.data || []) {
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

  // Expense tables total
  const [fuelRes, tollRes, pierRes, repairRes, mealRes, loadRes, contRes] = await Promise.all([
    supabase.from('delivery_fuel').select('amount'),
    supabase.from('delivery_toll_fees').select('amt'),
    supabase.from('delivery_pier_expenses').select('amt'),
    supabase.from('delivery_repair_maintenance').select('amt'),
    supabase.from('delivery_meal_expenses').select('amt'),
    supabase.from('delivery_load_expenses').select('amt'),
    supabase.from('delivery_contingency').select('amt'),
  ]);

  const sumAmt = (arr, k = 'amt') => (arr || []).reduce((s, x) => s + (Number(x[k]) || 0), 0);
  const totalExpenses =
    sumAmt(fuelRes.data, 'amount') +
    sumAmt(tollRes.data) +
    sumAmt(pierRes.data) +
    sumAmt(repairRes.data) +
    sumAmt(mealRes.data) +
    sumAmt(loadRes.data) +
    sumAmt(contRes.data);

  const monthlyExpensesTrend = Array(12).fill(0);
  const joCounts = {};
  for (const jo of jobOrdersRes.data || []) {
    const val = (jo.value || '').trim();
    if (val) joCounts[val] = (joCounts[val] || 0) + 1;
  }
  const topJobOrders = Object.entries(joCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    totalUsers: usersCountRes.count || 0,
    totalDeliveries: delCountRes.count || 0,
    pendingRequests: pendingReqRes.count || 0,
    activeDeliveries: activeDelRes.count || 0,
    completedDeliveries: completedDelRes.count || 0,
    totalVehicles,
    availableVehicles,
    maintenanceVehicles,
    unavailableVehicles,
    unavailableVehiclesList,
    approvedRequests: approvedReqRes.count || 0,
    totalAnnouncements: annCountRes.count || 0,
    totalPersonnel: persCountRes.count || 0,
    totalPurchases,
    totalExpenses,
    weeklyExpenses: totalExpenses,
    monthlyExpenses: totalExpenses,
    yearlyExpenses: totalExpenses,
    monthlyExpensesTrend,
    topJobOrders,
    logisticsPurchases: vehiclePurchases + motorpoolPurchases,
    plantFacilitiesPurchases,
    maintenancePurchases,
    pendingDeliveries: pendingDelRes.count || 0,
    inTransitDeliveries: inTransitDelRes.count || 0,
    declinedRequests: declinedReqRes.count || 0,
    approvedWithChangesRequests: approvedWithChangesReqRes.count || 0,
    deliveriesToday: deliveriesTodayList.length,
    pendingRequestsToday: pendingRequestsTodayList.length,
    recentDeliveriesToday: deliveriesTodayList,
    recentPendingRequestsToday: pendingRequestsTodayList,
  };
};

export const getCharts = async (_pool) => {
  const supabase = getSupabase();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const { data: deliveries } = await supabase.from('deliveries').select('created_at, status, vehicle_equipment');
  const [fuelRes, tollRes, pierRes, repairRes, mealRes, loadRes, contRes] = await Promise.all([
    supabase.from('delivery_fuel').select('amount'),
    supabase.from('delivery_toll_fees').select('amt'),
    supabase.from('delivery_pier_expenses').select('amt'),
    supabase.from('delivery_repair_maintenance').select('amt'),
    supabase.from('delivery_meal_expenses').select('amt'),
    supabase.from('delivery_load_expenses').select('amt'),
    supabase.from('delivery_contingency').select('amt'),
  ]);

  const sumAmt = (arr, k = 'amt') => (arr || []).reduce((s, x) => s + (Number(x[k]) || 0), 0);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const trendMap = {};
  const statusMap = {};
  const vehMap = {};

  for (const d of deliveries || []) {
    const dt = new Date(d.created_at);
    if (dt >= sixMonthsAgo) {
      const key = `${monthNames[dt.getMonth()]} ${dt.getFullYear()}`;
      trendMap[key] = (trendMap[key] || 0) + 1;
    }
    const st = d.status || 'Unknown';
    statusMap[st] = (statusMap[st] || 0) + 1;
    const v = (d.vehicle_equipment || '').trim();
    if (v) vehMap[v] = (vehMap[v] || 0) + 1;
  }

  const deliveriesTrend = Object.entries(trendMap).map(([name, count]) => ({ name, count }));
  const statusDistribution = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  const topVehicles = Object.entries(vehMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const expenseBreakdown = [];
  const fAmt = sumAmt(fuelRes.data, 'amount');
  if (fAmt > 0) expenseBreakdown.push({ name: 'Fuel', value: fAmt });
  const tAmt = sumAmt(tollRes.data);
  if (tAmt > 0) expenseBreakdown.push({ name: 'Toll Fees', value: tAmt });
  const pAmt = sumAmt(pierRes.data);
  if (pAmt > 0) expenseBreakdown.push({ name: 'Pier/Shipping', value: pAmt });
  const rAmt = sumAmt(repairRes.data);
  if (rAmt > 0) expenseBreakdown.push({ name: 'Repair & Maint.', value: rAmt });
  const mAmt = sumAmt(mealRes.data);
  if (mAmt > 0) expenseBreakdown.push({ name: 'Meals', value: mAmt });
  const lAmt = sumAmt(loadRes.data);
  if (lAmt > 0) expenseBreakdown.push({ name: 'Load/Labor', value: lAmt });
  const cAmt = sumAmt(contRes.data);
  if (cAmt > 0) expenseBreakdown.push({ name: 'Contingency', value: cAmt });

  return {
    deliveriesTrend,
    statusDistribution,
    topVehicles,
    expenseBreakdown,
  };
};

export const getActivity = async (_pool) => {
  const supabase = getSupabase();
  const [usersRes, delRes, reqRes] = await Promise.all([
    supabase.from('users').select('id, username, role, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('deliveries').select('id, reference_no, status, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('delivery_requests').select('*').order('created_at', { ascending: false }).limit(5),
  ]);

  const activities = [];
  (usersRes.data || []).forEach((u) => {
    activities.push({
      id: `user-${toApiId(u)}`,
      type: 'user',
      title: 'New User Registration',
      description: `${u.username} registered as a ${u.role}.`,
      timestamp: u.created_at,
      status: 'Pending',
    });
  });
  (delRes.data || []).forEach((d) => {
    activities.push({
      id: `del-${toApiId(d)}`,
      type: 'delivery',
      title: 'Delivery Update',
      description: `Delivery ${d.reference_no} is currently ${d.status}.`,
      timestamp: d.created_at,
      status: d.status,
    });
  });
  for (const r of reqRes.data || []) {
    const full = await buildFullRequest(null, r);
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

export const getUserMetrics = async (_pool, userId, username, role) => {
  const supabase = getSupabase();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const stIso = startOfToday.toISOString();
  const endIso = endOfToday.toISOString();

  const { data: myReqs } = await supabase.from('delivery_requests').select('*').eq('requested_by_user_id', String(userId));
  const linkedDeliveryRefs = (myReqs || []).map((r) => r.delivery_reference_no).filter(Boolean);

  let delQ = supabase.from('deliveries').select('*');
  if (role !== 'manager') {
    if (linkedDeliveryRefs.length) {
      delQ = delQ.or(`requested_by.eq.${username},reference_no.in.(${linkedDeliveryRefs.join(',')})`);
    } else {
      delQ = delQ.eq('requested_by', username);
    }
  }
  const { data: myDeliveries } = await delQ;
  const allDeliveries = myDeliveries || [];

  const deliveriesTodayList = [];
  for (const d of allDeliveries.filter((x) => ['Pending', 'In Transit'].includes(x.status) && x.date_from >= stIso && x.date_from <= endIso)) {
    const subs = await loadSubs(null, d.id);
    deliveriesTodayList.push(buildFullDelivery(d, subs));
  }

  let pendReqData = [];
  if (role === 'manager') {
    const { data } = await supabase
      .from('delivery_requests')
      .select('*')
      .in('request_status', ['Approved', 'Approved with Changes'])
      .eq('reviewer_status', 'Pending')
      .gte('created_at', stIso)
      .lte('created_at', endIso)
      .order('created_at', { ascending: false });
    pendReqData = data || [];
  } else {
    pendReqData = (myReqs || []).filter((r) => r.request_status === 'Pending' && r.created_at >= stIso && r.created_at <= endIso);
  }

  const pendingRequestsTodayList = [];
  for (const r of pendReqData) {
    pendingRequestsTodayList.push(await buildFullRequest(null, r));
  }

  const totalDeliveries = allDeliveries.length;
  const pendingDeliveries = allDeliveries.filter((d) => d.status === 'Pending').length;
  const inTransitDeliveries = allDeliveries.filter((d) => d.status === 'In Transit').length;
  const completedDeliveries = allDeliveries.filter((d) => d.status === 'Completed').length;

  const { data: allVeh } = await supabase.from('vehicles').select('*');
  const totalVehicles = (allVeh || []).length;
  const availableVehicles = (allVeh || []).filter((v) => v.status === 'Available').length;
  const maintenanceVehicles = (allVeh || []).filter((v) => v.status === 'Maintenance').length;
  const unavailableVehicles = (allVeh || []).filter((v) => ['Unavailable', 'Booked'].includes(v.status)).length;
  const unavailableVehiclesList = (allVeh || [])
    .filter((v) => ['Maintenance', 'Unavailable', 'Booked'].includes(v.status))
    .map((r) => ({
      _id: toApiId(r),
      plateNumber: r.plate_number,
      model: r.model,
      status: r.status,
      maintenanceReason: r.maintenance_reason,
    }));

  const reqSource = role === 'manager' ? (await supabase.from('delivery_requests').select('*')).data || [] : myReqs || [];
  const approvedRequests = reqSource.filter((r) => r.request_status === 'Approved').length;
  const declinedRequests = reqSource.filter((r) => r.request_status === 'Declined').length;
  const approvedWithChangesRequests = reqSource.filter((r) => r.request_status === 'Approved with Changes').length;
  const pendingRequests = reqSource.filter((r) => r.request_status === 'Pending').length;

  const requestUpdateHistory = [];
  for (const r of reqSource.slice(0, 15)) {
    requestUpdateHistory.push(await buildFullRequest(null, r));
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

export const getUserCharts = async (_pool, userId, username) => {
  const supabase = getSupabase();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: myReqs } = await supabase.from('delivery_requests').select('*').eq('requested_by_user_id', String(userId));
  const linkedDeliveryRefs = (myReqs || []).map((r) => r.delivery_reference_no).filter(Boolean);

  let delQ = supabase.from('deliveries').select('*');
  if (linkedDeliveryRefs.length) {
    delQ = delQ.or(`requested_by.eq.${username},reference_no.in.(${linkedDeliveryRefs.join(',')})`);
  } else {
    delQ = delQ.eq('requested_by', username);
  }
  const { data: myDeliveries } = await delQ;

  const trendMap = {};
  const statusMap = {};
  for (const d of myDeliveries || []) {
    const dt = new Date(d.created_at);
    if (dt >= sixMonthsAgo) {
      const key = `${monthNames[dt.getMonth()]} ${dt.getFullYear()}`;
      trendMap[key] = (trendMap[key] || 0) + 1;
    }
    const st = d.status || 'Unknown';
    statusMap[st] = (statusMap[st] || 0) + 1;
  }
  const deliveriesTrend = Object.entries(trendMap).map(([name, count]) => ({ name, count }));
  const statusDistribution = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  const reqStatusMap = {};
  for (const r of myReqs || []) {
    const st = r.request_status || 'Unknown';
    reqStatusMap[st] = (reqStatusMap[st] || 0) + 1;
  }
  const requestStatusDistribution = Object.entries(reqStatusMap).map(([name, value]) => ({ name, value }));

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const monthCounts = Array(12).fill(0);
  for (const d of myDeliveries || []) {
    const dt = new Date(d.created_at);
    if (dt >= startOfYear) {
      monthCounts[dt.getMonth()] += 1;
    }
  }
  const monthlyDeliveries = monthNames.map((name, i) => ({ name, count: monthCounts[i] }));

  return {
    deliveriesTrend,
    statusDistribution,
    requestStatusDistribution,
    monthlyDeliveries,
  };
};
