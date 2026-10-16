import bcrypt from 'bcryptjs';
import { getSupabase } from '../db/supabase.js';
import { toApiId, idLookup } from '../utils/entityId.js';

const mapUser = (r) =>
  r
    ? {
        _id: toApiId(r),
        id: r.id,
        username: r.username,
        plainPassword: r.plain_password,
        department: r.department,
        role: r.role,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    : null;

export const findUserByUsername = async (_pool, username) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('users').select('*').eq('username', username).maybeSingle();
  if (error) throw error;
  return data || null;
};

export const findUserByIdParam = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data || null;
};

export const comparePassword = async (plain, passwordHash) => bcrypt.compare(plain, passwordHash);

export const hashPassword = async (plain) => bcrypt.hash(plain, 10);

export const listUsers = async (_pool) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, username, plain_password, department, role, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapUser);
};

export const createUser = async (_pool, { username, password, department, role }) => {
  const hash = await hashPassword(password);
  const supabase = getSupabase();
  const { data, error } = await supabase.from('users').insert({
    username,
    password_hash: hash,
    plain_password: password,
    department: department || '',
    role: role || 'requestor',
  }).select().single();
  if (error) throw error;
  return mapUser(data);
};

export const updateUserByIdParam = async (_pool, param, { username, password, department, role }) => {
  const lk = idLookup(param);
  if (!lk) return null;
  const id = lk.params[0];
  const supabase = getSupabase();
  const updates = {};
  if (username !== undefined) updates.username = username;
  if (password !== undefined) {
    updates.password_hash = await hashPassword(password);
    updates.plain_password = password;
  }
  if (department !== undefined) updates.department = department;
  if (role !== undefined) updates.role = role;

  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return mapUser(data);
};

export const deleteUserByIdParam = async (_pool, param) => {
  const lk = idLookup(param);
  if (!lk) return false;
  const id = lk.params[0];
  const supabase = getSupabase();
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const seedDefaultAdmin = async () => {
  const supabase = getSupabase();
  const seedUser = async (username, password, department, role) => {
    const { data } = await supabase.from('users').select('id').eq('username', username).maybeSingle();
    if (data) return;
    const hash = await hashPassword(password);
    await supabase.from('users').insert({
      username,
      password_hash: hash,
      plain_password: password,
      department,
      role,
    });
  };

  await seedUser('logistic-department', '123456', 'logistic', 'admin');
  await seedUser('demo-admin', '123456', 'logistic', 'admin');
  await seedUser('demo-requestor', '123456', 'operations', 'requestor');
};
