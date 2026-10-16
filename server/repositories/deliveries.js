import { getSupabase } from '../db/supabase.js';
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
  d.purpose = (subs.purposes || []).map((x) => x.value);
  d.activity = (subs.activities || []).map((x) => x.value);
  d.destination = (subs.destinations || []).map((x) => x.value);
  d.driver = (subs.drivers || []).map((x) => x.value);
  d.helper = (subs.helpers || []).map((x) => x.value);
  d.jobOrderNo = (subs.jobOrders || []).map((x) => x.value);
  d.customerSupplier = (subs.customers || []).map((x) => x.value);
  d.timeline = (subs.timeline || []).map((t) => ({
    type: t.event_type,
    destination: t.destination,
    timestamp: t.event_time,
    destinationIndex: t.destination_index,
  }));
  d.fuel = (subs.fuel || []).map((f) => ({
    liters: Number(f.liters),
    price: Number(f.price || 0),
    amount: Number(f.amount),
    gasStation: f.gas_station,
    invoiceNo: f.invoice_no,
    paymentType: f.payment_type,
    date: f.expense_date,
  }));
  const mapExpense = (rows) =>
    (rows || []).map((x) => ({
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

export const loadSubs = async (_conn, deliveryId) => {
  const supabase = getSupabase();
  const [
    purposes, activities, destinations, drivers, helpers,
    jobOrders, customers, timeline, fuel, toll, pier, repair, meal, load, contingency,
  ] = await Promise.all([
    supabase.from('delivery_purposes').select('value').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_activities').select('value').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_destinations').select('value').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_drivers').select('value').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_helpers').select('value').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_job_orders').select('value').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_customer_suppliers').select('value').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_timeline').select('event_type, destination, event_time, destination_index').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_fuel').select('liters, price, amount, gas_station, invoice_no, payment_type, expense_date').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_toll_fees').select('details, amt, expense_date').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_pier_expenses').select('details, amt, expense_date').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_repair_maintenance').select('details, amt, expense_date').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_meal_expenses').select('details, amt, expense_date').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_load_expenses').select('details, amt, expense_date').eq('delivery_id', deliveryId).then((r) => r.data || []),
    supabase.from('delivery_contingency').select('details, amt, expense_date').eq('delivery_id', deliveryId).then((r) => r.data || []),
  ]);
  return { purposes, activities, destinations, drivers, helpers, jobOrders, customers, timeline, fuel, toll, pier, repair, meal, load, contingency };
};

export const clearDeliveryChildren = async (_conn, deliveryId) => {
  const tables = [
    'delivery_purposes', 'delivery_activities', 'delivery_destinations',
    'delivery_drivers', 'delivery_helpers', 'delivery_job_orders',
    'delivery_customer_suppliers', 'delivery_timeline', 'delivery_fuel',
    'delivery_toll_fees', 'delivery_pier_expenses', 'delivery_repair_maintenance',
    'delivery_meal_expenses', 'delivery_load_expenses', 'delivery_contingency',
  ];
  const supabase = getSupabase();
  await Promise.all(tables.map((t) => supabase.from(t).delete().eq('delivery_id', deliveryId)));
};

