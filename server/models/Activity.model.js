import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema(
  {
    type: {
      type: String, // 'FILE', 'NODE', 'SYSTEM'
      required: true,
    },
    action: {
      type: String, // 'UPLOADED', 'DELETED', 'OFFLINE', 'ONLINE', etc.
      required: true,
    },
    message: {
      type: String, // Human readable message like 'Node 1 went offline'
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // flexible JSON for extra metadata
      default: {},
    },
  },
  { 
    timestamps: true,
    capped: { size: 1024 * 1024 * 10, max: 1000 } // Keep only max 1000 logs, max 10MB
  }
);

export const Activity = mongoose.model('Activity', ActivitySchema);
