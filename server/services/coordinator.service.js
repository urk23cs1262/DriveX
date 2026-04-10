import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { File } from '../models/File.model.js';
import {
  getAvailableNodes,
  incrementNodeLoad,
  decrementNodeLoad,
  getNodeById,
  refreshAllNodeHealth,
} from './nodeRegistry.service.js';
import { eventBus, EVENT_TYPES } from './eventBus.service.js';
import { ENV } from '../config/env.js';

const MAX_RETRIES = 3;

/**
 * DISTRIBUTED CONCEPT: Write with Replication
 * 1. Pick N best available nodes (load-balanced)
 * 2. Write file buffer to each node (parallel)
 * 3. Retry failed writes up to MAX_RETRIES
 * 4. Mark replication status based on success count
 */
export const storeFileAcrossNodes = async (fileBuffer, originalName, mimeType, size) => {
  const fileId = uuidv4();
  const safeFileName = `${fileId}_${originalName.replace(/\s+/g, '_')}`;

  // Pick target nodes based on replication factor
  const targetNodes = getAvailableNodes(ENV.REPLICATION_FACTOR);

  const replicas = [];

  // DISTRIBUTED CONCEPT: Parallel Storage
  // Write to all target nodes simultaneously using Promise.allSettled
  // allSettled (not Promise.all) so one failure doesn't abort others
  const writeResults = await Promise.allSettled(
    targetNodes.map((node) => writeToNode(node, safeFileName, fileBuffer))
  );

  writeResults.forEach((result, i) => {
    const node = targetNodes[i];
    if (result.status === 'fulfilled') {
      replicas.push({
        nodeId: node.id,
        nodePath: result.value,
        status: 'stored',
        storedAt: new Date(),
      });
      incrementNodeLoad(node.id);
    } else {
      // DISTRIBUTED CONCEPT: Retry Logic
      // First attempt failed — try again up to MAX_RETRIES
      console.warn(`⚠️ Write to ${node.id} failed, initiating retry...`);
      replicas.push({
        nodeId: node.id,
        nodePath: path.join(node.path, safeFileName),
        status: 'failed',
      });
    }
  });

  // Retry failed replicas
  for (let replica of replicas.filter((r) => r.status === 'failed')) {
    const retryResult = await retryWrite(replica.nodeId, safeFileName, fileBuffer);
    if (retryResult) {
      replica.status = 'stored';
      replica.storedAt = new Date();
      incrementNodeLoad(replica.nodeId);
    }
  }

  const successCount = replicas.filter((r) => r.status === 'stored').length;

  // DISTRIBUTED CONCEPT: Eventual Consistency
  // We accept partial success and mark replication status accordingly.
  // A background job (in production) would later re-replicate to reach full consistency.
  let replicationStatus = 'failed';
  if (successCount === replicas.length) replicationStatus = 'complete';
  else if (successCount >= 1) replicationStatus = 'partial';

  if (successCount === 0) {
    throw new Error('All nodes failed to store the file. Upload aborted.');
  }

  // Save metadata to MongoDB
  const fileDoc = await File.create({
    fileId,
    originalName,
    mimeType,
    size,
    replicas,
    primaryNode: replicas.find((r) => r.status === 'stored')?.nodeId,
    replicationStatus,
  });

  // Emit event for replication status change (if not all succeeded immediately)
  if (replicationStatus !== 'complete') {
    eventBus.emit(EVENT_TYPES.FILE_REPLICATION_UPDATED, { fileId, replicationStatus });
  }

  return fileDoc;
};

/**
 * Write file buffer to a single node's storage directory
 */
const writeToNode = (node, fileName, buffer) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(node.path, fileName);
    fs.writeFile(filePath, buffer, (err) => {
      if (err) reject(err);
      else resolve(filePath);
    });
  });
};

/**
 * DISTRIBUTED CONCEPT: Retry Mechanism
 * Exponential backoff retry for failed node writes
 */
const retryWrite = async (nodeId, fileName, buffer) => {
  const node = getNodeById(nodeId);
  if (!node || node.status === 'offline') return false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await new Promise((r) => setTimeout(r, attempt * 200)); // backoff
      await writeToNode(node, fileName, buffer);
      console.log(`✅ Retry ${attempt} succeeded for ${nodeId}`);
      return true;
    } catch (err) {
      console.warn(`❌ Retry ${attempt}/${MAX_RETRIES} failed for ${nodeId}`);
    }
  }
  return false;
};

/**
 * DISTRIBUTED CONCEPT: Fault-Tolerant Read
 * Try to read from the primary node first.
 * If it fails (node offline/file missing), fall back to any replica.
 */
export const retrieveFile = async (fileId) => {
  const fileMeta = await File.findOne({ fileId });
  if (!fileMeta) throw new Error('File not found in metadata store');

  refreshAllNodeHealth();

  // Sort: try stored replicas first, prefer online nodes
  const candidates = fileMeta.replicas
    .filter((r) => r.status === 'stored')
    .sort((a, b) => {
      const nodeA = getNodeById(a.nodeId);
      const nodeB = getNodeById(b.nodeId);
      const aOnline = nodeA?.status === 'online' ? 0 : 1;
      const bOnline = nodeB?.status === 'online' ? 0 : 1;
      return aOnline - bOnline;
    });

  for (const replica of candidates) {
    try {
      const buffer = fs.readFileSync(replica.nodePath);
      return { buffer, fileMeta };
    } catch {
      console.warn(`⚠️ Read failed from ${replica.nodeId}, trying next replica...`);
    }
  }

  throw new Error('File unavailable — all replicas failed or nodes are offline');
};

/**
 * Delete file from all nodes and remove metadata
 */
export const deleteFileFromNodes = async (fileId) => {
  const fileMeta = await File.findOne({ fileId });
  if (!fileMeta) throw new Error('File not found');

  // Delete from every node that holds a replica
  await Promise.allSettled(
    fileMeta.replicas
      .filter((r) => r.status === 'stored')
      .map((replica) => {
        decrementNodeLoad(replica.nodeId);
        return new Promise((resolve) => {
          fs.unlink(replica.nodePath, (err) => {
            if (err) console.warn(`⚠️ Could not delete from ${replica.nodeId}: ${err.message}`);
            resolve();
          });
        });
      })
  );

  await File.deleteOne({ fileId });
  return true;
};