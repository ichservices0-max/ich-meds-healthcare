'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiUsers, FiChevronRight, FiVideo, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import { Appointment } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Link from 'next/link';

interface LiveQueueTrackerProps {
  appointment: Appointment;
}

export default function LiveQueueTracker({ appointment }: LiveQueueTrackerProps) {
  const [currentToken, setCurrentToken] = useState(appointment.session?.currentToken || 0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const myToken = appointment.tokenNumber;
  const isMyTurn = currentToken === myToken;
  const isDone = currentToken > myToken;
  const tokensAhead = Math.max(0, myToken - currentToken - 1);
  const estimatedWaitMins = tokensAhead * 10; // Simple estimation: 10 mins per patient

  useEffect(() => {
    if (!appointment.session) return;
    
    const socket = getSocket();
    const sessionId = appointment.session.id;
    
    socket.emit('join-session', sessionId);
    
    const handleQueueUpdate = (data: { sessionId: string; currentToken: number }) => {
      if (data.sessionId === sessionId) {
        setCurrentToken(data.currentToken);
        setLastUpdate(new Date());
      }
    };
    
    socket.on('queue-updated', handleQueueUpdate);
    
    return () => {
      socket.off('queue-updated', handleQueueUpdate);
    };
  }, [appointment.session]);

  if (!appointment.session) return null;

  return (
    <div className="premium-card overflow-hidden !p-0">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white relative">
        {/* Animated background glow if it's your turn */}
        {isMyTurn && (
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-500/10 blur-xl"
          />
        )}
        
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <span className="bg-white/10 text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border border-white/20">
              Live Tracker
            </span>
            <h3 className="mt-3 text-xl font-bold">
              {appointment.doctor.name}
            </h3>
            <p className="text-slate-400 text-sm mt-0.5">
              {appointment.session.sessionType} Session
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Your Token</p>
            <div className="text-4xl font-black tabular-nums tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
              #{myToken}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-white">
        {isDone ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <FiCheckCircle className="w-12 h-12 text-green-500 mb-3" />
            <h4 className="text-lg font-bold text-ink-700">Appointment Completed</h4>
            <p className="text-sm text-ink-500 mt-1">Your turn has already passed.</p>
          </div>
        ) : isMyTurn ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-6 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 relative">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-green-200 rounded-full opacity-50 blur-md" />
              {appointment.type === 'video' ? <FiVideo className="w-8 h-8 text-green-600 relative z-10" /> : <FiMapPin className="w-8 h-8 text-green-600 relative z-10" />}
            </div>
            <h4 className="text-2xl font-black text-green-600 mb-1">It's Your Turn!</h4>
            <p className="text-sm text-ink-600 font-medium mb-6">The doctor is ready for you now.</p>
            
            {appointment.type === 'video' ? (
              <Link href={`/dashboard/consultations?room=${appointment.roomId || appointment.id}`} className="btn-primary w-full animate-pulse shadow-green-500/30">
                Join Video Call
              </Link>
            ) : (
              <div className="w-full p-4 bg-surface-50 rounded-xl border border-surface-200">
                <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Clinic Room</p>
                <p className="text-lg font-bold text-ink-800">Please proceed to Cabin 4</p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1">Currently Serving</p>
                <div className="flex items-center">
                  <div className="text-3xl font-black text-ink-800 tabular-nums">#{currentToken || '--'}</div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1">Est. Wait</p>
                <div className="flex items-center justify-end text-ink-800 font-bold">
                  <FiClock className="text-primary-500 mr-1.5" />
                  {currentToken === 0 ? 'Not started' : `~${estimatedWaitMins} mins`}
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary-500" 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(5, (currentToken / myToken) * 100))}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs font-semibold text-ink-400">
                <span>{tokensAhead} {tokensAhead === 1 ? 'person' : 'people'} ahead of you</span>
                <span>Updated just now</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-surface-100">
              <p className="text-sm font-medium text-ink-600 flex items-center">
                <FiUsers className="mr-2 text-ink-400" />
                Please arrive at the clinic at least 15 mins early.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
