'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, SlidersHorizontal, Navigation, X } from 'lucide-react'
import { doctorsApi } from '@/lib/api'
import type { Doctor } from '@/lib/api'
import DoctorCard from '@/components/DoctorCard'
import BookingDrawer from '@/components/BookingDrawer'

const SPECIALTIES = [
  'All', 'Cardiologist', 'Neurologist', 'Dermatologist', 'Orthopedist',
  'Pediatrician', 'Psychiatrist', 'Gynecologist', 'Ophthalmologist', 'Dentist', 'ENT',
]

const MOCK_DOCTORS: Doctor[] = [
  { _id: '1', name: 'Dr. Sarah Mitchell', specialty: 'Cardiologist', city: 'New York', rating: 4.9, reviewCount: 312, fee: 120, availableSlots: 5, isOnline: true, isVerified: true, experience: 12 },
  { _id: '2', name: 'Dr. James Chen', specialty: 'Neurologist', city: 'San Francisco', rating: 4.8, reviewCount: 245, fee: 150, availableSlots: 3, isOnline: true, isVerified: true, experience: 15 },
  { _id: '3', name: 'Dr. Priya Sharma', specialty: 'Dermatologist', city: 'Los Angeles', rating: 4.7, reviewCount: 189, fee: 90, availableSlots: 8, isOnline: false, isVerified: true, experience: 8 },
  { _id: '4', name: 'Dr. Michael Torres', specialty: 'Orthopedist', city: 'Chicago', rating: 4.6, reviewCount: 156, fee: 130, availableSlots: 2, isOnline: true, isVerified: true, experience: 20 },
  { _id: '5', name: 'Dr. Emily Watson', specialty: 'Pediatrician', city: 'Houston', rating: 4.9, reviewCount: 401, fee: 80, availableSlots: 6, isOnline: false, isVerified: true, experience: 10 },
  { _id: '6', name: 'Dr. David Park', specialty: 'Psychiatrist', city: 'Seattle', rating: 4.7, reviewCount: 178, fee: 140, availableSlots: 4, isOnline: true, isVerified: false, experience: 14 },
  { _id: '7', name: 'Dr. Aisha Rahman', specialty: 'Gynecologist', city: 'Miami', rating: 4.8, reviewCount: 267, fee: 110, availableSlots: 7, isOnline: true, isVerified: true, experience: 11 },
  { _id: '8', name: 'Dr. Robert Klein', specialty: 'Cardiologist', city: 'Boston', rating: 4.5, reviewCount: 134, fee: 160, availableSlots: 0, isOnline: false, isVerified: true, experience: 25 },
  { _id: '9', name: 'Dr. Mei Lin', specialty: 'Ophthalmologist', city: 'Phoenix', rating: 4.8, reviewCount: 203, fee: 95, availableSlots: 5, isOnline: true, isVerified: true, experience: 9 },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK_DOCTORS)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpecialty, setSelectedSpecialty] = useState('All')
  const [city, setCity] = useState('')
  const [radius, setRadius] = useState(25)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    setIsLoading(true)
    doctorsApi.getAll({
      specialty: selectedSpecialty === 'All' ? undefined : selectedSpecialty,
      city: city || undefined,
      radius,
      ...userCoords,
    })
      .then((res: any) => setDoctors(res.data.doctors || []))
      .catch((err) => {
        console.error('Failed to fetch doctors:', err);
        // Filter mock data client-side
        let filtered = MOCK_DOCTORS
        if (selectedSpecialty !== 'All') {
          filtered = filtered.filter((d) => d.specialty === selectedSpecialty)
        }
        if (city) {
          filtered = filtered.filter((d) => d.city.toLowerCase().includes(city.toLowerCase()))
        }
        setDoctors(filtered)
      })
      .finally(() => setIsLoading(false))
  }, [selectedSpecialty, city, radius, userCoords])

  const filteredDoctors = doctors.filter((d) =>
    searchQuery === '' || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function useMyLocation() {
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
        alert('Could not access location. Please check browser permissions.')
      }
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="section-title text-3xl">Find Doctors</h1>
        <p className="section-subtitle text-base mt-1">Search from 240+ verified specialists</p>
      </motion.div>

      {/* Search + filter bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or specialty..."
              className="premium-input w-full pl-12 py-3.5 shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary bg-white flex-1 sm:flex-none flex items-center justify-center gap-2 py-3.5 shadow-sm ${showFilters ? 'ring-2 ring-primary-500/20 border-primary-300' : ''}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="font-semibold">Filters</span>
            </button>
            <button
              onClick={useMyLocation}
              disabled={isLocating}
              className="btn-secondary bg-white flex-1 sm:flex-none flex items-center justify-center gap-2 py-3.5 shadow-sm"
            >
              <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin text-primary-600' : userCoords ? 'text-emerald-500' : ''}`} />
              <span className="font-semibold">{userCoords ? 'Located' : 'My Location'}</span>
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="premium-card p-6 space-y-4 shadow-sm"
          >
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <label className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2 block">City Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city..."
                    className="premium-input w-full pl-11 text-sm py-2.5"
                  />
                  {city && (
                    <button onClick={() => setCity('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2 flex justify-between block">
                  Search Radius <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">{radius} km</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-2 bg-ink-100 rounded-full appearance-none cursor-pointer accent-primary-600 mt-2"
                />
                <div className="flex justify-between text-xs font-medium text-ink-400 mt-2">
                  <span>5 km</span><span>100 km</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Specialty chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 overflow-x-auto pb-2 pt-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {SPECIALTIES.map((spec) => (
          <button
            key={spec}
            onClick={() => setSelectedSpecialty(spec)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm ${
              selectedSpecialty === spec
                ? 'bg-ink-700 border-ink-700 text-white'
                : 'bg-white border-ink-200 text-ink-600 hover:text-ink-800 hover:bg-ink-50 hover:border-ink-300'
            }`}
          >
            {spec}
          </button>
        ))}
      </motion.div>

      {/* Results count */}
      <div className="flex items-center justify-between py-2 border-b border-ink-100">
        <p className="text-sm font-medium text-ink-500">
          Showing <span className="text-ink-800 font-bold">{filteredDoctors.length}</span> doctors
          {selectedSpecialty !== 'All' && <span> in <span className="text-primary-600 font-semibold">{selectedSpecialty}</span></span>}
        </p>
        {isLoading && <span className="text-xs font-bold text-primary-600 uppercase tracking-wider animate-pulse bg-primary-50 px-3 py-1 rounded-full">Searching...</span>}
      </div>

      {/* Doctor grid */}
      {filteredDoctors.length === 0 ? (
        <div className="premium-card p-16 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-ink-50 rounded-full border border-ink-100 flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-ink-300" />
          </div>
          <p className="text-ink-700 font-bold text-xl mb-2">No doctors found</p>
          <p className="text-ink-500">Try adjusting your filters, location, or search query.</p>
          <button 
            onClick={() => {setSearchQuery(''); setSelectedSpecialty('All'); setCity('')}}
            className="mt-6 btn-secondary bg-white text-sm"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredDoctors.map((doctor) => (
            <motion.div key={doctor.id || doctor._id} variants={item}>
              <DoctorCard doctor={doctor} onBook={setSelectedDoctor} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <BookingDrawer
        doctor={selectedDoctor}
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
      />
    </div>
  )
}