export const insertDeliveryChildren = async (_conn, deliveryId, body) => {
  const supabase = getSupabase();
  const insList = async (table, values) => {
    const rows = asStringArray(values)
      .filter((v) => String(v).trim() !== '')
      .map((v) => ({ delivery_id: deliveryId, value: String(v).trim() }));
    if (rows.length) await supabase.from(table).insert(rows);
  };

  await Promise.all([
    insList('delivery_purposes', body.purpose),
    insList('delivery_activities', body.activity),
    insList('delivery_destinations', body.destination),
    insList('delivery_drivers', body.driver),
    insList('delivery_helpers', body.helper),
    insList('delivery_job_orders', body.jobOrderNo),
    insList('delivery_customer_suppliers', body.customerSupplier),
  ]);

  const timeline = (Array.isArray(body.timeline) ? body.timeline : []).map((t) => ({
    delivery_id: deliveryId,
    event_type: t.type === 'arrival' ? 'arrival' : 'departure',
    destination: t.destination ?? null,
    event_time: toDateOrNull(t.timestamp),
    destination_index: t.destinationIndex ?? null,
  }));
  if (timeline.length) await supabase.from('delivery_timeline').insert(timeline);

  const fuel = (Array.isArray(body.fuel) ? body.fuel : []).map((f) => ({
    delivery_id: deliveryId,
    liters: Number(f.liters) || 0,
    price: Number(f.price) || 0,
    amount: Number(f.amount) || 0,
    gas_station: f.gasStation ?? null,
    invoice_no: f.invoiceNo ?? null,
    payment_type: f.paymentType ?? null,
    expense_date: toDateOrNull(f.date),
  }));
  if (fuel.length) await supabase.from('delivery_fuel').insert(fuel);

  const insExp = async (table, arr) => {
    const rows = (Array.isArray(arr) ? arr : []).map((row) => ({
      delivery_id: deliveryId,
      details: row.details ?? null,
      amt: Number(row.amt) || 0,
      expense_date: toDateOrNull(row.date),
    }));
    if (rows.length) await supabase.from(table).insert(rows);
  };

  await Promise.all([
    insExp('delivery_toll_fees', body.tollFee),
    insExp('delivery_pier_expenses', body.pierExpenses),
    insExp('delivery_repair_maintenance', body.repairAndMaintenance),
    insExp('delivery_meal_expenses', body.mealExpenses),
    insExp('delivery_load_expenses', body.loadExpenses),
    insExp('delivery_contingency', body.contingency),
  ]);
};

export const getDeliveryNumericId = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { data } = await supabase.from('deliveries').select('id').eq('id', id).maybeSingle();
  return data?.id ?? null;
};

export const findDeliveryByReferenceNo = async (_pool, referenceNo) => {
  if (!referenceNo) return null;
  const ref = String(referenceNo).trim().toUpperCase();
  const supabase = getSupabase();
  const { data, error } = await supabase.from('deliveries').select('*').eq('reference_no', ref).maybeSingle();
  if (error || !data) return null;
  const subs = await loadSubs(null, data.id);
  return buildFullDelivery(data, subs);
};

export const findDeliveryByIdParam = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { data, error } = await supabase.from('deliveries').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  const subs = await loadSubs(null, data.id);
  return buildFullDelivery(data, subs);
};

export const listAllDeliveries = async (_pool) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('deliveries').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const out = [];
  for (const r of data || []) {
    const subs = await loadSubs(null, r.id);
    out.push(buildFullDelivery(r, subs));
  }
  return out;
};

export const listDeliveriesSummary = async (_pool, limit = 5) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('deliveries')
    .select('id, reference_no, delivery_type, date_from, date_to, vehicle_equipment, status')
    .order('created_at', { ascending: false })
    .limit(Number(limit));
  if (error) throw error;
  const enriched = [];
  for (const r of data || []) {
    const subs = await loadSubs(null, r.id);
    enriched.push({
      _id: toApiId(r),
      referenceNo: r.reference_no,
      destination: (subs.destinations || []).map((x) => x.value),
      vehicleEquipment: r.vehicle_equipment,
      status: r.status,
      dateFrom: r.date_from,
      dateTo: r.date_to,
      purpose: (subs.purposes || []).map((x) => x.value),
    });
  }
  return enriched;
};

export const countDeliveries = async (_pool, status = null) => {
  const supabase = getSupabase();
  let q = supabase.from('deliveries').select('*', { count: 'exact', head: true });
  if (status) q = q.eq('status', status);
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
};

