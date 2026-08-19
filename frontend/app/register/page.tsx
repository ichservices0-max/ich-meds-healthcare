'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, User, Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Quote } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)

  function handleChange(field: keyof typeof formData) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      setError('')
    }
  }

  function validatePassword(password: string): string | null {
    if (password.length < 6) return 'Password must be at least 6 characters'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy before creating an account')
      return
    }

    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (!/^\d{10}$/.test(formData.mobile.replace(/\s/g, ''))) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setIsLoading(true)
    try {
      await register({
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
      })
      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Registration failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = (() => {
    const p = formData.password
    if (!p) return null
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%' }
    if (score === 2) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' }
    if (score === 3) return { label: 'Good', color: 'bg-blue-500', width: '75%' }
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' }
  })()

  const fields = [
    { key: 'name' as const, label: 'Full Name', type: 'text', placeholder: 'Alex Johnson', Icon: User, autoComplete: 'name' },
    { key: 'email' as const, label: 'Email address', type: 'email', placeholder: 'you@example.com', Icon: Mail, autoComplete: 'email' },
    { key: 'mobile' as const, label: 'Mobile Number', type: 'tel', placeholder: '+1 234 567 8900', Icon: Phone, autoComplete: 'tel' },
  ]

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Right Image Section - Hidden on mobile, swapped to right side for variation */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden items-center justify-center p-12 order-2">
        <Image
          src="/images/hospital_hero.png"
          alt="Modern Hospital"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-900/70" />
        
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Quote className="w-12 h-12 text-electric-300 mb-6 opacity-60 drop-shadow-md" />
            <h2 className="text-4xl font-display font-bold text-white mb-6 leading-tight drop-shadow-lg">
              "Healing is a matter of time, but it is sometimes also a matter of opportunity."
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
              <div>
                <p className="text-white font-semibold">Join ICH Meds</p>
                <p className="text-electric-200 text-sm">Take control of your wellbeing today</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Left Register Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative order-1">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-40 w-96 h-96 bg-primary-50 rounded-full blur-3xl opacity-60" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shadow-glow-indigo hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-ink-700 leading-tight">ICH Meds</h1>
              <p className="text-xs text-ink-400">Patient Portal</p>
            </div>
          </div>

          <h2 className="text-3xl font-display font-bold text-ink-800 mb-2">Create your account</h2>
          <p className="text-ink-500 text-[15px] mb-8">Join thousands of patients managing their health</p>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, type, placeholder, Icon, autoComplete }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-sm font-semibold text-ink-600">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-300" />
                  <input
                    type={type}
                    value={formData[key]}
                    onChange={handleChange(key)}
                    placeholder={placeholder}
                    required
                    className="premium-input pl-11"
                    autoComplete={autoComplete}
                  />
                </div>
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-ink-600">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange('password')}
                    placeholder="Min 8 chars"
                    required
                    className="premium-input pl-10 pr-10 text-sm"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-ink-600">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    placeholder="Re-enter password"
                    required
                    className="premium-input pl-10 pr-10 text-sm"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle className="absolute right-10 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500 bg-white" />
                  )}
                </div>
              </div>
            </div>

            {/* Password strength indicator */}
            {passwordStrength && (
              <div className="space-y-1 mt-1 pb-2">
                <div className="flex gap-1 h-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width, maxWidth: '100%' }}
                  />
                  <div className="h-full flex-1 bg-ink-100 rounded-full" />
                </div>
                <p className="text-xs text-ink-400 font-medium">
                  Password strength:{' '}
                  <span
                    className={
                      passwordStrength.label === 'Strong'
                        ? 'text-emerald-600'
                        : passwordStrength.label === 'Good'
                        ? 'text-blue-600'
                        : passwordStrength.label === 'Fair'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }
                  >
                    {passwordStrength.label}
                  </span>
                </p>
              </div>
            )}

            {/* Profile Making Charge Notice */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0">
                  ₹10
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-950">Patient Profile Making Charge</p>
                  <p className="text-xs text-emerald-700 font-medium">One-time registration & digital health record setup</p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-emerald-200/70 text-emerald-800 px-2.5 py-1 rounded-full shrink-0">
                ₹10 Fixed
              </span>
            </div>

            <div className="flex items-start pb-2">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-1 border-surface-300 rounded text-primary focus:ring-primary cursor-pointer shrink-0"
              />
              <label htmlFor="terms" className="ml-2 text-[13.5px] text-ink-500 leading-relaxed select-none cursor-pointer">
                I agree to the <span className="text-primary-600 font-medium hover:underline">Terms of Service</span> and <span className="text-primary-600 font-medium hover:underline">Privacy Policy</span>, and I explicitly consent to the secure processing of my uploaded documents and medical records.
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2 text-[15px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account & Pay ₹10 Profile Fee'
              )}
            </motion.button>
          </form>          <div className="mt-8 text-center text-[15px] text-ink-500">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Sign in here
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
