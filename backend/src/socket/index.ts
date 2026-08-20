import http from 'http';
import { Server, Socket } from 'socket.io';
import prisma from '../lib/prisma';

// ─── Exported io instance ─────────────────────────────────────────────────────
let io: Server;

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized. Call setupSocket first.');
  }
  return io;
}

// ─── Socket Setup ─────────────────────────────────────────────────────────────
export function setupSocket(server: http.Server): Server {
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000,http://localhost:3001,https://frontend-kappa-liard-40.vercel.app,https://www.ichmeds.in,https://ichmeds.in')
    .split(',')
    .map((o) => o.trim());

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow all local dev origins, vercel domains, custom domains, or requests with no origin
        if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('vercel.app') || origin.includes('ichmeds.in')) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // ── Join appointment room ──────────────────────────────────────────────────
    socket.on('join-room', (appointmentId: string) => {
      if (!appointmentId || typeof appointmentId !== 'string') return;
      socket.join(appointmentId);
      console.log(`[Socket.io] Socket ${socket.id} joined room: ${appointmentId}`);
    });

    // ── Leave room ────────────────────────────────────────────────────────────
    socket.on('leave-room', (appointmentId: string) => {
      if (!appointmentId || typeof appointmentId !== 'string') return;
      socket.leave(appointmentId);
      console.log(`[Socket.io] Socket ${socket.id} left room: ${appointmentId}`);
    });

    // ── Join session room (for live queue tracker) ───────────────────────────
    socket.on('join-session', (sessionId: string) => {
      if (!sessionId || typeof sessionId !== 'string') return;
      socket.join(`session_${sessionId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined session queue: ${sessionId}`);
    });

    // ── Send message ──────────────────────────────────────────────────────────
    socket.on(
      'send-message',
      async (payload: {
        appointmentId: string;
        senderId: string;
        senderRole: string;
        content: string;
        fileUrl?: string | null;
      }) => {
        try {
          const { appointmentId, senderId, senderRole, content, fileUrl } = payload;

          if (!appointmentId || !senderId || !senderRole || !content) {
            socket.emit('error', { message: 'Missing required message fields.' });
            return;
          }

          const nowIso = new Date().toISOString();
          let messageData: any = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            appointmentId,
            senderId,
            senderRole,
            content,
            fileUrl: fileUrl ?? null,
            createdAt: nowIso,
            timestamp: nowIso,
          };

          try {
            // Check if appointment exists before DB insert
            const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
            if (appt) {
              const saved = await prisma.message.create({
                data: {
                  appointmentId,
                  senderId,
                  senderRole,
                  content,
                  fileUrl: fileUrl ?? null,
                },
              });
              messageData = {
                ...saved,
                timestamp: saved.createdAt.toISOString(),
              };
            }
          } catch (dbErr) {
            console.warn('[Socket.io] Could not persist message to Supabase DB, broadcasting live:', dbErr);
          }

          // Broadcast to everyone in the room (including sender)
          io.to(appointmentId).emit('new-message', messageData);
          socket.emit('new-message', messageData);
        } catch (error) {
          console.error('[Socket.io] send-message error:', error);
          socket.emit('error', { message: 'Failed to send message.' });
        }
      },
    );

    // ── Typing Indicator ──────────────────────────────────────────────────────
    socket.on('typing', (payload: { roomId: string; userId: string; isTyping: boolean }) => {
      if (!payload?.roomId) return;
      socket.to(payload.roomId).emit('typing', payload);
    });

    // ── WebRTC Signaling ──────────────────────────────────────────────────────
    socket.on(
      'webrtc-signal',
      (payload: { appointmentId: string; signal: unknown; targetId?: string; fromId?: string }) => {
        if (!payload?.appointmentId) return;
        payload.fromId = socket.id;
        socket.to(payload.appointmentId).emit('webrtc-signal', payload);
      },
    );

    // ── Doctor online/offline status ──────────────────────────────────────────
    socket.on(
      'doctor-status',
      async (payload: { doctorId: string; isOnline: boolean }) => {
        try {
          const { doctorId, isOnline } = payload;
          if (!doctorId || typeof isOnline !== 'boolean') return;

          await prisma.doctor.update({
            where: { id: doctorId },
            data: { isOnline },
          });

          io.emit('doctor-online-status', { doctorId, isOnline });
          console.log(`[Socket.io] Doctor ${doctorId} is now ${isOnline ? 'online' : 'offline'}`);
        } catch (error) {
          console.error('[Socket.io] doctor-status error:', error);
        }
      },
    );

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason: string) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  console.log('[Socket.io] Server initialized');
  return io;
}

export { io };
