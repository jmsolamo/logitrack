import express from 'express';
import Personnel from '../models/Personnel.js';

const router = express.Router();

// @route   GET /api/personnels
// @desc    Get all personnels
// @access  Public
router.get('/', async (req, res) => {
  try {
    const personnels = await Personnel.find({}).sort({ createdAt: -1 });
    res.json(personnels);
  } catch (error) {
    console.error('Error fetching personnels:', error);
    res.status(500).json({ message: 'Server error fetching personnels' });
  }
});

// @route   POST /api/personnels
// @desc    Add new personnel
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { firstname, lastname, position } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !position) {
      return res.status(400).json({ message: 'All fields (firstname, lastname, position) are required' });
    }

    const newPersonnel = new Personnel({
      firstname,
      lastname,
      position
    });

    const savedPersonnel = await newPersonnel.save();
    res.status(201).json(savedPersonnel);
  } catch (error) {
    console.error('Error adding personnel:', error);
    res.status(500).json({ message: 'Server error adding personnel' });
  }
});

// @route   PUT /api/personnels/:id
// @desc    Update personnel
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { firstname, lastname, position } = req.body;
    const updatedPersonnel = await Personnel.findByIdAndUpdate(
      req.params.id,
      { firstname, lastname, position },
      { new: true }
    );
    
    if (!updatedPersonnel) {
      return res.status(404).json({ message: 'Personnel not found' });
    }
    
    res.json(updatedPersonnel);
  } catch (error) {
    console.error('Error updating personnel:', error);
    res.status(500).json({ message: 'Server error updating personnel' });
  }
});

// @route   DELETE /api/personnels/:id
// @desc    Delete personnel
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const deletedPersonnel = await Personnel.findByIdAndDelete(req.params.id);
    
    if (!deletedPersonnel) {
      return res.status(404).json({ message: 'Personnel not found' });
    }
    
    res.json({ message: 'Personnel removed successfully' });
  } catch (error) {
    console.error('Error deleting personnel:', error);
    res.status(500).json({ message: 'Server error deleting personnel' });
  }
});

export default router;
