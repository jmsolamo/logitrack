import mongoose from 'mongoose';

const deliveryChargeSchema = new mongoose.Schema({
  plateNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  destination: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  charge: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate entries for the same plate and destination
deliveryChargeSchema.index({ plateNumber: 1, destination: 1 }, { unique: true });

export default mongoose.model('DeliveryCharge', deliveryChargeSchema);
