import express from 'express';
import Delivery from '../models/Delivery.js';
import DeliveryRequest from '../models/DeliveryRequest.js';

const router = express.Router();

// @route   PUT /api/deliveries/:id/assign-personnel
// @desc    Assign driver and helper to a delivery
router.put('/:id/assign-personnel', async (req, res) => {
  try {
    const { driver, helper, totalBudget } = req.body;
    
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Update driver, helper, and budget
    if (driver) delivery.driver = driver;
    if (helper) delivery.helper = helper;
    if (totalBudget !== undefined) {
      // Add to existing budget instead of replacing
      delivery.totalBudget = (delivery.totalBudget || 0) + Number(totalBudget);
    }

    await delivery.save();

    // Also update the corresponding delivery request if it exists
    const request = await DeliveryRequest.findOne({ deliveryReferenceNo: delivery.referenceNo });
    if (request) {
      const assignedPersonnel = (driver && driver.length > 0) || (helper && helper.length > 0);
      if (driver) request.driver = driver;
      if (helper) request.helper = helper;
      if (totalBudget !== undefined) request.totalBudget = (request.totalBudget || 0) + Number(totalBudget);
      if (assignedPersonnel) {
        request.requestStatus = 'For Review';
      }
      await request.save();
    }

    res.json({ 
      message: 'Personnel assigned successfully', 
      delivery,
      request 
    });
  } catch (error) {
    console.error('Error assigning personnel:', error);
    res.status(500).json({ message: 'Server error assigning personnel' });
  }
});

export default router;
