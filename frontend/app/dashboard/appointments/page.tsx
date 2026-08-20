'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, Video, MessageSquare, X, Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import { appointmentsApi } from '@/lib/api'
import type { Appointment, Doctor } from '@/lib/api'
import dynamic from 'next/dynamic'
import ChatPanel from '@/components/ChatPanel'
const VideoConsultation = dynamic(() => import('@/components/VideoConsultation'), {
  ssr: false,
})
import PreCheckFormModal from '@/components/PreCheckFormModal'
import { ClipboardList } from 'lucide-react'

type Tab = 'upcoming' | 'past' | 'cancelled'

const MOCK_DOCTOR: Doctor = {
  _id: '1', name: 'Dr. Sarah Mitchell', specialty: 'Cardiologist', city: 'New York',
  rating: 4.9, reviewCount: 312, fee: 120, availableSlots: 5, isOnline: true, isVerified: true, experience: 12,
}

const MOCK_APPOINTMENTS: Appointment[] = [] // Removed mocks due to structure change, relies entirely on API now.

export default function AppointmentsPage() {
  const [tab, setTab] = useState<'WAITING' | 'COMPLETED' | 'CANCELLED'>('WAITING')
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS)
  const [isLoading, setIsLoading] = useState(false)
  const [chatDoctor, setChatDoctor] = useState<Doctor | null>(null)
  const [chatRoomId, setChatRoomId] = useState('')
  const [videoDoctor, setVideoDoctor] = useState<Doctor | null>(null)
  const [videoRoomId, setVideoRoomId] = useState('')
  const [preCheckAppointmentId, setPreCheckAppointmentId] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    appointmentsApi.getAll()
      .then((res) => setAppointments(res.data.data))
      .catch(() => setAppointments(MOCK_APPOINTMENTS))
      .finally(() => setIsLoading(false))
  }, [])

  const tabs = [
    { key: 'WAITING', label: 'Upcoming', count: appointments.filter((a) => ['WAITING', 'IN_PROGRESS', 'PENDING'].includes(a.status)).length },
    { key: 'COMPLETED', label: 'Completed', count: appointments.filter((a) => a.status === 'COMPLETED').length },
    { key: 'CANCELLED', label: 'Cancelled', count: appointments.filter((a) => a.status === 'CANCELLED' || a.status === 'REJECTED').length },
  ] as const

  const filtered = appointments.filter((a) => {
    if (tab === 'WAITING') return ['WAITING', 'IN_PROGRESS', 'PENDING'].includes(a.status)
    if (tab === 'COMPLETED') return a.status === 'COMPLETED'
    return a.status === 'CANCELLED' || a.status === 'REJECTED'
  })

  async function handleCancel(id: string) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    try {
      await appointmentsApi.cancel(id)
      setAppointments((prev) => prev.map((a) => a._id === id ? { ...a, status: 'CANCELLED' } : a))
    } catch {
      setAppointments((prev) => prev.map((a) => a._id === id ? { ...a, status: 'CANCELLED' } : a))
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl">My Appointments</h1>
          <p className="section-subtitle">Manage your consultation schedule</p>
        </div>
        <Link href="/dashboard/doctors" className="btn-primary flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-glow-indigo">
          <Plus className="w-4 h-4" /> Book New
        </Link>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-ink-50 border border-ink-100 rounded-xl p-1.5 shadow-inner-soft">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === key 
                ? 'bg-white text-primary-700 shadow-sm border border-ink-100/50' 
                : 'text-ink-500 hover:text-ink-700 hover:bg-ink-100/50'
            }`}
          >
            {label}
            <span className={`text-xs px-2 py-0.5 rounded-full ${tab === key ? 'bg-primary-50 text-primary-700' : 'bg-ink-100 text-ink-500'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Appointment list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          {filtered.length === 0 ? (
            <div className="premium-card p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-ink-50 rounded-2xl flex items-center justify-center mb-4 border border-ink-100">
                <Calendar className="w-8 h-8 text-ink-300" />
              </div>
              <p className="text-ink-600 font-semibold text-lg">No {tab} appointments</p>
              <p className="text-ink-400 text-sm mt-1">You're all caught up for now.</p>
              {tab === 'upcoming' && (
                <Link href="/dashboard/doctors" className="btn-primary mt-6 inline-flex items-center gap-2 text-sm shadow-sm">
                  <Plus className="w-4 h-4" /> Book Appointment
                </Link>
              )}
            </div>
          ) : (
            filtered.map((appt, idx) => {
              const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.doctor.name)}&background=4F46E5&color=fff&size=64`
              return (
                <motion.div
                  key={appt.id || appt._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className="premium-card p-5 lg:p-6"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    <img src={avatarUrl} alt={appt.doctor.name} className="w-16 h-16 rounded-xl border border-primary-100 shrink-0 shadow-sm" />
                    
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="font-bold text-ink-700 text-lg leading-tight">{appt.doctor.name}</h3>
                          <p className="text-sm font-medium text-primary-600 mt-0.5">{appt.doctor.specialty}</p>
                        </div>
                        <span className={
                          ['WAITING', 'IN_PROGRESS'].includes(appt.status) ? 'badge-primary' :
                          appt.status === 'PENDING' ? 'bg-gold-50 text-gold-700 border border-gold-200 px-2.5 py-0.5 rounded-full text-xs font-bold' :
                          appt.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'
                        }>
                          {appt.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 text-sm font-medium text-ink-500">
                        <span className="flex items-center gap-2 font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">
                          Token #{appt.tokenNumber}
                        </span>
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-ink-400" />
                          {new Date(appt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-ink-400" />
                          {appt.session?.sessionType} Session
                        </span>
                        <span className="flex items-center gap-2">
                          {appt.type === 'video' ? (
                            <><Video className="w-4 h-4 text-accent-500" /> <span className="text-accent-600">Video Consultation</span></>
                          ) : (
                            <><MapPin className="w-4 h-4 text-electric-500" /> <span className="text-electric-600">In-Person</span></>
                          )}
                        </span>
                      </div>

                      {appt.notes && (
                        <div className="mt-4 p-3 bg-ink-50 rounded-lg border border-ink-100">
                          <p className="text-sm text-ink-600 italic">&quot;{appt.notes}&quot;</p>
                        </div>
                      )}

                      {appt.prescription && (
                        <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-emerald-600" />
                            <h4 className="font-bold text-emerald-800">Digital Prescription Available</h4>
                          </div>
                          <div className="text-sm text-emerald-700 bg-white p-4 rounded-lg border border-emerald-200 shadow-sm font-mono whitespace-pre-wrap mt-3">
                            {appt.prescription.digitalText}
                          </div>
                          {appt.prescription.imageUrl && (
                            <a 
                              href={`http://localhost:5000${appt.prescription.imageUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm mt-3 hover:underline"
                            >
                              <FileText className="w-4 h-4" /> View Original Handwritten Image
                            </a>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      {(appt.status === 'WAITING' || appt.status === 'IN_PROGRESS') && (
                        <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-ink-100">
                          <Link
                            href={`/dashboard/appointments/queue?id=${appt.id || appt._id}`}
                            className="btn-primary flex items-center gap-2 text-sm py-2 px-4 bg-primary-600 text-white"
                          >
                            <Clock className="w-4 h-4" /> Live Queue Tracker
                          </Link>
                          
                          <button
                            onClick={() => setPreCheckAppointmentId(appt.id || appt._id)}
                            className="btn-secondary flex items-center gap-2 text-sm py-2 px-4 bg-white border border-primary-200 text-primary-700 hover:bg-primary-50"
                          >
                            <ClipboardList className="w-4 h-4" /> Fill Pre-Check
                          </button>
                          
                          <button
                            onClick={() => { setChatDoctor(appt.doctor); setChatRoomId(appt.id || appt._id || '') }}
                            className="btn-secondary flex items-center gap-2 text-sm py-2 px-4 bg-white"
                          >
                            <MessageSquare className="w-4 h-4" /> Message
                          </button>
                          
                          {appt.status === 'IN_PROGRESS' && appt.type === 'video' && (
                            <button
                              onClick={() => { setVideoDoctor(appt.doctor); setVideoRoomId(appt.roomId || `video-${appt._id}`) }}
                              className="btn-primary flex items-center gap-2 text-sm py-2 px-4 shadow-sm shadow-glow-indigo bg-gradient-to-r from-primary-600 to-accent-600 text-white border-0"
                            >
                              <Video className="w-4 h-4" /> Join Video Call
                            </button>
                          )}
                          <button
                            onClick={() => handleCancel(appt.id || appt._id)}
                            className="text-red-500 hover:text-red-700 text-sm font-semibold px-4 ml-auto"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </AnimatePresence>

      {/* Chat panel */}
      <ChatPanel
        isOpen={!!chatDoctor}
        onClose={() => setChatDoctor(null)}
        doctor={chatDoctor}
        roomId={chatRoomId}
      />

      {/* Video consultation */}
      <VideoConsultation
        isOpen={!!videoDoctor}
        onClose={() => setVideoDoctor(null)}
        doctor={videoDoctor}
        roomId={videoRoomId}
      />

      {/* Pre-Check Form */}
      <PreCheckFormModal
        isOpen={!!preCheckAppointmentId}
        onClose={() => setPreCheckAppointmentId(null)}
        appointmentId={preCheckAppointmentId || ''}
      />
    </div>
  )
}
