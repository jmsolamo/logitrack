import { getSupabase } from '../db/supabase.js';

export const insertLoginHistory = async (_pool, logData) => {
  const supabase = getSupabase();
  const { username, status, reason, ipAddress } = logData;
  const { data, error } = await supabase.from('login_history').insert({
    username,
    status,
    reason: reason || null,
    ip_address: ipAddress || null,
  }).select();
  if (error) throw error;
  return data;
};

export const getLoginHistory = async (_pool, limit = 100) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('login_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Number(limit));
  if (error) throw error;
  return (data || []).map((item) => {
    const rawIp = item.ip_address || item.ipAddress || '';
    const cleanIp =
      rawIp === '::1' || rawIp === '::ffff:127.0.0.1'
        ? '127.0.0.1'
        : (rawIp.replace(/^::ffff:/, '') || '127.0.0.1');
    return {
      ...item,
      ip_address: cleanIp,
      ipAddress: cleanIp,
    };
  });
};

export const clearLoginHistory = async (_pool) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('login_history').delete().neq('id', 0);
  if (error) throw error;
  return true;
};
