'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Calendar, MessageSquare, Clock, Settings, Check, CheckCheck, Trash2 } from 'lucide-react'
import { notificationsApi } from '@/lib/api'
import type { Notification } from '@/lib/api'

const MOCK_NOTIFICATIONS: Notification[] = [
  { _id: 'n1', title: 'Appointment Reminder', message: 'Your appointment with Dr. Sarah Mitchell is tomorrow at 10:00 AM. Please be ready 5 minutes early.', type: 'appointment', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: 'n2', title: 'New Message', message: 'Dr. James Chen sent you a message regarding your last neurological visit and follow-up prescription.', type: 'message', isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { _id: 'n3', title: 'Lab Results Ready', message: 'Your CBC blood test results from June 15 are now available in your Medical Records vault.', type: 'reminder', isRead: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: 'n4', title: 'Appointment Completed', message: 'Your video consultation with Dr. Priya Sharma has been marked as completed. Please leave a review.', type: 'appointment', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { _id: 'n5', title: 'System Update', message: 'ICH Meds portal has been updated with new features including improved video calling and record management.', type: 'system', isRead: true, createdAt: new Date(Date.now() - 259200000).toISOString() },
  { _id: 'n6', title: 'Prescription Reminder', message: "Don't forget to take your prescribed medication. You have a refill due next week.", type: 'reminder', isRead: true, createdAt: new Date(Date.now() - 345600000).toISOString() },
]

const TYPE_META: Record<Notification['type'], { icon: React.ElementType; color: string; bg: string }> = {
  appointment: { icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50 border-primary-100' },
  message: { icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  reminder: { icon: Clock, color: 'text-gold-600', bg: 'bg-gold-50 border-gold-100' },
  system: { icon: Settings, color: 'text-ink-500', bg: 'bg-ink-50 border-ink-100' },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    setIsLoading(true)
    notificationsApi.getAll()
      .then((res) => setNotifications(res.data.data))
      .catch(() => setNotifications(MOCK_NOTIFICATIONS))
      .finally(() => setIsLoading(false))
  }, [])

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n))
    try { await notificationsApi.markRead(id) } catch { /* demo */ }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try { await notificationsApi.markAllRead() } catch { /* demo */ }
  }

  function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n._id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="section-title text-2xl mb-0">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-red-50 text-red-600 border border-red-200 text-[11px] uppercase tracking-wider font-bold rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="section-subtitle mt-1">Stay up to date with your ICH Meds activities</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="btn-secondary bg-white text-sm py-2 px-4 shadow-sm flex items-center justify-center gap-2"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </motion.div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              filter === f 
                ? 'bg-ink-700 border-ink-700 text-white shadow-sm' 
                : 'bg-white border-ink-200 text-ink-600 hover:text-ink-800 hover:bg-ink-50 hover:border-ink-300'
            }`}
          >
            {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-4 mt-4">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="premium-card p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-ink-50 border border-ink-100 rounded-2xl flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-ink-300" />
              </div>
              <p className="text-ink-700 text-lg font-bold">No {filter === 'unread' ? 'unread ' : ''}notifications</p>
              <p className="text-ink-500 text-sm mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            filtered.map((notif, idx) => {
              const meta = TYPE_META[notif.type as keyof typeof TYPE_META] || TYPE_META['system']
              const Icon = meta.icon || Bell
              return (
                <motion.div
                  key={notif.id || notif._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`premium-card p-5 flex items-start gap-4 transition-all cursor-pointer group ${
                    !notif.isRead ? 'border-primary-200 bg-primary-50/40 shadow-sm' : 'hover:border-ink-200 hover:bg-ink-50/50'
                  }`}
                  onClick={() => !notif.isRead && markRead(notif._id)}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${meta.bg}`}>
                    <Icon className={`w-6 h-6 ${meta.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[15px] font-bold ${notif.isRead ? 'text-ink-600' : 'text-ink-800'}`}>
                        {notif.title}
                        {!notif.isRead && (
                          <span className="ml-2 inline-block w-2 h-2 bg-primary-500 rounded-full" />
                        )}
                      </p>
                      <span className="text-[11px] font-medium text-ink-400 shrink-0 uppercase tracking-wider">{relativeTime(notif.createdAt)}</span>
                    </div>
                    <p className={`text-sm mt-1 leading-relaxed ${notif.isRead ? 'text-ink-500' : 'text-ink-600 font-medium'}`}>{notif.message}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(notif._id) }}
                        className="w-8 h-8 bg-white border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 rounded-xl flex items-center justify-center text-emerald-500 transition-all shadow-sm"
                        title="Mark as read"
                      >
                        <Check className="w-4.5 h-4.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id) }}
                      className="w-8 h-8 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-xl flex items-center justify-center text-red-500 transition-all shadow-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
