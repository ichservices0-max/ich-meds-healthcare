'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface PreCheckViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
}

export default function PreCheckViewModal({ isOpen, onClose, appointmentId }: PreCheckViewModalProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && appointmentId) {
      setIsLoading(true);
      setData(null);
      // Use direct axios to backend so doctor token OR patient token both work
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('doctorToken') || localStorage.getItem('ICH Meds_token') || '')
        : '';
      axios.get(`http://localhost:5000/api/precheck/${appointmentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => setData(res.data.preCheck))
        .catch(() => setData(null))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, appointmentId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
          />

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
                <p className="text-sm text-ink-500">Review patient symptoms and vitals</p>
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
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
              ) : !data ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4 text-ink-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-ink-500 font-medium">Patient has not submitted a Pre-Check form yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-primary-600 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Current Symptoms
                    </h4>
                    <div className="p-4 bg-surface-50 rounded-xl border border-surface-100 text-ink-700 text-sm whitespace-pre-wrap">
                      {data.symptoms || 'None reported.'}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-primary-600 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Vital Signs
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-surface-200 shadow-sm">
                        <div className="text-xs text-ink-400 mb-1">Temperature</div>
                        <div className="font-semibold text-ink-700">{data.vitalSigns?.temperature || '--'} °F</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-surface-200 shadow-sm">
                        <div className="text-xs text-ink-400 mb-1">Blood Pressure</div>
                        <div className="font-semibold text-ink-700">{data.vitalSigns?.bloodPressure || '--'}</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-surface-200 shadow-sm">
                        <div className="text-xs text-ink-400 mb-1">Heart Rate</div>
                        <div className="font-semibold text-ink-700">{data.vitalSigns?.heartRate || '--'} BPM</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-surface-200 shadow-sm">
                        <div className="text-xs text-ink-400 mb-1">Weight</div>
                        <div className="font-semibold text-ink-700">{data.vitalSigns?.weight || '--'} kg</div>
                      </div>
                    </div>
                  </div>

                  {data.medicalHistory && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary-600 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Past Medical History / Allergies
                      </h4>
                      <div className="p-4 bg-surface-50 rounded-xl border border-surface-100 text-ink-700 text-sm whitespace-pre-wrap">
                        {data.medicalHistory}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-surface-200 p-6 bg-white/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-white bg-ink-700 rounded-xl hover:bg-ink-800 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
