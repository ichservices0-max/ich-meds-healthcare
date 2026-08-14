'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Paperclip, Loader2, File } from 'lucide-react'
import { getSocket, sendMessage, onMessage, joinRoom, leaveRoom, emitTyping, onTyping } from '@/lib/socket'
import { useAuth } from '@/contexts/AuthContext'
import type { ChatMessage } from '@/lib/socket'
import type { Doctor } from '@/lib/api'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  doctor: Doctor | null
  roomId: string
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', senderId: 'doctor-1', senderName: 'Dr. Sarah Mitchell', senderRole: 'doctor', content: 'Hello! How are you feeling today?', timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 'm2', senderId: 'patient-1', senderName: 'Alex', senderRole: 'patient', content: "Hi Doctor! I've been having some headaches since yesterday.", timestamp: new Date(Date.now() - 540000).toISOString() },
  { id: 'm3', senderId: 'doctor-1', senderName: 'Dr. Sarah Mitchell', senderRole: 'doctor', content: "I see. Can you describe the location and intensity of the headache? Is it throbbing or a constant dull ache?", timestamp: new Date(Date.now() - 480000).toISOString() },
]

export default function ChatPanel({ isOpen, onClose, doctor, roomId }: ChatPanelProps) {
  const { patient } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [doctorTyping, setDoctorTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const patientId = patient?.id || 'patient-local'

  useEffect(() => {
    if (!isOpen || !roomId) return
    joinRoom(roomId, patientId)
    const unsubMessage = onMessage((msg) => {
      setMessages((prev) => [...prev, msg])
    })
    const unsubTyping = onTyping(({ userId, isTyping: t }) => {
      if (userId !== patientId) setDoctorTyping(t)
    })
    return () => {
      leaveRoom(roomId, patientId)
      unsubMessage()
      unsubTyping()
    }
  }, [isOpen, roomId, patientId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, doctorTyping])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputText(e.target.value)
    if (!isTyping) {
      setIsTyping(true)
      emitTyping(roomId, patientId, true)
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false)
      emitTyping(roomId, patientId, false)
    }, 1500)
  }

  function handleSend() {
    if (!inputText.trim()) return
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: patientId,
      senderName: patient?.name || 'You',
      senderRole: 'patient',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, msg])
    sendMessage(roomId, msg)
    setInputText('')
    setIsTyping(false)
    emitTyping(roomId, patientId, false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: patientId,
      senderName: patient?.name || 'You',
      senderRole: 'patient',
      content: '',
      timestamp: new Date().toISOString(),
      attachmentName: file.name,
      attachmentType: file.type,
      attachmentUrl: URL.createObjectURL(file),
    }
    setMessages((prev) => [...prev, msg])
    sendMessage(roomId, msg)
    e.target.value = ''
  }

  const doctorAvatarUrl = doctor
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=1E40AF&color=fff&size=64`
    : ''

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Chat panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl flex flex-col"
            style={{ height: '80vh', maxHeight: '600px' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              {doctor && (
                <>
                  <div className="relative">
                    <img src={doctorAvatarUrl} alt={doctor.name} className="w-10 h-10 rounded-xl border border-primary/30" />
                    {doctor.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{doctor.name}</p>
                    <p className="text-xs text-emerald-400">{doctor.isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                </>
              )}
              <button onClick={onClose} className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg) => {
                const isPatient = msg.senderRole === 'patient'
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isPatient ? 'justify-end' : 'justify-start'} gap-2`}
                  >
                    {!isPatient && doctor && (
                      <img src={doctorAvatarUrl} alt={doctor.name} className="w-7 h-7 rounded-lg border border-primary/20 self-end shrink-0" />
                    )}
                    <div className={`max-w-[75%] ${isPatient ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {msg.attachmentUrl ? (
                        <div className={isPatient ? 'msg-bubble-patient' : 'msg-bubble-doctor'}>
                          <div className="flex items-center gap-2">
                            <File className="w-4 h-4 shrink-0" />
                            <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline truncate max-w-[160px]">
                              {msg.attachmentName}
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className={isPatient ? 'msg-bubble-patient' : 'msg-bubble-doctor'}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500 px-1">{formatTime(msg.timestamp)}</p>
                    </div>
                  </motion.div>
                )
              })}

              {/* Typing indicator */}
              {doctorTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  {doctor && <img src={doctorAvatarUrl} alt="" className="w-7 h-7 rounded-lg border border-primary/20" />}
                  <div className="msg-bubble-doctor flex items-center gap-1 py-3 px-4">
                    {[0, 0.2, 0.4].map((delay) => (
                      <motion.span
                        key={delay}
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="glass-input flex-1 py-2.5 text-sm"
                />
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleSend}
                  disabled={!inputText.trim() || isSending}
                  className="w-9 h-9 bg-primary hover:bg-primary-700 rounded-xl flex items-center justify-center text-white transition-colors disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
