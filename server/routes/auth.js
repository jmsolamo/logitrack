import express from 'express';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Register user (after Firebase auth)
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, initials, email, role } = req.body;
    const firebaseUid = req.user.uid;

    // Check if user already exists by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Check if Firebase UID already registered
    const existingUid = await User.findOne({ firebaseUid });
    if (existingUid) {
      return res.status(409).json({ message: 'Account already registered' });
    }

    // Create new user in MongoDB
    const user = new User({
      firebaseUid,
      firstName,
      lastName,
      initials: initials || '',
      email,
      role: role || 'user'
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Check if user exists in MongoDB
router.get('/check', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ message: 'Error checking user', error: error.message });
  }
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

export default router;
