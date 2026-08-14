'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Quote } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Invalid credentials. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left Image Section - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden items-center justify-center p-12">
        <Image
          src="/images/ich_meds_logo.jpg"
          alt="ICH Meds"
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
            <Quote className="w-12 h-12 text-primary-300 mb-6 opacity-60 drop-shadow-md" />
            <h2 className="text-4xl font-display font-bold text-white mb-6 leading-tight drop-shadow-lg">
              "ICH Meds is not just about treating illness, it's about empowering wellness."
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                <span className="text-white font-black text-lg tracking-tight">ICH</span>
              </div>
              <div>
                <p className="text-white font-semibold">ICH Meds Portal</p>
                <p className="text-primary-200 text-sm">Your trusted medical companion</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-electric-50 rounded-full blur-3xl opacity-60" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="premium-card w-full max-w-md p-8 sm:p-10 relative z-10"
        >
          {/* Logo - Mobile only */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center shadow-glow-indigo">
              <span className="text-white font-black text-base tracking-tight">ICH</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-ink-800 tracking-tight">ICH Meds</h1>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-ink-700 mb-2">Welcome back</h2>
            <p className="text-ink-400 text-sm mb-8">Sign in to your account to continue</p>
          </motion.div>

          {/* Error message */}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-ink-600">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="premium-input pl-11"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-ink-600">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="premium-input pl-11 pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full mt-8 flex items-center justify-center gap-2 py-3.5 text-[15px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative mt-8 mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink-100" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-ink-400 font-medium">New to ICH Meds?</span>
            </div>
          </div>

          {/* Register link */}
          <Link 
            href="/register" 
            className="btn-secondary w-full flex items-center justify-center py-3.5 text-[15px]"
          >
            Create an account
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
