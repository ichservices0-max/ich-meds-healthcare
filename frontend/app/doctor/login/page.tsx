'use client';

import { useState, useEffect } from 'react';
import { useDoctorAuth } from '@/contexts/DoctorAuthContext';
import Link from 'next/link';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

export default function DoctorLogin() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  
  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useDoctorAuth();

  useEffect(() => {
    // Clean up recaptcha container on unmount or mode switch
    if (loginMethod === 'email') {
      setConfirmationResult(null);
      setOtp('');
    }
  }, [loginMethod]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/auth/login`, {
        email,
        password,
      });
      login(res.data.token, res.data.doctor);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const requestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const formattedPhone = phone.startsWith('+') ? phone : `+1${phone}`; // Fallback to +1 if no country code
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP');
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    
    setError('');
    setIsLoading(true);

    try {
      // 1. Verify OTP with Firebase
      const result = await confirmationResult.confirm(otp);
      
      // 2. Exchange Firebase token for our backend JWT
      // (You will need to create a new backend route /api/doctor/auth/verify-firebase)
      const idToken = await result.user.getIdToken();
      
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/auth/verify-firebase`, {
        token: idToken,
      });
      
      login(res.data.token, res.data.doctor);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/[0.06] to-accent/[0.04] blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-electric/[0.05] to-primary/[0.03] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="glass-card p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary via-accent to-electric rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-glow-indigo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-ink-700 tracking-tight">Doctor Portal</h1>
            <p className="text-[15px] text-ink-400 mt-1.5">Sign in to manage your practice</p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex p-1 bg-surface-100 rounded-xl mb-6">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all ${
                loginMethod === 'email' ? 'bg-white text-ink-700 shadow-sm' : 'text-ink-400 hover:text-ink-600'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all ${
                loginMethod === 'phone' ? 'bg-white text-ink-700 shadow-sm' : 'text-ink-400 hover:text-ink-600'
              }`}
            >
              Phone (OTP)
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="p-3.5 bg-red-50 text-red-600 rounded-xl text-[14px] font-medium border border-red-100 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <div className="min-h-[220px]">
            {loginMethod === 'email' ? (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleEmailSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="block text-[13px] font-semibold text-ink-500 mb-1.5">Email Address</label>
                  <input type="email" required className="premium-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dr.smith@example.com" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-ink-500 mb-1.5">Password</label>
                  <input type="password" required className="premium-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-[15px] flex items-center justify-center gap-2">
                  {isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</> : 'Sign In'}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="phone-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={confirmationResult ? verifyOTP : requestOTP}
                className="space-y-5"
              >
                {!confirmationResult ? (
                  <>
                    <div>
                      <label className="block text-[13px] font-semibold text-ink-500 mb-1.5">Phone Number (with country code)</label>
                      <input type="tel" required className="premium-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" />
                    </div>
                    <div id="recaptcha-container"></div>
                    <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-[15px] flex items-center justify-center gap-2">
                      {isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending OTP...</> : 'Send OTP Code'}
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[13px] font-semibold text-ink-500 mb-1.5">6-Digit OTP Code</label>
                      <input type="text" required className="premium-input text-center tracking-[0.5em] font-bold text-lg" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="------" />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-[15px] flex items-center justify-center gap-2">
                      {isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</> : 'Verify & Sign In'}
                    </button>
                    <button type="button" onClick={() => setConfirmationResult(null)} className="w-full text-center text-[13px] font-medium text-ink-400 hover:text-ink-600 mt-3">
                      Use a different number
                    </button>
                  </>
                )}
              </motion.form>
            )}
          </div>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-black/[0.06]" />
          </div>

          <p className="text-center text-[14px] text-ink-400">
            Not registered yet?{' '}
            <Link href="/doctor/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Apply for an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
