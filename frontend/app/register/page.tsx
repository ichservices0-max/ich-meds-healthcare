'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, User, Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle,
  CheckCircle, Quote, CreditCard, ArrowLeft, ArrowRight, ShieldCheck, QrCode, Smartphone
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [step, setStep] = useState<'details' | 'payment'>('details')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'qr'>('upi')
  const [upiId, setUpiId] = useState('')
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

  function handleProceedToPayment(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.email || !formData.mobile || !formData.password) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy')
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

    // Move to ₹10 Payment Step
    setStep('payment')
  }

  async function handleCompletePaymentAndRegister() {
    setError('')
    setIsLoading(true)
    try {
      // Simulate ₹10 payment confirmation delay
      await new Promise((resolve) => setTimeout(resolve, 800))

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
    { key: 'mobile' as const, label: 'Mobile Number', type: 'tel', placeholder: '9876543210', Icon: Phone, autoComplete: 'tel' },
  ]

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Right Image Section */}
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

      {/* Left Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative order-1">
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
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shadow-glow-indigo hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-ink-700 leading-tight">ICH Meds</h1>
              <p className="text-xs text-ink-400">Patient Portal</p>
            </div>
          </div>

          {/* Stepper indicator */}
          <div className="flex items-center justify-between mb-6 bg-white p-2 rounded-xl border border-ink-100 shadow-sm">
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 'details' ? 'text-primary-600' : 'text-ink-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'details' ? 'bg-primary-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                {step === 'payment' ? '✓' : '1'}
              </span>
              Patient Info
            </div>
            <div className="w-8 h-0.5 bg-ink-200" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 'payment' ? 'text-emerald-600' : 'text-ink-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'payment' ? 'bg-emerald-600 text-white' : 'bg-ink-100 text-ink-500'}`}>
                2
              </span>
              Profile Fee (₹10)
            </div>
          </div>

          {/* Error Banner */}
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

          <AnimatePresence mode="wait">
            {/* STEP 1: PATIENT DETAILS */}
            {step === 'details' && (
              <motion.div
                key="step-details"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h2 className="text-2xl font-display font-bold text-ink-800 mb-1">Create your profile</h2>
                <p className="text-ink-500 text-sm mb-6">Enter your details to initiate digital patient registration</p>

                <form onSubmit={handleProceedToPayment} className="space-y-4">
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
                          placeholder="Min 6 chars"
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
                    <div className="space-y-1 mt-1 pb-1">
                      <div className="flex gap-1 h-1.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color}`}
                          style={{ width: passwordStrength.width, maxWidth: '100%' }}
                        />
                        <div className="h-full flex-1 bg-ink-100 rounded-full" />
                      </div>
                      <p className="text-xs text-ink-400 font-medium">
                        Strength: <span className="font-bold">{passwordStrength.label}</span>
                      </p>
                    </div>
                  )}

                  {/* Profile Fee Notice Banner */}
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold text-base flex items-center justify-center shadow-sm shrink-0">
                        ₹10
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-950 uppercase tracking-wide">One-Time Profile Making Charge</p>
                        <p className="text-[11.5px] text-emerald-700 font-medium">Payable next before activating your health profile</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                      ₹10
                    </span>
                  </div>

                  <div className="flex items-start pt-1 pb-2">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 mt-1 border-surface-300 rounded text-primary focus:ring-primary cursor-pointer shrink-0"
                    />
                    <label htmlFor="terms" className="ml-2 text-xs text-ink-500 leading-relaxed select-none cursor-pointer">
                      I agree to the <span className="text-primary-600 font-medium hover:underline">Terms</span> & <span className="text-primary-600 font-medium hover:underline">Privacy Policy</span> and consent to digital record processing.
                    </label>
                  </div>

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2 text-sm font-bold shadow-glow-indigo"
                  >
                    Proceed to Profile Fee (₹10) <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* STEP 2: ONE-TIME PROFILE CHARGE PAYMENT */}
            {step === 'payment' && (
              <motion.div
                key="step-payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-ink-800">Profile Making Charge</h2>
                    <p className="text-ink-500 text-xs mt-0.5">One-time registration fee to activate digital patient profile</p>
                  </div>
                  <button
                    onClick={() => setStep('details')}
                    className="text-xs font-bold text-ink-500 hover:text-ink-800 flex items-center gap-1 bg-ink-100 hover:bg-ink-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                </div>

                {/* Profile Summary Card */}
                <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-ink-100">
                    <span className="text-ink-400">Patient Name</span>
                    <span className="text-ink-800 font-bold">{formData.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-ink-100">
                    <span className="text-ink-400">Mobile Number</span>
                    <span className="text-ink-800 font-bold">+91 {formData.mobile}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-ink-100">
                    <span className="text-ink-400">Profile Registration Fee</span>
                    <span className="text-ink-800 font-bold">₹10.00</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-ink-700 font-extrabold">Total Amount to Pay</span>
                    <span className="text-emerald-600 font-black text-lg">₹10</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink-600 uppercase tracking-wider block">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'upi' as const, label: 'UPI / Apps', Icon: Smartphone },
                      { id: 'qr' as const, label: 'Scan QR', Icon: QrCode },
                      { id: 'card' as const, label: 'Card / Net', Icon: CreditCard },
                    ].map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPaymentMethod(id)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                          paymentMethod === id
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                            : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${paymentMethod === id ? 'text-emerald-600' : 'text-ink-400'}`} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Mode Detail */}
                {paymentMethod === 'upi' && (
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-emerald-950">Pay using any UPI App</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. mobile@upi / yourname@okaxis"
                        className="premium-input bg-white text-xs flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Supports GPay, PhonePe, Paytm, BHIM & all Indian UPI handles</span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'qr' && (
                  <div className="bg-white border border-ink-100 rounded-2xl p-4 text-center space-y-2">
                    <div className="w-28 h-28 mx-auto bg-ink-50 border border-ink-200 rounded-xl flex flex-col items-center justify-center p-2 shadow-inner">
                      <QrCode className="w-16 h-16 text-ink-800" />
                      <span className="text-[10px] font-bold text-ink-600 mt-1">₹10 ICH Meds UPI</span>
                    </div>
                    <p className="text-xs font-medium text-ink-500">Scan with any UPI camera to complete ₹10 payment</p>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="bg-white border border-ink-100 rounded-2xl p-4 space-y-2.5">
                    <p className="text-xs font-bold text-ink-700">Card & NetBanking Checkout</p>
                    <p className="text-xs text-ink-500">Instant ₹10 debit card, credit card, or net banking authentication.</p>
                  </div>
                )}

                {/* Final Confirmation Action */}
                <motion.button
                  type="button"
                  onClick={handleCompletePaymentAndRegister}
                  disabled={isLoading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying ₹10 Payment & Creating Profile...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" /> Pay ₹10 & Activate My Profile
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center text-[15px] text-ink-500">
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
