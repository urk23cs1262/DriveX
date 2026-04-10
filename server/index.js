import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import fileRoutes from './routes/file.route.js';
import nodeRoutes from './routes/node.route.js';
import sseRoutes from './routes/sse.route.js';
import activityRoutes from './routes/activity.route.js';
import { startCronJobs } from './services/cron.service.js';
import { initActivityLogger } from './services/activityLogger.service.js';

const app = express();

// ── Security & Middleware ──────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please slow down.' },
  skip: (req) => {
    // Skip rate limiting for SSE streams
    return req.path === '/health-stream' || req.path === '/files-stream';
  },
});
app.use('/api', limiter);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api', sseRoutes); // SSE streams
app.use('/api', fileRoutes);
app.use('/api', nodeRoutes);
app.use('/api', activityRoutes);

// ── Ping ───────────────────────────────────────────────────────────────────
app.get('/ping', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────────────
connectDB().then(() => {
  initActivityLogger();
  app.listen(ENV.PORT, () => {
    console.log(`🚀 DriveX server running on http://localhost:${ENV.PORT}`);
    startCronJobs();
  });
});

export default app;