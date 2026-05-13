import express from 'express';
import { getPool } from '../db/pool.js';
import * as deliveriesMysql from '../repositories/deliveriesMysql.js';
import * as deliveryChargesMysql from '../repositories/deliveryChargesMysql.js';

const router = express.Router();

const calculateDeliveryCharge = async (pool, plateNumber, destinations) =>
  deliveryChargesMysql.calculateDeliveryCharge(pool, plateNumber, destinations);

const generateReferenceNo = async (pool, deliveryType) => {
  const prefix = deliveryType === 'Itinerary' ? 'ITN' : 'FT';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const pattern = `${prefix}-${dateStr}-`;
  const latest = await deliveriesMysql.latestReferenceNo(pool, pattern);
  let seq = 1;
  if (latest) {
    const lastSeq = parseInt(latest.split('-').pop(), 10);
    if (!Number.isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return `${pattern}${String(seq).padStart(3, '0')}`;
};

router.get('/user-stats', async (req, res) => {
  try {
    const pool = getPool();
    const [totalCount, pendingCount, inTransitCount, completedCount, recentDeliveries] = await Promise.all([
      deliveriesMysql.countDeliveries(pool),
      deliveriesMysql.countDeliveries(pool, 'Pending'),
      deliveriesMysql.countDeliveries(pool, 'In Transit'),
      deliveriesMysql.countDeliveries(pool, 'Completed'),
      deliveriesMysql.listDeliveriesSummary(pool, 5),
    ]);
    res.json({
      total: totalCount,
      pending: pendingCount,
      inTransit: inTransitCount,
      completed: completedCount,
      recentDeliveries,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    await deliveriesMysql.runAutoStatusUpdates(pool);
    const deliveries = await deliveriesMysql.listAllDeliveries(pool);
    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ message: 'Server error fetching deliveries' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const delivery = await deliveriesMysql.findDeliveryByIdParam(pool, req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    res.json(delivery);
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({ message: 'Server error fetching delivery' });
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = getPool();
    const { deliveryType } = req.body;
    if (!deliveryType) {
      return res.status(400).json({ message: 'Delivery Type is required' });
    }
    const referenceNo = await generateReferenceNo(pool, deliveryType);
    let finalDeliveryCharge = 0;
    if (req.body.vehicleEquipment && req.body.destination) {
      finalDeliveryCharge = await calculateDeliveryCharge(pool, req.body.vehicleEquipment, req.body.destination);
    }
    const saved = await deliveriesMysql.insertDelivery(pool, { ...req.body, status: req.body.status || 'Pending' }, referenceNo, finalDeliveryCharge);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ message: 'Server error creating delivery' });
  }
});

const cleanExpenseItem = (item) => {
  const cleaned = { ...item };
  if (cleaned.id) delete cleaned.id;
  if (cleaned.date !== undefined) {
    if (cleaned.date && typeof cleaned.date === 'string' && cleaned.date.trim() !== '') {
      cleaned.date = new Date(cleaned.date);
    } else {
      delete cleaned.date;
    }
  }
  if (cleaned.timestamp !== undefined) {
    if (cleaned.timestamp && typeof cleaned.timestamp === 'string' && cleaned.timestamp.trim() !== '') {
      cleaned.timestamp = new Date(cleaned.timestamp);
    } else {
      delete cleaned.timestamp;
    }
  }
  return cleaned;
};

router.put('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { referenceNo, ...updateData } = req.body;
    const current = await deliveriesMysql.findDeliveryByIdParam(pool, req.params.id);
    if (!current) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (updateData.vehicleEquipment !== undefined || updateData.destination !== undefined) {
      const vehicle = updateData.vehicleEquipment !== undefined ? updateData.vehicleEquipment : current.vehicleEquipment;
      const dests = updateData.destination !== undefined ? updateData.destination : current.destination;
      updateData.deliveryCharge = await calculateDeliveryCharge(pool, vehicle, dests);
    }

    const arrayFields = ['fuel', 'tollFee', 'pierExpenses', 'repairAndMaintenance', 'mealExpenses', 'loadExpenses', 'contingency', 'timeline'];
    for (const field of arrayFields) {
      if (updateData[field] !== undefined && Array.isArray(updateData[field])) {
        updateData[field] = updateData[field].map(cleanExpenseItem);
      }
    }

    const merged = { ...current, ...updateData, referenceNo: current.referenceNo };
    const updatedDelivery = await deliveriesMysql.updateDeliveryFull(pool, req.params.id, merged);
    res.json(updatedDelivery);
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ message: 'Server error updating delivery' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const ok = await deliveriesMysql.deleteDeliveryByParam(pool, req.params.id);
    if (!ok) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    res.json({ message: 'Delivery removed successfully' });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({ message: 'Server error deleting delivery' });
  }
});

export default router;
