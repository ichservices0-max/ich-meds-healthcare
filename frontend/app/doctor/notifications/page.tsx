'use client';

import { useDoctorAuth } from '@/contexts/DoctorAuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiBell, FiCalendar, FiCheckCircle, FiXCircle, FiUser, FiStar, FiShield, FiTrash2 } from 'react-icons/fi';

const NOTIFICATION_ICONS: Record<string, any> = {
  APPOINTMENT_REQUEST: FiCalendar,
  APPOINTMENT_CONFIRMED: FiCheckCircle,
  APPOINTMENT_CANCELLED: FiXCircle,
  APPOINTMENT_REMINDER: FiBell,
  NEW_REVIEW: FiStar,
  VERIFICATION_UPDATE: FiShield,
  DEFAULT: FiBell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  APPOINTMENT_REQUEST: 'bg-blue-100 text-blue-600',
  APPOINTMENT_CONFIRMED: 'bg-green-100 text-green-600',
  APPOINTMENT_CANCELLED: 'bg-red-100 text-red-600',
  APPOINTMENT_REMINDER: 'bg-amber-100 text-amber-600',
  NEW_REVIEW: 'bg-purple-100 text-purple-600',
  VERIFICATION_UPDATE: 'bg-teal-100 text-teal-600',
  DEFAULT: 'bg-slate-100 text-slate-600',
};

export default function DoctorNotifications() {
  const { doctor, loading } = useDoctorAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  useEffect(() => {
    if (doctor) fetchNotifications();
  }, [doctor]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/doctor`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(res.data);
    } catch {
      // If endpoint not available yet, show sample notifications
      setNotifications([
        { id: '1', type: 'APPOINTMENT_REQUEST', title: 'New Appointment Request', body: 'Alex Johnson has requested an appointment for tomorrow at 10:00 AM.', isRead: false, createdAt: new Date().toISOString() },
        { id: '2', type: 'VERIFICATION_UPDATE', title: 'Verification In Progress', body: 'Your documents are currently under review by our team.', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', type: 'NEW_REVIEW', title: 'New Patient Review', body: 'A patient left you a 5-star review. Check your reviews page!', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '4', type: 'APPOINTMENT_CONFIRMED', title: 'Appointment Confirmed', body: 'Your appointment with Sarah M. on Monday at 3 PM is confirmed.', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
      ]);
    } finally {
      setIsFetching(false);
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const displayed = filter === 'UNREAD' ? notifications.filter(n => !n.isRead) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading || isFetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-1">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-blue-600 hover:underline font-medium">
              Mark all as read
            </button>
          )}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {(['ALL', 'UNREAD'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {displayed.length === 0 ? (
          <div className="p-16 text-center">
            <FiBell className="mx-auto text-slate-300 mb-3" size={48} />
            <p className="text-slate-500 font-medium">No notifications</p>
            <p className="text-sm text-slate-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {displayed.map((notif, i) => {
              const IconComp = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.DEFAULT;
              const colorClass = NOTIFICATION_COLORS[notif.type] || NOTIFICATION_COLORS.DEFAULT;
              return (
                <motion.div key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => markRead(notif.id)}
                  className={`flex items-start p-5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-4 ${colorClass}`}>
                    <IconComp size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className={`font-semibold text-sm ${!notif.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {notif.title}
                        {!notif.isRead && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" />}
                      </p>
                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                        className="ml-3 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{notif.body}</p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {new Date(notif.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
