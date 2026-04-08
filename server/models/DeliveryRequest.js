import mongoose from 'mongoose';

const deliveryRequestSchema = new mongoose.Schema({
  referenceNo: {
    type: String,
    unique: true,
    trim: true
  },
  deliveryType: {
    type: String,
    trim: true
  },
  dateFrom: {
    type: Date
  },
  dateTo: {
    type: Date
  },
  purpose: [{ type: String, trim: true }],
  activity: [{ type: String, trim: true }],
  vehicleEquipment: {
    type: String,
    trim: true
  },
  destination: [{ type: String, trim: true }],
  jobOrderNo: [{ type: String, trim: true }],
  customerSupplier: [{ type: String, trim: true }],
  requestedBy: {
    type: String,
    trim: true
  },
  dateSubmitted: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  notes: {
    type: String,
    trim: true
  },

  // Request workflow fields
  requestedByUserId: {
    type: String,
    trim: true
  },
  requestStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Approved with Changes', 'Declined'],
    default: 'Pending'
  },
  declineReason: {
    type: String,
    trim: true
  },
  reviewedBy: {
    type: String,
    trim: true
  },
  reviewedAt: {
    type: Date
  },
  // Vehicle change tracking
  originalVehicle: {
    type: String,
    trim: true
  },
  vehicleChanged: {
    type: Boolean,
    default: false
  },
  vehicleChangeReason: {
    type: String,
    trim: true
  },
  // Delivery tracking
  deliveryReferenceNo: {
    type: String,
    trim: true
  },
  combinedWithDelivery: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('DeliveryRequest', deliveryRequestSchema);
