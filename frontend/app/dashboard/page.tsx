'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Calendar, Users, FileText, MessageSquare, ArrowRight,
  Clock, MapPin, Video, Plus, Stethoscope, Activity, Quote,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { appointmentsApi, doctorsApi, notificationsApi } from '@/lib/api'
import type { Appointment, Doctor, Notification } from '@/lib/api'
import DoctorCard from '@/components/DoctorCard'
import BookingDrawer from '@/components/BookingDrawer'
import LiveQueueTracker from '@/components/LiveQueueTracker'

// Stagger animation variants
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const MOCK_DOCTORS: Doctor[] = [
  { _id: '1', name: 'Dr. Sarah Mitchell', specialty: 'Cardiologist', city: 'New York', rating: 4.9, reviewCount: 312, fee: 120, availableSlots: 5, isOnline: true, isVerified: true, experience: 12 },
  { _id: '2', name: 'Dr. James Chen', specialty: 'Neurologist', city: 'San Francisco', rating: 4.8, reviewCount: 245, fee: 150, availableSlots: 3, isOnline: true, isVerified: true, experience: 15 },
  { _id: '3', name: 'Dr. Priya Sharma', specialty: 'Dermatologist', city: 'Los Angeles', rating: 4.7, reviewCount: 189, fee: 90, availableSlots: 8, isOnline: false, isVerified: true, experience: 8 },
]

const MOCK_APPOINTMENTS: Appointment[] = [
  // Fallback mocks will fail typechecks without full structure, so we just start empty to avoid typescript errors, 
  // since real data is fetched immediately anyway.
]

