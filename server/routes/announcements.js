import express from 'express';
import { getPool } from '../db/pool.js';
import * as announcementsMysql from '../repositories/announcementsMysql.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const userRole = req.user.role;
    const announcements = await announcementsMysql.findActiveForRole(pool, userRole);
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
});

router.get('/all', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const userRole = req.user.role;
    if (userRole === 'admin') {
      const announcements = await announcementsMysql.listAllForAdmin(pool);
      return res.json(announcements);
    }
    const announcements = await announcementsMysql.listForRoleAll(pool, userRole);
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create announcements' });
    }
    const { title, content, targetRoles, startDate, endDate } = req.body;
    if (!title || !content || !startDate || !endDate) {
      return res.status(400).json({ message: 'Title, content, startDate, and endDate are required' });
    }
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }
    const pool = getPool();
    const announcement = await announcementsMysql.createAnnouncement(pool, { title, content, targetRoles, startDate, endDate }, req.user.username);
    res.status(201).json({ message: 'Announcement created successfully', announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Error creating announcement', error: error.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update announcements' });
    }
    const { title, content, targetRoles, startDate, endDate } = req.body;
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }
    const pool = getPool();
    const announcement = await announcementsMysql.updateAnnouncement(pool, req.params.id, {
      title,
      content,
      targetRoles,
      startDate,
      endDate,
    });
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ message: 'Announcement updated successfully', announcement });
  } catch (error) {
    res.status(500).json({ message: 'Error updating announcement', error: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete announcements' });
    }
    const pool = getPool();
    const ok = await announcementsMysql.deleteAnnouncement(pool, req.params.id);
    if (!ok) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting announcement', error: error.message });
  }
});

export default router;
