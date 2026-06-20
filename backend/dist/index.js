"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const feed_1 = __importDefault(require("./routes/feed"));
const messages_1 = __importDefault(require("./routes/messages"));
const admin_1 = __importDefault(require("./routes/admin"));
const comments_1 = __importDefault(require("./routes/comments"));
const rateLimiter_1 = require("./middlewares/rateLimiter");
const security_1 = require("./middlewares/security");
const notifications_1 = __importDefault(require("./routes/notifications"));
const socketManager_1 = require("./services/socketManager");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL || 'https://unseen-world.vercel.app',
    'https://unseen-world.vercel.app',
    'https://unseen-social.vercel.app',
    'https://unseen-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin)
            return callback(null, true);
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
app.use((0, helmet_1.default)({
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
app.use(security_1.additionalSecurityHeaders);
// ── Parsers ─────────────────────────────────────────────────────────────────
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
// ── MongoDB Injection Protection ────────────────────────────────────────────
app.use(security_1.mongoSanitize);
// ── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    app.use((0, morgan_1.default)('dev'));
}
// ── Global Rate Limiter ──────────────────────────────────────────────────────
app.use(rateLimiter_1.globalLimiter);
// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/feed', feed_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/comments', comments_1.default);
app.use('/api/notifications', notifications_1.default);
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
app.use((err, _req, res, _next) => {
    console.error('[Error]', err.message);
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
});
// ── Socket.io ─────────────────────────────────────────────────────────────────
(0, socketManager_1.initSocket)(server);
// ── MongoDB connection tuning ────────────────────────────────────────────────
mongoose_1.default.set('bufferCommands', false); // Fail fast instead of queuing when disconnected
// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5001;
const MONGO_URI = process.env.MONGO_URI || '';
if (MONGO_URI) {
    mongoose_1.default
        .connect(MONGO_URI, {
        maxPoolSize: 10, // Max concurrent connections to Atlas
        minPoolSize: 2, // Keep at least 2 alive for fast queries
        serverSelectionTimeoutMS: 5000, // Fail fast if DB unreachable
        socketTimeoutMS: 45000, // Don't hang forever on slow queries
        connectTimeoutMS: 10000, // Connection establishment timeout
    })
        .then(() => {
        console.log('[DB] MongoDB connected');
        server.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
    })
        .catch((err) => {
        console.error('[DB] Connection error:', err);
        process.exit(1);
    });
}
else {
    console.warn('[DB] No MONGO_URI provided — starting without database.');
    server.listen(PORT, () => console.log(`[Server] Running on port ${PORT} (no DB)`));
}
exports.default = app;
