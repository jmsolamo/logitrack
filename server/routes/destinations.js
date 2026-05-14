import express from 'express';
import { getPool } from '../db/pool.js';
import * as destinationsMysql from '../repositories/destinationsMysql.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const destinations = await destinationsMysql.listDestinations(pool);
    res.json(destinations);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ message: 'Server error fetching destinations' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, customerSupplier } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Destination name is required' });
    }
    const pool = getPool();
    const existingCombination = await destinationsMysql.findByCombination(pool, name, customerSupplier);
    if (existingCombination) {
      return res.status(400).json({ message: 'Destination with this Customer/Supplier already exists' });
    }
    const savedDestination = await destinationsMysql.createDestination(pool, { name, customerSupplier });
    res.status(201).json(savedDestination);
  } catch (error) {
    console.error('Error adding destination:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Destination with this Customer/Supplier already exists' });
    }

    res.status(500).json({ 
      message: 'Server error adding destination',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, customerSupplier } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Destination name is required' });
    }
    const pool = getPool();
    
    // Check if the combination already exists for another record
    const existingCombination = await destinationsMysql.findByCombination(pool, name, customerSupplier);
    if (existingCombination && existingCombination._id !== req.params.id) {
       return res.status(400).json({ message: 'Destination with this Customer/Supplier already exists' });
    }

    const updatedDestination = await destinationsMysql.updateDestination(pool, req.params.id, { name, customerSupplier });
    if (!updatedDestination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.json(updatedDestination);
  } catch (error) {
    console.error('Error updating destination:', error);
    res.status(500).json({ message: 'Server error updating destination' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const ok = await destinationsMysql.deleteDestination(pool, req.params.id);
    if (!ok) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.json({ message: 'Destination removed successfully' });
  } catch (error) {
    console.error('Error deleting destination:', error);
    res.status(500).json({ message: 'Server error deleting destination' });
  }
});

export default router;
