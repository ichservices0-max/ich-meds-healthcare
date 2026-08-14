'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';
import { useDoctorAuth } from '@/contexts/DoctorAuthContext';
import { CheckCircle, Loader2, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export default function MembershipLock({ children }: { children: React.ReactNode }) {
  const { doctor, updateDoctorInfo, loading: authLoading } = useDoctorAuth();
  const [isPaying, setIsPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const feeAmount = 2000;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!doctor || doctor.membershipStatus === 'ACTIVE') {
    return <>{children}</>;
  }

  // Generate UPI string
  const upiId = 'ICH Meds@upi';
  const upiString = `upi://pay?pa=${upiId}&pn=ICH Meds Platform&am=${feeAmount}&cu=INR&tn=Doctor Membership Fee`;

  const handlePay = async () => {
    setIsPaying(true);
    try {
      const token = localStorage.getItem('doctorToken');
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/auth/pay-membership`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          updateDoctorInfo({ membershipStatus: 'ACTIVE' });
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to activate membership. Please try again.');
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-surface-200"
      >
        <div className="bg-gradient-to-br from-primary-600 to-accent-600 p-8 text-center text-white">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl font-black mb-2">Account Locked</h2>
          <p className="text-primary-100 font-medium">
            Activate your doctor profile to start accepting appointments.
          </p>
        </div>

        <div className="p-8">
          {success ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center py-10"
            >
              <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-ink-900 mb-2">Membership Activated!</h3>
              <p className="text-ink-500">Redirecting to your dashboard...</p>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-1">
                  Membership Fee
                </p>
                <p className="text-4xl font-black text-ink-900">₹{feeAmount}</p>
                <p className="text-xs text-ink-500 mt-2">One-time activation fee</p>
              </div>

              <div className="bg-surface-100 p-6 rounded-2xl flex flex-col items-center justify-center mb-8 border border-surface-200">
                <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                  <QRCode value={upiString} size={180} />
                </div>
                <p className="text-sm font-bold text-ink-600 flex items-center gap-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" className="h-4" />
                  Scan to Pay
                </p>
              </div>

              <button
                onClick={handlePay}
                disabled={isPaying}
                className="w-full py-4 bg-ink-900 hover:bg-ink-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Activating...
                  </>
                ) : (
                  'I have completed the payment'
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
