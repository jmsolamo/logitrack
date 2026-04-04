import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Check if admin already exists
    const existing = await User.findOne({ username: 'logistic-department' });
    if (existing) {
      console.log('Admin account already exists, skipping seed.');
      await mongoose.disconnect();
      return;
    }

    // Create admin account
    const admin = new User({
      username: 'logistic-department',
      password: '123456',
      firstName: 'Logistic',
      lastName: 'Department',
      email: 'logistic-department@logitrack.com',
      department: 'logistic',
      role: 'admin',
    });

    await admin.save();
    console.log('✓ Admin account created successfully');
    console.log('  Username: logistic-department');
    console.log('  Password: 123456');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedAdmin();
