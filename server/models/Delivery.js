import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  referenceNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
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
  status: {
    type: String,
    enum: ['Pending', 'In Transit', 'Completed'],
    default: 'Pending'
  },
  departureDate: {
    type: Date
  },
  arrivalDate: {
    type: Date
  },

  // Fuel (array of entries)
  fuel: [{
    liters: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    gasStation: { type: String, trim: true },
    invoiceNo: { type: String, trim: true }
  }],

  // Expenses (arrays of amounts)
  tollFee: [{
    amt: { type: Number, default: 0 }
  }],
  pierExpenses: [{
    amt: { type: Number, default: 0 }
  }],
  repairAndMaintenance: [{
    amt: { type: Number, default: 0 }
  }],
  mealExpenses: [{
    amt: { type: Number, default: 0 }
  }],
  loadExpenses: [{
    amt: { type: Number, default: 0 }
  }],
  contingency: [{
    amt: { type: Number, default: 0 }
  }],

  // Summary
  deliveryCharge: [{ type: Number, default: 0 }],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Helper to sum an array of objects by a key
const sumArray = (arr, key) => (arr || []).reduce((sum, item) => sum + (item?.[key] || 0), 0);
const sumNumberArray = (arr) => (arr || []).reduce((sum, val) => sum + (val || 0), 0);

// Virtual: totalExpenses (auto-computed sum of all expense fields)
deliverySchema.virtual('totalExpenses').get(function () {
  return (
    sumArray(this.fuel, 'amount') +
    sumArray(this.tollFee, 'amt') +
    sumArray(this.pierExpenses, 'amt') +
    sumArray(this.repairAndMaintenance, 'amt') +
    sumArray(this.mealExpenses, 'amt') +
    sumArray(this.loadExpenses, 'amt') +
    sumArray(this.contingency, 'amt')
  );
});
// Virtual: duration (days between dateFrom and dateTo; Itinerary is always 1 day)
deliverySchema.virtual('duration').get(function () {
  if (this.deliveryType === 'Itinerary') return 1;
  if (!this.dateFrom || !this.dateTo) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = new Date(this.dateTo) - new Date(this.dateFrom);
  const days = Math.ceil(diff / msPerDay) + 1;
  return days > 0 ? days : 0;
});

export default mongoose.model('Delivery', deliverySchema);
