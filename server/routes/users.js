import express from 'express';
import { getPool } from '../db/pool.js';
import * as usersMysql from '../repositories/usersMysql.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const users = await usersMysql.listUsers(pool);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { username, password, department, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const pool = getPool();
    const existingUser = await usersMysql.findUserByUsername(pool, username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    const user = await usersMysql.createUser(pool, { username, password, department, role });
    res.status(201).json({ message: 'User created successfully', user: { username: user.username, department: user.department, role: user.role } });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { username, password, department, role } = req.body;
    const patch = {};
    if (username !== undefined) patch.username = username;
    if (password !== undefined) patch.password = password;
    if (department !== undefined) patch.department = department;
    if (role !== undefined) patch.role = role;
    const pool = getPool();
    const user = await usersMysql.updateUserByIdParam(pool, req.params.id, patch);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully', user: { username: user.username, department: user.department, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const ok = await usersMysql.deleteUserByIdParam(pool, req.params.id);
    if (!ok) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

export default router;