export const runAutoStatusUpdates = async (_pool) => {
  const supabase = getSupabase();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const stIso = startOfToday.toISOString();
  const endIso = endOfToday.toISOString();
  await supabase
    .from('deliveries')
    .update({ status: 'Completed' })
    .in('status', ['Pending', 'In Transit'])
    .or(`and(date_to.not.is.null,date_to.lt.${stIso}),and(date_to.is.null,date_from.not.is.null,date_from.lt.${stIso})`);
  await supabase
    .from('deliveries')
    .update({ status: 'In Transit' })
    .eq('status', 'Pending')
    .not('date_from', 'is', null)
    .lte('date_from', endIso);
};

export const latestReferenceNo = async (_pool, patternPrefix) => {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('deliveries')
    .select('reference_no')
    .ilike('reference_no', `${patternPrefix}%`)
    .order('reference_no', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.reference_no ?? null;
};

export const insertDelivery = async (_pool, body, referenceNo, deliveryCharge) => {
  const supabase = getSupabase();
  const { data: main, error } = await supabase
    .from('deliveries')
    .insert({
      reference_no: referenceNo.toUpperCase(),
      delivery_type: body.deliveryType ?? null,
      date_from: toDateOrNull(body.dateFrom)?.toISOString() ?? null,
      date_to: toDateOrNull(body.dateTo)?.toISOString() ?? null,
      vehicle_equipment: body.vehicleEquipment ?? null,
      tnvs_provider: body.tnvsProvider ?? null,
      total_budget: Number(body.totalBudget) || 0,
      requested_by: body.requestedBy ?? null,
      status: body.status || 'Pending',
      departure_date: toDateOrNull(body.departureDate)?.toISOString() ?? null,
      arrival_date: toDateOrNull(body.arrivalDate)?.toISOString() ?? null,
      delivery_charge: Number(deliveryCharge) || 0,
      notes: body.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  await insertDeliveryChildren(null, main.id, body);
  return findDeliveryByIdParam(null, String(main.id));
};

export const updateDeliveryFull = async (_pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { error } = await supabase
    .from('deliveries')
    .update({
      delivery_type: body.deliveryType ?? null,
      date_from: toDateOrNull(body.dateFrom)?.toISOString() ?? null,
      date_to: toDateOrNull(body.dateTo)?.toISOString() ?? null,
      vehicle_equipment: body.vehicleEquipment ?? null,
      tnvs_provider: body.tnvsProvider ?? null,
      total_budget: Number(body.totalBudget) || 0,
      requested_by: body.requestedBy ?? null,
      status: body.status || 'Pending',
      departure_date: toDateOrNull(body.departureDate)?.toISOString() ?? null,
      arrival_date: toDateOrNull(body.arrivalDate)?.toISOString() ?? null,
      delivery_charge: Number(body.deliveryCharge) || 0,
      notes: body.notes ?? null,
    })
    .eq('id', id);
  if (error) throw error;
  await clearDeliveryChildren(null, id);
  await insertDeliveryChildren(null, id, body);
  return findDeliveryByIdParam(null, String(id));
};

export const deleteDeliveryByParam = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { error } = await supabase.from('deliveries').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const findOverlappingPendingDeliveries = async (_pool, vehiclePlate, requestDateFrom, requestDateTo) => {
  const rf = new Date(requestDateFrom);
  rf.setHours(0, 0, 0, 0);
  const rt = requestDateTo ? new Date(requestDateTo) : new Date(requestDateFrom);
  rt.setHours(23, 59, 59, 999);
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('vehicle_equipment', vehiclePlate)
    .eq('status', 'Pending');
  if (error) throw error;
  const matching = (data || []).filter((d) => {
    const df = d.date_from ? new Date(d.date_from) : null;
    const dt = d.date_to ? new Date(d.date_to) : null;
    if (dt && df) return dt >= rf && df <= rt;
    if (!dt && df) return df >= rf && df <= rt;
    return false;
  });
  const out = [];
  for (const r of matching) {
    const subs = await loadSubs(null, r.id);
    out.push(buildFullDelivery(r, subs));
  }
  return out;
};

export const mergeArraysPreserve = (a, b) => [...(a || []), ...(b || [])].filter(Boolean);
