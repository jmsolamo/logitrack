import express from 'express';
import DeliveryCharge from '../models/DeliveryCharge.js';

const router = express.Router();

// @route   GET /api/delivery-charges
// @desc    Get all delivery charges
// @access  Public
router.get('/', async (req, res) => {
  try {
    const charges = await DeliveryCharge.find({}).sort({ createdAt: -1 });
    res.json(charges);
  } catch (error) {
    console.error('Error fetching delivery charges:', error);
    res.status(500).json({ message: 'Server error fetching delivery charges' });
  }
});

// @route   POST /api/delivery-charges
// @desc    Add new delivery charge
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { plateNumber, destination, charge } = req.body;

    if (!plateNumber) return res.status(400).json({ message: 'Plate Number is required' });
    if (!destination) return res.status(400).json({ message: 'Destination is required' });
    if (charge === undefined || charge === null || charge === '') {
      return res.status(400).json({ message: 'Delivery Charge is required' });
    }

    const newCharge = new DeliveryCharge({
      plateNumber,
      destination,
      charge
    });

    const savedCharge = await newCharge.save();
    res.status(201).json(savedCharge);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A delivery charge for this plate number and destination already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Error adding delivery charge:', error);
    res.status(500).json({ message: 'Server error adding delivery charge' });
  }
});

// @route   PUT /api/delivery-charges/:id
// @desc    Update delivery charge
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { plateNumber, destination, charge } = req.body;
    
    if (!plateNumber) return res.status(400).json({ message: 'Plate Number is required' });
    if (!destination) return res.status(400).json({ message: 'Destination is required' });
    if (charge === undefined || charge === null || charge === '') {
      return res.status(400).json({ message: 'Delivery Charge is required' });
    }

    const updatedCharge = await DeliveryCharge.findByIdAndUpdate(
      req.params.id,
      { 
        plateNumber: plateNumber.toUpperCase(), 
        destination: destination.toUpperCase(), 
        charge 
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCharge) {
      return res.status(404).json({ message: 'Delivery charge entry not found' });
    }
    
    res.json(updatedCharge);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A delivery charge for this plate number and destination already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Error updating delivery charge:', error);
    res.status(500).json({ message: 'Server error updating delivery charge' });
  }
});

// @route   DELETE /api/delivery-charges/:id
// @desc    Delete delivery charge
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const deletedCharge = await DeliveryCharge.findByIdAndDelete(req.params.id);
    
    if (!deletedCharge) {
      return res.status(404).json({ message: 'Delivery charge entry not found' });
    }
    
    res.json({ message: 'Delivery charge entry removed successfully' });
  } catch (error) {
    console.error('Error deleting delivery charge:', error);
    res.status(500).json({ message: 'Server error deleting delivery charge' });
  }
});

export default router;
