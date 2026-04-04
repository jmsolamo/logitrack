import User from '../models/User.js';

// Seed the default admin account if it doesn't exist
const seedDefaultAdmin = async () => {
  try {
    const existing = await User.findOne({ username: 'logistic-department' });
    if (!existing) {
      const admin = new User({
        username: 'logistic-department',
        password: '123456',
        department: 'logistic',
        role: 'admin',
      });
      await admin.save();
      console.log('✓ Default admin account seeded');
    }
  } catch (error) {
    console.error('Seed error:', error.message);
  }
};

export default seedDefaultAdmin;
