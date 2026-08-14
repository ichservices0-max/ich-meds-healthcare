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
  apiToken: string;
}

export default function ChatBox({ appointmentId, currentUser, apiToken }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const isDoctor = currentUser.role === 'doctor';
  const fetchUrl = isDoctor 
    ? `${API_URL}/api/doctor/messages/${appointmentId}`
    : `${API_URL}/api/messages/${appointmentId}`;
    
  const uploadUrl = isDoctor 
    ? `${API_URL}/api/doctor/messages/upload`
    : `${API_URL}/api/messages/upload`;

  useEffect(() => {
    if (!apiToken) return;

    // 1. Fetch Chat History
    const fetchHistory = async () => {
      try {
        const res = await axios.get(fetchUrl, {
          headers: { Authorization: `Bearer ${apiToken}` }
        });
        setMessages(res.data.messages);
      } catch (err) {
        console.error('Failed to fetch chat history', err);
      }
    };
    fetchHistory();

    // 2. Setup Socket
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-room', appointmentId);
    });

    newSocket.on('new-message', (message: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [appointmentId, apiToken, API_URL, fetchUrl]);

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
            Authorization: `Bearer ${apiToken}`
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

    const payload = {
      appointmentId,
      senderId: currentUser.id,
      senderRole: currentUser.role,
      content: newMessage.trim() || 'Sent an attachment',
      fileUrl
    };

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
        <div>
          <h3 className="font-bold text-ink-800">Live Chat</h3>
          <p className="text-xs text-ink-500">End-to-end encrypted messaging</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50/50 min-h-[300px]">
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-ink-400 text-sm">
              No messages yet. Say hello!
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <motion.div 
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider">
                      {isMe ? 'You' : msg.senderRole}
                    </span>
                    <span className="text-[10px] text-ink-300">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                    isMe 
                      ? 'bg-primary-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-surface-200 text-ink-700 rounded-tl-sm'
                  }`}>
                    {msg.fileUrl && (
                      <div className={`mb-2 p-2 rounded-xl border flex items-center gap-3 ${isMe ? 'bg-white/10 border-white/20' : 'bg-surface-50 border-surface-200'}`}>
                        {msg.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                          <ImageIcon className={`w-6 h-6 shrink-0 ${isMe ? 'text-white' : 'text-primary-500'}`} />
                        ) : (
                          <FileText className={`w-6 h-6 shrink-0 ${isMe ? 'text-white' : 'text-primary-500'}`} />
                        )}
                        <a 
                          href={`${API_URL}${msg.fileUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex-1 truncate text-sm font-medium hover:underline"
                        >
                          View Attachment
                        </a>
                      </div>
                    )}
                    {msg.content && <p className="text-[14px] leading-relaxed break-words">{msg.content}</p>}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-surface-200">
        {file && (
          <div className="mb-3 p-2 bg-surface-50 border border-surface-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Paperclip className="w-4 h-4 text-primary-500 shrink-0" />
              <span className="text-xs font-medium text-ink-600 truncate">{file.name}</span>
            </div>
            <button onClick={removeFile} className="text-red-500 text-xs font-bold px-2 hover:bg-red-50 rounded p-1 shrink-0">
              Remove
            </button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-ink-400 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-surface-50 border border-surface-200 text-ink-800 text-[14px] rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
          />
          
          <button
            type="submit"
            disabled={(!newMessage.trim() && !file) || isUploading}
            className={`p-3 rounded-full shrink-0 flex items-center justify-center transition-all ${
              (!newMessage.trim() && !file) || isUploading
                ? 'bg-surface-200 text-ink-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
