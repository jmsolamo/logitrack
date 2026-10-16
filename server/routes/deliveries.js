import express from 'express';
import * as deliveriesRepo from '../repositories/deliveries.js';
import * as deliveryChargesRepo from '../repositories/deliveryCharges.js';
import * as deliveryRequestsRepo from '../repositories/deliveryRequests.js';

const router = express.Router();

const generateRequestReferenceNo = async (pool) => {
  const prefix = 'REQ';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const pattern = `${prefix}-${dateStr}-`;
  const latest = await deliveryRequestsRepo.latestRequestReferenceNo(pool, pattern);
  let seq = 1;
  if (latest) {
    const parts = latest.split('-');
    const lastPart = parts[parts.length - 1];
    const lastSeq = parseInt(lastPart, 10);
    if (!Number.isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return `${pattern}${String(seq).padStart(3, '0')}`;
};

const calculateDeliveryCharge = async (pool, plateNumber, destinations) =>
  deliveryChargesRepo.calculateDeliveryCharge(pool, plateNumber, destinations);

const generateReferenceNo = async (pool, deliveryType) => {
  const prefix = deliveryType === 'Itinerary' ? 'ITN' : 'FT';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const pattern = `${prefix}-${dateStr}-`;
  const latest = await deliveriesRepo.latestReferenceNo(pool, pattern);
  let seq = 1;
  if (latest) {
    const lastSeq = parseInt(latest.split('-').pop(), 10);
    if (!Number.isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return `${pattern}${String(seq).padStart(3, '0')}`;
};

router.get('/user-stats', async (req, res) => {
  try {
    const pool = null;
    const [totalCount, pendingCount, inTransitCount, completedCount, recentDeliveries] = await Promise.all([
      deliveriesRepo.countDeliveries(pool),
      deliveriesRepo.countDeliveries(pool, 'Pending'),
      deliveriesRepo.countDeliveries(pool, 'In Transit'),
      deliveriesRepo.countDeliveries(pool, 'Completed'),
      deliveriesRepo.listDeliveriesSummary(pool, 5),
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
    const pool = null;
    await deliveriesRepo.runAutoStatusUpdates(pool);
    const deliveries = await deliveriesRepo.listAllDeliveries(pool);
    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ message: 'Server error fetching deliveries' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = null;
    const delivery = await deliveriesRepo.findDeliveryByIdParam(pool, req.params.id);
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
    const pool = null;
    const { deliveryType } = req.body;
    if (!deliveryType) {
      return res.status(400).json({ message: 'Delivery Type is required' });
    }
    const referenceNo = await generateReferenceNo(pool, deliveryType);
    let finalDeliveryCharge = 0;
    if (req.body.vehicleEquipment && req.body.destination) {
      finalDeliveryCharge = await calculateDeliveryCharge(pool, req.body.vehicleEquipment, req.body.destination);
    }
    const saved = await deliveriesRepo.insertDelivery(pool, { ...req.body, status: req.body.status || 'Pending' }, referenceNo, finalDeliveryCharge);
    
    // Automatically create a companion request for Manager (Reviewer) visibility
    try {
      const requestRefNo = await generateRequestReferenceNo(pool);
      await deliveryRequestsRepo.createRequest(pool, {
        ...req.body,
        deliveryReferenceNo: referenceNo, 
        requestStatus: 'Approved', 
        reviewerStatus: 'Pending',
      }, requestRefNo);
    } catch (reqError) {
      console.error('Failed to create companion request for direct delivery:', reqError);
    }

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
    const pool = null;
    const { referenceNo, ...updateData } = req.body;
    const current = await deliveriesRepo.findDeliveryByIdParam(pool, req.params.id);
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
    const updatedDelivery = await deliveriesRepo.updateDeliveryFull(pool, req.params.id, merged);
    res.json(updatedDelivery);
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ message: 'Server error updating delivery' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = null;
    const ok = await deliveriesRepo.deleteDeliveryByParam(pool, req.params.id);
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
