'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';
import { Send, Paperclip, FileText, Download, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  appointmentId: string;
  senderId: string;
  senderRole: string;
  content: string;
  fileUrl: string | null;
  createdAt: string;
}

interface ChatBoxProps {
  appointmentId: string;
  currentUser: { id: string; role: 'patient' | 'doctor' };
  apiToken?: string;
}

export default function ChatBox({ appointmentId, currentUser, apiToken }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const isDoctor = currentUser.role === 'doctor';
  
  const effectiveToken = apiToken || (typeof window !== 'undefined' ? (
    localStorage.getItem('ICH Meds_token') ||
    localStorage.getItem('doctorToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('healthcare_token') ||
    ''
  ) : '');

  const fetchUrl = isDoctor 
    ? `${API_URL}/api/doctor/messages/${appointmentId}`
    : `${API_URL}/api/messages/${appointmentId}`;
    
  const uploadUrl = isDoctor 
    ? `${API_URL}/api/doctor/messages/upload`
    : `${API_URL}/api/messages/upload`;

  useEffect(() => {
    // 1. Fetch Chat History if token is available
    if (effectiveToken && appointmentId) {
      const fetchHistory = async () => {
        try {
          const res = await axios.get(fetchUrl, {
            headers: { Authorization: `Bearer ${effectiveToken}` }
          });
          if (res.data?.messages) {
            setMessages(res.data.messages);
          }
        } catch (err) {
          console.warn('Chat history notice:', err);
        }
      };
      fetchHistory();
    }

    // 2. Setup Socket Connection
    const newSocket = io(API_URL, {
      auth: { token: effectiveToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected to chat room:', appointmentId);
      newSocket.emit('join-room', appointmentId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('new-message', (message: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        // Clean up temp optimistic message if any
        const filtered = prev.filter(m => !(m.id.startsWith('temp-') && m.senderId === message.senderId && m.content === message.content));
        return [...filtered, message];
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [appointmentId, effectiveToken, API_URL, fetchUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !file) || !socket) return;

    let fileUrl = null;

    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await axios.post(uploadUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${effectiveToken}`
          }
        });
        fileUrl = res.data.fileUrl;
      } catch (err) {
        console.error('File upload failed', err);
        alert('File upload failed. Please try again.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
      setFile(null);
    }

    const contentText = newMessage.trim() || 'Sent an attachment';

    const payload = {
      appointmentId,
      senderId: currentUser.id,
      senderRole: currentUser.role,
      content: contentText,
      fileUrl
    };

    // Optimistically show message immediately
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      appointmentId,
      senderId: currentUser.id,
      senderRole: currentUser.role,
      content: contentText,
      fileUrl,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    socket.emit('send-message', payload);
    setNewMessage('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
              {isDoctor ? 'P' : 'Dr'}
            </div>
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isConnected ? 'bg-emerald-500' : 'bg-ink-300'}`} />
          </div>
          <div>
            <h3 className="font-bold text-ink-700 text-sm">
              {isDoctor ? 'Patient Consultation Chat' : 'Doctor Consultation Chat'}
            </h3>
            <p className="text-[12px] text-ink-400">
              {isConnected ? 'Real-time Live Chat Connected' : 'Connecting live chat...'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface-50/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-ink-400 p-6">
            <p className="text-sm font-medium">No messages yet.</p>
            <p className="text-xs mt-1">Send a message or upload clinical files to start the consultation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === currentUser.role || msg.senderId === currentUser.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl p-3 text-sm shadow-sm ${
                    isMe
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-white border border-surface-200 text-ink-700 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Attached File Display */}
                  {msg.fileUrl && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      {msg.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <div className="rounded-lg overflow-hidden my-1 max-w-[200px]">
                          <img
                            src={msg.fileUrl.startsWith('http') ? msg.fileUrl : `${API_URL}${msg.fileUrl}`}
                            alt="Attachment"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      ) : (
                        <a
                          href={msg.fileUrl.startsWith('http') ? msg.fileUrl : `${API_URL}${msg.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold ${
                            isMe ? 'bg-black/10 text-white' : 'bg-surface-100 text-primary-600'
                          }`}
                        >
                          <FileText size={16} />
                          <span className="truncate max-w-[150px]">View Attachment</span>
                          <Download size={14} className="ml-auto" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-ink-400 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload Preview Banner */}
      {file && (
        <div className="p-2.5 px-4 bg-primary-50 border-t border-primary-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary-800 truncate">
            <Paperclip size={14} />
            <span className="truncate max-w-[200px]">{file.name}</span>
            <span className="text-[10px] text-primary-500 font-normal">
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          <button onClick={removeFile} className="text-primary-700 hover:text-red-600 text-xs font-bold px-2 py-0.5">
            ✕ Remove
          </button>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-surface-200 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl hover:bg-surface-100 text-ink-400 hover:text-ink-600 transition-colors"
          title="Attach file or image"
        >
          <Paperclip size={18} />
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-ink-700"
        />

        <button
          type="submit"
          disabled={(!newMessage.trim() && !file) || isUploading}
          className="p-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:hover:bg-primary-600 text-white rounded-xl shadow-soft transition-all active:scale-95"
        >
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
