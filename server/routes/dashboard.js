import express from 'express';
import * as dashboardRepo from '../repositories/dashboard.js';

const router = express.Router();

router.get('/metrics', async (req, res) => {
  try {
    const pool = null;
    const data = await dashboardRepo.getMetrics(pool);
    res.json(data);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ message: 'Error fetching metrics' });
  }
});

router.get('/charts', async (req, res) => {
  try {
    const pool = null;
    const data = await dashboardRepo.getCharts(pool);
    res.json(data);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ message: 'Error fetching chart data' });
  }
});

router.get('/activity', async (req, res) => {
  try {
    const pool = null;
    const data = await dashboardRepo.getActivity(pool);
    res.json(data);
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ message: 'Error fetching activity feed' });
  }
});

router.get('/user-metrics', async (req, res) => {
  try {
    const { userId, username, role } = req.query;
    if (!userId || !username) {
      return res.status(400).json({ message: 'userId and username are required' });
    }
    const pool = null;
    const data = await dashboardRepo.getUserMetrics(pool, userId, username, role);
    res.json(data);
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    res.status(500).json({ message: 'Error fetching metrics' });
  }
});

router.get('/user-charts', async (req, res) => {
  try {
    const { userId, username } = req.query;
    if (!userId || !username) {
      return res.status(400).json({ message: 'userId and username are required' });
    }
    const pool = null;
    const data = await dashboardRepo.getUserCharts(pool, userId, username);
    res.json(data);
  } catch (error) {
    console.error('Error fetching user chart data:', error);
    res.status(500).json({ message: 'Error fetching chart data' });
  }
});

export default router;
