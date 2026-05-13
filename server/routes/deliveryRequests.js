import express from 'express';
import { getPool } from '../db/pool.js';
import * as deliveryRequestsMysql from '../repositories/deliveryRequestsMysql.js';
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

const generateRequestReferenceNo = async (pool) => {
  const prefix = 'REQ';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const pattern = `${prefix}-${dateStr}-`;
  const latest = await deliveryRequestsMysql.latestRequestReferenceNo(pool, pattern);
  let seq = 1;
  if (latest) {
    const parts = latest.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return `${pattern}${String(seq).padStart(3, '0')}`;
};

router.get('/schedules', async (req, res) => {
  try {
    const pool = getPool();
    
    // Fetch Active Deliveries from deliveries table only
    const [activeDeliveries] = await pool.query(
      "SELECT id, vehicle_equipment, date_from, date_to, status FROM deliveries WHERE status NOT IN ('Completed', 'Cancelled')"
    );

    const active = activeDeliveries.map(r => ({
      _id: 'DEL_' + r.id,
      vehicleEquipment: r.vehicle_equipment,
      dateFrom: r.date_from,
      dateTo: r.date_to,
      requestStatus: r.status 
    }));

    res.json(active);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Server error fetching schedules' });
  }
});

router.get('/pending-count', async (req, res) => {
  try {
    const pool = getPool();
    const count = await deliveryRequestsMysql.countPending(pool);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my-requests', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId query param is required' });
    }
    const pool = getPool();
    const requests = await deliveryRequestsMysql.listMyRequests(pool, userId);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.requestStatus = req.query.status;
    }
    if (req.query.reviewerStatus && req.query.reviewerStatus !== 'all') {
      const reviewerStatuses = req.query.reviewerStatus.split(',').map((s) => s.trim()).filter(Boolean);
      filter.reviewerStatus = reviewerStatuses.length > 1 ? reviewerStatuses : reviewerStatuses[0];
    }
    if (req.query.deliveryReferenceNo) {
      filter.deliveryReferenceNo = req.query.deliveryReferenceNo;
    }
    if (req.query.requestStatus) {
      const statuses = req.query.requestStatus.split(',').map((s) => s.trim()).filter(Boolean);
      filter.requestStatus = statuses.length > 1 ? statuses : statuses[0];
    }
    const requests = await deliveryRequestsMysql.listRequestsFiltered(pool, filter);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching delivery requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/reviewer-accept', async (req, res) => {
  try {
    const pool = getPool();
    const request = await deliveryRequestsMysql.findRequestByIdParam(pool, req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (!['Approved', 'Approved with Changes'].includes(request.requestStatus)) {
      return res.status(400).json({ message: 'Only approved requests can be reviewed' });
    }
    if (request.reviewerStatus === 'Accepted') {
      return res.status(400).json({ message: 'Request has already been accepted by reviewer' });
    }
    request.reviewerStatus = 'Accepted';
    request.reviewerNotes = req.body.reviewerNotes || '';
    request.reviewerReviewedBy = req.body.reviewerReviewedBy || '';
    request.reviewerReviewedAt = new Date();
    if (request.requestStatus === 'For Review') {
      request.requestStatus = 'Approved';
    }
    const saved = await deliveryRequestsMysql.saveRequest(pool, request);
    res.json({ message: 'Request accepted by reviewer', request: saved });
  } catch (error) {
    console.error('Error accepting request as reviewer:', error);
    res.status(500).json({ message: 'Server error accepting request' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const request = await deliveryRequestsMysql.findRequestByIdParam(pool, req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    console.error('Error fetching delivery request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = getPool();
    const { deliveryType } = req.body;
    if (!deliveryType) {
      return res.status(400).json({ message: 'Delivery Type is required' });
    }
    const referenceNo = await generateRequestReferenceNo(pool);
    const saved = await deliveryRequestsMysql.createRequest(pool, req.body, referenceNo);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating delivery request:', error);
    res.status(500).json({ message: 'Server error creating request' });
  }
});

router.put('/:id/approve', async (req, res) => {
  try {
    const pool = getPool();
    const request = await deliveryRequestsMysql.findRequestByIdParam(pool, req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (request.requestStatus !== 'Pending') {
      return res.status(400).json({ message: 'Only pending requests can be approved' });
    }

    const newVehicle = req.body.vehicleEquipment;
    const originalVehicle = request.vehicleEquipment;
    const vehicleChanged = newVehicle && newVehicle !== originalVehicle;
    const finalVehicle = newVehicle || originalVehicle;

    if (vehicleChanged) {
      const requestDateFrom = new Date(request.dateFrom);
      requestDateFrom.setHours(0, 0, 0, 0);
      const requestDateTo = request.dateTo ? new Date(request.dateTo) : new Date(request.dateFrom);
      requestDateTo.setHours(23, 59, 59, 999);

      const existingDeliveries = await deliveriesMysql.findOverlappingPendingDeliveries(pool, finalVehicle, requestDateFrom, requestDateTo);

      if (existingDeliveries.length > 0 && !req.body.combineWithExisting && !req.body.createSeparate) {
        return res.json({
          needsCombineConfirmation: true,
          existingDeliveries: existingDeliveries.map((d) => ({
            _id: d._id,
            referenceNo: d.referenceNo,
            dateFrom: d.dateFrom,
            dateTo: d.dateTo,
            destination: d.destination,
            customerSupplier: d.customerSupplier,
            purpose: d.purpose,
            requestedBy: d.requestedBy,
          })),
          currentRequest: {
            _id: request._id,
            referenceNo: request.referenceNo,
            dateFrom: request.dateFrom,
            dateTo: request.dateTo,
            destination: request.destination,
            customerSupplier: request.customerSupplier,
            purpose: request.purpose,
            requestedBy: request.requestedBy,
          },
        });
      }

      if (req.body.combineWithExisting && req.body.existingDeliveryId) {
        const existingDelivery = await deliveriesMysql.findDeliveryByIdParam(pool, req.body.existingDeliveryId);
        if (!existingDelivery) {
          return res.status(404).json({ message: 'Existing delivery not found' });
        }

        const newDestinations = (request.destination || []).filter((d) => !(existingDelivery.destination || []).includes(d));
        let additionalCharge = 0;
        if (finalVehicle && newDestinations.length > 0) {
          additionalCharge = await calculateDeliveryCharge(pool, finalVehicle, newDestinations);
        }

        existingDelivery.purpose = deliveriesMysql.mergeArraysPreserve(existingDelivery.purpose, request.purpose);
        existingDelivery.activity = deliveriesMysql.mergeArraysPreserve(existingDelivery.activity, request.activity);
        existingDelivery.destination = deliveriesMysql.mergeArraysPreserve(existingDelivery.destination, request.destination);
        existingDelivery.jobOrderNo = deliveriesMysql.mergeArraysPreserve(existingDelivery.jobOrderNo, request.jobOrderNo);
        existingDelivery.customerSupplier = deliveriesMysql.mergeArraysPreserve(
          existingDelivery.customerSupplier,
          request.customerSupplier,
        );
        existingDelivery.deliveryCharge = (existingDelivery.deliveryCharge || 0) + additionalCharge;
        existingDelivery.totalBudget = (existingDelivery.totalBudget || 0) + additionalCharge;

        const mergedExisting = await deliveriesMysql.updateDeliveryFull(pool, existingDelivery._id, existingDelivery);

        request.deliveryReferenceNo = mergedExisting.referenceNo;
        request.combinedWithDelivery = true;
        request.requestStatus = vehicleChanged ? 'Approved with Changes' : 'Approved';
        request.reviewerStatus = 'Pending';
        request.reviewedBy = req.body.reviewedBy || '';
        request.reviewedAt = new Date();
        if (vehicleChanged) {
          request.originalVehicle = originalVehicle;
          request.vehicleEquipment = finalVehicle;
          request.vehicleChanged = true;
          request.vehicleChangeReason = 'Vehicle changed by admin during approval';
        }
        const savedReq = await deliveryRequestsMysql.saveRequest(pool, request);

        return res.json({
          request: savedReq,
          delivery: mergedExisting,
          deliveryId: mergedExisting._id,
          combined: true,
          vehicleChanged: true,
          message: `Request combined with existing delivery ${mergedExisting.referenceNo}`,
        });
      }
    }

    const referenceNo = await generateReferenceNo(pool, request.deliveryType);
    let finalDeliveryCharge = 0;
    if (finalVehicle && request.destination) {
      finalDeliveryCharge = await calculateDeliveryCharge(pool, finalVehicle, request.destination);
    }

    const newDeliveryBody = {
      deliveryType: request.deliveryType,
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
      purpose: request.purpose || [],
      activity: request.activity || [],
      vehicleEquipment: finalVehicle,
      destination: request.destination || [],
      jobOrderNo: request.jobOrderNo || [],
      customerSupplier: request.customerSupplier || [],
      requestedBy: request.requestedBy,
      notes: request.notes,
      status: 'Pending',
    };

    const savedDelivery = await deliveriesMysql.insertDelivery(pool, newDeliveryBody, referenceNo, finalDeliveryCharge);

    request.deliveryReferenceNo = savedDelivery.referenceNo;
    request.combinedWithDelivery = false;
    request.requestStatus = vehicleChanged ? 'Approved with Changes' : 'Approved';
    request.reviewerStatus = 'Pending';
    request.reviewedBy = req.body.reviewedBy || '';
    request.reviewedAt = new Date();
    if (vehicleChanged) {
      request.originalVehicle = originalVehicle;
      request.vehicleEquipment = finalVehicle;
      request.vehicleChanged = true;
      request.vehicleChangeReason = 'Vehicle changed by admin during approval';
    }
    const savedReq = await deliveryRequestsMysql.saveRequest(pool, request);

    res.json({
      request: savedReq,
      delivery: savedDelivery,
      deliveryId: savedDelivery._id,
      vehicleChanged,
      message: vehicleChanged
        ? `Request approved with vehicle change from ${originalVehicle} to ${finalVehicle}`
        : 'Request approved successfully',
    });
  } catch (error) {
    console.error('Error approving delivery request:', error);
    res.status(500).json({ message: error.message || 'Server error approving request' });
  }
});

router.put('/:id/decline', async (req, res) => {
  try {
    const pool = getPool();
    const request = await deliveryRequestsMysql.findRequestByIdParam(pool, req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (request.requestStatus !== 'Pending') {
      return res.status(400).json({ message: 'Only pending requests can be declined' });
    }
    const { declineReason, reviewedBy } = req.body;
    if (!declineReason || declineReason.trim() === '') {
      return res.status(400).json({ message: 'Decline reason is required' });
    }
    request.requestStatus = 'Declined';
    request.declineReason = declineReason;
    request.reviewedBy = reviewedBy || '';
    request.reviewedAt = new Date();
    const saved = await deliveryRequestsMysql.saveRequest(pool, request);
    res.json(saved);
  } catch (error) {
    console.error('Error declining delivery request:', error);
    res.status(500).json({ message: 'Server error declining request' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const request = await deliveryRequestsMysql.findRequestByIdParam(pool, req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    const { dateSubmitted, ...updateData } = req.body;
    Object.assign(request, updateData);
    const updated = await deliveryRequestsMysql.saveRequest(pool, request);
    res.json(updated);
  } catch (error) {
    console.error('Error updating delivery request:', error);
    res.status(500).json({ message: 'Server error updating request' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const ok = await deliveryRequestsMysql.deleteRequest(pool, req.params.id);
    if (!ok) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery request:', error);
    res.status(500).json({ message: 'Server error deleting request' });
  }
});

export default router;
