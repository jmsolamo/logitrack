import express from 'express';
import DeliveryRequest from '../models/DeliveryRequest.js';
import Delivery from '../models/Delivery.js';
import DeliveryCharge from '../models/DeliveryCharge.js';

const router = express.Router();

// Helper to reliably compute delivery charge based on vehicle and destinations
const calculateDeliveryCharge = async (plateNumber, destinations) => {
  if (!plateNumber || !destinations || destinations.length === 0) return 0;
  try {
    const upperDestinations = destinations.map(d => String(d).toUpperCase());
    const availableCharges = await DeliveryCharge.find({
      plateNumber: String(plateNumber).toUpperCase(),
      destination: { $in: upperDestinations }
    });
    let totalCharge = 0;
    destinations.forEach(dest => {
      const matched = availableCharges.find(c => c.destination === String(dest).toUpperCase());
      if (matched) totalCharge += matched.charge;
    });
    return totalCharge;
  } catch (err) {
    console.error('Error computing delivery charge:', err);
    return 0;
  }
};

// Generate a unique reference number based on delivery type
const generateReferenceNo = async (deliveryType) => {
  const prefix = deliveryType === 'Itinerary' ? 'ITN' : 'FT';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const pattern = `${prefix}-${dateStr}-`;

  const latest = await Delivery.findOne({ referenceNo: { $regex: `^${pattern}` } })
    .sort({ referenceNo: -1 });

  let seq = 1;
  if (latest) {
    const lastSeq = parseInt(latest.referenceNo.split('-').pop(), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${pattern}${String(seq).padStart(3, '0')}`;
};

// Generate a unique reference number for new requests: REQ-YYYYMMDD-XXX
const generateRequestReferenceNo = async () => {
  const prefix = 'REQ';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const pattern = `${prefix}-${dateStr}-`;

  const latest = await DeliveryRequest.findOne({ referenceNo: { $regex: `^${pattern}` } })
    .sort({ referenceNo: -1 });

  let seq = 1;
  if (latest && latest.referenceNo) {
    const parts = latest.referenceNo.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${pattern}${String(seq).padStart(3, '0')}`;
};

// @route   GET /api/delivery-requests/pending-count
// @desc    Get count of pending delivery requests (for admin badge)
router.get('/pending-count', async (req, res) => {
  try {
    const count = await DeliveryRequest.countDocuments({ requestStatus: 'Pending' });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/delivery-requests/my-requests
// @desc    Get requests submitted by a specific user
router.get('/my-requests', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId query param is required' });
    }
    const requests = await DeliveryRequest.find({ requestedByUserId: userId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/delivery-requests
// @desc    Get all delivery requests (admin)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.requestStatus = req.query.status;
    }
    const requests = await DeliveryRequest.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching delivery requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/delivery-requests/:id
// @desc    Get single delivery request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    console.error('Error fetching delivery request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/delivery-requests
// @desc    Create a new delivery request (user submits)
router.post('/', async (req, res) => {
  try {
    const { deliveryType } = req.body;
    if (!deliveryType) {
      return res.status(400).json({ message: 'Delivery Type is required' });
    }

    // Generate a unique tracking number for the request
    const referenceNo = await generateRequestReferenceNo();

    const newRequest = new DeliveryRequest({
      ...req.body,
      referenceNo,
      requestStatus: 'Pending'
    });

    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Error creating delivery request:', error);
    res.status(500).json({ message: 'Server error creating request' });
  }
});

// @route   PUT /api/delivery-requests/:id/approve
// @desc    Admin approves a request → auto-creates a Delivery
router.put('/:id/approve', async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.requestStatus !== 'Pending') {
      return res.status(400).json({ message: 'Only pending requests can be approved' });
    }

    // Generate a reference number for the new delivery
    const referenceNo = await generateReferenceNo(request.deliveryType);

    // Calculate delivery charge
    let finalDeliveryCharge = 0;
    if (request.vehicleEquipment && request.destination) {
      finalDeliveryCharge = await calculateDeliveryCharge(request.vehicleEquipment, request.destination);
    }

    // Create the delivery from the request data
    const newDelivery = new Delivery({
      referenceNo,
      deliveryType: request.deliveryType,
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
      purpose: request.purpose,
      activity: request.activity,
      vehicleEquipment: request.vehicleEquipment,
      destination: request.destination,
      driver: request.driver,
      helper: request.helper,
      jobOrderNo: request.jobOrderNo,
      customerSupplier: request.customerSupplier,
      totalBudget: request.totalBudget,
      requestedBy: request.requestedBy,
      notes: request.notes,
      deliveryCharge: finalDeliveryCharge,
      status: 'Pending'
    });

    const savedDelivery = await newDelivery.save();

    // Update the request status and sync the formal reference number
    request.referenceNo = referenceNo; // Update to formal tracking number
    request.requestStatus = 'Approved';
    request.reviewedBy = req.body.reviewedBy || '';
    request.reviewedAt = new Date();
    await request.save();

    res.json({ request, delivery: savedDelivery });
  } catch (error) {
    console.error('Error approving delivery request:', error);
    res.status(500).json({ message: 'Server error approving request' });
  }
});

// @route   PUT /api/delivery-requests/:id/decline
// @desc    Admin declines a request with a reason
router.put('/:id/decline', async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id);
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
    await request.save();

    res.json(request);
  } catch (error) {
    console.error('Error declining delivery request:', error);
    res.status(500).json({ message: 'Server error declining request' });
  }
});

// @route   PUT /api/delivery-requests/:id
// @desc    Update a delivery request
router.put('/:id', async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only allow updates to requests that aren't Declined? 
    // User requested "Pending" can edit, "Approved" can edit.
    // Let's allow update regardless, front-end will handle visibility.
    // But keep in mind if it's already approved, editing might need re-approval?
    // For now, let's keep it simple as requested.
    
    Object.assign(request, req.body);
    const updatedRequest = await request.save();
    res.json(updatedRequest);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Error updating delivery request:', error);
    res.status(500).json({ message: 'Server error updating request' });
  }
});

// @route   DELETE /api/delivery-requests/:id
// @desc    Delete a delivery request
router.delete('/:id', async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    await DeliveryRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery request:', error);
    res.status(500).json({ message: 'Server error deleting request' });
  }
});

export default router;
