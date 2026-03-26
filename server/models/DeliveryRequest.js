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
  driver: [{ type: String, trim: true }],
  helper: [{ type: String, trim: true }],
  jobOrderNo: [{ type: String, trim: true }],
  customerSupplier: [{ type: String, trim: true }],
  totalBudget: {
    type: Number,
    default: 0
  },
  requestedBy: {
    type: String,
    trim: true
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
    enum: ['Pending', 'Approved', 'Declined'],
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
  }
}, {
  timestamps: true
});

export default mongoose.model('DeliveryRequest', deliveryRequestSchema);
