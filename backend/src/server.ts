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
import prisma from './lib/prisma';

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

// ─── Health & Debug Check ───────────────────────────────────────────────────
app.get(['/health', '/api/health'], (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  });
});

app.get(['/debug', '/api/debug'], async (_req, res) => {
  try {
    const patientCount = await prisma.patient.count();
    const doctorCount = await prisma.doctor.count();
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      patientCount,
      doctorCount,
      environment: process.env.NODE_ENV ?? 'development',
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      database: 'failed',
      message: err.message,
    });
  }
});

// ─── Trust Proxy (Vercel / Reverse Proxy support) ─────────────────────────────
app.set('trust proxy', 1);

// ─── API Routes (Mounted on both /api/* and /* for full Vercel compatibility) ──
const mount = (routePath: string, ...handlers: any[]) => {
  app.use(`/api${routePath}`, ...handlers);
  app.use(routePath, ...handlers);
};

mount('/auth', authRoutes);
mount('/doctors', publicLimiter, doctorRoutes);
mount('/appointments', apiLimiter, appointmentRoutes);
mount('/records', apiLimiter, recordRoutes);
mount('/notifications', apiLimiter, notificationRoutes);
mount('/messages', apiLimiter, messageRoutes);

// Doctor specific routes
mount('/doctor/auth', doctorAuthRoutes);
mount('/doctor/profile', apiLimiter, doctorProfileRoutes);
mount('/doctor/appointments', apiLimiter, doctorAppointmentsRoutes);
mount('/doctor/reviews', publicLimiter, doctorReviewsRoutes);
mount('/doctor/patients', apiLimiter, doctorPatientsRoutes);
mount('/doctor/messages', apiLimiter, doctorMessagesRoutes);

// Admin routes
mount('/admin', adminRoutes);

// Precheck routes
mount('/precheck', precheckRoutes);

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
