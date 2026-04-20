import express from 'express';
import Announcement from '../models/Announcement.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get active announcements (for users after login)
// Returns announcements where current date is between startDate and endDate, filtered by user role
router.get('/', verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role; // 'admin', 'reviewer', or 'user'
    const now = new Date();

    const announcements = await Announcement.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
      targetRoles: userRole
    }).sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
});

// Get all announcements (for history view and admin management)
// Admins can see all; users/reviewers see only those visible to them
router.get('/all', verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    if (userRole === 'admin') {
      // Admins see all announcements
      const announcements = await Announcement.find().sort({ createdAt: -1 });
      res.json(announcements);
    } else {
      // Users and reviewers see only announcements visible to them (including expired ones)
      const announcements = await Announcement.find({
        targetRoles: userRole
      }).sort({ createdAt: -1 });
      res.json(announcements);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
});

// Create announcement (admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create announcements' });
    }

    const { title, content, targetRoles, startDate, endDate } = req.body;

    // Validation
    if (!title || !content || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Title, content, startDate, and endDate are required' 
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ 
        message: 'Start date must be before end date' 
      });
    }

    const announcement = new Announcement({
      title,
      content,
      targetRoles: targetRoles || ['user', 'reviewer', 'admin'],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdBy: req.user.username
    });

    await announcement.save();
    res.status(201).json({ 
      message: 'Announcement created successfully', 
      announcement 
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Error creating announcement', error: error.message });
  }
});

// Update announcement (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update announcements' });
    }

    const { title, content, targetRoles, startDate, endDate } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Validate dates if provided
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ 
          message: 'Start date must be before end date' 
        });
      }
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (targetRoles) announcement.targetRoles = targetRoles;
    if (startDate) announcement.startDate = new Date(startDate);
    if (endDate) announcement.endDate = new Date(endDate);

    await announcement.save();
    res.json({ 
      message: 'Announcement updated successfully', 
      announcement 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating announcement', error: error.message });
  }
});

// Delete announcement (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete announcements' });
    }

    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting announcement', error: error.message });
  }
});

export default router;
