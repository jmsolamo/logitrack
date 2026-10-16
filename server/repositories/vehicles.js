import { getSupabase } from '../db/supabase.js';
import { toApiId, idLookup } from '../utils/entityId.js';

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

export const listVehicles = async (_pool) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, vehicle_maintenance_logs(id)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((v) =>
    map({ ...v, maintenance_count: v.vehicle_maintenance_logs?.length || 0 })
  );
};

export const findByPlate = async (_pool, plate) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .ilike('plate_number', String(plate).trim())
    .maybeSingle();
  if (error) throw error;
  return data || null;
};

export const createVehicle = async (_pool, body) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      plate_number: String(body.plateNumber).toUpperCase(),
      model: body.model,
    })
    .select()
    .single();
  if (error) throw error;
  return map(data);
};

export const updateVehicle = async (_pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const updates = {};
  if (body.plateNumber !== undefined) updates.plate_number = String(body.plateNumber).toUpperCase();
  if (body.model !== undefined) updates.model = body.model;
  const { data, error } = await supabase.from('vehicles').update(updates).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return map(data);
};

export const deleteVehicle = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const updateMaintenance = async (_pool, param, updateData) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { data: ex } = await supabase.from('vehicles').select('id, status').eq('id', id).maybeSingle();
  if (!ex) return null;

  if (updateData.status === 'Maintenance' && ex.status !== 'Maintenance') {
    await supabase.from('vehicle_maintenance_logs').insert({
      vehicle_id: id,
      reason: updateData.maintenanceReason || '',
      start_date: updateData.maintenanceStartDate || null,
      end_date: updateData.maintenanceEndDate || null,
    });
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update({
      status: updateData.status,
      maintenance_reason: updateData.maintenanceReason ?? '',
      maintenance_start_date: updateData.maintenanceStartDate ?? null,
      maintenance_end_date: updateData.maintenanceEndDate ?? null,
    })
    .eq('id', id)
    .select('*, vehicle_maintenance_logs(id)')
    .single();
  if (error) throw error;
  return map({ ...data, maintenance_count: data.vehicle_maintenance_logs?.length || 0 });
};

export const countVehicles = async (_pool, whereSql) => {
  const supabase = getSupabase();
  let q = supabase.from('vehicles').select('*', { count: 'exact', head: true });
  if (whereSql && whereSql.includes("status = 'Available'")) {
    q = q.eq('status', 'Available');
  } else if (whereSql && whereSql.includes("status = 'Maintenance'")) {
    q = q.eq('status', 'Maintenance');
  } else if (whereSql && whereSql.includes("status IN ('Unavailable','Booked')")) {
    q = q.in('status', ['Unavailable', 'Booked']);
  }
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
};

export const findVehiclesWhere = async (_pool, whereSql) => {
  const supabase = getSupabase();
  let q = supabase.from('vehicles').select('*').order('updated_at', { ascending: false });
  if (whereSql && whereSql.includes("status IN ('Maintenance','Unavailable','Booked')")) {
    q = q.in('status', ['Maintenance', 'Unavailable', 'Booked']);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(map);
};

export const selectPlatesModels = async (_pool) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('vehicles').select('plate_number, model');
  if (error) throw error;
  return (data || []).map((v) => ({ plateNumber: v.plate_number, model: v.model }));
};

export const getMaintenanceLogsByMonth = async (_pool) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('vehicle_maintenance_logs')
    .select('created_at, vehicles(plate_number)');
  if (error) throw error;
  const mapAgg = {};
  for (const item of data || []) {
    const month = item.created_at ? item.created_at.substring(0, 7) : 'Unknown';
    const plate = item.vehicles?.plate_number || 'Unknown';
    const key = `${month}_${plate}`;
    if (!mapAgg[key]) {
      mapAgg[key] = { month, plateNumber: plate, count: 0 };
    }
    mapAgg[key].count += 1;
  }
  return Object.values(mapAgg).sort((a, b) => a.month.localeCompare(b.month) || b.count - a.count);
};