const MOCK_NOTIFICATIONS: Notification[] = [
  { _id: 'n1', title: 'Appointment Reminder', message: 'Your appointment with Dr. Sarah Mitchell is tomorrow at 10:00 AM', type: 'appointment', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: 'n2', title: 'New Message', message: 'Dr. James Chen sent you a message regarding your last visit', type: 'message', isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { _id: 'n3', title: 'Lab Results Ready', message: 'Your blood test results are now available in Medical Records', type: 'reminder', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
]

export default function DashboardHome() {
  const { patient } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS)
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK_DOCTORS)
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    Promise.allSettled([
      appointmentsApi.getAll('upcoming'),
      doctorsApi.getAll(),
      notificationsApi.getAll(),
    ]).then(([apptResult, docResult, notifResult]) => {
      if (apptResult.status === 'fulfilled') setAppointments(apptResult.value.data.data)
      if (docResult.status === 'fulfilled') setDoctors((docResult.value.data as any).doctors?.slice(0, 3) || [])
      if (notifResult.status === 'fulfilled') setNotifications(notifResult.value.data.data.slice(0, 3))
    }).finally(() => setIsLoading(false))
  }, [])

  const stats = [
    { label: 'Upcoming Appointments', value: appointments.length, icon: Calendar, color: 'bg-primary-50 text-primary-600 border-primary-100' },
    { label: 'Total Doctors', value: '240+', icon: Users, color: 'bg-electric-50 text-electric-600 border-electric-100' },
    { label: 'Medical Records', value: '12', icon: FileText, color: 'bg-accent-50 text-accent-600 border-accent-100' },
    { label: 'Messages', value: '5', icon: MessageSquare, color: 'bg-gold-50 text-gold-600 border-gold-100' },
  ]

  const greeting = getGreeting()
  const firstName = patient?.name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ===== Hero Greeting with Quote ===== */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden premium-card p-6 lg:p-10 bg-slate-950 text-white border-none shadow-xl"
      >
        {/* Hospital Background */}
        <div className="absolute inset-0 z-0">
          <img src="/images/hospital_hero.png" alt="Hospital" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-900/90 to-primary-900/40" />
        </div>
        
        <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <p className="text-primary-200 text-sm font-semibold mb-2 tracking-wide uppercase">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl lg:text-5xl font-display font-extrabold text-white mb-3 drop-shadow-md">
              {greeting}, {firstName}!
            </h1>
            <p className="text-primary-100 text-base mb-8 max-w-md drop-shadow-sm">
              You have <span className="text-white font-bold">{appointments.length} upcoming appointments</span>.
              Stay on top of your health today.
            </p>
            
            <Link href="/dashboard/doctors" className="inline-flex items-center gap-2 bg-white text-primary-700 px-7 py-3 rounded-xl font-bold shadow-soft hover:shadow-glow-indigo transition-all hover:-translate-y-0.5">
              <Plus className="w-5 h-5" /> Book Appointment
            </Link>
          </div>
          
          <div className="hidden lg:flex lg:col-span-5 items-center justify-end gap-6 border-l border-white/10 pl-8">
            <div className="flex-1">
              <Quote className="w-8 h-8 text-primary-400 opacity-60 mb-3 drop-shadow-sm" />
              <p className="text-base font-semibold italic text-white leading-relaxed mb-4 drop-shadow-sm">
                "To ensure good health: eat lightly, breathe deeply, live moderately, cultivate cheerfulness..."
              </p>
              <p className="text-xs font-bold text-primary-300 uppercase tracking-widest">— W. Londen</p>
            </div>
            {/* Doctor Image Overlay */}
            <div className="w-32 h-40 shrink-0 rounded-2xl overflow-hidden relative shadow-2xl border-4 border-white/10 backdrop-blur-sm -rotate-3 hover:rotate-0 transition-transform duration-300">
              <img src="/images/ich_meds_logo.jpg" alt="Doctor" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== Stats row ===== */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} variants={item} className="premium-card p-5 flex items-center gap-4 hover:-translate-y-1 transition-transform">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-700">{value}</p>
              <p className="text-xs font-medium text-ink-500 leading-snug">{label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ===== Quick Actions ===== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="section-title">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Link href="/dashboard/doctors" className="premium-card p-5 flex items-center gap-4 group hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100 group-hover:border-primary-300 transition-colors">
              <Plus className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-ink-700">Find Doctor</p>
              <p className="text-xs text-ink-500">Book an appointment</p>
            </div>
            <ArrowRight className="w-4 h-4 text-ink-300 ml-auto group-hover:text-primary-600 transition-colors" />
          </Link>
          <Link href="/dashboard/records" className="premium-card p-5 flex items-center gap-4 group hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-electric-50 rounded-xl flex items-center justify-center border border-electric-100 group-hover:border-electric-300 transition-colors">
              <FileText className="w-6 h-6 text-electric-600" />
            </div>
            <div>
              <p className="font-semibold text-ink-700">View Records</p>
              <p className="text-xs text-ink-500">Medical history vault</p>
            </div>
            <ArrowRight className="w-4 h-4 text-ink-300 ml-auto group-hover:text-electric-600 transition-colors" />
          </Link>
          <Link href="/dashboard/appointments" className="premium-card p-5 flex items-center gap-4 group hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center border border-accent-100 group-hover:border-accent-300 transition-colors">
              <Video className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="font-semibold text-ink-700">Consultations</p>
              <p className="text-xs text-ink-500">Manage your schedule</p>
            </div>
            <ArrowRight className="w-4 h-4 text-ink-300 ml-auto group-hover:text-accent-600 transition-colors" />
          </Link>
        </div>
      </motion.div>

      {/* ===== Live Queue Tracker (Only shows if appointment is today) ===== */}
      {appointments.some(a => new Date(a.date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) && a.session) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <LiveQueueTracker 
            appointment={appointments.find(a => new Date(a.date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) && a.session)!} 
          />
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ===== Upcoming Appointments ===== */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Upcoming Appointments</h2>
            <Link href="/dashboard/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="premium-card p-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-ink-50 rounded-2xl flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-ink-400" />
                </div>
                <p className="text-ink-500 font-medium">No upcoming appointments</p>
                <Link href="/dashboard/doctors" className="btn-primary mt-6 inline-flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" /> Book Now
                </Link>
              </div>
            ) : (
              appointments.map((appt) => (
                <motion.div
                  key={appt.id || appt._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="premium-card p-5 flex items-center gap-4 hover:border-primary-100 transition-colors"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(appt.doctor.name)}&background=4F46E5&color=fff&size=64`}
                    alt={appt.doctor.name}
                    className="w-12 h-12 rounded-xl border border-primary-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink-700 text-sm truncate">{appt.doctor.name}</p>
                    <p className="text-xs text-primary-600 font-medium">{appt.doctor.specialty}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-xs text-ink-500">
                        <Clock className="w-3.5 h-3.5" />
                        {appt.time}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-ink-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(appt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {appt.type === 'video' ? (
                        <span className="flex items-center gap-1.5 text-xs text-accent-600 font-medium">
                          <Video className="w-3.5 h-3.5" /> Video Call
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-electric-600 font-medium">
                          <MapPin className="w-3.5 h-3.5" /> In-person
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="badge-primary shrink-0">{appt.status}</span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* ===== Recent Notifications ===== */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Notifications</h2>
            <Link href="/dashboard/notifications" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {notifications.map((notif) => {
              const iconMap = { appointment: Calendar, message: MessageSquare, reminder: Clock, system: Stethoscope }
              const Icon = iconMap[notif.type] || Stethoscope
              const colorMap = { 
                appointment: 'text-primary-600 bg-primary-50 border-primary-100', 
                message: 'text-emerald-600 bg-emerald-50 border-emerald-100', 
                reminder: 'text-gold-600 bg-gold-50 border-gold-100', 
                system: 'text-ink-500 bg-ink-50 border-ink-100' 
              }
              return (
                <div
                  key={notif.id || notif._id}
                  className={`premium-card p-4 flex items-start gap-3 ${!notif.isRead ? 'border-primary-200 bg-primary-50/30' : ''}`}
                >
                  {!notif.isRead && (
                    <span className="absolute top-4 right-4 w-2 h-2 bg-primary-500 rounded-full" />
                  )}
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[notif.type]}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${notif.isRead ? 'text-ink-600' : 'text-ink-800'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-ink-500 mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
                    <p className="text-[11px] font-medium text-ink-400 mt-1.5">
                      {new Date(notif.createdAt).toLocaleDateString() === new Date().toLocaleDateString() 
                        ? new Date(notif.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ===== Nearby Doctors Preview ===== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <div className="flex items-center justify-between mb-4 mt-6">
          <div>
            <h2 className="section-title mb-0">Recommended Doctors</h2>
            <p className="text-sm text-ink-500 mt-0.5">Top-rated specialists available today</p>
          </div>
          <Link href="/dashboard/doctors" className="btn-secondary text-sm px-4 py-2 flex items-center gap-2 bg-white">
            See all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {doctors.map((doctor) => (
            <motion.div key={doctor.id || doctor._id} variants={item}>
              <DoctorCard doctor={doctor} onBook={setSelectedDoctor} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Booking drawer */}
      <BookingDrawer
        doctor={selectedDoctor}
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
      />
    </div>
  )
}
