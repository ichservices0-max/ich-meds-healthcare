'use client';

import { useDoctorAuth } from '@/contexts/DoctorAuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiMapPin, FiDollarSign, FiStar, FiCheckCircle, FiClock, FiXCircle, FiEdit2, FiSave, FiLock } from 'react-icons/fi';

export default function DoctorProfile() {
  const { doctor, updateDoctorInfo, loading } = useDoctorAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (doctor) {
      setForm({
        name: doctor.name || '',
        qualification: doctor.qualification || '',
        degree: doctor.degree || '',
        experience: doctor.experience || '',
        specialty: doctor.specialty || '',
        fee: doctor.fee || '',
        bio: doctor.bio || '',
        clinicName: doctor.clinicName || '',
        clinicAddress: doctor.clinicAddress || '',
        city: doctor.city || '',
        state: doctor.state || '',
        country: doctor.country || '',
      });
    }
  }, [doctor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('doctorToken');
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/profile/update`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateDoctorInfo(res.data.doctor);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Password state
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      const token = localStorage.getItem('doctorToken');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/doctor/profile/change-password`,
        {
          currentPassword: passwordForm.current,
          newPassword: passwordForm.newPass,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordSuccess('Password updated successfully!');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Profile completion calculation
  const fields = ['name', 'email', 'phone', 'specialty', 'qualification', 'degree', 'experience', 'bio', 'clinicAddress', 'city', 'fee'];
  const filled = fields.filter((f) => doctor?.[f]).length;
  const completionPct = Math.round((filled / fields.length) * 100);

  const verificationBadge = () => {
    if (doctor?.verificationStatus === 'VERIFIED') return <span className="flex items-center text-green-600 text-sm font-semibold"><FiCheckCircle className="mr-1" /> Verified</span>;
    if (doctor?.verificationStatus === 'REJECTED') return <span className="flex items-center text-red-600 text-sm font-semibold"><FiXCircle className="mr-1" /> Rejected</span>;
    return <span className="flex items-center text-amber-500 text-sm font-semibold"><FiClock className="mr-1" /> Pending Verification</span>;
  };

  const Field = ({ label, name, type = 'text', textarea = false }: { label: string; name: string; type?: string; textarea?: boolean }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      {editing ? (
        textarea ? (
          <textarea name={name} value={form[name]} onChange={handleChange} rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        ) : (
          <input type={type} name={name} value={form[name]} onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        )
      ) : (
        <p className="text-slate-800 dark:text-slate-200 text-sm py-2">{doctor?.[name] || <span className="text-slate-400 italic">Not set</span>}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <div className="flex space-x-3">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <FiSave size={16} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <FiEdit2 size={16} />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar + quick info */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
              {doctor?.name?.[0] || 'D'}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{doctor?.name}</h2>
            <p className="text-sm text-slate-500 mb-2">{doctor?.specialty}</p>
            {verificationBadge()}
            <div className="mt-4 flex items-center text-amber-400">
              <FiStar className="fill-amber-400 mr-1" size={16} />
              <span className="font-bold text-slate-900 dark:text-white">{doctor?.rating || 0}</span>
              <span className="text-slate-500 text-sm ml-1">({doctor?.reviewCount || 0} reviews)</span>
            </div>
          </motion.div>

          {/* Profile Completion */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Profile Completion</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Progress</span>
              <span className="text-sm font-bold text-blue-600">{completionPct}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-700" style={{ width: `${completionPct}%` }} />
            </div>
            {completionPct < 100 && (
              <p className="mt-2 text-xs text-slate-500">Complete your profile to attract more patients.</p>
            )}
          </motion.div>

          {/* Verification status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Verification</h3>
            <div className={`rounded-lg p-3 text-sm ${doctor?.verificationStatus === 'VERIFIED' ? 'bg-green-50 text-green-700' : doctor?.verificationStatus === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
              {doctor?.verificationStatus === 'VERIFIED' && '✅ Your account is fully verified. You appear in patient searches.'}
              {doctor?.verificationStatus === 'PENDING' && '🕐 Documents under review. You will be notified once verified.'}
              {doctor?.verificationStatus === 'REJECTED' && '❌ Verification rejected. Please contact support to re-submit documents.'}
            </div>
          </motion.div>
        </div>

        {/* Right: Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 space-y-4">

          {/* Personal Info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center"><FiUser className="mr-2 text-blue-600" /> Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name" name="name" />
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                <p className="text-slate-800 dark:text-slate-200 text-sm py-2 flex items-center"><FiMail className="mr-2 text-slate-400" />{doctor?.email}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                <p className="text-slate-800 dark:text-slate-200 text-sm py-2 flex items-center"><FiPhone className="mr-2 text-slate-400" />{doctor?.phone}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reg. Number</label>
                <p className="text-slate-800 dark:text-slate-200 text-sm py-2">{doctor?.registrationNumber}</p>
              </div>
            </div>
            <div className="mt-4">
              <Field label="Bio" name="bio" textarea />
            </div>
          </div>

          {/* Professional Info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center"><FiBriefcase className="mr-2 text-blue-600" /> Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Specialization" name="specialty" />
              <Field label="Qualification" name="qualification" />
              <Field label="Degree" name="degree" />
              <Field label="Years of Experience" name="experience" type="number" />
              <Field label="Consultation Fee (₹)" name="fee" type="number" />
            </div>
          </div>

          {/* Clinic Info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center"><FiMapPin className="mr-2 text-blue-600" /> Clinic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Clinic Name" name="clinicName" />
              <Field label="City" name="city" />
              <Field label="State" name="state" />
              <Field label="Country" name="country" />
            </div>
            <div className="mt-4">
              <Field label="Full Address" name="clinicAddress" textarea />
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center"><FiLock className="mr-2 text-blue-600" /> Change Password</h3>
            
            {passwordError && (
              <div className="mb-4 p-3 bg-red-105 text-red-700 bg-red-100 rounded-lg text-sm">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-105 text-green-700 bg-green-100 rounded-lg text-sm">{passwordSuccess}</div>
            )}

            <form onSubmit={handlePasswordSave} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <span>{passwordSaving ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
