import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';

import { setupSocket } from './socket';
import { publicLimiter, apiLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth';
import doctorRoutes from './routes/doctors';
import appointmentRoutes from './routes/appointments';
import recordRoutes from './routes/records';
import notificationRoutes from './routes/notifications';
import messageRoutes from './routes/messages';

import doctorAuthRoutes from './routes/doctorAuth';
import doctorProfileRoutes from './routes/doctorProfile';
import doctorAppointmentsRoutes from './routes/doctorAppointments';
import doctorReviewsRoutes from './routes/doctorReviews';
import doctorPatientsRoutes from './routes/doctorPatients';
import doctorMessagesRoutes from './routes/doctorMessages';
import precheckRoutes from './routes/precheck';
import adminRoutes from './routes/admin';

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
import helmet from 'helmet';

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources for WebRTC/APIs
  contentSecurityPolicy: false, // CSP disabled to not interfere with Firebase Auth / Agora WebRTC if not configured perfectly
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000,https://frontend-kappa-liard-40.vercel.app')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('loca.lt')
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Allow custom domains
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files ─────────────────────────────────────────────────────────────
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  });
});

// ─── Trust Proxy (Vercel / Reverse Proxy support) ─────────────────────────────
app.set('trust proxy', 1);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes); // Limits applied per-route
app.use('/api/doctors', publicLimiter, doctorRoutes);
app.use('/api/appointments', apiLimiter, appointmentRoutes);
app.use('/api/records', apiLimiter, recordRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/messages', apiLimiter, messageRoutes);

// Doctor specific routes
app.use('/api/doctor/auth', doctorAuthRoutes); // Limits applied per-route
app.use('/api/doctor/profile', apiLimiter, doctorProfileRoutes);
app.use('/api/doctor/appointments', apiLimiter, doctorAppointmentsRoutes);
app.use('/api/doctor/reviews', publicLimiter, doctorReviewsRoutes);
app.use('/api/doctor/patients', apiLimiter, doctorPatientsRoutes);
app.use('/api/doctor/messages', apiLimiter, doctorMessagesRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Precheck routes
app.use('/api/precheck', precheckRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('[Global Error Handler]', err.message, err.stack);
    res.status(500).json({ error: err.message ?? 'Internal server error.' });
  },
);

// ─── HTTP Server + Socket.io (Standalone mode only) ──────────────────────────
if (!process.env.VERCEL) {
  const httpServer = http.createServer(app);
  setupSocket(httpServer);

  const PORT = parseInt(process.env.PORT ?? '5000', 10);
  httpServer.listen(PORT, () => {
    console.log(`[Server] Healthcare backend running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`[Server] CORS allowed origins: ${allowedOrigins.join(', ')}`);
  });
}

export default app;
