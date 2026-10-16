import express from 'express';
import * as purchasesRepo from '../repositories/purchases.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pool = null;
    const purchases = await purchasesRepo.listPurchases(pool);
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = null;
    const newPurchase = await purchasesRepo.createPurchase(pool, req.body);
    res.status(201).json(newPurchase);
  } catch (error) {
    console.error('Validation Error Details:', JSON.stringify(error, null, 2));
    res.status(400).json({ message: error.message, details: error });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pool = null;
    const updatedPurchase = await purchasesRepo.updatePurchase(pool, req.params.id, req.body);
    if (!updatedPurchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(updatedPurchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = null;
    const ok = await purchasesRepo.deletePurchase(pool, req.params.id);
    if (!ok) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
