import { io, Socket } from 'socket.io-client'
import { getToken } from './auth'

let socket: Socket | null = null

/**
 * Get or create the Socket.io singleton instance
 */
export function getSocket(): Socket {
  if (!socket) {
    const token = getToken()
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message)
    })
  }
  return socket
}

/**
 * Disconnect and destroy the socket instance
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Join a chat/video room
 */
export function joinRoom(roomId: string, userId: string): void {
  const s = getSocket()
  s.emit('join-room', roomId)
}

/**
 * Leave a room
 */
export function leaveRoom(roomId: string, userId: string): void {
  const s = getSocket()
  s.emit('leave-room', roomId)
}

/**
 * Send a chat message
 */
export function sendMessage(roomId: string, message: ChatMessage): void {
  const s = getSocket()
  s.emit('send-message', {
    appointmentId: roomId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    content: message.content,
    fileUrl: message.attachmentUrl || null
  })
}

/**
 * Listen for incoming messages
 */
export function onMessage(callback: (message: ChatMessage) => void): () => void {
  const s = getSocket()
  s.on('new-message', callback)
  return () => {
    s.off('new-message', callback)
  }
}

/**
 * Send WebRTC signaling data
 */
export function sendSignal(roomId: string, signal: unknown, targetId: string): void {
  const s = getSocket()
  // simple-peer emits 'signal' with various types; we wrap them in a generic event for the backend
  s.emit('webrtc-signal', { appointmentId: roomId, signal, targetId })
}

/**
 * Listen for WebRTC signals
 */
export function onSignal(callback: (data: { signal: unknown; fromId: string }) => void): () => void {
  const s = getSocket()
  const handler = (payload: any) => {
    callback({ signal: payload.signal, fromId: payload.fromId || 'doctor' })
  }
  s.on('webrtc-signal', handler)
  return () => {
    s.off('webrtc-signal', handler)
  }
}

/**
 * Emit typing indicator
 */
export function emitTyping(roomId: string, userId: string, isTyping: boolean): void {
  const s = getSocket()
  s.emit('typing', { roomId, userId, isTyping })
}

/**
 * Listen for typing events
 */
export function onTyping(callback: (data: { userId: string; isTyping: boolean }) => void): () => void {
  const s = getSocket()
  s.on('typing', callback)
  return () => {
    s.off('typing', callback)
  }
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: 'patient' | 'doctor'
  content: string
  timestamp: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentType?: string
}

export { socket }
