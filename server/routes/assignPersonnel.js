import express from 'express';
import { getPool } from '../db/pool.js';
import * as deliveriesMysql from '../repositories/deliveriesMysql.js';
import * as deliveryRequestsMysql from '../repositories/deliveryRequestsMysql.js';

const router = express.Router();

router.put('/:id/assign-personnel', async (req, res) => {
  try {
    const pool = getPool();
    const { driver, helper, totalBudget } = req.body;
    const delivery = await deliveriesMysql.findDeliveryByIdParam(pool, req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (driver) delivery.driver = driver;
    if (helper) delivery.helper = helper;
    if (totalBudget !== undefined) {
      delivery.totalBudget = (delivery.totalBudget || 0) + Number(totalBudget);
    }

    const updatedDelivery = await deliveriesMysql.updateDeliveryFull(pool, req.params.id, delivery);

    let request = null;
    if (delivery.referenceNo) {
      const [rows] = await pool.query('SELECT * FROM delivery_requests WHERE delivery_reference_no = ? LIMIT 1', [
        delivery.referenceNo,
      ]);
      if (rows[0]) {
        const fullReq = await deliveryRequestsMysql.buildFullRequest(pool, rows[0]);
        if (driver) fullReq.driver = driver;
        if (helper) fullReq.helper = helper;
        if (totalBudget !== undefined) {
          fullReq.totalBudget = (fullReq.totalBudget || 0) + Number(totalBudget);
        }
        request = await deliveryRequestsMysql.saveRequest(pool, fullReq);
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
