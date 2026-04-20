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
    // Get pending requests
    const pendingRequests = await DeliveryRequest.find(
      { requestStatus: 'Pending' },
      'vehicleEquipment dateFrom dateTo requestStatus'
    );

    // Get approved requests and check their delivery status
    const approvedRequests = await DeliveryRequest.find(
      { requestStatus: { $in: ['Approved', 'Approved with Changes', 'For Review'] } },
      'vehicleEquipment dateFrom dateTo requestStatus deliveryReferenceNo'
    );

    // Filter out approved requests whose deliveries are completed
    const activeApprovedRequests = [];
    for (const req of approvedRequests) {
      if (req.deliveryReferenceNo) {
        const delivery = await Delivery.findOne({ referenceNo: req.deliveryReferenceNo });
        // Only include if delivery is not completed
        if (delivery && delivery.status !== 'Completed') {
          activeApprovedRequests.push({
            _id: req._id,
            vehicleEquipment: req.vehicleEquipment,
            dateFrom: req.dateFrom,
            dateTo: req.dateTo,
            requestStatus: req.requestStatus
          });
        }
      } else {
        // If no delivery reference, include it (shouldn't happen but safe fallback)
        activeApprovedRequests.push({
          _id: req._id,
          vehicleEquipment: req.vehicleEquipment,
          dateFrom: req.dateFrom,
          dateTo: req.dateTo,
          requestStatus: req.requestStatus
        });
      }
    }

    const schedules = [...pendingRequests, ...activeApprovedRequests];
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
// @desc    Get all delivery requests (admin/reviewer)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.requestStatus = req.query.status;
    }
    if (req.query.reviewerStatus && req.query.reviewerStatus !== 'all') {
      const reviewerStatuses = req.query.reviewerStatus.split(',').map((s) => s.trim()).filter(Boolean);
      if (reviewerStatuses.length === 1) {
        filter.reviewerStatus = reviewerStatuses[0];
      } else if (reviewerStatuses.length > 1) {
        filter.reviewerStatus = { $in: reviewerStatuses };
      }
    }
    if (req.query.deliveryReferenceNo) {
      filter.deliveryReferenceNo = req.query.deliveryReferenceNo;
    }
    if (req.query.requestStatus) {
      const statuses = req.query.requestStatus.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        filter.requestStatus = statuses[0];
      } else if (statuses.length > 1) {
        filter.requestStatus = { $in: statuses };
      }
    }
    const requests = await DeliveryRequest.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching delivery requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/delivery-requests/:id/reviewer-accept
// @desc    Reviewer accepts an approved request after review
router.put('/:id/reviewer-accept', async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!['Approved', 'Approved with Changes', 'For Review'].includes(request.requestStatus)) {
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

    await request.save();

    res.json({ message: 'Request accepted by reviewer', request });
  } catch (error) {
    console.error('Error accepting request as reviewer:', error);
    res.status(500).json({ message: 'Server error accepting request' });
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
      requestStatus: 'Pending',
      dateSubmitted: new Date()
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

        // Calculate charge for NEW destinations only (before merging)
        const newDestinations = (request.destination || []).filter(d => 
          !(existingDelivery.destination || []).includes(d)
        );
        let additionalCharge = 0;
        if (finalVehicle && newDestinations.length > 0) {
          additionalCharge = await calculateDeliveryCharge(finalVehicle, newDestinations);
        }
        
        // Merge the data - keep all values including duplicates
        existingDelivery.purpose = [...(existingDelivery.purpose || []), ...(request.purpose || [])].filter(Boolean);
        existingDelivery.activity = [...(existingDelivery.activity || []), ...(request.activity || [])].filter(Boolean);
        existingDelivery.destination = [...(existingDelivery.destination || []), ...(request.destination || [])].filter(Boolean);
        existingDelivery.jobOrderNo = [...(existingDelivery.jobOrderNo || []), ...(request.jobOrderNo || [])].filter(Boolean);
        existingDelivery.customerSupplier = [...(existingDelivery.customerSupplier || []), ...(request.customerSupplier || [])].filter(Boolean);
        
        // Add the additional charge to deliveryCharge and totalBudget
        existingDelivery.deliveryCharge = (existingDelivery.deliveryCharge || 0) + additionalCharge;
        existingDelivery.totalBudget = (existingDelivery.totalBudget || 0) + additionalCharge;

        await existingDelivery.save();

        // Update the request - track which delivery it was combined with
        request.deliveryReferenceNo = existingDelivery.referenceNo;
        request.combinedWithDelivery = true;
        request.requestStatus = 'For Review';
        request.reviewerStatus = 'Pending';
        request.reviewedBy = req.body.reviewedBy || '';
        request.reviewedAt = new Date();
        
        if (vehicleChanged) {
          request.originalVehicle = originalVehicle;
          request.vehicleEquipment = finalVehicle;
          request.vehicleChanged = true;
          request.vehicleChangeReason = 'Vehicle changed by admin during approval';
        }
        
        await request.save({ validateModifiedOnly: true });

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
      purpose: request.purpose || [],
      activity: request.activity || [],
      vehicleEquipment: finalVehicle,
      destination: request.destination || [],
      jobOrderNo: request.jobOrderNo || [],
      customerSupplier: request.customerSupplier || [],
      requestedBy: request.requestedBy,
      notes: request.notes,
      deliveryCharge: finalDeliveryCharge,
      status: 'Pending'
    });

    const savedDelivery = await newDelivery.save();

    // Update the request with delivery reference and vehicle change info
    request.deliveryReferenceNo = referenceNo;
    request.combinedWithDelivery = false;
    request.requestStatus = 'For Review';
    request.reviewerStatus = 'Pending';
    request.reviewedBy = req.body.reviewedBy || '';
    request.reviewedAt = new Date();
    
    if (vehicleChanged) {
      request.originalVehicle = originalVehicle;
      request.vehicleEquipment = finalVehicle;
      request.vehicleChanged = true;
      request.vehicleChangeReason = 'Vehicle changed by admin during approval';
    }
    
    await request.save({ validateModifiedOnly: true });

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
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(500).json({ message: `Validation error: ${messages.join(', ')}` });
    }
    res.status(500).json({ message: error.message || 'Server error approving request' });
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
    await request.save({ validateModifiedOnly: true });

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

    // Exclude dateSubmitted from being updated
    const { dateSubmitted, ...updateData } = req.body;
    Object.assign(request, updateData);
    const updatedRequest = await request.save({ validateModifiedOnly: true });
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
