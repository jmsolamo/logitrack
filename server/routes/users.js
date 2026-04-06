import express from 'express';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Create user (admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { username, password, department, role } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const user = new User({
      username,
      password,
      plainPassword: password,
      department: department || '',
      role: role || 'user'
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully', user: { username: user.username, department: user.department, role: user.role } });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Update user (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { username, password, department, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username;
    if (password) {
      user.password = password;
      user.plainPassword = password;
    }
    if (department !== undefined) user.department = department;
    if (role) user.role = role;

    await user.save();
    res.json({ message: 'User updated successfully', user: { username: user.username, department: user.department, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

export default router;
