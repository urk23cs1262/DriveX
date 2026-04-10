import express from 'express';
import { getClusterHealth, toggleNode } from '../controllers/node.controller.js';

const router = express.Router();

router.get('/health', getClusterHealth);
router.patch('/node/:nodeId/toggle', toggleNode);

export default router;