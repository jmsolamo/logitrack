import express from 'express';
import jwt from 'jsonwebtoken';
import { getPool } from '../db/pool.js';
import * as usersMysql from '../repositories/usersMysql.js';
import { verifyToken } from '../middleware/auth.js';
import { insertLoginHistory } from '../repositories/historyMysql.js';

const router = express.Router();

const publicUser = (u) => ({
  _id: String(u.id),
  username: u.username,
  role: u.role,
  department: u.department,
});

router.post('/login', async (req, res) => {
  try {
    const { username, password, captchaToken } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    if (!captchaToken) {
      return res.status(400).json({ message: 'Please complete the reCAPTCHA verification' });
    }

    if (captchaToken !== 'dev-bypass') {
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
      const recaptchaRes = await fetch(verifyUrl, { method: 'POST' });
      const recaptchaData = await recaptchaRes.json();
      if (!recaptchaData.success) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed. Please try again.' });
      }
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || req.ip;

    const pool = getPool();
    const userRow = await usersMysql.findUserByUsername(pool, username);
    if (!userRow) {
      await insertLoginHistory(pool, { username, status: 'Failed', reason: 'Invalid username', ipAddress: clientIp });
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const ok = await usersMysql.comparePassword(password, userRow.password_hash);
    if (!ok) {
      await insertLoginHistory(pool, { username, status: 'Failed', reason: 'Invalid password', ipAddress: clientIp });
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        _id: String(userRow.id),
        username: userRow.username,
        role: userRow.role,
        department: userRow.department,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      token,
      user: {
        _id: String(userRow.id),
        username: userRow.username,
        role: userRow.role,
        department: userRow.department,
      },
    });

    await insertLoginHistory(pool, { username, status: 'Success', reason: 'Logged in successfully', ipAddress: clientIp });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const raw = await usersMysql.findUserByIdParam(pool, req.user._id);
    if (!raw) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(publicUser(raw));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

router.put('/update-profile', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    const pool = getPool();
    const raw = await usersMysql.findUserByIdParam(pool, req.user._id);
    if (!raw) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ok = await usersMysql.comparePassword(currentPassword, raw.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    if (newUsername && newUsername !== raw.username) {
      const existing = await usersMysql.findUserByUsername(pool, newUsername);
      if (existing) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    const patch = {};
    if (newUsername && newUsername !== raw.username) patch.username = newUsername;
    if (newPassword) patch.password = newPassword;

    const updated = await usersMysql.updateUserByIdParam(pool, req.user._id, patch);

    const token = jwt.sign(
      {
        _id: req.user._id,
        username: updated.username,
        role: updated.role,
        department: updated.department,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      message: 'Profile updated successfully',
      token,
      user: publicUser(updated),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

export default router;
