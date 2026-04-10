import express from 'express';
import { streamClusterHealth, streamFileUpdates } from '../controllers/sse.controller.js';

const router = express.Router();

// SSE endpoints — no rate limiting (streaming)
router.get('/health-stream', streamClusterHealth);
router.get('/files-stream', streamFileUpdates);

export default router;
