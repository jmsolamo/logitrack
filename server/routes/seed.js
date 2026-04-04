import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Seed admin user endpoint (remove this in production!)
router.post('/seed-admin', async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: 'logistic-department' });
    if (existingUser) {
      return res.json({ message: 'Admin user already exists' });
    }

    const admin = new User({
      username: 'logistic-department',
      password: '123456',
      department: 'logistic',
      role: 'admin'
    });

    await admin.save();
    res.json({ message: 'Admin user created successfully', username: 'logistic-department' });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding admin', error: error.message });
  }
});

export default router;
