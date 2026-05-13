import express from 'express';
import { getPool } from '../db/pool.js';
import * as deliveryChargesMysql from '../repositories/deliveryChargesMysql.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const charges = await deliveryChargesMysql.listCharges(pool);
    res.json(charges);
  } catch (error) {
    console.error('Error fetching delivery charges:', error);
    res.status(500).json({ message: 'Server error fetching delivery charges' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { plateNumber, destination, charge } = req.body;
    if (!plateNumber) return res.status(400).json({ message: 'Plate Number is required' });
    if (!destination) return res.status(400).json({ message: 'Destination is required' });
    if (charge === undefined || charge === null || charge === '') {
      return res.status(400).json({ message: 'Delivery Charge is required' });
    }
    const pool = getPool();
    const savedCharge = await deliveryChargesMysql.createCharge(pool, { plateNumber, destination, charge });
    res.status(201).json(savedCharge);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'A delivery charge for this plate number and destination already exists' });
    }
    console.error('Error adding delivery charge:', error);
    res.status(500).json({ message: 'Server error adding delivery charge' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { plateNumber, destination, charge } = req.body;
    if (!plateNumber) return res.status(400).json({ message: 'Plate Number is required' });
    if (!destination) return res.status(400).json({ message: 'Destination is required' });
    if (charge === undefined || charge === null || charge === '') {
      return res.status(400).json({ message: 'Delivery Charge is required' });
    }
    const pool = getPool();
    const updatedCharge = await deliveryChargesMysql.updateCharge(pool, req.params.id, { plateNumber, destination, charge });
    if (!updatedCharge) {
      return res.status(404).json({ message: 'Delivery charge entry not found' });
    }
    res.json(updatedCharge);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'A delivery charge for this plate number and destination already exists' });
    }
    console.error('Error updating delivery charge:', error);
    res.status(500).json({ message: 'Server error updating delivery charge' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const ok = await deliveryChargesMysql.deleteCharge(pool, req.params.id);
    if (!ok) {
      return res.status(404).json({ message: 'Delivery charge entry not found' });
    }
    res.json({ message: 'Delivery charge entry removed successfully' });
  } catch (error) {
    console.error('Error deleting delivery charge:', error);
    res.status(500).json({ message: 'Server error deleting delivery charge' });
  }
});

export default router;
