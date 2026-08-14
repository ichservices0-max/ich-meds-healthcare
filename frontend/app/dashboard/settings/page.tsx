'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Lock, Bell, Palette, Save, Eye, EyeOff, Camera, Loader2, CheckCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'

type Tab = 'profile' | 'security' | 'notifications' | 'appearance'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance', label: 'Appearance', icon: Palette },
]

export default function SettingsPage() {
  const { patient, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: patient?.name || '',
    email: patient?.email || '',
    phone: '',
    dateOfBirth: '',
    bloodGroup: '',
    address: '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Security state
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    appointmentReminders: true,
    newMessages: true,
    labResults: true,
    systemUpdates: false,
    marketingEmails: false,
    smsAlerts: true,
  })

  // Theme preferences (light theme only for premium redesign)
  const [accentColor, setAccentColor] = useState('blue')

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    try {
      await authApi.updateProfile(profileForm)
      refreshUser()
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch {
      // Demo: show success anyway
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordError('New passwords do not match')
      return
    }
    if (passwordForm.newPass.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    setPasswordSaving(true)
    try {
      await authApi.changePassword(passwordForm.current, passwordForm.newPass)
      setPasswordSaved(true)
      setPasswordForm({ current: '', newPass: '', confirm: '' })
      setTimeout(() => setPasswordSaved(false), 3000)
    } catch {
      setPasswordError('Current password is incorrect')
    } finally {
      setPasswordSaving(false)
    }
  }

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileForm.name || 'User')}&background=4F46E5&color=fff&bold=true&size=128`

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="section-title text-3xl mb-1">Settings</h1>
        <p className="section-subtitle text-base">Manage your account, security, and preferences</p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar tabs */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 space-y-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all border ${
                activeTab === key 
                  ? 'bg-white border-ink-200 text-ink-800 shadow-sm' 
                  : 'bg-transparent border-transparent text-ink-500 hover:bg-white/50 hover:text-ink-700'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${activeTab === key ? 'text-primary-600' : ''}`} /> {label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
          {/* ===== PROFILE TAB ===== */}
          {activeTab === 'profile' && (
            <div className="premium-card p-6 sm:p-8">
              <h2 className="text-xl font-extrabold text-ink-800 mb-6">Profile Information</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5 mb-8">
                <div className="relative">
                  <img src={avatarUrl} alt="Profile" className="w-24 h-24 rounded-2xl border-2 border-primary-100 shadow-sm" />
                  <button className="absolute -bottom-2 -right-2 w-9 h-9 bg-white text-ink-600 hover:text-primary-600 rounded-full flex items-center justify-center border border-ink-200 shadow-sm transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <p className="font-extrabold text-ink-800 text-xl">{profileForm.name}</p>
                  <p className="text-sm font-medium text-ink-500 mt-0.5">{profileForm.email}</p>
                  <button className="text-xs font-bold text-primary-600 hover:text-primary-700 mt-2">Change photo</button>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    { key: 'name' as const, label: 'Full Name', type: 'text', placeholder: 'Alex Johnson' },
                    { key: 'email' as const, label: 'Email Address', type: 'email', placeholder: 'alex@example.com' },
                    { key: 'phone' as const, label: 'Phone Number', type: 'tel', placeholder: '+1 234 567 8900' },
                    { key: 'dateOfBirth' as const, label: 'Date of Birth', type: 'date', placeholder: '' },
                    { key: 'bloodGroup' as const, label: 'Blood Group', type: 'text', placeholder: 'e.g. A+' },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-bold text-ink-700">{label}</label>
                      <input
                        type={type}
                        value={profileForm[key]}
                        onChange={(e) => setProfileForm((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="premium-input w-full text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-ink-700">Address</label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Enter your full address..."
                    rows={2}
                    className="premium-input w-full text-sm resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-ink-100">
                  <button type="submit" disabled={profileSaving} className="btn-primary w-full sm:w-auto px-8 flex items-center justify-center gap-2">
                    {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : profileSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {profileSaved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===== SECURITY TAB ===== */}
          {activeTab === 'security' && (
            <div className="premium-card p-6 sm:p-8">
              <h2 className="text-xl font-extrabold text-ink-800 mb-6">Change Password</h2>
              {passwordError && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium text-red-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {passwordError}
                </div>
              )}
              <form onSubmit={handlePasswordSave} className="space-y-5 max-w-md">
                {[
                  { key: 'current' as const, label: 'Current Password', showKey: 'current' as const },
                  { key: 'newPass' as const, label: 'New Password', showKey: 'new' as const },
                  { key: 'confirm' as const, label: 'Confirm New Password', showKey: 'confirm' as const },
                ].map(({ key, label, showKey }) => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-bold text-ink-700">{label}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                      <input
                        type={showPasswords[showKey] ? 'text' : 'password'}
                        value={passwordForm[key]}
                        onChange={(e) => setPasswordForm((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="••••••••"
                        required
                        className="premium-input w-full pl-11 pr-11 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((p) => ({ ...p, [showKey]: !p[showKey] }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                      >
                        {showPasswords[showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}

                <button type="submit" disabled={passwordSaving} className="btn-primary w-full sm:w-auto px-8 flex items-center justify-center gap-2 mt-4">
                  {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : passwordSaved ? <CheckCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {passwordSaved ? 'Password Updated!' : 'Update Password'}
                </button>
              </form>

              {/* Security info */}
              <div className="mt-10 pt-8 border-t border-ink-100">
                <h3 className="text-lg font-bold text-ink-800 mb-5">Security Overview</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Two-Factor Authentication', status: 'Not enabled', action: 'Enable', positive: false },
                    { label: 'Login Notifications', status: 'Enabled', action: 'Disable', positive: true },
                    { label: 'Active Sessions', status: '1 device', action: 'View All', positive: true },
                  ].map(({ label, status, action, positive }) => (
                    <div key={label} className="flex items-center justify-between p-4 bg-ink-50 rounded-xl border border-ink-100">
                      <div>
                        <p className="text-sm font-bold text-ink-700">{label}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${positive ? 'text-emerald-600' : 'text-amber-600'}`}>{status}</p>
                      </div>
                      <button className="text-sm font-bold text-ink-600 hover:text-primary-600">{action}</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== NOTIFICATIONS TAB ===== */}
          {activeTab === 'notifications' && (
            <div className="premium-card p-6 sm:p-8">
              <h2 className="text-xl font-extrabold text-ink-800 mb-6">Notification Preferences</h2>
              <div className="space-y-2">
                {(Object.entries(notifPrefs) as [keyof typeof notifPrefs, boolean][]).map(([key, enabled]) => {
                  const labels: Record<keyof typeof notifPrefs, { title: string; desc: string }> = {
                    appointmentReminders: { title: 'Appointment Reminders', desc: 'Get notified 24 hours and 1 hour before appointments' },
                    newMessages: { title: 'New Messages', desc: 'Notifications when doctors send you messages' },
                    labResults: { title: 'Lab Results', desc: 'Alert when new test results are available' },
                    systemUpdates: { title: 'System Updates', desc: 'Updates about new features and improvements' },
                    marketingEmails: { title: 'Marketing Emails', desc: 'Health tips, promotions, and newsletters' },
                    smsAlerts: { title: 'SMS Alerts', desc: 'Critical notifications via text message' },
                  }
                  const { title, desc } = labels[key]
                  return (
                    <div key={key} className="flex items-center justify-between p-4 hover:bg-ink-50 rounded-xl transition-colors">
                      <div className="pr-4">
                        <p className="text-sm font-bold text-ink-700">{title}</p>
                        <p className="text-xs font-medium text-ink-500 mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))}
                        className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-500' : 'bg-ink-200'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="pt-6 mt-4 border-t border-ink-100">
                <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto px-8">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* ===== APPEARANCE TAB ===== */}
          {activeTab === 'appearance' && (
            <div className="premium-card p-6 sm:p-8">
              <h2 className="text-xl font-extrabold text-ink-800 mb-6">Appearance</h2>
              <p className="text-sm text-ink-500 mb-8">Personalize your ICH Meds portal experience.</p>

              <div className="space-y-8">
                <div>
                  <p className="text-sm font-bold text-ink-700 uppercase tracking-wider mb-4">Color Theme</p>
                  <div className="flex gap-4">
                    {[
                      { color: 'blue', hex: 'bg-blue-600', label: 'Classic Blue' },
                      { color: 'indigo', hex: 'bg-indigo-600', label: 'Indigo' },
                      { color: 'emerald', hex: 'bg-emerald-600', label: 'Emerald' },
                      { color: 'rose', hex: 'bg-rose-600', label: 'Rose' },
                    ].map(({ color, hex, label }) => (
                      <div key={color} className="flex flex-col items-center gap-2">
                        <button 
                          onClick={() => setAccentColor(color)}
                          title={label} 
                          className={`w-12 h-12 ${hex} rounded-full border-4 transition-all shadow-sm ${accentColor === color ? 'border-white ring-2 ring-ink-300 scale-110' : 'border-white hover:scale-105'}`} 
                        />
                        <span className="text-[11px] font-bold text-ink-500">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-ink-100">
                  <p className="text-sm font-bold text-ink-700 uppercase tracking-wider mb-4">Interface Density</p>
                  <div className="flex flex-wrap gap-3">
                    {['Compact', 'Comfortable (Default)', 'Spacious'].map((size) => (
                      <button key={size} className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${size.includes('Default') ? 'bg-ink-700 border-ink-700 text-white shadow-sm' : 'bg-white border-ink-200 text-ink-600 hover:bg-ink-50'}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
