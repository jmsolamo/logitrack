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

const clearRequestChildren = async (_conn, requestId) => {
  const supabase = getSupabase();
  const tables = [
    'delivery_request_purposes',
    'delivery_request_activities',
    'delivery_request_destinations',
    'delivery_request_job_orders',
    'delivery_request_customer_suppliers',
    'delivery_request_drivers',
    'delivery_request_helpers',
  ];
  await Promise.all(tables.map((t) => supabase.from(t).delete().eq('delivery_request_id', requestId)));
};

const insertRequestChildren = async (_conn, requestId, body) => {
  const supabase = getSupabase();
  const ins = async (table, field) => {
    const rows = asStringArray(body[field])
      .filter((v) => String(v).trim() !== '')
      .map((v) => ({ delivery_request_id: requestId, value: String(v).trim() }));
    if (rows.length) await supabase.from(table).insert(rows);
  };
  await Promise.all([
    ins('delivery_request_purposes', 'purpose'),
    ins('delivery_request_activities', 'activity'),
    ins('delivery_request_destinations', 'destination'),
    ins('delivery_request_job_orders', 'jobOrderNo'),
    ins('delivery_request_customer_suppliers', 'customerSupplier'),
    ins('delivery_request_drivers', 'driver'),
    ins('delivery_request_helpers', 'helper'),
  ]);
};

const loadRequestSubs = async (_conn, requestId) => {
  const supabase = getSupabase();
  const [purposes, activities, destinations, jobOrders, customers, drivers, helpers] = await Promise.all([
    supabase.from('delivery_request_purposes').select('value').eq('delivery_request_id', requestId).then((r) => r.data || []),
    supabase.from('delivery_request_activities').select('value').eq('delivery_request_id', requestId).then((r) => r.data || []),
    supabase.from('delivery_request_destinations').select('value').eq('delivery_request_id', requestId).then((r) => r.data || []),
    supabase.from('delivery_request_job_orders').select('value').eq('delivery_request_id', requestId).then((r) => r.data || []),
    supabase.from('delivery_request_customer_suppliers').select('value').eq('delivery_request_id', requestId).then((r) => r.data || []),
    supabase.from('delivery_request_drivers').select('value').eq('delivery_request_id', requestId).then((r) => r.data || []),
    supabase.from('delivery_request_helpers').select('value').eq('delivery_request_id', requestId).then((r) => r.data || []),
  ]);
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
  department: r.user_department || r.department || null,
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
  purpose: (subs.purposes || []).map((x) => x.value),
  activity: (subs.activities || []).map((x) => x.value),
  destination: (subs.destinations || []).map((x) => x.value),
  jobOrderNo: (subs.jobOrders || []).map((x) => x.value),
  customerSupplier: (subs.customers || []).map((x) => x.value),
  driver: (subs.drivers || []).map((x) => x.value),
  helper: (subs.helpers || []).map((x) => x.value),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const buildFullRequest = async (_pool, row) => {
  if (!row) return null;
  const subs = await loadRequestSubs(null, row.id);
  return mapMain(row, subs);
};

export const findRequestByIdParam = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { data: row, error } = await supabase.from('delivery_requests').select('*').eq('id', id).maybeSingle();
  if (error || !row) return null;
  let dept = null;
  if (row.requested_by_user_id) {
    const { data: u } = await supabase.from('users').select('department').eq('id', row.requested_by_user_id).maybeSingle();
    dept = u?.department || null;
  }
  row.user_department = dept;
  return buildFullRequest(null, row);
};

export const latestRequestReferenceNo = async (_pool, patternPrefix) => {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('delivery_requests')
    .select('reference_no')
    .ilike('reference_no', `${patternPrefix}%`)
    .order('reference_no', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.reference_no ?? null;
};

export const countPending = async (_pool) => {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from('delivery_requests')
    .select('*', { count: 'exact', head: true })
    .eq('request_status', 'Pending');
  if (error) throw error;
  return count || 0;
};

export const listMyRequests = async (_pool, userId) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('delivery_requests')
    .select('*')
    .eq('requested_by_user_id', String(userId))
    .order('created_at', { ascending: false });
  if (error) throw error;
  const out = [];
  for (const row of data || []) {
    out.push(await buildFullRequest(null, row));
  }
  return out;
};

export const listRequestsFiltered = async (_pool, filter) => {
  const supabase = getSupabase();
  let q = supabase.from('delivery_requests').select('*').order('created_at', { ascending: false });
  if (filter.requestStatus) {
    if (Array.isArray(filter.requestStatus)) {
      q = q.in('request_status', filter.requestStatus);
    } else {
      q = q.eq('request_status', filter.requestStatus);
    }
  }
  if (filter.reviewerStatus) {
    if (Array.isArray(filter.reviewerStatus)) {
      q = q.in('reviewer_status', filter.reviewerStatus);
    } else {
      q = q.eq('reviewer_status', filter.reviewerStatus);
    }
  }
  if (filter.deliveryReferenceNo) {
    q = q.eq('delivery_reference_no', filter.deliveryReferenceNo);
  }
  const { data, error } = await q;
  if (error) throw error;
  const out = [];
  for (const row of data || []) {
    out.push(await buildFullRequest(null, row));
  }
  return out;
};

