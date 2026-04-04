import express from 'express';
import Purchase from '../models/Purchase.js';

const router = express.Router();

// Get all purchases
router.get('/', async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ date: -1, createdAt: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new purchase
router.post('/', async (req, res) => {
  const purchase = new Purchase(req.body);
  try {
    const newPurchase = await purchase.save();
    res.status(201).json(newPurchase);
  } catch (error) {
    console.error('Validation Error Details:', JSON.stringify(error, null, 2));
    res.status(400).json({ message: error.message, details: error });
  }
});

// Update a purchase
router.put('/:id', async (req, res) => {
  try {
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPurchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(updatedPurchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a purchase
router.delete('/:id', async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
