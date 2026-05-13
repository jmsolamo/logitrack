import express from 'express';
import { getPool } from '../db/pool.js';
import * as usersMysql from '../repositories/usersMysql.js';

const router = express.Router();

router.post('/seed-admin', async (req, res) => {
  try {
    const pool = getPool();
    const existingUser = await usersMysql.findUserByUsername(pool, 'logistic-department');
    if (existingUser) {
      return res.json({ message: 'Admin user already exists' });
    }
    await usersMysql.seedDefaultAdmin();
    res.json({ message: 'Admin user created successfully', username: 'logistic-department' });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding admin', error: error.message });
  }
});

export default router;
