import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  targetRoles: {
    type: [String],
    enum: ['admin', 'reviewer', 'user'],
    default: ['user', 'reviewer', 'admin']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Index on date range for efficient queries
announcementSchema.index({ startDate: 1, endDate: 1 });
announcementSchema.index({ createdAt: -1 });

export default mongoose.model('Announcement', announcementSchema);
