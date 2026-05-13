import express from 'express';
import { getPool } from '../db/pool.js';
import { getLoginHistory, clearLoginHistory } from '../repositories/historyMysql.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const pool = getPool();
    const history = await getLoginHistory(pool, req.query.limit || 100);
    res.json(history);
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({ message: 'Failed to fetch login history', error: error.message });
  }
});

router.delete('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const pool = getPool();
    await clearLoginHistory(pool);
    res.json({ message: 'Logs cleared successfully' });
  } catch (error) {
    console.error('Error clearing login history:', error);
    res.status(500).json({ message: 'Failed to clear login history', error: error.message });
  }
});

export default router;
