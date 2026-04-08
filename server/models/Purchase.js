import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  date: {
    type: String,
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
    type: String,
    required: true
  },
  itemDates: {
    type: String
  },
  itemAmounts: {
    type: String
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
  budget: {
    type: Number
  },
  usedForNote: {
    type: String
  }
}, {
  timestamps: true
});

const Purchase = mongoose.model('Purchase', purchaseSchema);

export default Purchase;
