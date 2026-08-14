'use client';

import { useDoctorAuth } from '@/contexts/DoctorAuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiClock, FiVideo, FiCheckCircle, FiChevronRight } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { DoctorSession } from '@/lib/api';

const VideoConsultation = dynamic(() => import('@/components/VideoConsultation'), {
  ssr: false,
});

interface SessionWithAppointments extends DoctorSession {
  appointments: any[];
}

export default function QueueManager() {
  const { doctor, loading } = useDoctorAuth();
  const [sessions, setSessions] = useState<SessionWithAppointments[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentVideoRoomId, setCurrentVideoRoomId] = useState('');

  useEffect(() => {
    if (doctor) fetchSessions();
  }, [doctor]);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/appointments/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Filter sessions for today (using local date string matching)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();
      
      const todaysSessions = (res.data || []).filter((s: any) => {
        const [year, month, day] = s.date.split('T')[0].split('-');
        return parseInt(year) === currentYear && parseInt(month) - 1 === currentMonth && parseInt(day) === currentDay;
      });
      setSessions(todaysSessions);
      if (todaysSessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(todaysSessions[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const performQueueAction = async (action: string, tokenNumber?: number) => {
    if (!selectedSessionId) return;
    setIsCallingNext(true);
    try {
      const token = localStorage.getItem('doctorToken');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/appointments/sessions/${selectedSessionId}/action`,
        { action, tokenNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchSessions(); // Refresh queue
    } catch (err: any) {
      alert(err.response?.data?.error || `Error performing ${action}`);
    } finally {
      setIsCallingNext(false);
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activeSession = sessions.find(s => s.id === selectedSessionId);
  const nextTokenAppointment = activeSession?.appointments.find(a => a.tokenNumber === activeSession.currentToken + 1);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-700 tracking-tight">Live Queue Manager</h1>
          <p className="text-[15px] text-ink-400">Manage today's patient tokens and waitlist.</p>
        </div>
        <div className="bg-primary-50 px-4 py-2 rounded-xl text-primary-700 font-bold border border-primary-100 flex items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-500 mr-2 animate-pulse" />
          Live
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: Today's Sessions */}
        <div className="space-y-4">
          <h3 className="font-bold text-ink-600 pl-1">Today's Sessions</h3>
          {sessions.length === 0 ? (
            <div className="premium-card text-center py-8">
              <p className="text-ink-400 text-sm">No sessions scheduled for today.</p>
            </div>
          ) : (
            sessions.map(session => (
              <button key={session.id} 
                onClick={() => setSelectedSessionId(session.id)}
                className={`w-full text-left premium-card transition-all !p-5 ${selectedSessionId === session.id ? 'ring-2 ring-primary-500 shadow-md shadow-primary-500/20' : 'hover:bg-surface-50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${session.sessionType === 'MORNING' ? 'bg-gold-100 text-gold-700' : 'bg-accent-100 text-accent-700'}`}>
                    {session.sessionType}
                  </span>
                  <span className="text-xs font-bold text-ink-400 bg-surface-100 px-2 py-1 rounded-md">
                    {session.appointments.length} Patients
                  </span>
                </div>
                <div className="font-semibold text-ink-700 flex items-center text-sm">
                  <FiClock className="mr-1.5 text-ink-400" />
                  {session.startTime} - {session.endTime}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Main Queue View */}
        <div className="lg:col-span-2">
          {!activeSession ? (
            <div className="premium-card flex flex-col items-center justify-center h-[400px]">
              <FiUsers className="w-12 h-12 text-surface-300 mb-4" />
              <p className="text-ink-500 font-medium">Select a session to manage its queue</p>
            </div>
          ) : (
            <div className="premium-card !p-0 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-extrabold mb-1">Currently Serving</h2>
                    <div className="text-5xl font-black tracking-tighter">
                      {activeSession.currentToken === 0 ? '--' : `#${activeSession.currentToken}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-100 font-medium mb-1">Up Next</p>
                    <div className="text-2xl font-bold opacity-90">
                      {nextTokenAppointment ? `#${nextTokenAppointment.tokenNumber}` : 'No one'}
                    </div>
                  </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-black/10 rounded-full blur-xl" />
              </div>

              <div className="p-6">
                <div className="flex gap-3">
                  <button 
                    onClick={() => performQueueAction('CALL_NEXT')}
                    disabled={!nextTokenAppointment || isCallingNext}
                    className={`flex-1 py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center shadow-lg transition-all ${!nextTokenAppointment ? 'bg-surface-100 text-surface-400 cursor-not-allowed shadow-none' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/30'}`}>
                    {isCallingNext ? 'Calling...' : 'Call Next'}
                    <FiChevronRight className="ml-2 w-6 h-6" />
                  </button>
                </div>

                <div className="mt-8 space-y-4">
                  <h4 className="font-bold text-ink-600 flex items-center">
                    <FiUsers className="mr-2" />
                    Waiting List
                  </h4>
                  
                  <div className="space-y-3">
                    {activeSession.appointments.map(appt => {
                      const isWaiting = appt.tokenNumber > activeSession.currentToken;
                      const isServing = appt.tokenNumber === activeSession.currentToken;
                      const isDone = appt.tokenNumber < activeSession.currentToken;
                      
                      return (
                        <div key={appt.id} className={`flex items-center p-4 rounded-2xl border ${isServing ? 'border-primary-300 bg-primary-50 ring-1 ring-primary-500' : isDone ? 'border-surface-200 bg-surface-50 opacity-60' : 'border-surface-200 bg-white'}`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg mr-4 ${isServing ? 'bg-primary-600 text-white' : isDone ? 'bg-surface-200 text-surface-500' : 'bg-accent-100 text-accent-700'}`}>
                            #{appt.tokenNumber}
                          </div>
                          <div className="flex-1">
                            <p className={`font-bold ${isServing ? 'text-primary-900' : 'text-ink-700'}`}>
                              Patient ID: {appt.patientId.substring(0, 8)}
                            </p>
                            <p className="text-xs text-ink-500 font-medium flex items-center mt-0.5">
                              {appt.type === 'video' ? <FiVideo className="mr-1" /> : <FiUsers className="mr-1" />}
                              {appt.type.toUpperCase()} • {appt.status}
                            </p>
                          </div>
                          <div className="flex flex-col items-end justify-center gap-2">
                            {appt.status === 'CALLED' && <span className="text-xs font-bold bg-gold-100 text-gold-700 px-2 py-1 rounded-md">Called</span>}
                            {appt.status === 'IN_CONSULTATION' && <span className="text-xs font-bold bg-primary-200 text-primary-800 px-2 py-1 rounded-md">Serving</span>}
                            {appt.status === 'COMPLETED' && <FiCheckCircle className="text-green-500 w-6 h-6" />}
                            {appt.status === 'NO_SHOW' && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-md">No Show</span>}
                            
                            <div className="flex gap-2">
                              {appt.status === 'CALLED' && (
                                <button onClick={() => performQueueAction('START', appt.tokenNumber)} className="text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg shadow-md transition-colors">
                                  Start
                                </button>
                              )}
                              {appt.status === 'IN_CONSULTATION' && (
                                <button onClick={() => performQueueAction('COMPLETE', appt.tokenNumber)} className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg shadow-md transition-colors">
                                  Complete
                                </button>
                              )}
                              {(appt.status === 'WAITING' || appt.status === 'CALLED') && (
                                <button onClick={() => performQueueAction('SKIP', appt.tokenNumber)} className="text-xs font-bold bg-surface-200 hover:bg-surface-300 text-ink-600 px-3 py-1.5 rounded-lg transition-colors">
                                  Skip
                                </button>
                              )}
                              {appt.status === 'IN_CONSULTATION' && appt.type === 'video' && (
                                <button 
                                  onClick={() => {
                                    setCurrentVideoRoomId(appt.id);
                                    setIsVideoOpen(true);
                                  }}
                                  className="text-xs font-bold bg-electric-500 hover:bg-electric-600 text-white px-3 py-1.5 rounded-lg flex items-center shadow-md transition-colors"
                                >
                                  <FiVideo className="mr-1.5" /> Call
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {activeSession.appointments.length === 0 && (
                      <p className="text-sm text-ink-400 text-center py-4">No appointments booked yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <VideoConsultation 
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        doctor={doctor}
        roomId={currentVideoRoomId}
      />
    </div>
  );
}