export const createRequest = async (_pool, body, referenceNo) => {
  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from('delivery_requests')
    .insert({
      reference_no: referenceNo,
      delivery_type: body.deliveryType ?? null,
      date_from: toDateOrNull(body.dateFrom)?.toISOString() ?? null,
      date_to: toDateOrNull(body.dateTo)?.toISOString() ?? null,
      vehicle_equipment: body.vehicleEquipment ?? null,
      tnvs_provider: body.tnvsProvider ?? null,
      requested_by: body.requestedBy ?? null,
      date_submitted: new Date().toISOString(),
      notes: body.notes ?? null,
      total_budget: Number(body.totalBudget) || 0,
      requested_by_user_id: body.requestedByUserId ?? null,
      request_status: body.requestStatus || 'Pending',
      reviewer_status: body.reviewerStatus || 'Pending',
      original_vehicle: body.originalVehicle ?? null,
      vehicle_changed: !!body.vehicleChanged,
      vehicle_change_reason: body.vehicleChangeReason ?? null,
      delivery_reference_no: body.deliveryReferenceNo ? String(body.deliveryReferenceNo).trim() : null,
      combined_with_delivery: !!body.combinedWithDelivery,
    })
    .select()
    .single();
  if (error) throw error;
  await insertRequestChildren(null, row.id, body);
  return buildFullRequest(null, row);
};

export const saveRequest = async (_pool, requestObj) => {
  const lk = idLookup(requestObj._id);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { error } = await supabase
    .from('delivery_requests')
    .update({
      reference_no: requestObj.referenceNo,
      delivery_type: requestObj.deliveryType ?? null,
      date_from: toDateOrNull(requestObj.dateFrom)?.toISOString() ?? null,
      date_to: toDateOrNull(requestObj.dateTo)?.toISOString() ?? null,
      vehicle_equipment: requestObj.vehicleEquipment ?? null,
      tnvs_provider: requestObj.tnvsProvider ?? null,
      requested_by: requestObj.requestedBy ?? null,
      notes: requestObj.notes ?? null,
      total_budget: Number(requestObj.totalBudget) || 0,
      requested_by_user_id: requestObj.requestedByUserId ?? null,
      request_status: requestObj.requestStatus,
      decline_reason: requestObj.declineReason ?? null,
      reviewed_by: requestObj.reviewedBy ?? null,
      reviewed_at: toDateOrNull(requestObj.reviewedAt)?.toISOString() ?? null,
      reviewer_status: requestObj.reviewerStatus,
      reviewer_notes: requestObj.reviewerNotes ?? null,
      reviewer_reviewed_by: requestObj.reviewerReviewedBy ?? null,
      reviewer_reviewed_at: toDateOrNull(requestObj.reviewerReviewedAt)?.toISOString() ?? null,
      original_vehicle: requestObj.originalVehicle ?? null,
      vehicle_changed: !!requestObj.vehicleChanged,
      vehicle_change_reason: requestObj.vehicleChangeReason ?? null,
      delivery_reference_no: requestObj.deliveryReferenceNo ? String(requestObj.deliveryReferenceNo).trim() : null,
      combined_with_delivery: !!requestObj.combinedWithDelivery,
    })
    .eq('id', id);
  if (error) throw error;
  await clearRequestChildren(null, id);
  await insertRequestChildren(null, id, requestObj);
  const { data: updated } = await supabase.from('delivery_requests').select('*').eq('id', id).single();
  return buildFullRequest(null, updated);
};

export const patchRequestScalars = async (_pool, param, patch) => {
  const req = await findRequestByIdParam(null, param);
  if (!req) return null;
  Object.assign(req, patch);
  return saveRequest(null, req);
};

export const deleteRequest = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { error } = await supabase.from('delivery_requests').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const listSchedulesData = async (_pool) => {
  const supabase = getSupabase();
  const [pendingRes, approvedRes] = await Promise.all([
    supabase.from('delivery_requests').select('id, vehicle_equipment, date_from, date_to, request_status').eq('request_status', 'Pending'),
    supabase.from('delivery_requests').select('id, vehicle_equipment, date_from, date_to, request_status, delivery_reference_no').in('request_status', ['Approved', 'Approved with Changes']),
  ]);
  return { pending: pendingRes.data || [], approved: approvedRes.data || [] };
};
