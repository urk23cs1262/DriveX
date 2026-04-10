import { eventBus, EVENT_TYPES } from './eventBus.service.js';
import { Activity } from '../models/Activity.model.js';
import { File } from '../models/File.model.js';

export const initActivityLogger = () => {
  // Listen for file uploads
  eventBus.on(EVENT_TYPES.FILE_UPLOADED, async (data) => {
    try {
      const { fileId } = data;
      const file = await File.findOne({ fileId });
      const name = file ? file.originalName : fileId;
      
      await Activity.create({
        type: 'FILE',
        action: 'UPLOADED',
        message: `File uploaded to network: ${name}`,
        details: { fileId, originalName: name, size: file?.size },
      });
    } catch (err) {
      console.error('Activity logger error (FILE_UPLOADED):', err);
    }
  });

  // Listen for file deletions
  eventBus.on(EVENT_TYPES.FILE_DELETED, async (data) => {
    try {
      const { fileId } = data;
      // Note: File might be soft deleted or hard deleted
      const file = await File.findOne({ fileId });
      const name = file ? file.originalName : fileId;

      await Activity.create({
        type: 'FILE',
        action: 'DELETED',
        message: `File deleted from network: ${name}`,
        details: { fileId, originalName: name },
      });
    } catch (err) {
      console.error('Activity logger error (FILE_DELETED):', err);
    }
  });

  // Listen for file replication updates
  eventBus.on(EVENT_TYPES.FILE_REPLICATION_UPDATED, async (data) => {
    try {
      const { fileId, replicationStatus } = data;
      const file = await File.findOne({ fileId });
      const name = file ? file.originalName : fileId;

      await Activity.create({
        type: 'FILE',
        action: 'REPLICATED',
        message: `Replication status for ${name} changed to ${replicationStatus}`,
        details: { fileId, originalName: name, replicationStatus },
      });
    } catch (err) {
      console.error('Activity logger error (FILE_REPLICATION_UPDATED):', err);
    }
  });

  // Listen for node status changes
  eventBus.on(EVENT_TYPES.NODE_STATUS_CHANGED, async (data) => {
    try {
      const { nodeId, status } = data;
      const action = status.toUpperCase();

      await Activity.create({
        type: 'NODE',
        action,
        message: `Node ${nodeId} went ${status}`,
        details: { nodeId, status },
      });
    } catch (err) {
      console.error('Activity logger error (NODE_STATUS_CHANGED):', err);
    }
  });

  console.log('📜 Activity Logger initialized');
};
