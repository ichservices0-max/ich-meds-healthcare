'use client'

import { motion } from 'framer-motion'
import { Star, MapPin, DollarSign, Clock, CheckCircle } from 'lucide-react'
import type { Doctor } from '@/lib/api'
import LivePulseRing from './LivePulseRing'

interface DoctorCardProps {
  doctor: Doctor
  onBook: (doctor: Doctor) => void
}

export default function DoctorCard({ doctor, onBook }: DoctorCardProps) {
  const avatarUrl = doctor.profileImage || doctor.imageUrl || doctor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=4F46E5&color=ffffff&bold=true&size=128`

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'star-filled' : 'star-empty'}`}
      />
    ))
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="premium-card p-5 flex flex-col gap-4 cursor-default"
    >
      {/* Header: Avatar + Online status */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <img
            src={avatarUrl}
            alt={doctor.name}
            className="w-14 h-14 rounded-2xl border-2 border-primary-100 object-cover"
          />
          {doctor.isOnline && (
            <span className="absolute -bottom-1 -right-1">
              <LivePulseRing size="sm" color="green" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-ink-700 text-sm leading-tight">{doctor.name}</h3>
            {doctor.isVerified && (
              <CheckCircle className="w-4 h-4 text-primary-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-primary-600 font-medium mt-0.5">{doctor.specialty}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-ink-400" />
            <p className="text-xs text-ink-500">{doctor.city}</p>
          </div>
        </div>

        {/* Online badge */}
        {doctor.isOnline ? (
          <span className="badge-success shrink-0">Online</span>
        ) : (
          <span className="badge bg-ink-100 text-ink-500 border border-ink-200 shrink-0">Offline</span>
        )}
      </div>

      {/* Rating row */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {renderStars(doctor.rating)}
        </div>
        <span className="text-sm font-bold text-gold-600">{doctor.rating.toFixed(1)}</span>
        <span className="text-xs text-ink-400">({doctor.reviewCount} reviews)</span>
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-ink-500">
          <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="font-semibold text-ink-700">${doctor.fee}</span>
          <span>per visit</span>
        </div>
        <div className="flex items-center gap-1.5 text-ink-500">
          <div className="w-6 h-6 bg-primary-50 rounded-lg flex items-center justify-center border border-primary-100">
            <Clock className="w-3.5 h-3.5 text-primary-600" />
          </div>
          <span className="font-semibold text-primary-600">{doctor.availableSlots}</span>
          <span>slots</span>
        </div>
      </div>

      {/* Experience */}
      <div className="flex items-center gap-2 py-2 border-y border-ink-100">
        <span className="text-xs font-medium text-ink-500">{doctor.experience} years experience</span>
        <span className="w-1 h-1 bg-ink-300 rounded-full" />
        {doctor.availableSlots > 0 ? (
          <span className="text-xs text-emerald-600 font-semibold">Available today</span>
        ) : (
          <span className="text-xs text-ink-400">Fully booked</span>
        )}
      </div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onBook(doctor)}
        disabled={doctor.availableSlots === 0}
        className="btn-primary w-full text-sm py-2.5 shadow-sm hover:shadow-glow-indigo disabled:shadow-none"
      >
        {doctor.availableSlots > 0 ? 'Book Appointment' : 'Join Waitlist'}
      </motion.button>
    </motion.div>
  )
}
