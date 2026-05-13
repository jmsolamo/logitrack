import express from 'express';
import { getPool } from '../db/pool.js';
import * as personnelsMysql from '../repositories/personnelsMysql.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const personnels = await personnelsMysql.listPersonnels(pool);
    res.json(personnels);
  } catch (error) {
    console.error('Error fetching personnels:', error);
    res.status(500).json({ message: 'Server error fetching personnels' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { firstname, lastname, position } = req.body;
    if (!firstname || !lastname || !position) {
      return res.status(400).json({ message: 'All fields (firstname, lastname, position) are required' });
    }
    const pool = getPool();
    const savedPersonnel = await personnelsMysql.createPersonnel(pool, { firstname, lastname, position });
    res.status(201).json(savedPersonnel);
  } catch (error) {
    console.error('Error adding personnel:', error);
    res.status(500).json({ message: 'Server error adding personnel' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { firstname, lastname, position } = req.body;
    const pool = getPool();
    const updatedPersonnel = await personnelsMysql.updatePersonnel(pool, req.params.id, { firstname, lastname, position });
    if (!updatedPersonnel) {
      return res.status(404).json({ message: 'Personnel not found' });
    }
    res.json(updatedPersonnel);
  } catch (error) {
    console.error('Error updating personnel:', error);
    res.status(500).json({ message: 'Server error updating personnel' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const ok = await personnelsMysql.deletePersonnel(pool, req.params.id);
    if (!ok) {
      return res.status(404).json({ message: 'Personnel not found' });
    }
    res.json({ message: 'Personnel removed successfully' });
  } catch (error) {
    console.error('Error deleting personnel:', error);
    res.status(500).json({ message: 'Server error deleting personnel' });
  }
});

export default router;
