import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  items: {
    type: String,
    required: true
  },
  qty: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  supplier: {
    type: String
  },
  invoiceNo: {
    type: String
  },
  purchasedBy: {
    type: String
  },
  usedForNote: {
    type: String
  }
}, {
  timestamps: true
});

const Purchase = mongoose.model('Purchase', purchaseSchema);

export default Purchase;
