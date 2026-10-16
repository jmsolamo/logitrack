import { getSupabase } from '../db/supabase.js';
import { toApiId, idLookup } from '../utils/entityId.js';

const formatSupabaseAnnouncement = (row) => {
  if (!row) return null;
  const roles = (row.announcement_target_roles || []).map((r) => r.role_name);
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

export const findActiveForRole = async (_pool, role) => {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('announcements')
    .select('*, announcement_target_roles!inner(role_name)')
    .lte('start_date', now)
    .gte('end_date', now)
    .eq('announcement_target_roles.role_name', role)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(formatSupabaseAnnouncement);
};

export const listAllForAdmin = async (_pool) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('announcements')
    .select('*, announcement_target_roles(role_name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(formatSupabaseAnnouncement);
};

export const listForRoleAll = async (_pool, role) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('announcements')
    .select('*, announcement_target_roles!inner(role_name)')
    .eq('announcement_target_roles.role_name', role)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(formatSupabaseAnnouncement);
};

export const createAnnouncement = async (_pool, body, createdByUsername) => {
  const supabase = getSupabase();
  const { data: ann, error: err1 } = await supabase.from('announcements').insert({
    title: body.title,
    content: body.content,
    start_date: new Date(body.startDate).toISOString(),
    end_date: new Date(body.endDate).toISOString(),
    created_by: createdByUsername,
  }).select().single();
  if (err1) throw err1;

  const roles = Array.isArray(body.targetRoles) && body.targetRoles.length ? body.targetRoles : ['requestor', 'manager', 'admin'];
  const roleRows = roles.map((r) => ({ announcement_id: ann.id, role_name: r }));
  const { error: err2 } = await supabase.from('announcement_target_roles').insert(roleRows);
  if (err2) throw err2;

  const { data: full } = await supabase
    .from('announcements')
    .select('*, announcement_target_roles(role_name)')
    .eq('id', ann.id)
    .single();
  return formatSupabaseAnnouncement(full);
};

export const updateAnnouncement = async (_pool, param, body) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const updates = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  if (body.startDate) updates.start_date = new Date(body.startDate).toISOString();
  if (body.endDate) updates.end_date = new Date(body.endDate).toISOString();

  if (Object.keys(updates).length) {
    await supabase.from('announcements').update(updates).eq('id', id);
  }
  if (body.targetRoles) {
    await supabase.from('announcement_target_roles').delete().eq('announcement_id', id);
    const roleRows = body.targetRoles.map((r) => ({ announcement_id: id, role_name: r }));
    if (roleRows.length) {
      await supabase.from('announcement_target_roles').insert(roleRows);
    }
  }
  const { data: full } = await supabase
    .from('announcements')
    .select('*, announcement_target_roles(role_name)')
    .eq('id', id)
    .single();
  return formatSupabaseAnnouncement(full);
};

export const deleteAnnouncement = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const countAnnouncements = async (_pool) => {
  const supabase = getSupabase();
  const { count, error } = await supabase.from('announcements').select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
};
