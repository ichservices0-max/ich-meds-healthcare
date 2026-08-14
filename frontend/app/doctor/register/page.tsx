'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuth } from '@/contexts/DoctorAuthContext';
import Link from 'next/link';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function DoctorRegister() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    registrationNumber: '',
    qualification: '',
    degree: '',
    experience: '',
    specialty: '',
    clinicName: '',
    clinicAddress: '',
    city: '',
    state: '',
    country: '',
    fee: '0',
    lat: '0',
    lng: '0',
  });
  
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    profileImage: null,
    medicalLicense: null,
    registrationCertificate: null,
    degreeCertificate: null,
    governmentId: null,
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { login } = useDoctorAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [e.target.name]: e.target.files[0] });
    }
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.phone) {
        setError('Please fill in all personal details.');
        return;
      }
      if (!files.profileImage) {
        setError('Please upload a profile picture.');
        return;
      }
    }
    if (step === 2 && (!formData.registrationNumber || !formData.specialty || !formData.qualification)) {
      setError('Please fill in all professional details.');
      return;
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 4) return;
    
    setError('');

    if (!agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy before submitting your application.');
      return;
    }

    setIsLoading(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          data.append(key, file);
        }
      });

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/auth/register`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      login(res.data.token, res.data.doctor);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
            <h2 className="text-xl font-bold text-ink-700 mb-6">Personal Details</h2>
            
            {/* Profile Picture Upload */}
            <div className="mb-8 flex items-center gap-6">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 ${files.profileImage ? 'border-primary' : 'border-dashed border-ink-200 bg-surface-100'}`}>
                  {files.profileImage ? (
                    <img src={URL.createObjectURL(files.profileImage)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-300"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  )}
                </div>
              </div>
              <div>
                <label className="cursor-pointer btn-secondary inline-block mb-2 text-[13px] py-2 px-4">
                  Upload Photo
                  <input type="file" name="profileImage" className="hidden" onChange={handleFileChange} accept=".jpg,.jpeg,.png" />
                </label>
                <p className="text-[12px] text-ink-400 font-medium">Clear frontal face photo required.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input type="text" name="name" required className="premium-input" value={formData.name} onChange={handleInputChange} placeholder="Dr. John Doe" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" name="email" required className="premium-input" value={formData.email} onChange={handleInputChange} placeholder="doctor@example.com" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Phone Number</label>
                <input type="tel" name="phone" required className="premium-input" value={formData.phone} onChange={handleInputChange} placeholder="+1 234 567 8900" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Password</label>
                <input type="password" name="password" required className="premium-input" value={formData.password} onChange={handleInputChange} placeholder="••••••••" />
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
            <h2 className="text-xl font-bold text-ink-700 mb-6">Professional Details</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Medical Registration Number</label>
                <input type="text" name="registrationNumber" required className="premium-input" value={formData.registrationNumber} onChange={handleInputChange} placeholder="e.g. MED-12345" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Qualification</label>
                  <input type="text" name="qualification" required className="premium-input" value={formData.qualification} onChange={handleInputChange} placeholder="MBBS, MD" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Degree</label>
                  <input type="text" name="degree" required className="premium-input" value={formData.degree} onChange={handleInputChange} placeholder="MD Cardiology" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Specialization</label>
                  <input type="text" name="specialty" required className="premium-input" value={formData.specialty} onChange={handleInputChange} placeholder="Cardiologist" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Years of Exp</label>
                  <input type="number" name="experience" required className="premium-input" value={formData.experience} onChange={handleInputChange} placeholder="10" />
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
            <h2 className="text-xl font-bold text-ink-700 mb-6">Clinic Information</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Clinic Name (Optional)</label>
                <input type="text" name="clinicName" className="premium-input" value={formData.clinicName} onChange={handleInputChange} placeholder="City Heart Clinic" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Clinic Address</label>
                <textarea name="clinicAddress" required className="premium-input min-h-[100px] resize-none" value={formData.clinicAddress} onChange={handleInputChange} placeholder="123 Medical Drive..."></textarea>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">City</label>
                  <input type="text" name="city" required className="premium-input" value={formData.city} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">State</label>
                  <input type="text" name="state" required className="premium-input" value={formData.state} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Country</label>
                  <input type="text" name="country" required className="premium-input" value={formData.country} onChange={handleInputChange} />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">Consultation Fee</label>
                <input type="number" name="fee" required className="premium-input" value={formData.fee} onChange={handleInputChange} placeholder="100" />
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
            <h2 className="text-xl font-bold text-ink-700 mb-2">Document Verification</h2>
            <p className="text-[14px] text-ink-400 mb-6">Upload these documents for verification. Max 5MB per file.</p>
            <div className="space-y-4">
              {[
                { name: 'medicalLicense', label: 'Medical License' },
                { name: 'registrationCertificate', label: 'Registration Certificate' },
                { name: 'degreeCertificate', label: 'Degree Certificate' },
                { name: 'governmentId', label: 'Government ID (Passport / Driving License)' },
              ].map(doc => (
                <div key={doc.name} className="premium-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${files[doc.name] ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-100 text-ink-300'}`}>
                      {files[doc.name] ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[14px] text-ink-700">{doc.label}</h3>
                      <p className="text-[12px] text-ink-400 font-medium">{files[doc.name]?.name || 'No file selected'}</p>
                    </div>
                  </div>
                  <label className="cursor-pointer btn-secondary px-4 py-2 text-[13px]">
                    {files[doc.name] ? 'Change' : 'Upload'}
                    <input type="file" name={doc.name} className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                  </label>
                </div>
              ))}
            </div>

            <div className="flex items-start mt-6 pt-4 border-t border-surface-200">
              <input
                id="doctor-terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 border-surface-300 rounded text-primary focus:ring-primary cursor-pointer shrink-0"
              />
              <label htmlFor="doctor-terms" className="ml-2 text-[13.5px] text-ink-500 leading-relaxed select-none cursor-pointer">
                I agree to the <span className="text-primary-600 font-medium hover:underline">Terms of Service</span> and <span className="text-primary-600 font-medium hover:underline">Privacy Policy</span>, and I explicitly consent to the secure collection, processing, and storage of my professional credentials and identity documents for verification purposes.
              </label>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none fixed">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/[0.04] to-accent/[0.04] blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-electric/[0.04] to-primary/[0.02] blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="glass-card p-10">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-ink-700 tracking-tight">Doctor Registration</h1>
            
            <div className="flex items-center mt-8 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-200 rounded-full z-0" />
              {[1, 2, 3, 4].map((i) => {
                const isActive = step === i;
                const isCompleted = step > i;
                return (
                  <div key={i} className="flex-1 flex justify-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold transition-all duration-300 shadow-sm
                      ${isCompleted ? 'bg-emerald-500 text-white shadow-soft scale-110' : 
                        isActive ? 'bg-gradient-to-br from-primary to-accent text-white shadow-glow-indigo scale-110 ring-4 ring-primary-50' : 
                        'bg-white text-ink-300 border-2 border-surface-200'}`}>
                      {isCompleted ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg> : i}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Progress Bar overlay for completed sections */}
            <div className="absolute top-[8.2rem] left-[12%] h-1 bg-gradient-to-r from-primary to-electric rounded-full transition-all duration-500 z-0" style={{ width: `${(step - 1) * 25}%` }} />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-[14px] font-medium border border-red-100 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="min-h-[360px]">
              <AnimatePresence mode="wait">
                {renderStep()}
              </AnimatePresence>
            </div>

            <div className="mt-10 flex justify-between items-center pt-6 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className={`btn-ghost ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
              >
                Back
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                  ) : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
        
        <p className="mt-8 text-center text-[14px] text-ink-400">
          Already have an account?{' '}
          <Link href="/doctor/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
