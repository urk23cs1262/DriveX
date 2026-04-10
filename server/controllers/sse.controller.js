import {
  getAllNodes,
  refreshAllNodeHealth,
} from '../services/nodeRegistry.service.js';
import { File } from '../models/File.model.js';
import { eventBus, EVENT_TYPES } from '../services/eventBus.service.js';

/**
 * SSE: Stream cluster health status
 * Sends updates immediately when node status changes
 */
export const streamClusterHealth = async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');

  // Send a comment to keep connection alive
  res.write(':keep-alive\n\n');

  // Helper to build and send health data
  const sendHealth = async () => {
    try {
      const nodes = refreshAllNodeHealth();
      const files = await File.find({}, 'replicas size');
      const nodeFileCounts = {};
      const nodeStorageBytes = {};

      files.forEach((file) => {
        file.replicas.forEach((replica) => {
          if (replica.status === 'stored') {
            nodeFileCounts[replica.nodeId] = (nodeFileCounts[replica.nodeId] || 0) + 1;
            nodeStorageBytes[replica.nodeId] = (nodeStorageBytes[replica.nodeId] || 0) + (file.size || 0);
          }
        });
      });

      const enriched = nodes.map((n) => ({
        ...n,
        fileCount: nodeFileCounts[n.id] || 0,
        storageUsed: nodeStorageBytes[n.id] || 0,
      }));

      const onlineCount = enriched.filter((n) => n.status === 'online').length;

      const data = {
        clusterStatus: onlineCount === nodes.length ? 'healthy' : onlineCount > 0 ? 'degraded' : 'down',
        onlineNodes: onlineCount,
        totalNodes: nodes.length,
        nodes: enriched,
        timestamp: Date.now(),
      };

      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error('Health stream error:', err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    }
  };

  // Send initial data immediately
  await sendHealth();

  // Listen for node status changes and broadcast
  const handleNodeChange = async () => {
    await sendHealth();
  };

  eventBus.on(EVENT_TYPES.NODE_STATUS_CHANGED, handleNodeChange);
  eventBus.on(EVENT_TYPES.NODE_HEALTH_REFRESHED, handleNodeChange);

  // Cleanup on client disconnect
  req.on('close', () => {
    eventBus.removeListener(EVENT_TYPES.NODE_STATUS_CHANGED, handleNodeChange);
    eventBus.removeListener(EVENT_TYPES.NODE_HEALTH_REFRESHED, handleNodeChange);
    res.end();
  });
};

/**
 * SSE: Stream file updates
 * Sends updates immediately when files are uploaded, deleted, or replication changes
 */
export const streamFileUpdates = async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');

  // Send a comment to keep connection alive
  res.write(':keep-alive\n\n');

  let lastFilesData = null;

  // Helper to send file list
  const sendFiles = async () => {
    try {
      const files = await File.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });

      // Compute replication status for each file
      const filesWithStatus = files.map((file) => ({
        fileId: file.fileId,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
        replicas: file.replicas,
        replicationStatus: computeReplicationStatus(file.replicas),
        isPublic: file.isPublic,
        shareToken: file.shareToken,
      }));

      const data = { files: filesWithStatus, timestamp: Date.now() };
      const dataStr = JSON.stringify(data);

      // Only send if data changed
      if (dataStr !== lastFilesData) {
        lastFilesData = dataStr;
        res.write(`data: ${dataStr}\n\n`);
      }
    } catch (err) {
      console.error('Files stream error:', err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    }
  };

  // Send initial data immediately
  await sendFiles();

  // Listen for file change events and broadcast
  const handleFileChange = async () => {
    await sendFiles();
  };

  eventBus.on(EVENT_TYPES.FILE_UPLOADED, handleFileChange);
  eventBus.on(EVENT_TYPES.FILE_DELETED, handleFileChange);
  eventBus.on(EVENT_TYPES.FILE_REPLICATION_UPDATED, handleFileChange);

  // Cleanup on client disconnect
  req.on('close', () => {
    eventBus.removeListener(EVENT_TYPES.FILE_UPLOADED, handleFileChange);
    eventBus.removeListener(EVENT_TYPES.FILE_DELETED, handleFileChange);
    eventBus.removeListener(EVENT_TYPES.FILE_REPLICATION_UPDATED, handleFileChange);
    res.end();
  });
};

/**
 * Compute replication status based on replicas
 */
function computeReplicationStatus(replicas) {
  if (!replicas || replicas.length === 0) return 'pending';
  const storedCount = replicas.filter((r) => r.status === 'stored').length;
  if (storedCount === replicas.length) return 'complete';
  if (storedCount > 0) return 'partial';
  return 'pending';
}
