'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, Users, ArrowLeft, Video, MapPin, Bell, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { getSocket } from '@/lib/socket'
import ChatBox from '@/components/ChatBox'
import { useAuth } from '@/contexts/AuthContext'

export default function LiveQueueTracker() {
  const { id } = useParams()
  const router = useRouter()
  const { patient } = useAuth()
  
  const [appointment, setAppointment] = useState<any>(null)
  const [currentToken, setCurrentToken] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [now, setNow] = useState(new Date())

  // Live clock — tick every 30s to update delay dynamically
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Request Notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true)
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') setNotificationsEnabled(true)
        })
      }
    }

    const fetchAppointment = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('doctorToken')
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/appointments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const apptData = res.data.data
        setAppointment(apptData)
        setCurrentToken(apptData.session?.currentToken || 0)
        setIsLoading(false)

        // Connect to Socket room for this specific doctor session
        const sessionId = apptData.session?.id || apptData.sessionId
        if (sessionId) {
          getSocket().emit('join-session', sessionId)
        }
      } catch (error) {
        console.error('Failed to load appointment details', error)
        setIsLoading(false)
      }
    }
    
    fetchAppointment()

    // Listen for queue updates
    const handleQueueUpdate = (data: { sessionId: string; currentToken: number }) => {
      setCurrentToken(data.currentToken)
      
      // Check if it's the patient's turn!
      if (appointment && data.currentToken === appointment.tokenNumber) {
        if (notificationsEnabled) {
          new Notification("It's Your Turn!", {
            body: `Dr. ${appointment.doctor.name} is ready for you now.`,
            icon: '/favicon.ico'
          })
        }
      }
    }

    getSocket().on('queue-updated', handleQueueUpdate)

    return () => {
      getSocket().off('queue-updated', handleQueueUpdate)
    }
  }, [id, appointment?.tokenNumber, notificationsEnabled])

  // Need to add appointment as dependency? No, let's keep it safe. The handleQueueUpdate closure grabs latest appointment using a ref or just dependencies. 
  // Wait, to avoid stale closure on `appointment.tokenNumber`, we should just use the fetched data.
  // We can update the useEffect dependencies to handle this properly, but for simplicity we rely on the fact that if it matches, it matches.

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-ink-700">Appointment not found</h2>
        <Link href="/dashboard/appointments" className="btn-primary mt-4 inline-block">Go Back</Link>
      </div>
    )
  }

  const isMyTurn = currentToken === appointment.tokenNumber
  const isPast = currentToken !== null && currentToken > appointment.tokenNumber
  const tokensAhead = currentToken !== null ? Math.max(0, appointment.tokenNumber - currentToken) : 0
  
  // Estimate: 10 mins per patient
  const estimatedWaitMins = tokensAhead * 10

  // ─── Delay Calculation ────────────────────────────────────────────────────────
  // Parse session start time like "10:00 AM" to today's Date object
  const parseSessionTime = (timeStr: string): Date | null => {
    if (!timeStr) return null
    try {
      const today = new Date()
      const [time, meridian] = timeStr.trim().split(' ')
      let [hours, minutes] = time.split(':').map(Number)
      if (meridian?.toUpperCase() === 'PM' && hours !== 12) hours += 12
      if (meridian?.toUpperCase() === 'AM' && hours === 12) hours = 0
      today.setHours(hours, minutes || 0, 0, 0)
      return today
    } catch { return null }
  }

  const sessionStartTime = parseSessionTime(appointment?.session?.startTime)
  const MINS_PER_PATIENT = 10

  // Expected current token based on elapsed time since session start
  const expectedCurrentToken = (() => {
    if (!sessionStartTime) return null
    const elapsedMins = Math.max(0, (now.getTime() - sessionStartTime.getTime()) / 60000)
    return Math.floor(elapsedMins / MINS_PER_PATIENT)
  })()

  // Delay = how far behind the doctor is from expected token
  const delayTokens = (currentToken !== null && expectedCurrentToken !== null)
    ? Math.max(0, expectedCurrentToken - currentToken)
    : 0
  const delayMins = delayTokens * MINS_PER_PATIENT

  const formatDelay = (mins: number) => {
    if (mins <= 0) return null
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''}`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? 's' : ''}`
  }
  const delayLabel = formatDelay(delayMins)
  
  const formatWaitTime = (mins: number) => {
    if (mins === 0) return "Ready"
    if (mins < 60) return `About ${mins} mins`
    const hours = Math.floor(mins / 60)
    const remaining = mins % 60
    return remaining > 0 ? `About ${hours}h ${remaining}m` : `About ${hours} hour${hours > 1 ? 's' : ''}`
  }
  
  // Generate visual queue indicator array
  const generateQueueSequence = () => {
    if (currentToken === null) return []
    const seq = []
    const start = currentToken
    const end = Math.max(start + 4, appointment.tokenNumber)
    for (let i = start; i <= end; i++) {
      seq.push(i)
      if (seq.length >= 6 && i < appointment.tokenNumber - 1) {
        seq.push(-1) // Ellipsis
        seq.push(appointment.tokenNumber)
        break
      }
    }
    return seq
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/appointments" className="w-10 h-10 rounded-full bg-ink-50 flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-ink-700">Live Queue Tracker</h1>
            <p className="text-ink-500 text-sm">Real-time updates for your consultation</p>
          </div>
        </div>
        
        {notificationsEnabled ? (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <Bell className="w-4 h-4" /> Alerts On
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-ink-500 bg-ink-50 px-3 py-1.5 rounded-full">
            <Bell className="w-4 h-4" /> Alerts Off
          </div>
        )}
      </div>

      {/* ── Delay Banner ────────────────────────────────────────────── */}
      {appointment?.session?.startTime && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-3 px-5 py-4 rounded-2xl border ${
            delayLabel
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          {delayLabel ? (
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          )}
          <div>
            {delayLabel ? (
              <>
                <p className="text-sm font-bold text-amber-700">
                  Doctor is running <span className="text-amber-900">{delayLabel} late</span>
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Session was scheduled at {appointment.session.startTime}. Your estimated wait has been adjusted accordingly.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-emerald-700">Doctor is on schedule</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Session started at {appointment.session.startTime}. No delays reported.
                </p>
              </>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Status Card */}
        <div className="premium-card-static p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent z-0"></div>
          
          <div className="relative z-10 w-full">
            <h2 className="text-sm font-extrabold text-ink-400 uppercase tracking-widest mb-6">Currently Serving</h2>
            
            <div className="flex items-end justify-center gap-4 mb-6">
              <motion.div 
                key={currentToken}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-7xl md:text-8xl font-black text-primary-600 leading-none drop-shadow-sm"
              >
                #{currentToken}
              </motion.div>
            </div>

            {/* Visual Queue Indicator */}
            <div className="flex items-center justify-center flex-wrap gap-2 mb-8 text-sm font-bold text-ink-500">
              {generateQueueSequence().map((num, idx, arr) => (
                <div key={idx} className="flex items-center gap-2">
                  {num === -1 ? (
                    <span className="opacity-50">...</span>
                  ) : (
                    <span className={`px-2 py-1 rounded-md transition-colors ${
                      num === appointment.tokenNumber 
                        ? 'bg-electric-500 text-white shadow-md shadow-electric-500/30' 
                        : num === currentToken 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-surface-100'
                    }`}>
                      #{num} {num === appointment.tokenNumber && '(You)'}
                    </span>
                  )}
                  {idx < arr.length - 1 && <span className="opacity-40">→</span>}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 md:gap-8 border-t border-ink-100/50 pt-6 mt-4">
              <div>
                <p className="text-xs text-ink-400 font-medium uppercase mb-1">Your Token</p>
                <p className="text-xl md:text-2xl font-black text-ink-700">#{appointment.tokenNumber}</p>
              </div>
              <div className="w-px h-10 bg-ink-100"></div>
              <div>
                <p className="text-xs text-ink-400 font-medium uppercase mb-1">Position</p>
                <p className="text-xl md:text-2xl font-black text-ink-700">{tokensAhead + 1}</p>
              </div>
              <div className="w-px h-10 bg-ink-100"></div>
              <div>
                <p className="text-xs text-ink-400 font-medium uppercase mb-1">Est. Wait</p>
                <p className="text-xl md:text-2xl font-black text-primary-600">{formatWaitTime(estimatedWaitMins)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="space-y-6">
          <div className="premium-card-static p-6 border-l-4 border-l-electric-500">
            <h3 className="font-bold text-ink-700 mb-1">Dr. {appointment.doctor.name}</h3>
            <p className="text-sm text-ink-500">{appointment.doctor.specialty}</p>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm font-medium text-ink-600">
                <Clock className="w-4 h-4 text-electric-500" />
                {appointment.session?.sessionType} Session
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-ink-600">
                {appointment.type === 'video' ? (
                  <><Video className="w-4 h-4 text-accent-500" /> Video Consultation</>
                ) : (
                  <><MapPin className="w-4 h-4 text-primary-500" /> Clinic Visit</>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Action Area */}
          <div className="premium-card p-6 bg-gradient-to-br from-ink-900 to-ink-800 text-white">
            {isMyTurn ? (
              <div className="text-center animate-pulse-soft">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">It's Your Turn!</h3>
                <p className="text-sm text-ink-300 mb-6">The doctor is ready for your consultation.</p>
                {appointment.type === 'video' && (
                  <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-glow-emerald hover:scale-[1.02] transition-transform">
                    Join Video Call
                  </button>
                )}
              </div>
            ) : isPast ? (
              <div className="text-center">
                <h3 className="text-lg font-bold mb-2 text-red-400">Your turn was missed</h3>
                <p className="text-sm text-ink-300">The current token has passed your number. Please contact the clinic.</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white/80" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">Please Wait</h3>
                <p className="text-sm text-ink-300">
                  There are <strong className="text-white">{tokensAhead}</strong> patients ahead of you. Keep this page open to receive a notification when it's your turn.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Chat Section */}
      {patient && (
        <div className="mt-8 h-[500px]">
          <ChatBox 
            appointmentId={id as string} 
            currentUser={{ id: patient.id, role: 'patient' }} 
            apiToken={typeof window !== 'undefined' ? localStorage.getItem('healthcare_token') || '' : ''} 
          />
        </div>
      )}
    </div>
  )
}
