import mongoose from 'mongoose';

// Replica entry — tracks which node holds a copy of this file
const ReplicaSchema = new mongoose.Schema({
  nodeId: { type: String, required: true },       // e.g. "node1"
  nodePath: { type: String, required: true },      // physical path on disk
  status: {
    type: String,
    enum: ['pending', 'stored', 'failed'],
    default: 'pending',
  },
  storedAt: { type: Date, default: Date.now },
});

const FileSchema = new mongoose.Schema(
  {
    fileId: { type: String, required: true, unique: true },  // UUID
    originalName: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },                                   // bytes

    // Distributed metadata
    replicas: [ReplicaSchema],                               // which nodes hold this file
    primaryNode: { type: String },                           // node that received upload first
    replicationStatus: {
      type: String,
      enum: ['pending', 'partial', 'complete', 'failed'],
      default: 'pending',
    },

    // Sharing
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, default: null },

    // Versioning
    version: { type: Number, default: 1 },

    uploadedBy: { type: String, default: 'anonymous' },

    // Soft deletion
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const File = mongoose.model('File', FileSchema);