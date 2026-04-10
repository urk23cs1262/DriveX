import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env.js';

/**
 * DISTRIBUTED CONCEPT: Node Registry
 * Central registry of all storage nodes in the cluster.
 * Each node has: id, storage path, health status, file count (load).
 * The coordinator consults this registry for every operation.
 */

const BASE_STORAGE = path.resolve(ENV.UPLOAD_DIR);

// Node definitions — in production these would be separate servers/IPs
const nodes = [
  { id: 'node1', path: path.join(BASE_STORAGE, 'node1'), status: 'online', fileCount: 0, simulated: false },
  { id: 'node2', path: path.join(BASE_STORAGE, 'node2'), status: 'online', fileCount: 0, simulated: false },
  { id: 'node3', path: path.join(BASE_STORAGE, 'node3'), status: 'online', fileCount: 0, simulated: false },
];

// Ensure all node directories exist on startup
nodes.forEach((node) => {
  if (!fs.existsSync(node.path)) {
    fs.mkdirSync(node.path, { recursive: true });
  }
});

/**
 * Get all nodes with current status
 */
export const getAllNodes = () => nodes;

/**
 * DISTRIBUTED CONCEPT: Health Check
 * A node is "online" if its directory is accessible on disk.
 * In a real system, this would be an HTTP ping to the node's service.
 */
export const checkNodeHealth = (nodeId) => {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return false;
  try {
    fs.accessSync(node.path, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
};

/**
 * Refresh health status for all nodes
 */
export const refreshAllNodeHealth = () => {
  nodes.forEach((node) => {
    // Don't refresh health for manually simulated failures
    if (node.simulated) return;
    const healthy = checkNodeHealth(node.id);
    node.status = healthy ? 'online' : 'offline';
  });
  return nodes;
};

/**
 * DISTRIBUTED CONCEPT: Fault Tolerance
 * Manually toggle a node offline to simulate failure.
 */
export const setNodeStatus = (nodeId, status) => {
  const node = nodes.find((n) => n.id === nodeId);
  // Mark as simulated failure so health checks won't override it
  node.simulated = status === 'offline';
  if (!node) throw new Error(`Node ${nodeId} not found`);
  node.status = status;
  return node;
};

/**
 * DISTRIBUTED CONCEPT: Load Balancing (Round-Robin + Health Filter)
 * Returns only online nodes, sorted by file count (least loaded first).
 * This ensures uploads are distributed evenly across healthy nodes.
 */
export const getAvailableNodes = (count = 1) => {
  refreshAllNodeHealth();
  const online = nodes
    .filter((n) => n.status === 'online')
    .sort((a, b) => a.fileCount - b.fileCount);

  if (online.length < count) {
    throw new Error(
      `Not enough healthy nodes. Required: ${count}, Available: ${online.length}`
    );
  }
  return online.slice(0, count);
};

/**
 * Increment file count on a node (called after successful write)
 */
export const incrementNodeLoad = (nodeId) => {
  const node = nodes.find((n) => n.id === nodeId);
  if (node) node.fileCount++;
};

/**
 * Decrement file count on a node (called after delete)
 */
export const decrementNodeLoad = (nodeId) => {
  const node = nodes.find((n) => n.id === nodeId);
  if (node && node.fileCount > 0) node.fileCount--;
};

export const getNodeById = (nodeId) => nodes.find((n) => n.id === nodeId);