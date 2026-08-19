'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Users, CheckCircle, Loader2, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import type { Doctor, DoctorSession } from '@/lib/api'
import { appointmentsApi, doctorsApi } from '@/lib/api'
import PreCheckFormModal from '@/components/PreCheckFormModal'

interface BookingDrawerProps {
  doctor: Doctor | null
  isOpen: boolean
  onClose: () => void
  onBooked?: () => void
}

function getDatesForWeek(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export default function BookingDrawer({ doctor, isOpen, onClose, onBooked }: BookingDrawerProps) {
  const router = useRouter()
  const [weekStart, setWeekStart] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSession, setSelectedSession] = useState<DoctorSession | null>(null)
  const [sessions, setSessions] = useState<DoctorSession[]>([])
  const [notes, setNotes] = useState('')
  const [appointmentType, setAppointmentType] = useState<'video' | 'in-person'>('video')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select')
  const [bookedAppointmentId, setBookedAppointmentId] = useState<string | null>(null)
  const [showPreCheck, setShowPreCheck] = useState(false)

  const dates = getDatesForWeek(weekStart)

  useEffect(() => {
    if (isOpen) {
      setStep('select')
      setSelectedDate(null)
      setSelectedSession(null)
      setNotes('')
      setBookedAppointmentId(null)
      setShowPreCheck(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!selectedDate || !doctor) return
    setIsLoading(true)
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    doctorsApi.getAvailableSessions(doctor.id || doctor._id, dateStr)
      .then((res) => {
        setSessions(res.data.data)
      })
      .catch(() => setSessions([]))
      .finally(() => setIsLoading(false))
  }, [selectedDate, doctor])

  async function handleConfirm() {
    if (!doctor || !selectedDate || !selectedSession) return
    setIsLoading(true)
    try {
      const doctorId = doctor.id || doctor._id;
      const res = await appointmentsApi.create({
        doctorId: doctorId!,
        sessionId: selectedSession.id,
        notes,
        type: appointmentType,
      })
      const newId = (res.data?.data?.id || res.data?.id || res.data?.appointment?.id || null)
      setBookedAppointmentId(newId)
      setStep('success')
      onBooked?.()
    } catch (err: any) {
      alert(err.response?.data?.error || "Error booking appointment")
    } finally {
      setIsLoading(false)
    }
  }

  if (!doctor) return null

  const avatarUrl = doctor.profileImage || doctor.imageUrl || doctor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=1E40AF&color=fff&size=128`

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-white/10 rounded-t-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="px-5 pb-8 max-w-2xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <h2 className="text-lg font-bold text-white">Join Queue</h2>
                <button onClick={onClose} className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Doctor info */}
              <div className="flex items-center gap-3 py-4 border-b border-white/5">
                <img src={avatarUrl} alt={doctor.name} className="w-12 h-12 rounded-xl border border-primary-500/30" />
                <div>
                  <p className="font-semibold text-white">{doctor.name}</p>
                  <p className="text-sm text-primary-400">{doctor.specialty}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-white">₹{doctor.fee}</p>
                  <p className="text-xs text-slate-400">Doctor fee + ₹10 profile fee</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step === 'select' && (
                  <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Appointment type */}
                    <div className="py-4">
                      <p className="text-sm font-semibold text-slate-300 mb-3">Appointment Type</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(['video', 'in-person'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setAppointmentType(type)}
                            className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                              appointmentType === type
                                ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            {type === 'video' ? '📹 Video Call' : '🏥 In-Person'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date selector */}
                    <div className="py-4 border-t border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-slate-300">Select Date</p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }}
                            className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-slate-400"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }}
                            className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-slate-400"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {dates.map((date) => {
                          const isSelected = selectedDate?.toDateString() === date.toDateString()
                          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
                          const isToday = date.toDateString() === new Date().toDateString()
                          return (
                            <button
                              key={date.toISOString()}
                              disabled={isPast}
                              onClick={() => { setSelectedDate(date); setSelectedSession(null) }}
                              className={`flex flex-col items-center py-2.5 px-1 rounded-xl text-xs transition-all ${
                                isSelected
                                  ? 'bg-primary-600 border border-primary-500 text-white shadow-lg shadow-primary-500/30'
                                  : isPast
                                  ? 'opacity-30 cursor-not-allowed text-slate-600'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-transparent'
                              }`}
                            >
                              <span className="font-medium text-[10px] uppercase tracking-wide">
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                              <span className={`text-sm font-bold mt-0.5 ${isToday && !isSelected ? 'text-primary-400' : ''}`}>
                                {date.getDate()}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Token Sessions */}
                    {selectedDate && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-4 border-t border-white/5">
                        <p className="text-sm font-semibold text-slate-300 mb-3">
                          Available Sessions — {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        {isLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                          </div>
                        ) : sessions.length === 0 ? (
                          <div className="text-center py-6 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-slate-400 text-sm">No sessions available on this date.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {sessions.map((session) => {
                              const isAvailable = session.bookedTokens < session.maxTokens;
                              const isSelected = selectedSession?.id === session.id;

                              return (
                                <button
                                  key={session.id}
                                  disabled={!isAvailable}
                                  onClick={() => setSelectedSession(session)}
                                  className={`text-left p-4 rounded-xl border transition-all ${
                                    !isAvailable
                                      ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/5'
                                      : isSelected
                                      ? 'bg-primary-600/20 border-primary-500 text-white'
                                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${session.sessionType === 'MORNING' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                                      {session.sessionType}
                                    </span>
                                    {!isAvailable && <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Full</span>}
                                  </div>
                                  <p className="font-bold text-sm mb-1 flex items-center">
                                    <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                    {session.startTime} - {session.endTime}
                                  </p>
                                  <p className="text-xs text-slate-400 flex items-center">
                                    <Users className="w-3 h-3 mr-1.5 opacity-70" />
                                    {session.bookedTokens} / {session.maxTokens} Tokens Booked
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Notes */}
                    {selectedSession && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-4 border-t border-white/5">
                        <label className="text-sm font-semibold text-slate-300 mb-2 block">Notes (optional)</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Describe your symptoms or reason for visit..."
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                        />
                      </motion.div>
                    )}

                    {/* CTA */}
                    {appointmentType === 'in-person' ? (
                      <button
                        onClick={handleConfirm}
                        disabled={!selectedDate || !selectedSession || isLoading}
                        className="w-full py-4 mt-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Booking...</> : 'Book Appointment'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setStep('confirm')}
                        disabled={!selectedDate || !selectedSession}
                        className="w-full py-4 mt-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue to Confirm
                      </button>
                    )}
                  </motion.div>
                )}

                {step === 'confirm' && (
                  <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                    <div className="py-5 space-y-4">
                      <h3 className="text-base font-bold text-white">Confirm Your Queue Position</h3>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                        {[
                          { label: 'Doctor', value: doctor.name },
                          { label: 'Specialty', value: doctor.specialty },
                          { label: 'Date', value: selectedDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || '' },
                          { label: 'Session', value: `${selectedSession?.sessionType} (${selectedSession?.startTime} - ${selectedSession?.endTime})` },
                          { label: 'Queue Token', value: `Wait for Next Available Token` },
                          { label: 'Type', value: appointmentType === 'video' ? 'Video Consultation' : 'In-Person Visit' },
                          { label: 'Doctor Consultation Fee', value: `₹${doctor.fee}` },
                          { label: 'Patient Profile Fee', value: `₹10` },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between text-sm">
                            <span className="text-slate-400">{label}</span>
                            <span className="text-white font-bold">{value}</span>
                          </div>
                        ))}
                        <div className="pt-2 mt-2 border-t border-white/10 flex justify-between text-base">
                          <span className="text-primary-300 font-bold">Total Amount</span>
                          <span className="text-emerald-400 font-extrabold text-lg">₹{(Number(doctor.fee) || 0) + 10}</span>
                        </div>
                      </div>
                      {notes && (
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Notes</p>
                          <p className="text-sm text-slate-300 bg-white/5 p-3 rounded-xl">{notes}</p>
                        </div>
                      )}
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setStep('select')} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20">Back</button>
                        <button onClick={handleConfirm} disabled={isLoading} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-500 flex items-center justify-center gap-2">
                          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : 'Confirm Token'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 flex flex-col items-center text-center"
                  >
                    <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mb-5">
                      <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Token Assigned!</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-sm leading-relaxed">
                      You are in the queue for <span className="text-white font-bold">{doctor.name}</span>'s session on {selectedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
                    </p>

                    {/* Pre-check prompt */}
                    <div className="w-full max-w-xs mb-4 p-4 rounded-2xl bg-primary-600/20 border border-primary-500/30 text-left">
                      <p className="text-sm font-bold text-primary-300 mb-1">📋 Save the doctor's time!</p>
                      <p className="text-xs text-slate-400 leading-relaxed">Fill in your symptoms and vitals so your doctor can review them before the appointment.</p>
                    </div>

                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      {bookedAppointmentId && (
                        <button
                          onClick={() => setShowPreCheck(true)}
                          className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                          📋 Fill Pre-Check Form Now
                        </button>
                      )}
                      <button
                        onClick={() => { onClose(); router.push('/dashboard/appointments'); }}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                      >
                        Go to Live Queue Tracker
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Pre-Check Modal - rendered outside the drawer AnimatePresence */}
    {bookedAppointmentId && (
      <PreCheckFormModal
        isOpen={showPreCheck}
        onClose={() => {
          setShowPreCheck(false)
          onClose()
          router.push('/dashboard/appointments')
        }}
        appointmentId={bookedAppointmentId}
      />
    )}
    </>
  )
}
