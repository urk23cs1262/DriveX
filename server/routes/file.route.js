import express from 'express';
import {
  uploadFile,
  listFiles,
  downloadFile,
  deleteFile,
  toggleShare,
  downloadShared,
  listTrash,
  restoreFile,
  hardDeleteFile,
} from '../controllers/file.controller.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/upload', upload.single('file'), uploadFile);
router.get('/files', listFiles);
router.get('/file/:id', downloadFile);
router.delete('/file/:id', deleteFile);
router.patch('/file/:id/share', toggleShare);
router.get('/shared/:token', downloadShared);

router.get('/trash', listTrash);
router.patch('/file/:id/restore', restoreFile);
router.delete('/file/:id/hard', hardDeleteFile);

export default router;