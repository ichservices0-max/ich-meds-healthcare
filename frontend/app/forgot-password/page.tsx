'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft, Key } from 'lucide-react'
import { authApi } from '@/lib/api'

type Step = 'email' | 'success'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('email')
  const [resetToken, setResetToken] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const response = await authApi.forgotPassword(email)
      const { resetToken: token } = response.data.data
      setResetToken(token)
      setStep('success')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not process your request. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-blob absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-glow-blue">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">ICH Meds</h1>
            <p className="text-xs text-slate-400">Patient Portal</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-white mb-1">Forgot your password?</h2>
              <p className="text-slate-400 text-sm mb-6">
                Enter your email address and we&apos;ll send you a reset link.
              </p>

              {error && (
                <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="glass-input w-full pl-11"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-slate-400 text-sm mb-6">
                We sent a password reset link to <span className="text-white font-medium">{email}</span>
              </p>

              {/* Show mock reset token for dev environment */}
              {resetToken && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-primary-400" />
                    <span className="text-xs font-semibold text-primary-400 uppercase tracking-wide">
                      Dev Mode — Reset Token
                    </span>
                  </div>
                  <code className="text-xs text-slate-300 break-all font-mono">{resetToken}</code>
                </div>
              )}

              <button
                onClick={() => {
                  setStep('email')
                  setResetToken('')
                  setEmail('')
                }}
                className="btn-ghost w-full mb-3"
              >
                Resend email
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-4 border-t border-white/10">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
