import express from 'express';
<<<<<<< HEAD
import jwt from 'jsonwebtoken';
=======
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

<<<<<<< HEAD
// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password, captchaToken } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (!captchaToken) {
      return res.status(400).json({ message: 'Please complete the reCAPTCHA verification' });
    }

    // Verify reCAPTCHA token
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
    const recaptchaRes = await fetch(verifyUrl, { method: 'POST' });
    const recaptchaData = await recaptchaRes.json();

    if (!recaptchaData.success) {
      return res.status(400).json({ message: 'reCAPTCHA verification failed. Please try again.' });
    }

    // Find user in MongoDB
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        role: user.role,
        department: user.department,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get user profile (from JWT token)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
=======
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
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

export default router;
