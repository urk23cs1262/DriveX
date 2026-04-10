import {
  storeFileAcrossNodes,
  retrieveFile,
  deleteFileFromNodes,
} from '../services/coordinator.service.js';
import { File } from '../models/File.model.js';
import { v4 as uuidv4 } from 'uuid';
import { eventBus, EVENT_TYPES } from '../services/eventBus.service.js';

/**
 * POST /api/upload
 * Accepts a file via multipart/form-data, stores it across nodes
 */
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { originalname, mimetype, size, buffer } = req.file;

    const fileDoc = await storeFileAcrossNodes(buffer, originalname, mimetype, size);

    // Emit event to notify SSE clients of new file
    eventBus.emit(EVENT_TYPES.FILE_UPLOADED, { fileId: fileDoc.fileId });

    return res.status(201).json({
      message: 'File uploaded and replicated successfully',
      file: fileDoc,
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/files
 * Returns all file metadata from MongoDB (excluding deleted files)
 */
export const listFiles = async (req, res) => {
  try {
    const files = await File.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    return res.json({ files });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/file/:id
 * Fault-tolerant download — tries primary node, falls back to replicas
 */
export const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { buffer, fileMeta } = await retrieveFile(id);

    res.setHeader('Content-Disposition', `attachment; filename="${fileMeta.originalName}"`);
    res.setHeader('Content-Type', fileMeta.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
};

/**
 * DELETE /api/file/:id
 * Soft deletes file by setting isDeleted to true
 */
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({ fileId: id });
    if (!file) return res.status(404).json({ error: 'File not found' });

    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    // Emit event to notify SSE clients of file deletion
    eventBus.emit(EVENT_TYPES.FILE_DELETED, { fileId: id });

    return res.json({ message: 'File moved to recycle bin safely' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/trash
 * Returns all deleted file metadata from MongoDB
 */
export const listTrash = async (req, res) => {
  try {
    const files = await File.find({ isDeleted: true }).sort({ deletedAt: -1 });
    return res.json({ files });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/file/:id/restore
 * Restores a soft-deleted file
 */
export const restoreFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({ fileId: id });
    if (!file) return res.status(404).json({ error: 'File not found' });

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    // Emit upload event to notify it's back
    eventBus.emit(EVENT_TYPES.FILE_UPLOADED, { fileId: id });

    return res.json({ message: 'File restored successfully', file });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/file/:id/hard
 * Removes file from all nodes + metadata from MongoDB permanently
 */
export const hardDeleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteFileFromNodes(id);

    // Also notify just in case
    eventBus.emit(EVENT_TYPES.FILE_DELETED, { fileId: id });

    return res.json({ message: 'File deleted from system permanently' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/file/:id/share
 * Toggle public/private sharing, generate a share token
 */
export const toggleShare = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await File.findOne({ fileId: id });
    if (!file) return res.status(404).json({ error: 'File not found' });

    file.isPublic = !file.isPublic;
    file.shareToken = file.isPublic ? uuidv4() : null;
    await file.save();

    return res.json({
      message: `File is now ${file.isPublic ? 'public' : 'private'}`,
      isPublic: file.isPublic,
      shareToken: file.shareToken,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/shared/:token
 * Download a file via its public share token
 */
export const downloadShared = async (req, res) => {
  try {
    const { token } = req.params;
    const file = await File.findOne({ shareToken: token, isPublic: true });
    if (!file) return res.status(404).json({ error: 'Invalid or expired share link' });

    const { buffer, fileMeta } = await retrieveFile(file.fileId);

    res.setHeader('Content-Disposition', `attachment; filename="${fileMeta.originalName}"`);
    res.setHeader('Content-Type', fileMeta.mimeType || 'application/octet-stream');
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};