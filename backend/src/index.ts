import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import feedRoutes from './routes/feed';
import messagesRoutes from './routes/messages';
import adminRoutes from './routes/admin';
import commentsRoutes from './routes/comments';
import { globalLimiter } from './middlewares/rateLimiter';
import { mongoSanitize, additionalSecurityHeaders } from './middlewares/security';
import notificationsRoutes from './routes/notifications';
import { initSocket } from './services/socketManager';

dotenv.config();

const app = express();
const server = createServer(app);

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, origin);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Security Headers (Helmet) ───────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'no-referrer' },
}));

app.use(additionalSecurityHeaders);

// ── Parsers ─────────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── MongoDB Injection Protection ────────────────────────────────────────────
app.use(mongoSanitize);

// ── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Global Rate Limiter ──────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Unseen API',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

// ── Socket.io ─────────────────────────────────────────────────────────────────
initSocket(server);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5001;
const MONGO_URI = process.env.MONGO_URI || '';

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log('[DB] MongoDB connected');
      server.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('[DB] Connection error:', err);
      process.exit(1);
    });
} else {
  console.warn('[DB] No MONGO_URI provided — starting without database.');
  server.listen(PORT, () => console.log(`[Server] Running on port ${PORT} (no DB)`));
}

export default app;
