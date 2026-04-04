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

// @route   GET /api/delivery-requests/schedules
// @desc    Get all active vehicle schedules to calculate frontend vehicle availability
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await DeliveryRequest.find(
      { requestStatus: { $in: ['Pending', 'Approved'] } },
      'vehicleEquipment dateFrom dateTo requestStatus'
    );
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Server error fetching schedules' });
  }
});

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

    // Check if vehicle is being changed
    const newVehicle = req.body.vehicleEquipment;
    const originalVehicle = request.vehicleEquipment;
    const vehicleChanged = newVehicle && newVehicle !== originalVehicle;

    // Use the new vehicle if provided, otherwise use original
    const finalVehicle = newVehicle || originalVehicle;

    // Only check for existing deliveries if vehicle was changed
    if (vehicleChanged) {
      // Check for existing deliveries with same vehicle and overlapping dates
      const requestDateFrom = new Date(request.dateFrom);
      requestDateFrom.setHours(0, 0, 0, 0);
      const requestDateTo = request.dateTo ? new Date(request.dateTo) : new Date(request.dateFrom);
      requestDateTo.setHours(23, 59, 59, 999);

      const existingDeliveries = await Delivery.find({
        vehicleEquipment: finalVehicle,
        status: 'Pending',
        $and: [
          {
            $or: [
              // Existing delivery has both dateFrom and dateTo
              {
                dateFrom: { $exists: true },
                dateTo: { $exists: true, $ne: null },
                $or: [
                  // Request starts during existing delivery
                  { dateFrom: { $lte: requestDateFrom }, dateTo: { $gte: requestDateFrom } },
                  // Request ends during existing delivery
                  { dateFrom: { $lte: requestDateTo }, dateTo: { $gte: requestDateTo } },
                  // Request completely contains existing delivery
                  { dateFrom: { $gte: requestDateFrom }, dateTo: { $lte: requestDateTo } }
                ]
              },
              // Existing delivery has only dateFrom (single day)
              {
                dateFrom: { $exists: true },
                $or: [
                  { dateTo: { $exists: false } },
                  { dateTo: null }
                ],
                dateFrom: { $gte: requestDateFrom, $lte: requestDateTo }
              }
            ]
          }
        ]
      });

      console.log('Checking for existing deliveries:', {
        finalVehicle,
        requestDateFrom,
        requestDateTo,
        foundDeliveries: existingDeliveries.length
      });

      // If there are existing deliveries and admin hasn't confirmed combination
      if (existingDeliveries.length > 0 && !req.body.combineWithExisting && !req.body.createSeparate) {
        return res.json({
          needsCombineConfirmation: true,
          existingDeliveries: existingDeliveries.map(d => ({
            _id: d._id,
            referenceNo: d.referenceNo,
            dateFrom: d.dateFrom,
            dateTo: d.dateTo,
            destination: d.destination,
            customerSupplier: d.customerSupplier,
            purpose: d.purpose,
            requestedBy: d.requestedBy
          })),
          currentRequest: {
            _id: request._id,
            referenceNo: request.referenceNo,
            dateFrom: request.dateFrom,
            dateTo: request.dateTo,
            destination: request.destination,
            customerSupplier: request.customerSupplier,
            purpose: request.purpose,
            requestedBy: request.requestedBy
          }
        });
      }

      // If admin chose to combine with existing delivery
      if (req.body.combineWithExisting && req.body.existingDeliveryId) {
        const existingDelivery = await Delivery.findById(req.body.existingDeliveryId);
        if (!existingDelivery) {
          return res.status(404).json({ message: 'Existing delivery not found' });
        }

        // Merge the data
        existingDelivery.purpose = [...new Set([...existingDelivery.purpose, ...request.purpose])].filter(Boolean);
        existingDelivery.activity = [...new Set([...existingDelivery.activity, ...request.activity])].filter(Boolean);
        existingDelivery.destination = [...new Set([...existingDelivery.destination, ...request.destination])].filter(Boolean);
        existingDelivery.jobOrderNo = [...new Set([...existingDelivery.jobOrderNo, ...request.jobOrderNo])].filter(Boolean);
        existingDelivery.customerSupplier = [...new Set([...existingDelivery.customerSupplier, ...request.customerSupplier])].filter(Boolean);
        
        // Recalculate delivery charge with merged destinations
        if (finalVehicle && existingDelivery.destination) {
          existingDelivery.deliveryCharge = await calculateDeliveryCharge(finalVehicle, existingDelivery.destination);
        }

        await existingDelivery.save();

        // Update the request
        request.referenceNo = existingDelivery.referenceNo;
        request.requestStatus = 'Approved with Changes';
        request.reviewedBy = req.body.reviewedBy || '';
        request.reviewedAt = new Date();
        request.originalVehicle = originalVehicle;
        request.vehicleEquipment = finalVehicle;
        request.vehicleChanged = true;
        request.vehicleChangeReason = 'Vehicle changed by admin during approval';
        
        await request.save();

        return res.json({
          request,
          delivery: existingDelivery,
          deliveryId: existingDelivery._id,
          combined: true,
          vehicleChanged: true,
          message: `Request combined with existing delivery ${existingDelivery.referenceNo}`
        });
      }
    }

    // Create new delivery (either no conflicts, no vehicle change, or admin chose to create separate)
    const referenceNo = await generateReferenceNo(request.deliveryType);

    // Calculate delivery charge with the final vehicle
    let finalDeliveryCharge = 0;
    if (finalVehicle && request.destination) {
      finalDeliveryCharge = await calculateDeliveryCharge(finalVehicle, request.destination);
    }

    // Create the delivery from the request data with the final vehicle
    const newDelivery = new Delivery({
      referenceNo,
      deliveryType: request.deliveryType,
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
      purpose: request.purpose,
      activity: request.activity,
      vehicleEquipment: finalVehicle,
      destination: request.destination,
      jobOrderNo: request.jobOrderNo,
      customerSupplier: request.customerSupplier,
      requestedBy: request.requestedBy,
      notes: request.notes,
      deliveryCharge: finalDeliveryCharge,
      status: 'Pending'
    });

    const savedDelivery = await newDelivery.save();

    // Update the request with vehicle change info
    request.referenceNo = referenceNo;
    request.requestStatus = vehicleChanged ? 'Approved with Changes' : 'Approved';
    request.reviewedBy = req.body.reviewedBy || '';
    request.reviewedAt = new Date();
    
    if (vehicleChanged) {
      request.originalVehicle = originalVehicle;
      request.vehicleEquipment = finalVehicle;
      request.vehicleChanged = true;
      request.vehicleChangeReason = 'Vehicle changed by admin during approval';
    }
    
    await request.save();

    res.json({ 
      request, 
      delivery: savedDelivery,
      deliveryId: savedDelivery._id,
      vehicleChanged,
      message: vehicleChanged 
        ? `Request approved with vehicle change from ${originalVehicle} to ${finalVehicle}` 
        : 'Request approved successfully'
    });
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
