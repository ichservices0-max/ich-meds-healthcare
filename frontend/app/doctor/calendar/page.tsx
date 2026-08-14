'use client';

import { useDoctorAuth } from '@/contexts/DoctorAuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiPlus, FiX, FiClock, FiUsers } from 'react-icons/fi';
import { DoctorSession } from '@/lib/api';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DoctorCalendar() {
  const { doctor, loading } = useDoctorAuth();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate());
  const [sessions, setSessions] = useState<DoctorSession[]>([]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState({
    sessionType: 'MORNING',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    maxTokens: '20'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (doctor) fetchSessions();
  }, [doctor, currentMonth, currentYear]);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/appointments/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSessions(res.data || []);
    } catch {
      setSessions([]);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const isToday = (day: number) => day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  const isPastDate = (day: number) => new Date(currentYear, currentMonth, day, 23, 59, 59) < new Date();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const selectedDateSessions = sessions.filter(s => {
    if (!selectedDate) return false;
    const [year, month, day] = s.date.split('T')[0].split('-');
    return parseInt(day) === selectedDate && parseInt(month) - 1 === currentMonth && parseInt(year) === currentYear;
  });

  const addSession = async () => {
    if (!selectedDate) return;
    setIsSaving(true);
    
    // YYYY-MM-DD format
    const targetDate = new Date(currentYear, currentMonth, selectedDate);
    
    if (targetDate < new Date(today.setHours(0,0,0,0))) {
      alert("Cannot add a session in the past");
      setIsSaving(false);
      return;
    }

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;

    try {
      const token = localStorage.getItem('doctorToken');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/appointments/sessions`,
        { 
          date: dateStr, 
          sessionType: newSession.sessionType,
          startTime: newSession.startTime,
          endTime: newSession.endTime,
          maxTokens: newSession.maxTokens
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchSessions();
      setShowAddSession(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Error adding session");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-ink-700 tracking-tight">Availability Calendar</h1>
      <p className="text-[15px] text-ink-400">Define your morning and evening token sessions.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="premium-card overflow-hidden !p-0">
            {/* Header */}
            <div className="p-5 border-b border-surface-200 flex items-center justify-between bg-surface-50">
              <button onClick={prevMonth} className="p-2 hover:bg-surface-200 rounded-xl transition-colors">
                <FiChevronLeft size={20} />
              </button>
              <h2 className="font-bold text-ink-700 text-lg">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-surface-200 rounded-xl transition-colors">
                <FiChevronRight size={20} />
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 border-b border-surface-100 bg-surface-50">
              {DAYS.map(d => (
                <div key={d} className="py-3 text-center text-[11px] font-bold text-ink-400 uppercase tracking-wider">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 p-2 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const isSelected = selectedDate === day;
                const past = isPastDate(day);
                const todayFlag = isToday(day);
                const hasSession = sessions.some(s => new Date(s.date).getDate() === day && new Date(s.date).getMonth() === currentMonth);
                
                return (
                  <button key={day}
                    disabled={past}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square flex flex-col items-center justify-center text-sm transition-all rounded-xl relative w-full
                      ${isSelected ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 font-bold scale-105' :
                      past ? 'bg-surface-50 text-surface-300 cursor-not-allowed' :
                      todayFlag ? 'border-2 border-primary-400 font-bold text-primary-600 hover:bg-primary-50' :
                      'hover:bg-surface-100 text-ink-600'}`}>
                    {day}
                    {hasSession && !isSelected && (
                      <span className="absolute bottom-2 w-1.5 h-1.5 bg-accent-500 rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Session Management Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="premium-card flex flex-col h-full !p-0 overflow-hidden">
            <div className="p-6 border-b border-surface-100 bg-surface-50">
              <h3 className="font-bold text-ink-700 text-lg">
                {selectedDate ? `${MONTHS[currentMonth]} ${selectedDate}` : 'Select a date'}
              </h3>
              <p className="text-sm text-ink-400 mt-1">Manage token sessions</p>
            </div>

            <div className="p-6 space-y-4 flex-1 bg-white">
              {!selectedDate ? (
                <p className="text-sm text-ink-400 text-center py-8">Click a date to manage sessions</p>
              ) : (
                <>
                  {selectedDateSessions.length === 0 ? (
                    <p className="text-sm text-ink-400 text-center py-6">No sessions scheduled for this day.</p>
                  ) : (
                    selectedDateSessions.map(session => (
                      <div key={session.id} className="p-4 rounded-2xl border border-surface-200 bg-surface-50 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${session.sessionType === 'MORNING' ? 'bg-gold-100 text-gold-700' : 'bg-accent-100 text-accent-700'}`}>
                              {session.sessionType}
                            </span>
                            <div className="flex items-center text-sm font-semibold text-ink-700 mt-3">
                              <FiClock className="mr-2 text-ink-400" />
                              {session.startTime} – {session.endTime}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center text-xs font-medium text-ink-500 bg-white p-2 rounded-lg border border-surface-100">
                          <FiUsers className="mr-2 text-primary-500" />
                          Max Tokens: {session.maxTokens} | Serving: #{session.currentToken}
                        </div>
                      </div>
                    ))
                  )}

                  {!showAddSession ? (
                    <button onClick={() => setShowAddSession(true)}
                      className="w-full py-3.5 border-2 border-dashed border-surface-200 text-ink-500 rounded-2xl text-sm font-semibold hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center space-x-2">
                      <FiPlus size={18} />
                      <span>Create Session</span>
                    </button>
                  ) : (
                    <div className="border border-primary-200 rounded-2xl p-5 bg-primary-50 space-y-4">
                      <p className="text-sm font-bold text-ink-700">New Token Session</p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-ink-500 mb-1.5 block">Session Type</label>
                          <select value={newSession.sessionType}
                            onChange={(e) => setNewSession({...newSession, sessionType: e.target.value})}
                            className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-white text-ink-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                            <option value="MORNING">Morning Session</option>
                            <option value="EVENING">Evening Session</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">Start Time</label>
                            <input type="text" placeholder="e.g. 10:00 AM" value={newSession.startTime}
                              onChange={(e) => setNewSession({...newSession, startTime: e.target.value})}
                              className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-white text-ink-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-ink-500 mb-1.5 block">End Time</label>
                            <input type="text" placeholder="e.g. 01:00 PM" value={newSession.endTime}
                              onChange={(e) => setNewSession({...newSession, endTime: e.target.value})}
                              className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-white text-ink-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-ink-500 mb-1.5 block">Max Tokens (Patients)</label>
                          <input type="number" min="1" max="100" value={newSession.maxTokens}
                            onChange={(e) => setNewSession({...newSession, maxTokens: e.target.value})}
                            className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-white text-ink-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <button onClick={() => setShowAddSession(false)} className="flex-1 py-2.5 rounded-xl border border-surface-200 bg-white text-ink-600 text-sm font-semibold hover:bg-surface-50 transition-colors">Cancel</button>
                        <button onClick={addSession} disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-colors">
                          {isSaving ? 'Creating...' : 'Create'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
