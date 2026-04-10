import {
  getAllNodes,
  refreshAllNodeHealth,
  setNodeStatus,
} from '../services/nodeRegistry.service.js';
import { File } from '../models/File.model.js';
import { eventBus, EVENT_TYPES } from '../services/eventBus.service.js';

/**
 * GET /api/health
 * Returns live health status of all storage nodes
 */
export const getClusterHealth = async (req, res) => {
  try {
    const nodes = refreshAllNodeHealth();

    // Count how many files each node holds (from metadata)
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

    return res.json({
      clusterStatus: onlineCount === nodes.length ? 'healthy' : onlineCount > 0 ? 'degraded' : 'down',
      onlineNodes: onlineCount,
      totalNodes: nodes.length,
      nodes: enriched,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/node/:nodeId/toggle
 * Simulate node failure — toggle a node online/offline
 * This is for demo/testing purposes (advanced feature)
 */
export const toggleNode = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const nodes = getAllNodes();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return res.status(404).json({ error: 'Node not found' });

    const newStatus = node.status === 'online' ? 'offline' : 'online';
    const updated = setNodeStatus(nodeId, newStatus);

    // Emit event to notify SSE clients of status change
    eventBus.emit(EVENT_TYPES.NODE_STATUS_CHANGED, { nodeId, status: newStatus });

    return res.json({
      message: `Node ${nodeId} is now ${newStatus}`,
      node: updated,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};