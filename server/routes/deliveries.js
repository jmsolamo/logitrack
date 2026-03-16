import express from 'express';
import Delivery from '../models/Delivery.js';

const router = express.Router();

// Generate a unique reference number based on delivery type
// Field Trip → FT-YYYYMMDD-XXX
// Itinerary  → ITN-YYYYMMDD-XXX
const generateReferenceNo = async (deliveryType) => {
  const prefix = deliveryType === 'Itinerary' ? 'ITN' : 'FT';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const pattern = `${prefix}-${dateStr}-`;

  // Find the latest entry with this prefix+date to determine next sequence
  const latest = await Delivery.findOne({ referenceNo: { $regex: `^${pattern}` } })
    .sort({ referenceNo: -1 });

  let seq = 1;
  if (latest) {
    const lastSeq = parseInt(latest.referenceNo.split('-').pop(), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${pattern}${String(seq).padStart(3, '0')}`;
};

// @route   GET /api/deliveries
// @desc    Get all deliveries
// @access  Public
router.get('/', async (req, res) => {
  try {
    const deliveries = await Delivery.find({}).sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ message: 'Server error fetching deliveries' });
  }
});

// @route   GET /api/deliveries/:id
// @desc    Get single delivery by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json(delivery);
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({ message: 'Server error fetching delivery' });
  }
});

// @route   POST /api/deliveries
// @desc    Create a new delivery
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { deliveryType } = req.body;

    if (!deliveryType) {
      return res.status(400).json({ message: 'Delivery Type is required' });
    }

    const referenceNo = await generateReferenceNo(deliveryType);

    const newDelivery = new Delivery({
      referenceNo,
      ...req.body
    });

    const savedDelivery = await newDelivery.save();
    res.status(201).json(savedDelivery);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Error creating delivery:', error);
    res.status(500).json({ message: 'Server error creating delivery' });
  }
});

// @route   PUT /api/deliveries/:id
// @desc    Update a delivery
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    // Prevent overwriting the referenceNo
    const { referenceNo, ...updateData } = req.body;

    const updatedDelivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDelivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json(updatedDelivery);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Error updating delivery:', error);
    res.status(500).json({ message: 'Server error updating delivery' });
  }
});

// @route   DELETE /api/deliveries/:id
// @desc    Delete a delivery
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const deletedDelivery = await Delivery.findByIdAndDelete(req.params.id);

    if (!deletedDelivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json({ message: 'Delivery removed successfully' });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({ message: 'Server error deleting delivery' });
  }
});

export default router;
