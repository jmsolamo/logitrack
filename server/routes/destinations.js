import express from 'express';
import Destination from '../models/Destination.js';

const router = express.Router();

// @route   GET /api/destinations
// @desc    Get all destinations
// @access  Public
router.get('/', async (req, res) => {
  try {
    const destinations = await Destination.find({}).sort({ name: 1 });
    res.json(destinations);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ message: 'Server error fetching destinations' });
  }
});

// @route   POST /api/destinations
// @desc    Add new destination
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Destination name is required' });
    }

    const existingDestination = await Destination.findOne({ name: name.toUpperCase() });
    if (existingDestination) {
      return res.status(400).json({ message: 'Destination already exists' });
    }

    const newDestination = new Destination({
      name
    });

    const savedDestination = await newDestination.save();
    res.status(201).json(savedDestination);
  } catch (error) {
    console.error('Error adding destination:', error);
    res.status(500).json({ message: 'Server error adding destination' });
  }
});

// @route   PUT /api/destinations/:id
// @desc    Update destination
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Destination name is required' });
    }

    const updatedDestination = await Destination.findByIdAndUpdate(
      req.params.id,
      { name: name.toUpperCase() },
      { new: true }
    );
    
    if (!updatedDestination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    
    res.json(updatedDestination);
  } catch (error) {
    console.error('Error updating destination:', error);
    res.status(500).json({ message: 'Server error updating destination' });
  }
});

// @route   DELETE /api/destinations/:id
// @desc    Delete destination
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const deletedDestination = await Destination.findByIdAndDelete(req.params.id);
    
    if (!deletedDestination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    
    res.json({ message: 'Destination removed successfully' });
  } catch (error) {
    console.error('Error deleting destination:', error);
    res.status(500).json({ message: 'Server error deleting destination' });
  }
});

export default router;
