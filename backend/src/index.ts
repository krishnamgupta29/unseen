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
  process.env.FRONTEND_URL || 'https://unseen-world.vercel.app',
  'https://unseen-world.vercel.app',
  'https://unseen-social.vercel.app',
  'https://unseen-frontend.onrender.com',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any explicitly allowed origins
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, origin);
    }
    
    // Allow local development domains, emulator IPs, and local area network ranges
    const isLocal = origin.startsWith('http://localhost:') || 
                    origin === 'http://localhost' ||
                    origin.startsWith('http://127.0.0.1:') || 
                    origin === 'http://127.0.0.1' ||
                    origin.startsWith('http://10.0.2.2:') ||
                    origin === 'http://10.0.2.2' ||
                    /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
                    /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin) ||
                    /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin);
                    
    if (isLocal) {
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
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
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
app.get('/', (_req, res) => {
  res.json({
    status: 'Backend running successfully',
    timestamp: new Date().toISOString(),
  });
});

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

// ── MongoDB connection tuning ────────────────────────────────────────────────
mongoose.set('bufferCommands', false); // Fail fast instead of queuing when disconnected

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5001;
const MONGO_URI = process.env.MONGO_URI || '';

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI, {
      maxPoolSize: 10,          // Max concurrent connections to Atlas
      minPoolSize: 2,           // Keep at least 2 alive for fast queries
      serverSelectionTimeoutMS: 5000, // Fail fast if DB unreachable
      socketTimeoutMS: 45000,   // Don't hang forever on slow queries
      connectTimeoutMS: 10000,  // Connection establishment timeout
    })
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
