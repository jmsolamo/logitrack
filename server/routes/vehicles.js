import express from 'express';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

// @route   GET /api/vehicles
// @desc    Get all vehicles
// @access  Public
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Server error fetching vehicles' });
  }
});

// @route   POST /api/vehicles
// @desc    Add new vehicle
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { plateNumber, model } = req.body;

    if (!plateNumber || !model) {
      return res.status(400).json({ message: 'All fields (plateNumber, model) are required' });
    }

    const existingVehicle = await Vehicle.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (existingVehicle) {
      return res.status(400).json({ message: 'Vehicle with this plate number already exists' });
    }

    const newVehicle = new Vehicle({
      plateNumber,
      model
    });

    const savedVehicle = await newVehicle.save();
    res.status(201).json(savedVehicle);
  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({ message: 'Server error adding vehicle' });
  }
});

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const { plateNumber, model } = req.body;
    
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { plateNumber: plateNumber ? plateNumber.toUpperCase() : undefined, model },
      { new: true }
    );
    
    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ message: 'Server error updating vehicle' });
  }
});

// @route   DELETE /api/vehicles/:id
// @desc    Delete vehicle
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const deletedVehicle = await Vehicle.findByIdAndDelete(req.params.id);
    
    if (!deletedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.json({ message: 'Vehicle removed successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ message: 'Server error deleting vehicle' });
  }
});

// @route   PUT /api/vehicles/:id/maintenance
// @desc    Update vehicle maintenance status
// @access  Public
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

      // Prevent past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(maintenanceStartDate) < today) {
        return res.status(400).json({ message: 'Start date cannot be in the past' });
      }

      // If no end date, default to start date (1 day)
      const effectiveEndDate = maintenanceEndDate || maintenanceStartDate;

      if (new Date(maintenanceStartDate) > new Date(effectiveEndDate)) {
        return res.status(400).json({ message: 'Start date must be before or equal to end date' });
      }

      updateData.maintenanceReason = maintenanceReason;
      updateData.maintenanceStartDate = maintenanceStartDate;
      updateData.maintenanceEndDate = effectiveEndDate;
    } else {
      // Clear maintenance fields when setting to Available
      updateData.maintenanceReason = '';
      updateData.maintenanceStartDate = null;
      updateData.maintenanceEndDate = null;
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

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
