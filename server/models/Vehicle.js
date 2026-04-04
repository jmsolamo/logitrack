import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  plateNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  model: {
    type: String,
    required: true,
    trim: true
<<<<<<< HEAD
  },
  status: {
    type: String,
    enum: ['Available', 'Booked', 'Maintenance'],
    default: 'Available'
=======
>>>>>>> 9bfcd831454350f8e2a9a1d736943a8f37e1294e
  }
}, {
  timestamps: true
});

export default mongoose.model('Vehicle', vehicleSchema);
