'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface PreCheckFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
}

export default function PreCheckFormModal({ isOpen, onClose, appointmentId }: PreCheckFormModalProps) {
  const [symptoms, setSymptoms] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [vitals, setVitals] = useState({
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    weight: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentId || appointmentId === 'undefined') {
      toast.error('No appointment ID found. Please try again.');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('ICH Meds_token') || localStorage.getItem('doctorToken') || '')
        : '';
      await import('axios').then(({ default: axios }) =>
        axios.post(`http://localhost:5000/api/precheck/${appointmentId}`, {
          symptoms,
          medicalHistory,
          vitalSigns: vitals,
        }, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
      );
      toast.success('✅ Pre-Check submitted! Your doctor will review it before the appointment.');
      onClose();
    } catch (error: any) {
      console.error('Pre-check submit error:', error?.response?.data || error?.message || error);
      const msg = error?.response?.data?.error || 'Failed to submit. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white/90 shadow-2xl backdrop-blur-xl border border-white/50 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-200 px-6 py-5 bg-white/50">
              <div>
                <h3 className="text-xl font-bold text-ink-700">Digital Pre-Check</h3>
                <p className="text-sm text-ink-500">Provide details for your doctor</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-ink-400 hover:bg-surface-100 hover:text-ink-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-6 flex-1">
              <form id="precheck-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">
                    Current Symptoms
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full rounded-xl border border-surface-200 bg-white/50 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    placeholder="E.g., Headache for 2 days, mild fever..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-3">
                    Vital Signs (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-ink-500 mb-1">Temperature (°F)</label>
                      <input
                        type="text"
                        placeholder="98.6"
                        className="w-full rounded-xl border border-surface-200 bg-white/50 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        value={vitals.temperature}
                        onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-500 mb-1">Blood Pressure</label>
                      <input
                        type="text"
                        placeholder="120/80"
                        className="w-full rounded-xl border border-surface-200 bg-white/50 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        value={vitals.bloodPressure}
                        onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-500 mb-1">Heart Rate (BPM)</label>
                      <input
                        type="text"
                        placeholder="72"
                        className="w-full rounded-xl border border-surface-200 bg-white/50 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        value={vitals.heartRate}
                        onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-500 mb-1">Weight (kg)</label>
                      <input
                        type="text"
                        placeholder="70"
                        className="w-full rounded-xl border border-surface-200 bg-white/50 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        value={vitals.weight}
                        onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">
                    Past Medical History / Allergies
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-xl border border-surface-200 bg-white/50 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Any relevant past conditions or allergies..."
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-surface-200 p-6 bg-white/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-ink-600 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="precheck-form"
                disabled={isSubmitting || !symptoms.trim()}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit to Doctor'}
                {!isSubmitting && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
