import express from 'express';
import { getPool } from '../db/pool.js';
import * as vehiclesMysql from '../repositories/vehiclesMysql.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const vehicles = await vehiclesMysql.listVehicles(pool);
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Server error fetching vehicles' });
  }
});

router.get('/maintenance-logs/monthly', async (req, res) => {
  try {
    const pool = getPool();
    const logs = await vehiclesMysql.getMaintenanceLogsByMonth(pool);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    res.status(500).json({ message: 'Server error fetching maintenance logs' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { plateNumber, model } = req.body;
    if (!plateNumber || !model) {
      return res.status(400).json({ message: 'All fields (plateNumber, model) are required' });
    }
    const pool = getPool();
    const existingVehicle = await vehiclesMysql.findByPlate(pool, plateNumber);
    if (existingVehicle) {
      return res.status(400).json({ message: 'Vehicle with this plate number already exists' });
    }
    const savedVehicle = await vehiclesMysql.createVehicle(pool, { plateNumber, model });
    res.status(201).json(savedVehicle);
  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({ message: 'Server error adding vehicle' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { plateNumber, model } = req.body;
    const pool = getPool();
    const updatedVehicle = await vehiclesMysql.updateVehicle(pool, req.params.id, { plateNumber, model });
    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ message: 'Server error updating vehicle' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const ok = await vehiclesMysql.deleteVehicle(pool, req.params.id);
    if (!ok) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle removed successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ message: 'Server error deleting vehicle' });
  }
});

router.put('/:id/maintenance', async (req, res) => {
  try {
    const { status, maintenanceReason, maintenanceStartDate, maintenanceEndDate } = req.body;
    if (!status || !['Available', 'Maintenance', 'Unavailable'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (Available, Maintenance, Unavailable) is required' });
    }
    const updateData = { status };
    if (status === 'Maintenance' || status === 'Unavailable') {
      if (!maintenanceReason || !maintenanceStartDate) {
        return res.status(400).json({ message: 'Reason and start date are required for Maintenance/Unavailable status' });
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(maintenanceStartDate) < today) {
        return res.status(400).json({ message: 'Start date cannot be in the past' });
      }
      const effectiveEndDate = maintenanceEndDate || maintenanceStartDate;
      if (new Date(maintenanceStartDate) > new Date(effectiveEndDate)) {
        return res.status(400).json({ message: 'Start date must be before or equal to end date' });
      }
      updateData.maintenanceReason = maintenanceReason;
      updateData.maintenanceStartDate = maintenanceStartDate;
      updateData.maintenanceEndDate = effectiveEndDate;
    } else {
      updateData.maintenanceReason = '';
      updateData.maintenanceStartDate = null;
      updateData.maintenanceEndDate = null;
    }
    const pool = getPool();
    const updatedVehicle = await vehiclesMysql.updateMaintenance(pool, req.params.id, updateData);
    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle maintenance:', error);
    res.status(500).json({ message: 'Server error updating vehicle maintenance' });
  }
});

export default router;
