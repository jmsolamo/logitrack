import dotenv from 'dotenv';

dotenv.config();

import { getPool } from './db/pool.js';
import * as usersMysql from './repositories/usersMysql.js';

const seedAdmin = async () => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    console.log('MySQL connected');

    const existing = await usersMysql.findUserByUsername(pool, 'logistic-department');
    if (existing) {
      console.log('Admin account already exists, skipping seed.');
      return;
    }

    await usersMysql.seedDefaultAdmin();
    console.log('✓ Admin account created successfully');
    console.log('  Username: logistic-department');
    console.log('  Password: 123456');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedAdmin();
