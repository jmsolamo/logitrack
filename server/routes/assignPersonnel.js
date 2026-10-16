import express from 'express';
import * as deliveriesRepo from '../repositories/deliveries.js';
import * as deliveryRequestsRepo from '../repositories/deliveryRequests.js';

const router = express.Router();

router.put('/:id/assign-personnel', async (req, res) => {
  try {
    const pool = null;
    const { driver, helper, totalBudget } = req.body;
    const delivery = await deliveriesRepo.findDeliveryByIdParam(pool, req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (driver) delivery.driver = driver;
    if (helper) delivery.helper = helper;
    if (totalBudget !== undefined) {
      delivery.totalBudget = (delivery.totalBudget || 0) + Number(totalBudget);
    }

    const updatedDelivery = await deliveriesRepo.updateDeliveryFull(pool, req.params.id, delivery);

    let request = null;
    if (delivery.referenceNo) {
      const requests = await deliveryRequestsRepo.listRequestsFiltered(null, {
        deliveryReferenceNo: delivery.referenceNo,
      });
      if (requests.length > 0) {
        const fullReq = requests[0];
        if (driver) fullReq.driver = driver;
        if (helper) fullReq.helper = helper;
        if (totalBudget !== undefined) {
          fullReq.totalBudget = (fullReq.totalBudget || 0) + Number(totalBudget);
        }
        request = await deliveryRequestsRepo.saveRequest(null, fullReq);
      }
    }

    res.json({
      message: 'Personnel assigned successfully',
      delivery: updatedDelivery,
      request,
    });
  } catch (error) {
    console.error('Error assigning personnel:', error);
    res.status(500).json({ message: 'Server error assigning personnel' });
  }
});

export default router;
